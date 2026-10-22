"""Compare text placement of tests/reference.typ against reference/2026-ballots.pdf.

    typst compile --font-path fonts --root . tests/reference.typ /tmp/ref-out.pdf
    python3 tools/compare.py /tmp/ref-out.pdf

Needs pdfminer.six. Prints, for every text run on the reference page, how far
(in points on a letter page) the same run is in our output. The reference is a
7x-scaled letter page exported from Google Slides; both are normalised to 612pt.
"""
import sys
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTChar

REFERENCE = "reference/2026-ballots.pdf"
# reference page -> page of tests/reference.typ
PAGES = [(2, 1), (43, 2), (46, 3), (45, 4), (47, 5), (49, 6), (55, 7), (56, 8)]
# Known, intended differences:
#  - page 2: "Erin" sits 21pt low in the reference (a mistake in the slide).
#  - page 46: the full-bleed card is ~11pt taller than the page allows once the
#    ballot-id footer is reserved, so its rows are slightly compressed.


def runs(path, page_no):
    page = next(iter(extract_pages(path, page_numbers=[page_no - 1])))
    k = page.width / 612
    out = []

    def walk(o):
        if isinstance(o, LTChar):
            yield o
        elif hasattr(o, "__iter__"):
            for c in o:
                yield from walk(c)

    for ch in walk(page):
        if ch.get_text() == "●":
            continue  # bullets are drawn as shapes in our output
        y = (page.height - ch.y1) / k
        if out and abs(out[-1]["y"] - y) < 0.5 and abs(out[-1]["x1"] - ch.x0 / k) < 8:
            out[-1]["text"] += ch.get_text()
            out[-1]["x1"] = ch.x1 / k
        else:
            out.append({"text": ch.get_text(), "y": y, "x0": ch.x0 / k, "x1": ch.x1 / k})
    for r in out:
        r["text"] = r["text"].strip()
    return [r for r in out if len(r["text"]) > 1]


def main(ours, tolerance=1.0):
    worst = 0.0
    for ref_page, our_page in PAGES:
        mine = runs(ours, our_page)
        print(f"== reference page {ref_page}")
        for r in runs(REFERENCE, ref_page):
            cands = [m for m in mine if m["text"] == r["text"]]
            if not cands:
                print(f"   missing  {r['text'][:50]!r}")
                continue
            m = min(cands, key=lambda m: abs(m["y"] - r["y"]) + abs(m["x0"] - r["x0"]))
            mine.remove(m)
            dy, dx = m["y"] - r["y"], m["x0"] - r["x0"]
            off = max(abs(dy), abs(dx))
            worst = max(worst, off)
            flag = "  " if off <= tolerance else "!!"
            print(f"{flag} dy={dy:+6.1f} dx={dx:+6.1f}  {r['text'][:50]!r}")
    print(f"worst offset: {worst:.1f}pt")


if __name__ == "__main__":
    main(sys.argv[1])
