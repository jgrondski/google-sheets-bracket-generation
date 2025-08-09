// connectorUtils.js
// Utility functions for bracket connector calculations and formatting

/**
 * Convert A1 cell notation (e.g. 'E3') to zero-based row/col indices
 * @param {string} cell - e.g. 'E3'
 * @returns {{row:number, col:number}}
 */
function a1ToRowCol(cell) {
  const match = cell.match(/([A-Z]+)(\d+)/);
  if (!match) throw new Error('Invalid cell: ' + cell);
  const col = match[1].split('').reduce((acc, c) => acc * 26 + (c.charCodeAt(0) - 64), 0) - 1;
  const row = parseInt(match[2], 10) - 1;
  return { row, col };
}

/**
 * Format a border request for Google Sheets API
 * @param {number} row - Row index (0-based)
 * @param {number} col - Column index (0-based)
 * @param {Array} borders - Array of border sides
 * @param {Object} color - Border color object
 * @param {number} width - Border width
 * @param {number} sheetId - Target sheet ID
 * @returns {Object} Border request object
 */
function formatBorderRequest(row, col, borders, color, width, sheetId = 0) {
  const borderObj = {};
  for (const side of borders) {
    borderObj[side] = {
      style: 'SOLID_MEDIUM',
      width,
      color,
    };
  }
  return {
    updateBorders: {
      range: {
        sheetId: sheetId,
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
