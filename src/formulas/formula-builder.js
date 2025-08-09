/**
 * Google Sheets Formula Builder
 * Centralized formula generation for bracket operations
 */
class FormulaBuilder {
  /**
   * Generate VLOOKUP formula to find player name by seed
   * @param {string} sheetName - Name of the sheet to lookup from
   * @param {string|number} seedCell - Cell reference or seed number to lookup
   * @param {string} nameColumn - Column letter for player names (default: 'C')
   * @param {string} seedColumn - Column letter for seeds (default: 'B')
   * @returns {string} VLOOKUP formula
   */
  static playerLookup(sheetName, seedCell, nameColumn = 'C', seedColumn = 'B') {
    return `=IFERROR(INDEX('${sheetName}'!${nameColumn}:${nameColumn},MATCH(${seedCell},'${sheetName}'!${seedColumn}:${seedColumn},0)),"TBD")`;
  }

  /**
   * Generate formula for winner advancement (takes winner of a match)
   * @param {string} matchCell1 - First player cell reference
   * @param {string} matchCell2 - Second player cell reference
   * @param {string} scoreCell1 - First player score cell
   * @param {string} scoreCell2 - Second player score cell
   * @returns {string} Winner selection formula
   */
  static winnerFormula(matchCell1, matchCell2, scoreCell1, scoreCell2) {
    return `=IF(AND(${scoreCell1}<>"",${scoreCell2}<>""),IF(${scoreCell1}>${scoreCell2},${matchCell1},${matchCell2}),"")`;
  }

  /**
   * Generate formula for loser bracket advancement
   * @param {string} matchCell1 - First player cell reference
   * @param {string} matchCell2 - Second player cell reference
   * @param {string} scoreCell1 - First player score cell
   * @param {string} scoreCell2 - Second player score cell
   * @returns {string} Loser selection formula
   */
  static loserFormula(matchCell1, matchCell2, scoreCell1, scoreCell2) {
    return `=IF(AND(${scoreCell1}<>"",${scoreCell2}<>""),IF(${scoreCell1}<${scoreCell2},${matchCell1},${matchCell2}),"")`;
  }

  /**
   * Generate formula for seeding-based initial bracket population
   * @param {string} qualifierSheet - Qualifier sheet name
   * @param {number} seed - Seed number to lookup
   * @returns {string} Seeding formula
   */
  static seedLookup(qualifierSheet, seed) {
    return FormulaBuilder.playerLookup(qualifierSheet, seed);
  }

  /**
   * Generate conditional formatting formula for match results
   * @param {string} scoreCell - Score cell reference
   * @returns {string} Conditional formatting formula
   */
  static hasResultFormula(scoreCell) {
    return `=${scoreCell}<>""`;
  }

  /**
   * Generate formula for match completion status
   * @param {string} scoreCell1 - First score cell
   * @param {string} scoreCell2 - Second score cell
   * @returns {string} Match completion formula
   */
  static matchCompleteFormula(scoreCell1, scoreCell2) {
    return `=AND(${scoreCell1}<>"",${scoreCell2}<>"")`;
  }

  /**
   * Generate formula for tournament progress calculation
   * @param {string} range - Range of match cells to check
   * @returns {string} Progress percentage formula
   */
  static progressFormula(range) {
    return `=ROUND(COUNTA(${range})/ROWS(${range})*100,1)`;
  }

  /**
   * Generate HYPERLINK formula for bracket navigation
   * @param {string} url - URL to link to
   * @param {string} displayText - Text to display
   * @returns {string} HYPERLINK formula
   */
  static hyperlinkFormula(url, displayText) {
    return `=HYPERLINK("${url}","${displayText}")`;
  }

  /**
   * Generate formula for rank calculation based on finish position
   * @param {string} finishCell - Cell containing finish position
   * @param {number} totalPlayers - Total number of players
   * @returns {string} Ranking formula
   */
  static rankFormula(finishCell, totalPlayers) {
    return `=IF(${finishCell}="","",${totalPlayers}-${finishCell}+1)`;
  }

  /**
   * Generate formula for bracket round names
   * @param {number} roundNumber - Round number (1-based)
   * @param {number} totalRounds - Total rounds in bracket
   * @returns {string} Round name formula or static text
   */
  static roundNameFormula(roundNumber, totalRounds) {
    if (roundNumber === totalRounds) return 'Finals';
    if (roundNumber === totalRounds - 1) return 'Semifinals';
    if (roundNumber === totalRounds - 2) return 'Quarterfinals';
    return `Round ${roundNumber}`;
  }

  /**
   * Generate array formula for bulk operations
   * @param {string} baseFormula - Base formula to apply
   * @param {string} range - Range to apply formula to
   * @returns {string} Array formula
   */
  static arrayFormula(baseFormula, range) {
    return `=ARRAYFORMULA(${baseFormula})`;
  }

  /**
   * Escape sheet name for formula usage (handles spaces and special characters)
   * @param {string} sheetName - Raw sheet name
   * @returns {string} Escaped sheet name for formula
   */
  static escapeSheetName(sheetName) {
    if (sheetName.includes(' ') || sheetName.includes("'")) {
      return `'${sheetName.replace(/'/g, "''")}'`;
    }
    return sheetName;
  }

  /**
   * Generate cell reference from row/column indices
   * @param {number} row - Row index (0-based)
   * @param {number} column - Column index (0-based)
   * @param {boolean} absoluteRow - Make row reference absolute
   * @param {boolean} absoluteColumn - Make column reference absolute
   * @returns {string} Cell reference (e.g., "A1", "$A$1")
   */
  static cellReference(row, column, absoluteRow = false, absoluteColumn = false) {
    const columnLetter = String.fromCharCode(65 + column);
    const rowNumber = row + 1;

    return `${absoluteColumn ? '$' : ''}${columnLetter}${absoluteRow ? '$' : ''}${rowNumber}`;
  }
}

export { FormulaBuilder };
