// Formula Management Layer Exports
// Provides clean imports for Google Sheets formula management

// Core Formula Components
export { FormulaBuilder } from './formula-builder.js';
// Note: FormulaTemplates and FormulaManager are currently unused and not exported.

// ==================== src/formulas/index.js ====================

import { colToA1 } from '../utils/a1.js';

/**
 * Build advancement formula to pick winner seed/username from a match block
 * Rows are 1-based, columns passed as 0-based
 */
export function winnerIfMaxScore({ sheet, scoreCol0, seedOrNameCol0, row1, row2, maxScore }) {
  const scoreCol = colToA1(scoreCol0);
  const valCol = colToA1(seedOrNameCol0);
  return `=IF('${sheet}'!${scoreCol}${row1}=${maxScore},'${sheet}'!${valCol}${row1},IF('${sheet}'!${scoreCol}${row2}=${maxScore},'${sheet}'!${valCol}${row2},""))`;
}

/**
 * Build direct reference to Matches sheet for a given round/match/player/field
 */
export function matchCellRef({ sheet, colsPerRound, roundIndex, matchIndex, playerIndex, field }) {
  const startCol0 = roundIndex * colsPerRound;
  const fieldOffset = field === 'seed' ? 1 : field === 'username' ? 2 : 3; // score
  const colA1 = colToA1(startCol0 + fieldOffset);
  const row = 2 + matchIndex * 3 + playerIndex; // 1-based
  return `='${sheet}'!${colA1}${row}`;
}
