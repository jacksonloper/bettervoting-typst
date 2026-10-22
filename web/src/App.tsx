import { useEffect, useMemo, useRef, useState } from 'react';
import example from '../../election.json';
import { compileElection, type ExtraFonts } from './typst';
import { PdfPreview } from './PdfPreview';

// Mirrors `specs` and `font-sizes` in ballot.typ.
const BALLOT_TYPES = [
  { id: 'star', label: 'STAR' },
  { id: 'star-multi', label: 'STAR multi-winner (bloc)' },
  { id: 'star-pr', label: 'Proportional STAR' },
  { id: 'score', label: 'Score' },
  { id: 'ranked-robin', label: 'Ranked Robin' },
  { id: 'approval', label: 'Approval' },
  { id: 'plurality', label: 'Choose One (plurality)' },
  { id: 'irv', label: 'Ranked Choice (IRV)' },
] as const;
type BallotType = (typeof BALLOT_TYPES)[number]['id'];

const FONT_SIZES = { large: 14, medium: 25, small: 35 } as const; // max rows (candidates + write-ins)
type FontSize = keyof typeof FONT_SIZES;
type Paper = 'us-letter' | 'a4';

interface Race {
  id: number;
  type: BallotType;
  title: string;
  description: string;
  writeIns: number;
  candidates: string;
  winners: number;
  maxRank: string;
  fontSize: '' | FontSize;
  footer: string;
  hideFooter: boolean;
  yesNo: boolean;
  mark: 'box' | 'oval';
}

interface Election {
  ballotId: string;
  title: string;
  description: string;
  paper: Paper;
  fontSize: FontSize;
  showPageNumbers: boolean;
  races: Race[];
}

let nextId = 1;
const newRace = (partial: Partial<Race> = {}): Race => ({
  id: nextId++,
  type: 'star',
  title: '',
  description: '',
  writeIns: 0,
  candidates: 'Andre\nBlake\nCarmen\nDavid\nErin',
  winners: 3,
  maxRank: '',
  fontSize: '',
  footer: '',
  hideFooter: false,
  yesNo: false,
  mark: 'box',
  ...partial,
});

type JsonRace = {
  type: BallotType;
  title?: string;
  description?: string;
  'write-ins'?: number;
  candidates: string[];
  winners?: number;
  'max-rank'?: number;
  'font-size'?: FontSize;
  footer?: string | null;
  'yes-no'?: boolean;
  mark?: 'box' | 'oval';
};
type JsonElection = {
  'ballot-id'?: string;
  title?: string;
  description?: string;
  paper?: Paper;
  'font-size'?: FontSize;
  'show-page-numbers'?: boolean;
  races: JsonRace[];
};

const fromJson = (j: JsonElection): Election => ({
  ballotId: j['ballot-id'] ?? '',
  title: j.title ?? '',
  description: j.description ?? '',
  paper: j.paper ?? 'us-letter',
  fontSize: j['font-size'] ?? 'large',
  showPageNumbers: j['show-page-numbers'] ?? true,
  races: j.races.map((r) =>
    newRace({
      type: r.type,
      title: r.title ?? '',
      description: r.description ?? '',
      writeIns: r['write-ins'] ?? 0,
      candidates: r.candidates.join('\n'),
      winners: r.winners ?? 3,
      maxRank: r['max-rank'] ? String(r['max-rank']) : '',
      fontSize: r['font-size'] ?? '',
      footer: typeof r.footer === 'string' ? r.footer : '',
      hideFooter: r.footer === null,
      yesNo: r['yes-no'] ?? false,
      mark: r.mark ?? 'box',
    }),
  ),
});

const candidatesOf = (r: Race) =>
  r.candidates
    .split('\n')
    .map((c) => c.trim())
    .filter(Boolean);

// Client-side mirror of the checks in ballot.typ, so problems show up next to
// the race that has them (Typst's own error is shown too).
interface Problem {
  raceId: number;
  index: number;
  title: string;
  message: string;
  fixes: { label: string; patch: Partial<Race> }[];
}

const MAX_CANDIDATES = Math.max(...Object.values(FONT_SIZES));

function findProblems(e: Election): Problem[] {
  const out: Problem[] = [];
  e.races.forEach((r, index) => {
    const n = candidatesOf(r).length + r.writeIns;
    const what = r.writeIns ? 'candidates and write-ins' : 'candidates';
    const size = r.fontSize || e.fontSize;
    const limit = FONT_SIZES[size];
    const base = { raceId: r.id, index, title: r.title };
    if (n === 0) {
      out.push({ ...base, message: 'This race has no candidates. Add at least one name or write-in line.', fixes: [] });
    } else if (n > limit) {
      const fits = (Object.keys(FONT_SIZES) as FontSize[]).filter((k) => FONT_SIZES[k] >= n);
      const extra = n - limit;
      out.push({
        ...base,
        message:
          `${n} ${what} is too many for font size “${size}”, which fits at most ${limit} per page. ` +
          (fits.length
            ? `Switch to a smaller font size or remove ${extra} candidate${extra === 1 ? '' : 's'}${r.writeIns ? ' or write-in line' + (extra === 1 ? '' : 's') : ''}.`
            : `No font size fits more than ${MAX_CANDIDATES}; remove ${n - MAX_CANDIDATES} or split the race.`),
        fixes: fits.map((k) => ({ label: `Use ${k} (≤ ${FONT_SIZES[k]})`, patch: { fontSize: k } })),
      });
    }
  });
  return out;
}

const raceLabel = (p: { index: number; title: string }) => `Race ${p.index + 1}${p.title ? ` · ${p.title}` : ''}`;

const toJson = (e: Election): JsonElection => ({
  'ballot-id': e.ballotId,
  title: e.title,
  description: e.description,
  paper: e.paper,
  'font-size': e.fontSize,
  'show-page-numbers': e.showPageNumbers,
  races: e.races.map((r) => {
    const out: JsonRace = { type: r.type, candidates: candidatesOf(r) };
    if (r.title.trim()) out.title = r.title.trim();
    if (r.description.trim()) out.description = r.description.trim();
    if (r.writeIns > 0) out['write-ins'] = r.writeIns;
    if (r.type === 'star-multi' || r.type === 'star-pr') out.winners = r.winners;
    if ((r.type === 'irv' || r.type === 'ranked-robin') && Number(r.maxRank) > 0) out['max-rank'] = Number(r.maxRank);
    if (r.fontSize) out['font-size'] = r.fontSize;
    if (r.type === 'approval') {
      if (r.yesNo) out['yes-no'] = true;
      if (r.mark === 'oval') out.mark = 'oval';
    }
    if (r.hideFooter) out.footer = null;
    else if (r.footer.trim()) out.footer = r.footer;
    return out;
  }),
});

const randomBallotId = () => {
  // BetterVoting-style id: b- + 8 chars without vowels or look-alikes.
  const alphabet = 'bcdfghjkmpqrtvwxy2346789';
  const pick = () => alphabet[Math.floor(Math.random() * alphabet.length)];
  return 'b-' + Array.from({ length: 8 }, pick).join('');
};

// Local Font Access API (Chromium) to use the user's own Verdana.
async function findSystemVerdana(): Promise<Uint8Array[] | null> {
  const q = (window as unknown as { queryLocalFonts?: () => Promise<{ family: string; blob(): Promise<Blob> }[]> })
    .queryLocalFonts;
  if (!q) return null;
  const fonts = (await q()).filter((f) => f.family === 'Verdana');
  if (!fonts.length) return null;
  return Promise.all(fonts.map(async (f) => new Uint8Array(await (await f.blob()).arrayBuffer())));
}

export default function App() {
  const [election, setElection] = useState<Election>(() => fromJson(example as JsonElection));
  const [selected, setSelected] = useState<number>(() => 0);
  const [pdf, setPdf] = useState<Uint8Array | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [fonts, setFonts] = useState<{ key: string; data: ExtraFonts; label: string }>({
    key: 'bundled',
    data: [],
    label: 'DejaVu Sans (bundled stand-in for Verdana)',
  });
  const [showJson, setShowJson] = useState(false);
  const [jsonDraft, setJsonDraft] = useState('');
  const [jsonError, setJsonError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const json = useMemo(() => toJson(election), [election]);
  const problems = useMemo(() => findProblems(election), [election]);
  const failed = errors.length > 0 || problems.length > 0;

  const goToRace = (id: number) => {
    setSelected(id);
    requestAnimationFrame(() =>
      document.getElementById(`race-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const res = await compileElection(json, fonts.data, fonts.key);
        if (cancelled) return;
        setErrors(res.errors);
        if (res.pdf && !res.errors.length) setPdf(res.pdf);
      } catch (e) {
        if (!cancelled) setErrors([String(e)]);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [json, fonts]);

  const update = (patch: Partial<Election>) => setElection((e) => ({ ...e, ...patch }));
  const updateRace = (id: number, patch: Partial<Race>) =>
    setElection((e) => ({ ...e, races: e.races.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const moveRace = (i: number, d: number) =>
    setElection((e) => {
      const races = [...e.races];
      const [r] = races.splice(i, 1);
      races.splice(i + d, 0, r);
      return { ...e, races };
    });

  const download = () => {
    if (!pdf) return;
    const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `ballots-${election.ballotId || 'sample'}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const useSystemVerdana = async () => {
    try {
      const found = await findSystemVerdana();
      if (found) {
        setFonts({ key: 'system-verdana', data: found, label: 'Verdana (from this computer)' });
        return;
      }
    } catch {
      /* permission denied or unsupported: fall back to file picker */
    }
    fileInput.current?.click();
  };

  const onFontFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const data = await Promise.all([...files].map(async (f) => new Uint8Array(await f.arrayBuffer())));
    setFonts({ key: 'uploaded-' + Date.now(), data, label: [...files].map((f) => f.name).join(', ') });
  };

  const openJson = () => {
    setJsonDraft(JSON.stringify(json, null, 2));
    setJsonError('');
    setShowJson(true);
  };
  const applyJson = () => {
    try {
      setElection(fromJson(JSON.parse(jsonDraft)));
      setShowJson(false);
    } catch (e) {
      setJsonError(String(e));
    }
  };

  const defaultLimit = FONT_SIZES[election.fontSize];

  return (
    <div className="app">
      <aside className="panel">
        <header className="panel-head">
          <h1>Ballot sandbox</h1>
          <p className="muted">
            Typst template from <code>ballot.typ</code>, compiled in your browser. Each race is one page; all pages
            share the ballot ID.
          </p>
        </header>

        <section className="card">
          <h2>Election</h2>
          <label>
            Ballot ID <span className="muted">(lower-right footer)</span>
            <div className="row">
              <input value={election.ballotId} onChange={(e) => update({ ballotId: e.target.value })} />
              <button type="button" onClick={() => update({ ballotId: randomBallotId() })}>
                Random
              </button>
            </div>
          </label>
          <label>
            Election title <span className="muted">(cover page and footer)</span>
            <input value={election.title} onChange={(e) => update({ title: e.target.value })} />
          </label>
          <label>
            Election description <span className="muted">(cover page)</span>
            <textarea
              rows={3}
              value={election.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </label>
          <div className="grid2">
            <label>
              Paper
              <select value={election.paper} onChange={(e) => update({ paper: e.target.value as Paper })}>
                <option value="us-letter">US Letter</option>
                <option value="a4">A4</option>
              </select>
            </label>
            <label>
              Font size
              <select value={election.fontSize} onChange={(e) => update({ fontSize: e.target.value as FontSize })}>
                {Object.entries(FONT_SIZES).map(([k, n]) => (
                  <option key={k} value={k}>
                    {k} (≤ {n} candidates)
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={election.showPageNumbers}
              onChange={(e) => update({ showPageNumbers: e.target.checked })}
            />
            Page numbers in footer
          </label>
          <div className="font-line">
            <span className="muted">Text font: {fonts.label}</span>
            {fonts.key === 'bundled' ? (
              <button type="button" className="link" onClick={useSystemVerdana}>
                Use my Verdana
              </button>
            ) : (
              <button type="button" className="link" onClick={() => setFonts({ key: 'bundled', data: [], label: 'DejaVu Sans (bundled stand-in for Verdana)' })}>
                Reset
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept=".ttf,.otf"
              multiple
              hidden
              onChange={(e) => onFontFiles(e.target.files)}
            />
          </div>
        </section>

        <div className="races-head">
          <h2>Races ({election.races.length})</h2>
          <div className="row">
            <button type="button" onClick={openJson}>
              JSON
            </button>
            <button type="button" onClick={() => setElection(fromJson(example as JsonElection))}>
              Reset example
            </button>
          </div>
        </div>

        {election.races.map((r, i) => {
          const n = candidatesOf(r).length + r.writeIns;
          const limit = FONT_SIZES[r.fontSize || election.fontSize];
          const open = selected === r.id;
          const problem = problems.find((p) => p.raceId === r.id);
          return (
            <section
              key={r.id}
              id={`race-${r.id}`}
              className={'card race' + (open ? ' open' : '') + (problem ? ' has-problem' : '')}
            >
              <button type="button" className="race-summary" onClick={() => setSelected(open ? 0 : r.id)}>
                <span className="race-num">{i + 1}</span>
                <span className="race-name">{r.title || '(untitled)'}</span>
                <span className="pill">
                  {BALLOT_TYPES.find((t) => t.id === r.type)?.label}
                  {r.type === 'approval' && r.yesNo ? ' Y/N' : ''}
                </span>
                <span className={'pill' + (n > limit ? ' bad' : '')}>
                  {n}/{limit}
                </span>
              </button>
              {problem && (
                <div className="race-problem" role="alert">
                  <strong>Can’t render this race.</strong> {problem.message}
                  {problem.fixes.length > 0 && (
                    <div className="row fixes">
                      {problem.fixes.map((f) => (
                        <button key={f.label} type="button" onClick={() => updateRace(r.id, f.patch)}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {open && (
                <div className="race-body">
                  <div className="grid2">
                    <label>
                      Type
                      <select value={r.type} onChange={(e) => updateRace(r.id, { type: e.target.value as BallotType })}>
                        {BALLOT_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Font size
                      <select
                        value={r.fontSize}
                        onChange={(e) => updateRace(r.id, { fontSize: e.target.value as Race['fontSize'] })}
                      >
                        <option value="">default ({election.fontSize})</option>
                        {Object.entries(FONT_SIZES).map(([k, m]) => (
                          <option key={k} value={k}>
                            {k} (≤ {m})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    Contest title <span className="muted">(shown above the card; optional)</span>
                    <input value={r.title} onChange={(e) => updateRace(r.id, { title: e.target.value })} />
                  </label>
                  <label>
                    Contest description <span className="muted">(under the title; optional)</span>
                    <textarea
                      rows={2}
                      value={r.description}
                      onChange={(e) => updateRace(r.id, { description: e.target.value })}
                    />
                  </label>
                  {(r.type === 'star-multi' || r.type === 'star-pr') && (
                    <label>
                      Winners
                      <input
                        type="number"
                        min={1}
                        value={r.winners}
                        onChange={(e) => updateRace(r.id, { winners: Math.max(1, Number(e.target.value) || 1) })}
                      />
                    </label>
                  )}
                  {r.type === 'approval' && (
                    <div className="grid2">
                      <label>
                        Columns
                        <select
                          value={r.yesNo ? 'yes-no' : 'single'}
                          onChange={(e) => updateRace(r.id, { yesNo: e.target.value === 'yes-no' })}
                        >
                          <option value="single">One column (p. 49)</option>
                          <option value="yes-no">Yes / No (p. 51–52)</option>
                        </select>
                      </label>
                      <label>
                        Marks
                        <select
                          value={r.mark}
                          onChange={(e) => updateRace(r.id, { mark: e.target.value as Race['mark'] })}
                        >
                          <option value="box">Boxes</option>
                          <option value="oval">Ovals</option>
                        </select>
                      </label>
                    </div>
                  )}
                  {(r.type === 'irv' || r.type === 'ranked-robin') && (
                    <label>
                      Rank columns <span className="muted">(blank = min(candidates, 8))</span>
                      <input
                        type="number"
                        min={1}
                        value={r.maxRank}
                        onChange={(e) => updateRace(r.id, { maxRank: e.target.value })}
                      />
                    </label>
                  )}
                  <label>
                    Candidates <span className="muted">(one per line)</span>
                    <textarea
                      rows={Math.min(12, Math.max(4, n + 1))}
                      value={r.candidates}
                      onChange={(e) => updateRace(r.id, { candidates: e.target.value })}
                    />
                  </label>
                  <label>
                    Write-in lines
                    <input
                      type="number"
                      min={0}
                      value={r.writeIns}
                      onChange={(e) => updateRace(r.id, { writeIns: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                    />
                  </label>
                  <label>
                    Footer text <span className="muted">(blank = standard text)</span>
                    <textarea
                      rows={2}
                      value={r.footer}
                      disabled={r.hideFooter}
                      onChange={(e) => updateRace(r.id, { footer: e.target.value })}
                    />
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={r.hideFooter}
                      onChange={(e) => updateRace(r.id, { hideFooter: e.target.checked })}
                    />
                    No footer text
                  </label>
                  <div className="row end">
                    <button type="button" disabled={i === 0} onClick={() => moveRace(i, -1)}>
                      ↑
                    </button>
                    <button type="button" disabled={i === election.races.length - 1} onClick={() => moveRace(i, 1)}>
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setElection((e) => {
                          const copy = { ...r, id: nextId++, title: r.title ? r.title + ' (copy)' : '' };
                          const races = [...e.races];
                          races.splice(i + 1, 0, copy);
                          return { ...e, races };
                        })
                      }
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="danger"
                      disabled={election.races.length === 1}
                      onClick={() => setElection((e) => ({ ...e, races: e.races.filter((x) => x.id !== r.id) }))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
        <button
          type="button"
          className="add"
          onClick={() => {
            const r = newRace({ title: `Race ${election.races.length + 1}` });
            setElection((e) => ({ ...e, races: [...e.races, r] }));
            setSelected(r.id);
          }}
        >
          + Add race
        </button>
        <p className="muted small">
          Font sizes: large ≤ {FONT_SIZES.large}, medium ≤ {FONT_SIZES.medium}, small ≤ {FONT_SIZES.small} rows
          (candidates + write-ins) per race. Default for this election: ≤ {defaultLimit}.
        </p>
      </aside>

      <main className="preview">
        <div className="toolbar">
          <span className={'status' + (failed ? ' bad' : '')}>
            {failed ? '⚠ Render failed' : busy ? 'Rendering…' : '✓ Up to date'}
          </span>
          <button
            type="button"
            className="primary"
            disabled={!pdf || failed}
            title={failed ? 'Fix the problems listed first' : undefined}
            onClick={download}
          >
            Download PDF
          </button>
        </div>
        {failed && (
          <div className="failure" role="alert">
            <div className="failure-head">
              <span className="failure-icon" aria-hidden>
                !
              </span>
              <div>
                <h3>The ballot couldn’t be rendered</h3>
                <p>
                  {problems.length > 0
                    ? `${problems.length} race${problems.length === 1 ? ' needs' : 's need'} attention. `
                    : ''}
                  {pdf ? 'The pages below are from the last successful render and are out of date. ' : ''}
                  Download is disabled until this is fixed.
                </p>
              </div>
            </div>
            {problems.length > 0 && (
              <ul className="failure-list">
                {problems.map((p) => (
                  <li key={p.raceId}>
                    <div className="failure-race">{raceLabel(p)}</div>
                    <div>{p.message}</div>
                    <div className="row fixes">
                      {p.fixes.map((f) => (
                        <button key={f.label} type="button" onClick={() => updateRace(p.raceId, f.patch)}>
                          {f.label}
                        </button>
                      ))}
                      <button type="button" className="link" onClick={() => goToRace(p.raceId)}>
                        Edit race {p.index + 1}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {errors.length > 0 && (
              <details className="typst-errors" open={problems.length === 0}>
                <summary>Typst error{errors.length === 1 ? '' : 's'}</summary>
                {errors.map((e, i) => (
                  <pre key={i}>{e}</pre>
                ))}
              </details>
            )}
          </div>
        )}
        <PdfPreview pdf={pdf} stale={failed} />
      </main>

      {showJson && (
        <div className="modal" onClick={() => setShowJson(false)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <h2>Election JSON</h2>
            <p className="muted small">
              Same format as <code>election.json</code>; compile it locally with{' '}
              <code>typst compile --font-path fonts --input data=election.json main.typ</code>.
            </p>
            <textarea value={jsonDraft} onChange={(e) => setJsonDraft(e.target.value)} spellCheck={false} />
            {jsonError && <div className="errors">{jsonError}</div>}
            <div className="row end">
              <button type="button" onClick={() => navigator.clipboard.writeText(jsonDraft)}>
                Copy
              </button>
              <button type="button" onClick={() => setShowJson(false)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={applyJson}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
