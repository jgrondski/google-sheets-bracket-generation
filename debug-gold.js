// Debug gold bracket structure
import { MultiBracketTournament } from './src/core/multi-bracket-tournament.js';
import { BracketConfig } from './src/config/bracket-config.js';

const bracketConfig = new BracketConfig('./bracket-data.json');
const tournament = new MultiBracketTournament(bracketConfig);

console.log("Available bracket types:", tournament.getBracketTypes());
console.log("Brackets:", Object.keys(tournament.getAllBrackets()));

const goldTournament = tournament.getBracket("gold");
if (!goldTournament) {
  console.log("Gold tournament not found!");
  const available = tournament.getAllBrackets();
  console.log("Available tournaments:", Object.keys(available));
  process.exit(1);
}

console.log("Gold tournament players:");
goldTournament
  .getPlayers()
  .forEach((p, i) => console.log(`  ${i + 1}: ${p.name} (seed: ${p.seed})`));

console.log("\nGold bracket structure:");
console.log(`  Actual players: ${goldTournament.getBracket().actualPlayerCount}`);
console.log(`  Bracket size: ${goldTournament.getBracket().bracketSize}`);
console.log(`  Num byes: ${goldTournament.getBracket().numByes}`);
console.log(`  Num rounds: ${goldTournament.getBracket().numRounds}`);

console.log("\nGold bracket round 1 matches:");
const goldMatches = goldTournament.getBracket().getRenderableMatches(0);
goldMatches.forEach((match, i) => {
  console.log(`  Match ${i + 1}:`);
  console.log(
    `    P1: seed ${match.position1?.seed}, name: ${match.position1?.name}, visible: ${match.position1?.visible}`
  );
  console.log(
    `    P2: seed ${match.position2?.seed}, name: ${match.position2?.name}, visible: ${match.position2?.visible}`
  );
});

console.log("\nGold bracket round 2 matches:");
const goldRound2Matches = goldTournament.getBracket().getRenderableMatches(1);
goldRound2Matches.forEach((match, i) => {
  console.log(`  Match ${i + 1}:`);
  console.log(
    `    P1: seed ${match.position1?.seed}, name: ${match.position1?.name}, visible: ${match.position1?.visible}`
  );
  console.log(
    `    P2: seed ${match.position2?.seed}, name: ${match.position2?.name}, visible: ${match.position2?.visible}`
  );
});
