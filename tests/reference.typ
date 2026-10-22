// Re-creates the reference pages (reference/2026-ballots.pdf pages 2, 43,
// 46, 45, 47, 49, 55, 56, 51, 52) with no contest title, for tools/compare.py.
#import "/ballot.typ": election

#let five = ("Andre", "Blake", "Carmen", "David", "Erin")
#let ella = ("Andre", "Blake", "Carmen", "David", "Ella")
#election(races: (
  (type: "star", candidates: five),
  (type: "star-multi", winners: 3, candidates: ella),
  (type: "star-pr", winners: 3, candidates: ella + ("Felicia",)),
  (type: "score", candidates: ella),
  (type: "ranked-robin", candidates: five),
  (type: "approval", candidates: five),
  (type: "plurality", candidates: five),
  (type: "irv", candidates: five),
  (type: "approval", yes-no: true, candidates: five),
  (type: "approval", yes-no: true, mark: "oval", candidates: five, footer: "The top-two vote-getters advance to the general election."),
))
