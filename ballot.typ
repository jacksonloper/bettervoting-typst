// Ballot template that reproduces the layouts in reference/2026-ballots.pdf.
//
// Every coordinate below is in points on a US-letter page and was measured
// from the reference PDF (which is a 7x-scaled letter page exported from
// Google Slides). Text positions are expressed as *baselines*: all text is
// set with top-edge/bottom-edge = "baseline" so that a placed box's top is
// exactly the baseline and paragraph leading is exactly the line pitch.

#let verdana = ("Verdana", "DejaVu Sans")
#let archivo = ("Archivo", "DejaVu Sans")

#let teal-fill = rgb("#E0F0F3")
#let teal-line = rgb("#A2C4C9")
#let gray-ring = rgb("#666666")

#let page-w = 612.0
#let page-h = 792.0

// Paper sizes. The layout is designed on US letter (as the reference is);
// on other papers it is centred, and cards wider than the page are trimmed.
#let papers = (
  "us-letter": (w: 612.0, h: 792.0),
  "a4": (w: 595.28, h: 841.89),
)

// Vertical band a race (title + card) may occupy: from band-top down to
// band-bottom-gap above the paper's bottom edge (the rest holds the footer).
#let band-top = 6.0
#let band-bottom-gap = 19.0
#let side-gap = 6.0 // minimum distance between a card and the paper edge

// ---------------------------------------------------------------------------
// Per-type layout specs (measured from the reference PDF; page numbers noted)
// ---------------------------------------------------------------------------

#let star-cols = (250.5, 306.06, 361.62, 417.18, 472.74, 528.3)
#let rank-last = 500.1
#let rank-pitch = 55.8

#let star-bullets = (size: 20.29, bx: 72.7, tx: 92.2, pitch: 24.33)
#let star-grid = (worst-gap: 41.5, star-gap: 13.8, rows-gap: 48.0)
#let star-rows = (h: 51.1, name-x: 85.6, ring: black, marks: "score")
#let star-footer = (size: 20.29, gap: 38.2, pitch: 24.33, width: 509.8, bottom: 23.5)

#let specs = (
  // page 2
  star: (
    top: 66.0,  // card top in the reference (auto = centre on page)
    card: (39.1, 572.9),
    header: (kind: "logo", top: 24.9, w: 347.9, h: 61.2),
    instructions: (kind: "bullets", gap: 37.2, ..star-bullets),
    winners: none,
    grid: (kind: "score", ..star-grid),
    rows: star-rows,
    footer: star-footer,
    text: (
      instructions: (
        "Give your favorite candidate(s) five stars.",
        "Give your last choice(s) zero or leave blank.",
        "Score other candidates as desired.",
        "Equal scores indicate equal support.",
      ),
      footer: "The two highest scoring candidates are finalists.\nYour full vote goes to the finalist you prefer.\nThe finalist with the most votes wins.",
    ),
  ),
  // page 43
  star-multi: (
    top: 20.7,  // card top in the reference (auto = centre on page)
    card: (39.1, 572.9),
    header: (kind: "logo", top: 32.5, w: 384.8, h: 67.6, cx: 299.1),
    instructions: (kind: "bullets", gap: 28.3, size: 20.29, bx: 76.9, tx: 96.5, pitch: 24.33),
    winners: (size: 20.29, after: 48.7),
    grid: (kind: "score", worst-gap: 36.9, star-gap: 13.8, rows-gap: 48.0),
    rows: (..star-rows, ring: gray-ring),
    footer: (size: 20.29, gap: 31.8, pitch: 24.33, width: 480.0, bottom: 17.1),
    text: (
      instructions: (
        "Give your favorite five stars.",
        "Give your last choice zero or leave blank.",
        "Equal scores are allowed.",
        "Score other candidates as desired.",
      ),
      footer: "The two highest scoring candidates are finalists. Your full vote goes to the finalist you prefer. The finalist with the most votes wins. This process repeats with remaining candidates until all seats are filled.",
    ),
  ),
  // page 46 (full-bleed card)
  star-pr: (
    top: 8.0,  // card top in the reference (auto = centre on page)
    card: (8.1, 603.9),
    header: (kind: "logo", top: 19.7, w: 384.8, h: 67.6, cx: 299.1),
    instructions: (kind: "bullets", gap: 45.9, size: 19.57, bx: 77.4, tx: 96.5, pitch: 23.47),
    winners: (size: 19.57, after: 35.5),
    grid: (kind: "score", worst-gap: 39.4, star-gap: 11.1, rows-gap: 48.0),
    rows: (..star-rows, ring: gray-ring),
    footer: (size: 18.86, gap: 27.6, pitch: 22.6, width: 572.0, bottom: 13.8),
    text: (
      instructions: (
        "Give your favorite five stars.",
        "Give your last choice zero or leave blank.",
        "Equal scores are allowed.",
        "Score other candidates as desired.",
      ),
      footer: "Winners in Proportional STAR Voting are selected in rounds. Each round elects the candidate with the highest total score, then designates that candidate's strongest supporters as represented. Subsequent rounds include all voters who are not yet fully represented.",
    ),
  ),
  // page 45
  score: (
    top: 43.8,  // card top in the reference (auto = centre on page)
    card: (39.1, 572.9),
    header: (kind: "title", bl: 69.3, size: 44.0),
    instructions: (kind: "bullets", gap: 56.7, size: 20.29, bx: 76.9, tx: 96.5, pitch: 24.33),
    winners: none,
    grid: (kind: "score", worst-gap: 52.6, star-gap: 13.2, rows-gap: 48.0),
    rows: star-rows,
    footer: (size: 19.57, gap: 43.7, pitch: 23.47, width: 509.8, bottom: 37.8),
    text: (
      title: "Score Voting",
      instructions: (
        "Give your favorite five stars.",
        "Give your last choice zero or leave blank.",
        "Equal scores are allowed.",
        "Score other candidates as desired.",
      ),
      footer: "The highest scoring candidate overall wins.",
    ),
  ),
  // page 47
  ranked-robin: (
    top: 98.9,  // card top in the reference (auto = centre on page)
    card: (53.8, 558.2),
    header: (kind: "title", bl: 56.6, size: 39.14),
    instructions: (kind: "bullets", gap: 46.5, size: 19.57, bx: 90.6, tx: 110.1, pitch: 23.47),
    winners: none,
    grid: (kind: "rank", head-gap: 71.2, head-size: 17.57, rows-gap: 11.55),
    rows: (h: 51.1, name-x: 100.7, ring: gray-ring, marks: "rank"),
    footer: (size: 21.43, gap: 47.4, pitch: 26.6, width: 440.0, bottom: 32.0),
    text: (
      title: "Ranked Robin",
      instructions: (
        "Rank candidates in order of preference.",
        "Equal ranks are allowed.",
        "Candidates left blank are ranked last.",
      ),
      footer: "Candidates are compared head-to-head in round robin matchups. The candidate preferred over all others wins.",
    ),
  ),
  // page 49
  approval: (
    top: 168.0,  // card top in the reference (auto = centre on page)
    card: (75.4, 536.6),
    header: (kind: "title", bl: 55.6, size: 38.0),
    instructions: (kind: "line", gap: 48.0, size: 20.43, x: 101.1),
    winners: none,
    grid: (kind: "none", rows-gap: 23.5),
    rows: (h: 51.1, name-x: 143.4, ring: black, marks: "check", mark-x: 348.05),
    footer: (size: 19.57, gap: 44.8, pitch: 23.47, width: 430.0, bottom: 31.8),
    text: (
      title: "Approval Voting",
      instructions: "Vote for ALL candidates you approve of.",
      footer: none,
    ),
  ),
  // pages 51 (boxes) and 52 (ovals): approval with Yes / No columns.
  // Not a ballot type of its own: used for approval races with yes-no: true.
  approval-yes-no: (
    top: 142.4,  // card top in the reference (auto = centre on page)
    card: (75.4, 536.6),
    header: (kind: "title", bl: 56.6, size: 38.0),
    instructions: (kind: "line", gap: 47.8, size: 20.43, x: 101.1),
    winners: none,
    grid: (kind: "yes-no", head-gap: 54.8, head-size: 24.57, rows-gap: 16.7, cols: (347.5, 444.6)),
    rows: (h: 51.1, name-x: 143.4, ring: black, marks: "check"),
    footer: (size: 19.57, gap: 40.8, pitch: 23.47, width: 430.0, bottom: 26.2),
    text: (
      title: "Approval Voting",
      instructions: "Vote for ALL candidates you approve of.",
      footer: none,
    ),
  ),
  // page 55
  plurality: (
    top: 168.0,  // card top in the reference (auto = centre on page)
    card: (75.4, 536.6),
    header: (kind: "title", bl: 55.6, size: 38.0),
    instructions: (kind: "line", gap: 48.0, size: 20.43, x: 101.1),
    winners: none,
    grid: (kind: "none", rows-gap: 20.1),
    rows: (h: 51.1, name-x: 143.2, ring: gray-ring, marks: "oval", mark-x: 347.5, fill: white),
    footer: (size: 19.57, gap: 44.8, pitch: 23.47, width: 430.0, bottom: 31.8),
    text: (
      title: "Choose One Voting",
      instructions: "Vote for only one candidate.",
      footer: "The candidate with the most votes wins.",
    ),
  ),
  // page 56
  irv: (
    top: 35.1,  // card top in the reference (auto = centre on page)
    card: (33.9, 581.6),
    header: (kind: "title", bl: 50.9, size: 32.71),
    instructions: (
      kind: "bullets", gap: 23.4, size: 19.57, bx: 70.9, tx: 90.5, pitch: 23.47,
      label: (x: 80.2, gap: 42.2),
    ),
    winners: none,
    grid: (kind: "rank", head-gap: 37.0, head-size: 17.57, rows-gap: 11.5),
    rows: (h: 51.1, name-x: 100.7, ring: gray-ring, marks: "rank"),
    footer: (
      size: 19.57, gap: 30.4, pitch: 23.47, width: 475.8, x: 70.8, bottom: 41.2,
      heading: (size: 20.0, gap: 41.6, cx: 305.6),
    ),
    text: (
      title: "Ranked Choice Voting",
      label: "Instructions:",
      instructions: (
        "Rank candidates in order of preference.",
        "Equal ranks are not allowed.",
        "Candidates left blank are ranked last.",
      ),
      footer-heading: "Ballots are counted in elimination rounds:",
      footer: "If a candidate has a majority of 1st choice votes they win, otherwise, the candidate with the fewest top choice votes is eliminated and these votes transfer to the voter’s next choice. Votes that can not transfer are exhausted. This process repeats until one candidate has a majority of remaining active ballots and wins.",
    ),
  ),
)

// Friendly aliases.
#let type-aliases = (
  "star-voting": "star",
  "bloc-star": "star-multi",
  "star-n": "star-multi",
  "star-multi-winner": "star-multi",
  "proportional-star": "star-pr",
  "rr": "ranked-robin",
  "ranked-choice": "irv",
  "rcv": "irv",
  "choose-one": "plurality",
  "pfptp": "plurality",
  "pftp": "plurality",
  "fptp": "plurality",
)

#let ballot-types = specs.keys().filter(k => k != "approval-yes-no")

// Default number of rank columns for ranked ballots (override with max-rank).
#let default-max-rank = 8

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Text whose box top is its baseline.
#let T(body, size: 20.29, weight: "regular", font: verdana) = text(
  font: font,
  size: size * 1pt,
  weight: weight,
  overhang: false, // no hanging punctuation: it shifts centred lines
  top-edge: "baseline",
  bottom-edge: "baseline",
  body,
)

// "a\nb" -> a linebreak b
#let lines(s) = if type(s) == str {
  s.split("\n").map(l => [#l]).join(linebreak())
} else { s }

#let at(x, y, body) = place(top + left, dx: x * 1pt, dy: y * 1pt, body)

#let at-center(cx, y, w, body) = at(cx - w / 2, y, box(width: w * 1pt, align(center, body)))

#let at-right(rx, y, body, w: 400.0) = at(rx - w, y, box(width: w * 1pt, align(right, body)))

// Paragraph with exact baseline pitch.
#let para(body, size: 20.29, pitch: 24.33, width: 500.0, align-x: left, weight: "regular") = box(
  width: width * 1pt,
  {
    set par(leading: pitch * 1pt, spacing: pitch * 1pt, justify: false)
    set align(align-x)
    T(lines(body), size: size, weight: weight)
  },
)

// Height (in pt, as float) of a baseline-edged paragraph: (lines - 1) * pitch.
#let h-of(c) = measure(c).height / 1pt

#let ordinal(n) = {
  let s = if calc.rem(n, 100) in (11, 12, 13) { "th" } else {
    ("th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th").at(calc.rem(n, 10))
  }
  str(n) + s
}

// Star from the reference PDF (44.42 x 42.02), centred on cx with its top at y.
#let star-pts = (
  (0.0, 16.05), (14.52, 12.71), (22.21, 0.0), (29.9, 12.71), (44.42, 16.05),
  (34.65, 27.25), (35.94, 42.02), (22.21, 36.24), (8.48, 42.02), (9.77, 27.25),
)
#let star-shape(cx, y) = at(cx - 22.21, y, polygon(
  fill: white,
  stroke: (paint: teal-line, thickness: 2.5pt, join: "round"),
  ..star-pts.map(((px, py)) => (px * 1pt, py * 1pt)),
))

#let bullet-dot(x, bl, size) = {
  let d = 0.42 * size
  at(x + 0.29 * size - d / 2, bl - 0.28 * size - d / 2, circle(radius: d / 2 * 1pt, fill: black))
}

// Mark target centred at (cx, cy), scaled by s.
#let mark(kind, cx, cy, s, ring, label: none, fill: none) = {
  if kind == "check" {
    let (w, h) = (27.7 * s, 25.6 * s)
    at(cx - w / 2, cy - h / 2, rect(width: w * 1pt, height: h * 1pt, radius: 5pt * s, stroke: 2.5pt * s + black))
  } else {
    let (w, h) = (30.8 * s, 25.5 * s)
    let thick = if kind == "oval" { 2.5 } else { 2.25 }
    at(cx - w / 2, cy - h / 2, ellipse(width: w * 1pt, height: h * 1pt, fill: fill, stroke: thick * s * 1pt + ring))
    if label != none {
      let size = 17.14 * s * (if label.len() > 1 { 0.78 } else { 1.0 })
      at-center(cx, cy + 0.359 * size, 60.0, T(label, size: size, font: archivo))
    }
  }
}

// Candidate name, left-aligned at x, vertically centred on cy, shrunk to fit
// width w (down to half size) and wrapped as a last resort.
#let name-cell(name, x, cy, w, size) = {
  let width = measure(T(name, size: size, weight: "bold")).width / 1pt
  let size = if width > w { calc.max(size * 0.5, size * w / width) } else { size }
  let body = para(name, size: size, pitch: size * 1.12, width: w, weight: "bold")
  let extra = h-of(body)
  // single line: caps centred on cy (measured: baseline = cy + 0.356 * size)
  at(x, cy + 0.356 * size - extra / 2, body)
}

// ---------------------------------------------------------------------------
// Card layout. Returns (height: float, body: content). Must run in context.
// x coordinates are absolute page positions; y is relative to the card top.
// ---------------------------------------------------------------------------

#let layout-card(race, spec, row-h, k, clip) = {
  // Font-size factor k: the card is laid out 1/k times wider and then scaled
  // by k, so text and vertical spacing shrink while every horizontal
  // position (card edges, columns, names) stays where the reference has it.
  let X(x) = x / k
  let items = ()
  let (x0, x1) = (X(calc.max(spec.card.at(0), clip.at(0))), X(calc.min(spec.card.at(1), clip.at(1))))
  let cx = (x0 + x1) / 2
  let txt = spec.text
  let get(key, default) = {
    let v = race.at(key, default: default)
    if v == auto { default } else { v }
  }

  // Header
  let y = 0.0
  let hdr = spec.header
  if hdr.kind == "logo" {
    items.push(at(X(hdr.at("cx", default: cx * k)) - hdr.w / 2, hdr.top, image("images/STAR_Voting_Logo-color.jpg", width: hdr.w * 1pt, height: hdr.h * 1pt)))
    y = hdr.top + hdr.h
  } else {
    y = hdr.bl
    items.push(at-center(cx, y, x1 - x0, T(get("heading", txt.title), size: hdr.size, weight: "bold")))
  }

  // Instructions
  let ins = spec.instructions
  let ins-text = get("instructions", txt.instructions)
  let last-bl = y
  if ins.kind == "line" {
    last-bl = y + ins.gap
    let body = para(ins-text, size: ins.size, pitch: ins.size * 1.2, width: x1 - X(ins.x) - 12)
    items.push(at(X(ins.x), last-bl, body))
    last-bl += h-of(body)
  } else {
    let bl = y + ins.gap
    if spec.winners != none {
      let n = get("winners", 2)
      let line = get("winners-text", "This election will elect " + str(n) + (if n == 1 { " winner." } else { " winners." }))
      items.push(at(X(ins.tx), bl, T(line, size: spec.winners.size)))
      bl += spec.winners.after
    }
    if "label" in ins {
      let label = get("instructions-label", txt.label)
      if label != none {
        items.push(at(X(ins.label.x), bl - ins.gap + ins.label.gap, T(label, size: ins.size, weight: "bold")))
        bl += ins.label.gap
      }
    }
    if type(ins-text) == str { ins-text = (ins-text,) }
    let w = x1 - X(ins.tx) - 14
    for (i, item) in ins-text.enumerate() {
      if i > 0 { bl += ins.pitch }
      items.push(bullet-dot(X(ins.bx), bl, ins.size))
      let body = para(item, size: ins.size, pitch: ins.pitch, width: w)
      items.push(at(X(ins.tx), bl, body))
      bl += h-of(body)
    }
    last-bl = bl
  }

  // Column header + row geometry
  // bubble scale: full size at the reference row height, shrinking gently
  let s = calc.min(1.0, row-h * 0.72 / 25.5)
  let grid = spec.grid
  let rows-top = 0.0
  let cols = ()
  let labels = ()
  if grid.kind == "score" {
    cols = star-cols.map(X)
    labels = range(6).map(str)
    let wbl = last-bl + grid.worst-gap
    items.push(at(cols.at(0) - 12.7, wbl, T(get("worst-label", "Worst"), size: 20.29, weight: "bold")))
    items.push(at-right(cols.at(5) + 23.7, wbl, T(get("best-label", "Best"), size: 20.29, weight: "bold")))
    let st = wbl + grid.star-gap
    for (i, c) in cols.enumerate() {
      if i > 0 { items.push(star-shape(c, st)) }
      items.push(at-center(c, st + 32.3, 60.0, T(str(i), size: 24.57, font: archivo)))
    }
    rows-top = st + grid.rows-gap
  } else if grid.kind == "rank" {
    let n = calc.max(1, calc.min(race.candidates.len(), get("max-rank", default-max-rank)))
    // reference: 5 columns ending at 500.1; more columns may extend right
    let last = X(if n > 5 { calc.min(spec.card.at(1) - 30.0, rank-last + rank-pitch * (n - 5)) } else { rank-last })
    let first-min = X(spec.rows.name-x + 132.0)
    let pitch = if n > 1 { calc.min(rank-pitch, (last - first-min) / (n - 1)) } else { rank-pitch }
    cols = range(n).map(i => last - pitch * (n - 1 - i))
    labels = range(1, n + 1).map(str)
    s = calc.min(s, (pitch - 3) / 30.8)
    let hbl = last-bl + grid.head-gap
    let hsize = grid.head-size * calc.min(1.0, pitch / 44.0)
    for (i, c) in cols.enumerate() {
      items.push(at-center(c, hbl, pitch, T(ordinal(i + 1), size: hsize, weight: "bold")))
    }
    rows-top = hbl + grid.rows-gap
  } else if grid.kind == "yes-no" {
    cols = grid.cols.map(X)
    let hbl = last-bl + grid.head-gap
    for (c, l) in cols.zip((get("yes-label", "Yes"), get("no-label", "No"))) {
      items.push(at-center(c, hbl, 100.0, T(l, size: grid.head-size, weight: "bold")))
    }
    rows-top = hbl + grid.rows-gap
  } else {
    rows-top = last-bl + grid.rows-gap
    cols = (X(spec.rows.mark-x),)
  }

  // Rows
  let cands = race.candidates
  let rows-bottom = rows-top + row-h * cands.len()
  for i in range(cands.len()) {
    let top = rows-top + row-h * i
    if calc.even(i) {
      items.push(at(x0 + 0.2, top, rect(width: (x1 - x0 - 0.4) * 1pt, height: row-h * 1pt, fill: teal-fill)))
    }
  }
  for i in range(cands.len() + 1) {
    let top = rows-top + row-h * i
    items.push(at(x0, top - 1.125, rect(width: (x1 - x0) * 1pt, height: 2.25pt, fill: teal-line)))
  }
  // Approval may use ovals instead of boxes (page 52).
  let marks = if spec.rows.marks == "check" and get("mark", "box") == "oval" { "oval" } else { spec.rows.marks }
  let name-size = 24.57 * calc.min(1.0, row-h / 51.1 * 1.3)
  let name-w = cols.at(0) - 15.4 * s - 20 - X(spec.rows.name-x)
  for (i, cand) in cands.enumerate() {
    let cy = rows-top + row-h * (i + 0.5)
    items.push(name-cell(cand, X(spec.rows.name-x), cy, name-w, name-size))
    for (j, c) in cols.enumerate() {
      let label = if spec.rows.marks in ("score", "rank") { labels.at(j) } else { none }
      items.push(mark(marks, c, cy, s, spec.rows.ring, label: label, fill: spec.rows.at("fill", default: none)))
    }
  }

  // Footer
  let ft = spec.footer
  let ft-text = get("footer", txt.footer)
  let bottom = rows-bottom
  if ft-text != none and ft-text != "" {
    let bl = rows-bottom
    if "heading" in ft {
      let heading = get("footer-heading", txt.footer-heading)
      if heading != none {
        bl += ft.heading.gap
        let hb = para(heading, size: ft.heading.size, pitch: ft.heading.size * 1.2, width: x1 - x0 - 20, align-x: center, weight: "bold")
        items.push(at-center(X(ft.heading.at("cx", default: cx * k)), bl, x1 - x0 - 20, hb))
        bl += h-of(hb) + ft.gap
      } else {
        bl += ft.heading.gap
      }
    } else {
      bl += ft.gap
    }
    let fw = calc.min(X(ft.width), x1 - x0 - 20)
    let body = para(ft-text, size: ft.size, pitch: ft.pitch, width: fw, align-x: if "x" in ft { left } else { center })
    if "x" in ft { items.push(at(X(ft.x), bl, body)) } else { items.push(at-center(cx, bl, fw, body)) }
    bottom = bl + h-of(body) + ft.bottom
  }

  // Card border (2.5pt, drawn centred on the edge like the reference)
  items.push(at(x0, 0, rect(width: (x1 - x0) * 1pt, height: bottom * 1pt, stroke: 2.5pt + black)))

  (height: bottom, body: block(width: X(page-w) * 1pt, height: bottom * 1pt, { for it in items { it } }))
}

// Race title shown above the card (page 33 style).
#let race-title(title, k) = para(title, size: 24.57, pitch: 29.5, width: 560.0 / k, align-x: center, weight: "bold")
#let title-gap = 22.5 // card top - last title baseline
#let title-ascent = 19.5 // approx cap height above first baseline

// Font sizes. "large" is the reference PDF's size; smaller sizes scale all
// text and vertical spacing by k (horizontal positions stay put). Each size
// supports at most `max` candidates per race: rows shrink (down to min-row,
// in that size's units) to make room, and a race over the limit fails.
#let font-sizes = (
  large: (k: 1.0, max: 6),
  medium: (k: 0.74, max: 14),
  small: (k: 0.55, max: 25),
)
#let min-row = 36.0
#let max-candidates = calc.max(..font-sizes.values().map(v => v.max))


#let resolve-type(race) = {
  let kind = race.at("type", default: "star")
  kind = type-aliases.at(kind, default: kind)
  assert(kind in ballot-types, message: "unknown ballot type '" + kind + "'; expected one of " + ballot-types.join(", "))
  if kind == "approval" and race.at("yes-no", default: false) == true { "approval-yes-no" } else { kind }
}

// Lay out a race at font-size factor k. Returns (k, card, title-h), or none
// if it cannot fit on the page. Must run in context.
#let fit-race(race, spec, k, paper: "us-letter") = {
  let pg = papers.at(paper)
  let dx = (pg.w - page-w) / 2
  let clip = (side-gap - dx, page-w + dx - side-gap)
  let n = race.candidates.len()
  let title = race.at("title", default: none)
  let room = (pg.h - band-bottom-gap - band-top) / k
  let title-h = if title != none and title != "" { title-ascent + h-of(race-title(title, k)) + title-gap } else { 0.0 }
  let card = layout-card(race, spec, spec.rows.h, k, clip)
  if card.height + title-h <= room {
    return (k: k, card: card, title-h: title-h)
  }
  let row-h = (room - title-h - (card.height - spec.rows.h * n)) / n
  if row-h >= min-row {
    return (k: k, card: layout-card(race, spec, row-h, k, clip), title-h: title-h)
  }
  none
}

#let race-page(race, index, footer, font-size, paper) = context {
  let spec = specs.at(resolve-type(race))
  let size-name = race.at("font-size", default: font-size)
  assert(size-name in font-sizes, message: "font-size must be one of " + font-sizes.keys().join(", ") + " (got " + repr(size-name) + ")")
  let size = font-sizes.at(size-name)
  let n = race.at("candidates", default: ()).len()
  let title = race.at("title", default: none)
  let label = "Race " + str(index + 1) + (if title == none or title == "" { "" } else { " (" + repr(title) + ")" })
  assert(n > 0, message: label + ": no candidates. Every race needs at least one candidate.")
  if n > size.max {
    // Suggest the largest font size that still fits, if any.
    let fits = font-sizes.pairs().filter(((_, v)) => v.max >= n).map(((name, v)) => repr(name) + " (up to " + str(v.max) + ")")
    let fix = if fits.len() > 0 {
      "switch it to font-size " + fits.join(" or ") + ", or remove " + str(n - size.max) + " candidate" + (if n - size.max == 1 { "" } else { "s" })
    } else {
      "no font size supports more than " + str(max-candidates) + " candidates; remove " + str(n - max-candidates) + " or split the race"
    }
    panic(label + ": " + str(n) + " candidates is too many for font-size " + repr(size-name) + ", which fits at most " + str(size.max) + " per page. To fix: " + fix + ".")
  }
  let chosen = fit-race(race, spec, size.k, paper: paper)
  assert(chosen != none, message: label + ": does not fit on one page at font-size " + repr(size-name) + ". To fix: shorten its title, instructions or footer text, or use a smaller font-size.")
  let (k, card, title-h) = chosen
  let total = (card.height + title-h) * k

  // Use the reference card position when it fits (title goes above it);
  // otherwise centre on the page. Always clamp to the band.
  let pg = papers.at(paper)
  let dx = (pg.w - page-w) / 2
  let band-bottom = pg.h - band-bottom-gap
  let y0 = if spec.top == auto or k < 1.0 { pg.h / 2 - total / 2 } else { spec.top + (pg.h - page-h) / 2 - title-h }
  y0 = calc.max(band-top, calc.min(y0, band-bottom - total))
  let group = block(width: page-w / k * 1pt, height: (card.height + title-h) * 1pt, {
    if title-h > 0 {
      at-center(page-w / 2 / k, title-ascent, 560.0 / k, race-title(title, k))
    }
    at(0, title-h, card.body)
  })
  if k < 1.0 {
    at(dx, y0, scale(k * 100%, origin: top + left, reflow: true, group))
  } else {
    at(dx, y0, group)
  }
  footer
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

// election(
//   ballot-id: "b-2026-000123",        // printed bottom-right on every page
//   title: "City of Example — 2026",   // optional, printed bottom-left
//   font-size: "large",                // large (<= 6), medium (<= 14), small (<= 25)
//   paper: "us-letter",                // or "a4"
//   races: ((type: "star", title: "Mayor", candidates: ("A", "B")), ...),
// )
//
// Every race gets exactly one page; all pages share the ballot id.
//
// Race keys: type (star | star-multi | star-pr | score | ranked-robin |
// approval | plurality | irv), candidates, title (contest name above the
// card), font-size (overrides the election default), winners (star-multi /
// star-pr), max-rank (ranked types, default 8), yes-no (approval: Yes / No
// columns, pages 51-52), mark (approval: "box" or "oval"), yes-label,
// no-label, and text overrides: heading,
// instructions, footer, footer-heading, worst-label, best-label,
// winners-text, instructions-label. Use none to hide a footer.
#let election(
  ballot-id: none,
  title: none,
  races: (),
  ballot-id-label: "Ballot ID: ",
  show-page-numbers: true,
  font-size: "large", // default for every race; a race may set its own
  paper: "us-letter", // or "a4"
) = {
  assert(paper in papers, message: "paper must be one of " + papers.keys().join(", ") + " (got " + repr(paper) + ")")
  let pg = papers.at(paper)
  set page(width: pg.w * 1pt, height: pg.h * 1pt, margin: 0pt)
  set text(font: verdana, lang: "en")
  let n = races.len()
  for (i, race) in races.enumerate() {
    let left-bits = ()
    if title != none and title != "" { left-bits.push(title) }
    if show-page-numbers and n > 1 { left-bits.push("Page " + str(i + 1) + " of " + str(n)) }
    let footer = {
      if left-bits.len() > 0 {
        at(36.0, pg.h - 7.0, T(left-bits.join("  ·  "), size: 8.0))
      }
      if ballot-id != none and ballot-id != "" {
        at-right(pg.w - 36.0, pg.h - 7.0, T(ballot-id-label + str(ballot-id), size: 10.0, weight: "bold"))
      }
    }
    if i > 0 { pagebreak() }
    race-page(race, i, footer, font-size, paper)
  }
}
