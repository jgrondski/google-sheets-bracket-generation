// connectorUtils.js
// Utility functions for bracket connector calculations and formatting

/**
 * Convert A1 cell notation (e.g. 'E3') to zero-based row/col indices
 * @param {string} cell - e.g. 'E3'
 * @returns {{row:number, col:number}}
 */
function a1ToRowCol(cell) {
  const match = cell.match(/([A-Z]+)(\d+)/);
  if (!match) throw new Error("Invalid cell: " + cell);
  const col =
    match[1]
      .split("")
      .reduce((acc, c) => acc * 26 + (c.charCodeAt(0) - 64), 0) - 1;
  const row = parseInt(match[2], 10) - 1;
  return { row, col };
}

/**
 * Format a Google Sheets API border request for a cell
 * @param {number} row
 * @param {number} col
 * @param {Array<'top'|'right'|'bottom'|'left'>} borders
 * @param {object} color - {red, green, blue}
 * @param {number} width
 * @returns {object} Google Sheets API request
 */
function formatBorderRequest(row, col, borders, color, width = 2) {
  const borderObj = {};
  for (const side of borders) {
    borderObj[side] = {
      style: "SOLID_MEDIUM",
      width,
      color,
    };
  }
  return {
    updateBorders: {
      range: {
        sheetId: 0,
        startRowIndex: row,
        endRowIndex: row + 1,
        startColumnIndex: col,
        endColumnIndex: col + 1,
      },
      ...borderObj,
    },
  };
}

export { a1ToRowCol, formatBorderRequest };
