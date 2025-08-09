import { BracketConfig } from "./src/config/bracket-config.js";
import { MultiBracketTournament } from "./src/core/multi-bracket-tournament.js";
import { MatchSheetCreator } from "./src/services/match-sheet-creator.js";

const bracketConfig = BracketConfig.fromFile("./bracket-data.json");
const tournament = new MultiBracketTournament(bracketConfig);
const silverTournament = tournament.getBracket("silver");

console.log("=== SIMULATING ALL SILVER BRACKET MATCHES ===");
console.log("Rule: Higher seed (lower number) always wins, winner gets 3 points, loser gets 0-2 points");

const bracket = silverTournament.getBracket();
const columnsPerRound = 9; // Match, Seed, Username, Score, Loss T, Game1, Game2, Game3, Spacer

// Helper function to get random score for loser (0-2)
function getLoserScore() {
  return Math.floor(Math.random() * 3); // 0, 1, or 2
}

// Helper function to determine winner based on seeds
function getWinner(p1, p2) {
  if (!p1 && !p2) return null;
  if (!p1) return p2;
  if (!p2) return p1;
  
  // Lower seed number wins (seed 1 beats seed 16)
  return p1.seed < p2.seed ? p1 : p2;
}

// Helper function to get loser
function getLoser(p1, p2, winner) {
  if (!p1 || !p2) return null;
  return winner === p1 ? p2 : p1;
}

// Simulate all rounds and track results
const simulationResults = [];
const winners = {}; // Track winners by match number for advancement

console.log("\n=== ROUND 1 SIMULATION ===");
const round1Matches = bracket.getRenderableMatches(0);

round1Matches.forEach((match, i) => {
  const matchNumber = i + 1;
  const p1 = match.position1;
  const p2 = match.position2;
  
  const winner = getWinner(p1, p2);
  const loser = getLoser(p1, p2, winner);
  const winnerScore = 3;
  const loserScore = getLoserScore();
  
  // Calculate sheet position
  const startColumn = 0; // Round 1 starts at column 0
  const matchRow1 = 3 + (i * 3); // Each match takes 3 rows (player1, player2, spacer)
  const matchRow2 = matchRow1 + 1;
  
  const result = {
    round: 1,
    matchNumber,
    p1: p1 ? `${p1.name} (seed ${p1.seed})` : "NULL",
    p2: p2 ? `${p2.name} (seed ${p2.seed})` : "NULL",
    winner: winner ? `${winner.name} (seed ${winner.seed})` : "NULL",
    loser: loser ? `${loser.name} (seed ${loser.seed})` : "NULL",
    winnerScore,
    loserScore,
    sheetPosition: {
      columns: `${startColumn}-${startColumn + columnsPerRound - 1}`,
      p1Row: matchRow1,
      p2Row: matchRow2,
      p1ScoreCell: `${String.fromCharCode(67 + startColumn)}${matchRow1}`, // Column D for score
      p2ScoreCell: `${String.fromCharCode(67 + startColumn)}${matchRow2}`
    }
  };
  
  simulationResults.push(result);
  winners[matchNumber] = winner;
  
  console.log(`Match ${matchNumber}: ${result.p1} vs ${result.p2}`);
  console.log(`  Winner: ${result.winner} (${winnerScore})`);
  console.log(`  Loser: ${result.loser} (${loserScore})`);
  console.log(`  Sheet: ${result.sheetPosition.columns}, Rows ${matchRow1}-${matchRow2}`);
  console.log(`  Score cells: ${result.sheetPosition.p1ScoreCell}, ${result.sheetPosition.p2ScoreCell}`);
});

console.log("\n=== ROUND 2 SIMULATION ===");
const round2Matches = bracket.getRenderableMatches(1);

round2Matches.forEach((match, i) => {
  const matchNumber = 10 + i; // Round 2 starts at match 10
  const p1 = match.position1;
  const p2 = match.position2;
  
  // For Round 2, we need to substitute winners from Round 1 into the "winner" positions
  let actualP1 = p1;
  let actualP2 = p2;
  
  // Determine which Round 1 winners should fill the "winner" positions
  // Based on standard single elimination bracket advancement:
  if (i === 0) { // Round 2 Match 1 (Match 10)
    // DMJ (seed 1) vs Winner of Match 1
    if (p2 && p2.type === "winner") {
      actualP2 = winners[1]; // Match 1 winner
    }
  } else if (i === 1) { // Round 2 Match 2 (Match 11)
    // Winner of Match 2 vs Winner of Match 3
    if (p1 && p1.type === "winner") {
      actualP1 = winners[2]; // Match 2 winner
    }
    if (p2 && p2.type === "winner") {
      actualP2 = winners[3]; // Match 3 winner
    }
  } else if (i === 2) { // Round 2 Match 3 (Match 12)
    // DENGLER (seed 4) vs Winner of Match 4
    if (p2 && p2.type === "winner") {
      actualP2 = winners[4]; // Match 4 winner
    }
  } else if (i === 3) { // Round 2 Match 4 (Match 13)
    // DANV (seed 5) vs Winner of Match 5
    if (p2 && p2.type === "winner") {
      actualP2 = winners[5]; // Match 5 winner
    }
  } else if (i === 4) { // Round 2 Match 5 (Match 14)
    // HUFF (seed 2) vs Winner of Match 6
    if (p2 && p2.type === "winner") {
      actualP2 = winners[6]; // Match 6 winner
    }
  } else if (i === 5) { // Round 2 Match 6 (Match 15)
    // TETRISTIME (seed 7) vs Winner of Match 7
    if (p2 && p2.type === "winner") {
      actualP2 = winners[7]; // Match 7 winner
    }
  } else if (i === 6) { // Round 2 Match 7 (Match 16)
    // GWAFEY (seed 3) vs Winner of Match 8
    if (p2 && p2.type === "winner") {
      actualP2 = winners[8]; // Match 8 winner
    }
  } else if (i === 7) { // Round 2 Match 8 (Match 17)
    // DILLAN (seed 6) vs Winner of Match 9
    if (p2 && p2.type === "winner") {
      actualP2 = winners[9]; // Match 9 winner
    }
  }
  
  const winner = getWinner(actualP1, actualP2);
  const loser = getLoser(actualP1, actualP2, winner);
  const winnerScore = 3;
  const loserScore = getLoserScore();
  
  // Calculate sheet position for Round 2
  const startColumn = columnsPerRound; // Round 2 starts at column 9
  const matchRow1 = 3 + (i * 3);
  const matchRow2 = matchRow1 + 1;
  
  const result = {
    round: 2,
    matchNumber,
    p1: actualP1 ? `${actualP1.name} (seed ${actualP1.seed})` : "NULL",
    p2: actualP2 ? `${actualP2.name} (seed ${actualP2.seed})` : "NULL",
    winner: winner ? `${winner.name} (seed ${winner.seed})` : "NULL",
    loser: loser ? `${loser.name} (seed ${loser.seed})` : "NULL",
    winnerScore,
    loserScore,
    sheetPosition: {
      columns: `${startColumn}-${startColumn + columnsPerRound - 1}`,
      p1Row: matchRow1,
      p2Row: matchRow2,
      p1ScoreCell: `${String.fromCharCode(67 + startColumn)}${matchRow1}`,
      p2ScoreCell: `${String.fromCharCode(67 + startColumn)}${matchRow2}`
    }
  };
  
  simulationResults.push(result);
  winners[matchNumber] = winner;
  
  console.log(`Match ${matchNumber}: ${result.p1} vs ${result.p2}`);
  console.log(`  Winner: ${result.winner} (${winnerScore})`);
  console.log(`  Loser: ${result.loser} (${loserScore})`);
  console.log(`  Sheet: ${result.sheetPosition.columns}, Rows ${matchRow1}-${matchRow2}`);
  console.log(`  Advancement: ${winner ? `${winner.name} advances to Round 3` : "No winner"}`);
});

// Continue with Round 3
console.log("\n=== ROUND 3 SIMULATION ===");
const round3Matches = bracket.getRenderableMatches(2);

round3Matches.forEach((match, i) => {
  const matchNumber = 18 + i; // Round 3 starts at match 18
  
  // For Round 3, all positions should be "winner" type, filled by Round 2 winners
  let actualP1, actualP2;
  
  if (i === 0) { // Round 3 Match 1
    actualP1 = winners[10]; // Round 2 Match 1 winner
    actualP2 = winners[11]; // Round 2 Match 2 winner
  } else if (i === 1) { // Round 3 Match 2
    actualP1 = winners[12]; // Round 2 Match 3 winner
    actualP2 = winners[13]; // Round 2 Match 4 winner
  } else if (i === 2) { // Round 3 Match 3
    actualP1 = winners[14]; // Round 2 Match 5 winner
    actualP2 = winners[15]; // Round 2 Match 6 winner
  } else if (i === 3) { // Round 3 Match 4
    actualP1 = winners[16]; // Round 2 Match 7 winner
    actualP2 = winners[17]; // Round 2 Match 8 winner
  }
  
  const winner = getWinner(actualP1, actualP2);
  const loser = getLoser(actualP1, actualP2, winner);
  const winnerScore = 3;
  const loserScore = getLoserScore();
  
  const startColumn = columnsPerRound * 2; // Round 3 starts at column 18
  const matchRow1 = 3 + (i * 3);
  const matchRow2 = matchRow1 + 1;
  
  const result = {
    round: 3,
    matchNumber,
    p1: actualP1 ? `${actualP1.name} (seed ${actualP1.seed})` : "NULL",
    p2: actualP2 ? `${actualP2.name} (seed ${actualP2.seed})` : "NULL",
    winner: winner ? `${winner.name} (seed ${winner.seed})` : "NULL",
    loser: loser ? `${loser.name} (seed ${loser.seed})` : "NULL",
    winnerScore,
    loserScore,
    sheetPosition: {
      columns: `${startColumn}-${startColumn + columnsPerRound - 1}`,
      p1Row: matchRow1,
      p2Row: matchRow2,
      p1ScoreCell: `${String.fromCharCode(67 + startColumn)}${matchRow1}`,
      p2ScoreCell: `${String.fromCharCode(67 + startColumn)}${matchRow2}`
    }
  };
  
  simulationResults.push(result);
  winners[matchNumber] = winner;
  
  console.log(`Match ${matchNumber}: ${result.p1} vs ${result.p2}`);
  console.log(`  Winner: ${result.winner} (${winnerScore})`);
  console.log(`  Loser: ${result.loser} (${loserScore})`);
  console.log(`  Sheet: ${result.sheetPosition.columns}, Rows ${matchRow1}-${matchRow2}`);
});

// Continue with Round 4 (Semifinals)
console.log("\n=== ROUND 4 SIMULATION (SEMIFINALS) ===");
const round4Matches = bracket.getRenderableMatches(3);

round4Matches.forEach((match, i) => {
  const matchNumber = 22 + i; // Round 4 starts at match 22
  
  let actualP1, actualP2;
  
  if (i === 0) { // Semifinal 1
    actualP1 = winners[18]; // Round 3 Match 1 winner
    actualP2 = winners[19]; // Round 3 Match 2 winner
  } else if (i === 1) { // Semifinal 2
    actualP1 = winners[20]; // Round 3 Match 3 winner
    actualP2 = winners[21]; // Round 3 Match 4 winner
  }
  
  const winner = getWinner(actualP1, actualP2);
  const loser = getLoser(actualP1, actualP2, winner);
  const winnerScore = 3;
  const loserScore = getLoserScore();
  
  const startColumn = columnsPerRound * 3; // Round 4 starts at column 27
  const matchRow1 = 3 + (i * 3);
  const matchRow2 = matchRow1 + 1;
  
  const result = {
    round: 4,
    matchNumber,
    p1: actualP1 ? `${actualP1.name} (seed ${actualP1.seed})` : "NULL",
    p2: actualP2 ? `${actualP2.name} (seed ${actualP2.seed})` : "NULL",
    winner: winner ? `${winner.name} (seed ${winner.seed})` : "NULL",
    loser: loser ? `${loser.name} (seed ${loser.seed})` : "NULL",
    winnerScore,
    loserScore,
    sheetPosition: {
      columns: `${startColumn}-${startColumn + columnsPerRound - 1}`,
      p1Row: matchRow1,
      p2Row: matchRow2,
      p1ScoreCell: `${String.fromCharCode(67 + startColumn)}${matchRow1}`,
      p2ScoreCell: `${String.fromCharCode(67 + startColumn)}${matchRow2}`
    }
  };
  
  simulationResults.push(result);
  winners[matchNumber] = winner;
  
  console.log(`Match ${matchNumber}: ${result.p1} vs ${result.p2}`);
  console.log(`  Winner: ${result.winner} (${winnerScore})`);
  console.log(`  Loser: ${result.loser} (${loserScore})`);
  console.log(`  Sheet: ${result.sheetPosition.columns}, Rows ${matchRow1}-${matchRow2}`);
});

// Final Round 5 (Championship)
console.log("\n=== ROUND 5 SIMULATION (CHAMPIONSHIP) ===");
const round5Matches = bracket.getRenderableMatches(4);

if (round5Matches.length > 0) {
  const match = round5Matches[0];
  const matchNumber = 24; // Final match
  
  const actualP1 = winners[22]; // Semifinal 1 winner
  const actualP2 = winners[23]; // Semifinal 2 winner
  
  const winner = getWinner(actualP1, actualP2);
  const loser = getLoser(actualP1, actualP2, winner);
  const winnerScore = 3;
  const loserScore = getLoserScore();
  
  const startColumn = columnsPerRound * 4; // Round 5 starts at column 36
  const matchRow1 = 3;
  const matchRow2 = 4;
  
  const result = {
    round: 5,
    matchNumber,
    p1: actualP1 ? `${actualP1.name} (seed ${actualP1.seed})` : "NULL",
    p2: actualP2 ? `${actualP2.name} (seed ${actualP2.seed})` : "NULL",
    winner: winner ? `${winner.name} (seed ${winner.seed})` : "NULL",
    loser: loser ? `${loser.name} (seed ${loser.seed})` : "NULL",
    winnerScore,
    loserScore,
    sheetPosition: {
      columns: `${startColumn}-${startColumn + columnsPerRound - 1}`,
      p1Row: matchRow1,
      p2Row: matchRow2,
      p1ScoreCell: `${String.fromCharCode(67 + startColumn)}${matchRow1}`,
      p2ScoreCell: `${String.fromCharCode(67 + startColumn)}${matchRow2}`
    }
  };
  
  simulationResults.push(result);
  winners[matchNumber] = winner;
  
  console.log(`Match ${matchNumber}: ${result.p1} vs ${result.p2}`);
  console.log(`  CHAMPION: ${result.winner} (${winnerScore})`);
  console.log(`  Runner-up: ${result.loser} (${loserScore})`);
  console.log(`  Sheet: ${result.sheetPosition.columns}, Rows ${matchRow1}-${matchRow2}`);
}

console.log("\n=== FINAL TOURNAMENT CHAMPION ===");
console.log(`🏆 SILVER BRACKET CHAMPION: ${winners[24] ? `${winners[24].name} (seed ${winners[24].seed})` : "ERROR"}`);

console.log("\n=== SUMMARY OF ALL MATCHES ===");
simulationResults.forEach(result => {
  console.log(`Match ${result.matchNumber} (Round ${result.round}): ${result.winner} defeats ${result.loser} (${result.winnerScore}-${result.loserScore})`);
});
