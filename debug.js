import { BracketConfig } from "./src/config/bracket-config.js";
import { MultiBracketTournament } from "./src/core/multi-bracket-tournament.js";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./bracket-data.json", "utf8"));
const bracketConfig = new BracketConfig(config.options, config.players);

console.log("=== BRACKET CONFIG DEBUG ===");
console.log("Total players:", bracketConfig.getAllPlayers().length);
console.log("Gold bracket size:", bracketConfig.getBracketSizeByType("gold"));
console.log(
  "Silver bracket size:",
  bracketConfig.getBracketSizeByType("silver")
);

console.log("\n=== GOLD BRACKET PLAYERS ===");
const goldPlayers = bracketConfig.getPlayersByType("gold");
goldPlayers.forEach((p, i) =>
  console.log(`  ${i + 1}: ${p.name} (seed: ${p.seed})`)
);

console.log("\n=== SILVER BRACKET PLAYERS ===");
const silverPlayers = bracketConfig.getPlayersByType("silver");
silverPlayers.forEach((p, i) =>
  console.log(`  ${i + 1}: ${p.name} (seed: ${p.seed})`)
);

console.log("\n=== MULTI BRACKET TOURNAMENT DEBUG ===");
const tournament = new MultiBracketTournament(bracketConfig);

const silverTournament = tournament.getBracket("silver");
console.log("Silver tournament players:");
silverTournament
  .getPlayers()
  .forEach((p, i) => console.log(`  ${i + 1}: ${p.name} (seed: ${p.seed})`));

console.log("\nSilver bracket round 1 matches:");
const silverMatches = silverTournament.getBracket().getRenderableMatches(0);
silverMatches.slice(0, 5).forEach((match, i) => {
  console.log(`  Match ${i + 1}:`);
  console.log(
    `    P1: seed ${match.position1?.seed}, name: ${match.position1?.name}`
  );
  console.log(
    `    P2: seed ${match.position2?.seed}, name: ${match.position2?.name}`
  );
});
