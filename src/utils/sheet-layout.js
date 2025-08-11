// ==================== src/utils/sheet-layout.js ====================

/**
 * Shared sheet layout helpers for Match sheets (and Bracket references)
 */
export function getColumnsPerRound(config, bracketType = null) {
  const bestOf = config.getMaxBestOf
    ? config.getMaxBestOf(bracketType)
    : config.getBestOf(bracketType);
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

// New: per-round variable geometry helpers
export function getRoundTotalCols(config, bracketType = null, roundIndex = 0, numRounds = 1) {
  const roundBestOf = config.getRoundBestOf
    ? config.getRoundBestOf(bracketType, roundIndex, numRounds)
    : config.getBestOf(bracketType);
  return 4 + roundBestOf + 1 + 1; // Match, Seed, Username, Score, Games, Loss T, Spacer
}

export function getRoundStartColumns(config, bracketType = null, numRounds = 1) {
  const starts = [];
  let offset = 0;
  for (let r = 0; r < numRounds; r++) {
    starts.push(offset);
    offset += getRoundTotalCols(config, bracketType, r, numRounds);
  }
  return starts;
}
