// Compile with:  typst compile --font-path fonts main.typ
// Use other data: typst compile --font-path fonts --input data=my-election.json main.typ
#import "ballot.typ": election

#election(..json(sys.inputs.at("data", default: "election.json")))
