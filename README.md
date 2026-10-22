# BetterVoting Typst ballots

Printable paper ballots that reproduce the layouts in
[`reference/2026-ballots.pdf`](reference/2026-ballots.pdf) (the Equal Vote
"2026 Ballots" slide deck), generated with [Typst](https://typst.app).

- **Every ballot type in the deck:** STAR (p. 2), STAR multi-winner
  (p. 43), Proportional STAR (p. 46), Score (p. 45), Ranked Robin (p. 47),
  Approval (p. 49), Choose One / plurality (p. 55) and Ranked Choice / IRV
  (p. 56).
- **Several races per election:** each race gets exactly one page, and every
  page carries the same **ballot ID** in the lower-right footer.
- **Matches the deck closely:** positions, sizes and colours were measured from
  the PDF. At the default size, every text line lands within about 0.5pt of the
  reference (see [Checking against the reference](#checking-against-the-reference)).
- **Paper size:** US Letter (the reference) or A4.
- **[Browser sandbox](web/):** a Vite/React page that compiles the template in
  the browser, for trying settings and candidates.


## Quick start

Install the [Typst CLI](https://github.com/typst/typst#installation), then:

```sh
typst compile --font-path fonts main.typ                     # uses election.json
typst compile --font-path fonts --input data=mine.json main.typ out.pdf
```

[`examples/example.pdf`](examples/example.pdf) (Letter) and
[`examples/example-a4.pdf`](examples/example-a4.pdf) are built from
[`election.json`](election.json).

You can also call the template from Typst directly:

```typst
#import "ballot.typ": election

#election(
  ballot-id: "b-2026-000123",
  title: "Example County General Election 2026",  // lower-left footer (optional)
  paper: "us-letter",                              // or "a4"
  font-size: "large",                              // default for every race
  races: (
    (type: "star", title: "Mayor", candidates: ("Andre", "Blake", "Carmen")),
    (type: "star-pr", title: "School Board", winners: 3, candidates: (...)),
    (type: "irv", title: "District Attorney", max-rank: 5, candidates: (...)),
  ),
)
```

## Options

Election:

| key | default | meaning |
| --- | --- | --- |
| `ballot-id` | none | printed bottom-right on every page |
| `ballot-id-label` | `"Ballot ID: "` | prefix for the ID |
| `title` | none | printed bottom-left |
| `show-page-numbers` | `true` | "Page i of n" bottom-left |
| `paper` | `"us-letter"` | `"us-letter"` or `"a4"` |
| `font-size` | `"large"` | default font size for every race (see below) |
| `races` | | list of races, one page each |

Race:

| key | meaning |
| --- | --- |
| `type` | `star`, `star-multi`, `star-pr`, `score`, `ranked-robin`, `approval`, `plurality`, `irv` |
| `candidates` | list of names |
| `title` | contest name shown above the card (as on p. 33) |
| `font-size` | overrides the election default |
| `winners` | number of seats (`star-multi`, `star-pr`) |
| `max-rank` | number of rank columns (`irv`, `ranked-robin`; default `min(candidates, 8)`) |
| `heading`, `instructions`, `footer`, `footer-heading`, `worst-label`, `best-label`, `winners-text`, `instructions-label` | replace the standard text; `footer: none` hides the footer |

### Font sizes

The font size is chosen separately from the number of candidates. Each size has
a fixed maximum, and a race with more candidates than its size allows fails to
compile with an error that names the race:

| `font-size` | scale | max candidates per race |
| --- | --- | --- |
| `large` | 100%, as in the reference PDF | 6 |
| `medium` | 74% | 14 |
| `small` | 55% | 25 |

The limits hold for every ballot type, even with a contest title. Within a
size, rows may tighten a little to make room. Smaller sizes shrink text and
vertical spacing only: the card keeps its width and the columns stay where the
reference puts them.

### A4

A4 is about 17pt narrower and 50pt taller than Letter. The Letter layout is
centred on the page; only the full-width Proportional STAR card is trimmed to
leave a margin.

### Ballot IDs

All pages of one election share a single ballot ID, which matches
BetterVoting's data model: one ballot row holds a `votes` entry per race. If
printed ballots will ever be uploaded into BetterVoting, make the IDs unique
**across elections**, for example by including the election ID
(`b-<electionId>-<n>`). The database only enforces uniqueness within an
election, but several lookups (such as verifying a ballot) search by
`ballot_id` alone.

## Fonts

The reference uses **Verdana** (text), **Archivo Black** (bubble and star
numerals) and Arial (only for the bullet glyph, which is drawn here as a
circle).

- Archivo Black is SIL OFL and included in `fonts/`.
- Verdana cannot be redistributed. The template asks for Verdana first and
  falls back to **DejaVu Sans** (included), whose letter widths are within about
  1% of Verdana's. Typst picks up Verdana automatically on macOS and Windows.
- In the sandbox, **Use my Verdana** loads your own copy, through the Local
  Font Access API in Chromium or a `.ttf` file picker elsewhere.

## Browser sandbox

```sh
cd web
npm install
npm run dev
```

The page imports `ballot.typ`, `fonts/` and `images/` from the repo root and
compiles them with [typst.ts](https://github.com/Myriad-Dreamin/typst.ts)
(Typst 0.14 in WebAssembly), so it always renders the real template. It is set
up for Netlify through [`netlify.toml`](netlify.toml) (base directory `web`).
The compiler wasm is about 28 MB, or about 11 MB gzipped.

## Checking against the reference

```sh
typst compile --font-path fonts --root . tests/reference.typ /tmp/ref.pdf
python3 tools/compare.py /tmp/ref.pdf   # needs pdfminer.six
```

`tests/reference.typ` rebuilds the reference pages, and `tools/compare.py`
reports how far each line of text is from where the PDF puts it. Two
differences are expected:

- On p. 2, "Erin" sits 21pt low in the reference, which is a mistake in the
  slide.
- On p. 46, the full-bleed card is 11pt too tall once room is left for the
  ballot-ID footer, so its rows are slightly tighter.
