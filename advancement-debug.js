import { BracketConfig } from "./src/config/bracket-config.js";
import { MultiBracketTournament } from "./src/core/multi-bracket-tournament.js";

const bracketConfig = BracketConfig.fromFile("./bracket-data.json");
const tournament = new MultiBracketTournament(bracketConfig);
const silverTournament = tournament.getBracket("silver");

console.log("=== DETAILED BRACKET ADVANCEMENT ANALYSIS ===");

// Get match data similar to how match sheet creator does it
const bracket = silverTournament.getBracket();
const columnsPerRound = 9; // From previous analysis

console.log("\n=== BRACKET ADVANCEMENT PATTERNS ===");

// Round 1 → Round 2 advancement
console.log("Round 1 → Round 2 advancement:");
const round1Matches = bracket.getRenderableMatches(0);
const round2Matches = bracket.getRenderableMatches(1);

// In single elimination:
// - Round 1 Match 1 & 2 winners → Round 2 Match 1 (positions determined by bracket structure)
// - Let's verify this by looking at the bracket structure

console.log("\nRound 1 has", round1Matches.length, "matches");
console.log("Round 2 has", round2Matches.length, "matches");

// The key insight: In single elimination, each round 2 match gets 2 winners from round 1
// But the pattern depends on the seeding structure

// Let's map out the exact advancement pattern by looking at bracket positions
console.log("\n=== ANALYZING ROUND 2 MATCH FEEDING ===");

round2Matches.forEach((match, matchIndex) => {
  console.log(`\nRound 2 Match ${matchIndex + 1} (Match #${10 + matchIndex}):`);
  console.log(`  Position 1: ${match.position1 ? `seed ${match.position1.seed}, name: ${match.position1.name}` : "Winner placeholder"}`);
  console.log(`  Position 2: ${match.position2 ? `seed ${match.position2.seed}, name: ${match.position2.name}` : "Winner placeholder"}`);
  
  // Calculate columns for this Round 2 match
  const startColumn = columnsPerRound; // Round 2 starts at column 9
  const matchRow1 = 3 + (matchIndex * 3); // Each match takes 3 rows (player1, player2, spacer)
  const matchRow2 = matchRow1 + 1;
  
  console.log(`  Sheet position: Columns ${startColumn}-${startColumn + columnsPerRound - 1}, Rows ${matchRow1}-${matchRow2}`);
});

// Now let's figure out which Round 1 matches feed into Round 2 Match 1
// Based on the output, Round 2 Match 1 has:
// - Position 1: DMJ (seed 1) - this is a top seed that gets a bye
// - Position 2: Winner placeholder - this should be fed by a Round 1 match

console.log("\n=== ROUND 1 MATCH → ROUND 2 DESTINATION MAPPING ===");

// Standard single elimination bracket advancement:
// The winners from Round 1 fill the "winner" positions in Round 2
// But we need to determine the exact mapping

// Looking at the bracket structure, Round 2 Match 1 (DMJ vs Winner) suggests:
// - DMJ (seed 1) gets a bye to Round 2
// - The winner position should be filled by a specific Round 1 match winner

// In a 32-person single elimination:
// - Top seeds (1-7) get byes to Round 2 (that's why they have "seeded" players in Round 2)
// - Round 1 winners fill the remaining positions

// Let's see which Round 1 match would logically feed Round 2 Match 1, position 2
// This requires understanding the bracket seeding pattern...

const round1Winners = [];
round1Matches.forEach((match, i) => {
  round1Winners.push({
    matchNumber: i + 1,
    matchIndex: i,
    seeds: [match.position1?.seed, match.position2?.seed],
    names: [match.position1?.name, match.position2?.name]
  });
});

console.log("\nRound 1 matches and their winners should go to:");
round1Winners.forEach(match => {
  console.log(`Match ${match.matchNumber}: ${match.names[0]} (${match.seeds[0]}) vs ${match.names[1]} (${match.seeds[1]})`);
  
  // In standard single elimination seeding:
  // Match 1 (seeds 16 vs 17) winner should face seed 1 in Round 2
  // This suggests Match 1 winner → Round 2 Match 1, Position 2
  
  if (match.matchNumber === 1) {
    console.log(`  → Winner should go to Round 2 Match 1, Position 2`);
    console.log(`  → Sheet location: Column ${columnsPerRound + 1} (Seed), Column ${columnsPerRound + 2} (Username), Row 4`);
    console.log(`  → This is Round 2, columns 9-17, specifically column 10 (seed) and 11 (username), row 4`);
  }
});
