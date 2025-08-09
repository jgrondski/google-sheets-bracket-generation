import { BracketConfig } from "./src/config/bracket-config.js";
import { MultiBracketTournament } from "./src/core/multi-bracket-tournament.js";
import { MatchSheetCreator } from "./src/services/match-sheet-creator.js";

const bracketConfig = BracketConfig.fromFile("./bracket-data.json");
const tournament = new MultiBracketTournament(bracketConfig);
const silverTournament = tournament.getBracket("silver");

console.log("=== SILVER BRACKET MATCH ANALYSIS ===");
console.log("Silver bracket size:", silverTournament.getBracket().bracketSize);
console.log("Silver actual players:", silverTournament.getBracket().actualPlayerCount);
console.log("Silver rounds:", silverTournament.getBracket().numRounds);

// Analyze Round 1 matches
console.log("\n=== ROUND 1 MATCHES ===");
const round1Matches = silverTournament.getBracket().getRenderableMatches(0);
round1Matches.forEach((match, i) => {
  console.log(`Match ${i + 1}:`);
  console.log(`  P1: seed ${match.position1?.seed}, name: ${match.position1?.name}`);
  console.log(`  P2: seed ${match.position2?.seed}, name: ${match.position2?.name}`);
});

// Analyze Round 2 structure
console.log("\n=== ROUND 2 STRUCTURE ===");
const round2Matches = silverTournament.getBracket().getRenderableMatches(1);
round2Matches.forEach((match, i) => {
  console.log(`Round 2 Match ${i + 1}:`);
  console.log(`  P1: ${match.position1 ? `seed ${match.position1.seed}, name: ${match.position1.name}, type: ${match.position1.type}` : "NULL"}`);
  console.log(`  P2: ${match.position2 ? `seed ${match.position2.seed}, name: ${match.position2.name}, type: ${match.position2.type}` : "NULL"}`);
});

// Test the match sheet creator to see how matches are numbered
console.log("\n=== MATCH SHEET ANALYSIS ===");
const creator = new MatchSheetCreator(null); // Don't need auth for analysis
const matchData = creator.generateMatchData(silverTournament, "silver");

console.log("Total matches:", matchData.totalMatches);
console.log("Rounds:", matchData.numRounds);

// Show first few rounds
matchData.rounds.slice(0, 2).forEach(roundData => {
  console.log(`\nRound ${roundData.roundNumber} (index ${roundData.roundIndex}):`);
  roundData.matches.forEach(match => {
    console.log(`  Match ${match.matchNumber}: ${match.position1?.name || "NULL"} vs ${match.position2?.name || "NULL"}`);
  });
});

// Calculate column positions
const bestOf = bracketConfig.getBestOf("silver");
const columnsPerRound = 5 + bestOf + 1; // Match, Seed, Username, Score, Loss T, Game1, Game2, Game3, Spacer
console.log(`\n=== COLUMN ANALYSIS ===`);
console.log(`bestOf: ${bestOf}`);
console.log(`columnsPerRound: ${columnsPerRound}`);
console.log(`Round 1 columns: 0-${columnsPerRound - 1}`);
console.log(`Round 2 columns: ${columnsPerRound}-${columnsPerRound * 2 - 1}`);

// Specific analysis for Match 1 winner
console.log(`\n=== MATCH 1 WINNER ADVANCEMENT ===`);
const match1 = round1Matches[0];
console.log(`Match 1: ${match1.position1?.name} (seed ${match1.position1?.seed}) vs ${match1.position2?.name} (seed ${match1.position2?.seed})`);
console.log("Match 1 is at:");
console.log(`  Round 1, columns 0-${columnsPerRound - 1}`);
console.log(`  Player 1 row: 3`);
console.log(`  Player 2 row: 4`);
console.log("Winner should advance to:");
console.log(`  Round 2, columns ${columnsPerRound}-${columnsPerRound * 2 - 1}`);

// In single elimination, match 1 and match 2 winners feed into round 2 match 1
// Let's verify this
if (round2Matches.length > 0) {
  const round2Match1 = round2Matches[0];
  console.log(`Round 2 Match 1 should be fed by Round 1 Match 1 & 2 winners`);
  console.log(`Round 2 Match 1 position: Round 2, columns ${columnsPerRound}-${columnsPerRound * 2 - 1}`);
  console.log(`Winner goes to Row: 3 (Player 1 position)`);
}
