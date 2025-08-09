// Debug script to analyze Round 2 structure

import { BracketConfig } from './src/config/bracket-config.js';
import { MultiBracketTournament } from './src/core/multi-bracket-tournament.js';

const bracketConfig = BracketConfig.fromFile("./bracket-data.json");
const tournament = new MultiBracketTournament(bracketConfig);
const silverTournament = tournament.getBracket("silver");

console.log('=== SILVER BRACKET ROUND 2 ANALYSIS ===');

const bracket = silverTournament.getBracket();
console.log(`Silver bracket has ${bracket.numRounds} rounds`);

// Get Round 2 matches
const round2Matches = bracket.getRenderableMatches(1); // Round index 1 = Round 2

console.log(`\nRound 2 has ${round2Matches.length} matches:`);

for (let i = 0; i < round2Matches.length; i++) {
  const match = round2Matches[i];
  console.log(`\nMatch ${i + 10} (index ${i}):`); // Match numbers start at 10 in Round 2
  
  console.log(`  Position 1: ${match.position1 ? 
    `Seed ${match.position1.seed} - ${match.position1.player ? match.position1.player.username : 'NO PLAYER'}` : 
    'EMPTY'}`);
    
  console.log(`  Position 2: ${match.position2 ? 
    `Seed ${match.position2.seed} - ${match.position2.player ? match.position2.player.username : 'NO PLAYER'}` : 
    'EMPTY'}`);
}

console.log('\n=== ANALYZING EMPTY POSITIONS FOR R1 WINNERS ===');
let expectedMappings = [];
let r1MatchIndex = 0;

for (let r2MatchIndex = 0; r2MatchIndex < round2Matches.length; r2MatchIndex++) {
  const match = round2Matches[r2MatchIndex];
  
  // Check position 1
  if (!match.position1 || !match.position1.player) {
    console.log(`R1M${r1MatchIndex + 1} winner should go to R2M${r2MatchIndex + 10}P1`);
    expectedMappings.push({
      sourceMatchIndex: r1MatchIndex,
      destMatchIndex: r2MatchIndex,
      destPlayerIndex: 0
    });
    r1MatchIndex++;
  }
  
  // Check position 2
  if (!match.position2 || !match.position2.player) {
    console.log(`R1M${r1MatchIndex + 1} winner should go to R2M${r2MatchIndex + 10}P2`);
    expectedMappings.push({
      sourceMatchIndex: r1MatchIndex,
      destMatchIndex: r2MatchIndex,
      destPlayerIndex: 1
    });
    r1MatchIndex++;
  }
}

console.log(`\nExpected mappings: ${expectedMappings.length}`);
console.log(`Round 1 matches used: ${r1MatchIndex}`);

// Get Round 1 for comparison
const round1Matches = bracket.getRenderableMatches(0);
console.log(`Round 1 has ${round1Matches.length} matches available`);
