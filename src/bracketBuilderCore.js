// Core bracket builder for single-elimination 16-player bracket
// Returns array of rounds, each round is array of matches, each match is array of 2 players (or nulls for later rounds)

function buildBracketData(players) {
  // 1. Sort by seed
  const sorted = [...players].sort((a, b) => a.seed - b.seed);
  // 2. Standard 16-seed bracket matchups
  const matchups = [
    [1, 16],
    [8, 9],
    [5, 12],
    [4, 13],
    [3, 14],
    [6, 11],
    [7, 10],
    [2, 15],
  ];
  const seedMap = new Map(sorted.map((p) => [p.seed, p]));
  // 3. Round 1: 8 matches
  const round1 = matchups.map(([s1, s2]) => [seedMap.get(s1), seedMap.get(s2)]);
  // 4. Later rounds: empty matches
  const rounds = [round1];
  let numMatches = round1.length;
  while (numMatches > 1) {
    numMatches = numMatches / 2;
    rounds.push(Array(numMatches).fill([null, null]));
  }
  // 5. Champion slot (single cell)
  rounds.push([[null]]);
  return rounds;
}

module.exports = { buildBracketData };
