// ==================== src/utils/sheet-layout.js ====================

/**
 * Shared sheet layout helpers for Match sheets (and Bracket references)
 */
export function getColumnsPerRound(config, bracketType = null) {
  const bestOf = config.getBestOf(bracketType);
  // Match + Seed + Username + Score + Game columns + Loss T + spacer
  return 4 + bestOf + 1 + 1;
}

export function getMatchSheetColumnWidths(bestOf) {
  // [Match, Seed, Username, Score, ...Game1..N, Loss T, Spacer]
  const widths = [46, 35, 130, 40];
  for (let i = 0; i < bestOf; i++) widths.push(65);
  widths.push(65); // Loss T
  widths.push(50); // Spacer
  return widths;
}
