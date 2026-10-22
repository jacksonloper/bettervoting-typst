# BetterVoting Typst ballots

Printable paper ballots that reproduce the layouts in
[`reference/2026-ballots.pdf`](reference/2026-ballots.pdf) (the Equal Vote
"2026 Ballots" slide deck), generated with [Typst](https://typst.app).

- **Every ballot type in the deck:** STAR (p. 2), STAR multi-winner
  (p. 43), Proportional STAR (p. 46), Score (p. 45), Ranked Robin (p. 47),
  Approval (p. 49, or with Yes / No columns as on pp. 51–52), Choose One /
  plurality (p. 55) and Ranked Choice / IRV (p. 56).
- **Several races per election:** an optional cover page shows the election
  title, description and list of contests. Each race then gets exactly one
  page, with its own title and description above the card and optional
  write-in lines. Every page carries the same **ballot ID** in the
  lower-right footer.
- **Matches the deck closely:** positions, sizes and colours were measured from
  the PDF. At the PDF's own size, every text line lands within about 0.7pt of
  the reference (see [Checking against the reference](#checking-against-the-reference)).
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
  title: "Example County General Election 2026",  // cover page + footer
  description: "Use a dark pen…",                  // cover page
  paper: "us-letter",                              // or "a4"
  font-size: "large",                              // default for every race
  races: (
    (type: "star", title: "Mayor", description: "Four-year term.",
     candidates: ("Andre", "Blake", "Carmen"), write-ins: 1),
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
| `title` | none | cover page, and bottom-left of every page |
| `description` | none | cover page; `\n` for line breaks, `\n\n` between paragraphs |
| `cover` | `auto` | cover page; `auto` shows one when there's a title or description |
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
| `description` | text under the title, above the card |
| `write-ins` | number of write-in rows ("Write-in:" plus a line), after the candidates |
| `write-in-label` | label on write-in rows (default `"Write-in:"`; `""` for just a line) |
| `font-size` | overrides the election default |
| `winners` | number of seats (`star-multi`, `star-pr`) |
| `max-rank` | number of rank columns (`irv`, `ranked-robin`; default `min(candidates, 8)`) |
| `yes-no` | `approval` only: `true` gives Yes / No columns (pp. 51–52) |
| `mark` | `approval` only: `"box"` (default, pp. 49/51) or `"oval"` (p. 52) |
| `yes-label`, `no-label` | column headings for `yes-no` (default "Yes", "No") |
| `heading`, `instructions`, `footer`, `footer-heading`, `worst-label`, `best-label`, `winners-text`, `instructions-label` | replace the standard text; `footer: none` hides the footer |

### Font sizes

The font size is chosen separately from the number of candidates. Each size has
a fixed maximum number of rows (candidates plus write-ins). A race with more
rows than its size allows fails to compile with an error that names the race
and suggests a fix:

| `font-size` | scale of the reference PDF | max rows per race |
| --- | --- | --- |
| `large` (default) | 72% | 14 |
| `medium` | 53% | 25 |
| `small` | 43% | 35 |

The limits hold for every ballot type, even with a contest title and a two-line
description. Within a size, rows may tighten a little to make room. Smaller
sizes shrink text and vertical spacing only: the card keeps its width and the
columns stay where the reference puts them.

There is also `reference` (100%, at most 6 rows), the PDF's own size. It is
larger than voters need and exists so the layout can be checked against the PDF.

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

`tests/reference.typ` rebuilds the reference pages at `font-size: "reference"`,
and `tools/compare.py`
reports how far each line of text is from where the PDF puts it. Two
differences are expected:

- On p. 2, "Erin" sits 21pt low in the reference, which is a mistake in the
  slide.
- On p. 46, the full-bleed card is 11pt too tall once room is left for the
  ballot-ID footer, so its rows are slightly tighter.
