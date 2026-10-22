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

const FONT_SIZES = { large: 6, medium: 14, small: 25 } as const;
type FontSize = keyof typeof FONT_SIZES;
type Paper = 'us-letter' | 'a4';

interface Race {
  id: number;
  type: BallotType;
  title: string;
  candidates: string;
  winners: number;
  maxRank: string;
  fontSize: '' | FontSize;
  footer: string;
  hideFooter: boolean;
}

interface Election {
  ballotId: string;
  title: string;
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
  candidates: 'Andre\nBlake\nCarmen\nDavid\nErin',
  winners: 3,
  maxRank: '',
  fontSize: '',
  footer: '',
  hideFooter: false,
  ...partial,
});

type JsonRace = {
  type: BallotType;
  title?: string;
  candidates: string[];
  winners?: number;
  'max-rank'?: number;
  'font-size'?: FontSize;
  footer?: string | null;
};
type JsonElection = {
  'ballot-id'?: string;
  title?: string;
  paper?: Paper;
  'font-size'?: FontSize;
  'show-page-numbers'?: boolean;
  races: JsonRace[];
};

const fromJson = (j: JsonElection): Election => ({
  ballotId: j['ballot-id'] ?? '',
  title: j.title ?? '',
  paper: j.paper ?? 'us-letter',
  fontSize: j['font-size'] ?? 'large',
  showPageNumbers: j['show-page-numbers'] ?? true,
  races: j.races.map((r) =>
    newRace({
      type: r.type,
      title: r.title ?? '',
      candidates: r.candidates.join('\n'),
      winners: r.winners ?? 3,
      maxRank: r['max-rank'] ? String(r['max-rank']) : '',
      fontSize: r['font-size'] ?? '',
      footer: typeof r.footer === 'string' ? r.footer : '',
      hideFooter: r.footer === null,
    }),
  ),
});

const candidatesOf = (r: Race) =>
  r.candidates
    .split('\n')
    .map((c) => c.trim())
    .filter(Boolean);

const toJson = (e: Election): JsonElection => ({
  'ballot-id': e.ballotId,
  title: e.title,
  paper: e.paper,
  'font-size': e.fontSize,
  'show-page-numbers': e.showPageNumbers,
  races: e.races.map((r) => {
    const out: JsonRace = { type: r.type, candidates: candidatesOf(r) };
    if (r.title.trim()) out.title = r.title.trim();
    if (r.type === 'star-multi' || r.type === 'star-pr') out.winners = r.winners;
    if ((r.type === 'irv' || r.type === 'ranked-robin') && Number(r.maxRank) > 0) out['max-rank'] = Number(r.maxRank);
    if (r.fontSize) out['font-size'] = r.fontSize;
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
            Election title <span className="muted">(lower-left footer)</span>
            <input value={election.title} onChange={(e) => update({ title: e.target.value })} />
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
          const n = candidatesOf(r).length;
          const limit = FONT_SIZES[r.fontSize || election.fontSize];
          const open = selected === r.id;
          return (
            <section key={r.id} className={'card race' + (open ? ' open' : '')}>
              <button type="button" className="race-summary" onClick={() => setSelected(open ? 0 : r.id)}>
                <span className="race-num">{i + 1}</span>
                <span className="race-name">{r.title || '(untitled)'}</span>
                <span className="pill">{BALLOT_TYPES.find((t) => t.id === r.type)?.label}</span>
                <span className={'pill' + (n > limit ? ' bad' : '')}>
                  {n}/{limit}
                </span>
              </button>
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
          Font sizes: large is the reference size (≤ {FONT_SIZES.large}), medium ≤ {FONT_SIZES.medium}, small ≤{' '}
          {FONT_SIZES.small} candidates per race. Default for this election: ≤ {defaultLimit}.
        </p>
      </aside>

      <main className="preview">
        <div className="toolbar">
          <span className={'status' + (errors.length ? ' bad' : '')}>
            {errors.length ? 'Error' : busy ? 'Rendering…' : 'Up to date'}
          </span>
          <button type="button" className="primary" disabled={!pdf || errors.length > 0} onClick={download}>
            Download PDF
          </button>
        </div>
        {errors.length > 0 && (
          <div className="errors">
            {errors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        )}
        <PdfPreview pdf={pdf} stale={errors.length > 0} />
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
