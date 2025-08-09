import { GoogleSheetsService } from '../services/google-sheets-service.js';

/**
 * Formula Manager
 * Coordinates formula generation and application to Google Sheets
 */
class FormulaManager {
  constructor(auth) {
    this.auth = auth;
    this.sheetsService = new GoogleSheetsService(auth);
    this.appliedFormulas = new Map(); // Track applied formulas by sheet
  }

  /**
   * Apply seeding formulas to bracket first round
   * @param {string} spreadsheetId - Target spreadsheet ID
   * @param {string} bracketSheet - Bracket sheet name
   * @param {string} qualifierSheet - Qualifier sheet name
   * @param {number} bracketSize - Size of bracket
   * @param {Function} getPlayerCellRef - Function to get player cell references
   * @returns {Promise<Object>} Applied formula results
   */
  async applySeedingFormulas(
    spreadsheetId,
    bracketSheet,
    qualifierSheet,
    bracketSize,
    getPlayerCellRef
  ) {
    const template = FormulaTemplates.singleEliminationSeeding(qualifierSheet, bracketSize);
    const requests = [];

    // Generate requests for each first-round match
    template.firstRound.forEach((match, index) => {
      const player1Cell = getPlayerCellRef(index, 0); // First player position
      const player2Cell = getPlayerCellRef(index, 1); // Second player position

      // Convert cell references to row/column indices
      const player1Coords = this._parseA1Notation(player1Cell);
      const player2Coords = this._parseA1Notation(player2Cell);

      requests.push({
        updateCells: {
          start: {
            sheetId: this._getSheetId(bracketSheet),
            rowIndex: player1Coords.row,
            columnIndex: player1Coords.column,
          },
          rows: [
            {
              values: [
                {
                  userEnteredValue: { formulaValue: match.player1Formula },
                },
              ],
            },
          ],
          fields: 'userEnteredValue.formulaValue',
        },
      });

      requests.push({
        updateCells: {
          start: {
            sheetId: this._getSheetId(bracketSheet),
            rowIndex: player2Coords.row,
            columnIndex: player2Coords.column,
          },
          rows: [
            {
              values: [
                {
                  userEnteredValue: { formulaValue: match.player2Formula },
                },
              ],
            },
          ],
          fields: 'userEnteredValue.formulaValue',
        },
      });
    });

    // Apply the formulas
    await this.sheetsService.batchUpdate(spreadsheetId, requests);

    // Track applied formulas
    this._trackAppliedFormulas(bracketSheet, 'seeding', template);

    return {
      success: true,
      formulasApplied: template.firstRound.length * 2,
      template: template.type,
    };
  }

  /**
   * Apply winner advancement formulas between rounds
   * @param {string} spreadsheetId - Target spreadsheet ID
   * @param {string} bracketSheet - Bracket sheet name
   * @param {number} round - Round number to populate
   * @param {Function} getCellRef - Function to get cell references
   * @returns {Promise<Object>} Applied formula results
   */
  async applyAdvancementFormulas(spreadsheetId, bracketSheet, round, getCellRef) {
    const matchesInRound = Math.pow(2, round - 2); // Calculate matches in target round
    const template = FormulaTemplates.winnerAdvancement(round, matchesInRound, getCellRef);
    const requests = [];

    template.matches.forEach((match, index) => {
      const targetCell = getCellRef(match.matchIndex, 0); // Winner goes to player 1 position
      const targetCoords = this._parseA1Notation(targetCell);

      requests.push({
        updateCells: {
          start: {
            sheetId: this._getSheetId(bracketSheet),
            rowIndex: targetCoords.row,
            columnIndex: targetCoords.column,
          },
          rows: [
            {
              values: [
                {
                  userEnteredValue: { formulaValue: match.winnerFormula },
                },
              ],
            },
          ],
          fields: 'userEnteredValue.formulaValue',
        },
      });
    });

    await this.sheetsService.batchUpdate(spreadsheetId, requests);
    this._trackAppliedFormulas(bracketSheet, `advancement-round-${round}`, template);

    return {
      success: true,
      formulasApplied: template.matches.length,
      round,
      template: template.type,
    };
  }

  /**
   * Apply match result tracking formulas
   * @param {string} spreadsheetId - Target spreadsheet ID
   * @param {string} bracketSheet - Bracket sheet name
   * @param {Array} matches - Array of match configurations
   * @returns {Promise<Object>} Applied formula results
   */
  async applyResultTrackingFormulas(spreadsheetId, bracketSheet, matches) {
    const template = FormulaTemplates.matchResultTracking(matches);
    const requests = [];

    template.matches.forEach((match) => {
      // For now, result tracking formulas will be applied to hidden columns
      // This is preparation for future match tracking features
      console.log(`Result tracking prepared for match ${match.matchId}`);
    });

    // Note: Actual implementation would apply formulas to tracking columns
    // For Phase 3, we're setting up the framework

    this._trackAppliedFormulas(bracketSheet, 'result-tracking', template);

    return {
      success: true,
      formulasApplied: template.matches.length,
      template: template.type,
    };
  }

  /**
   * Apply complete bracket formula set
   * @param {string} spreadsheetId - Target spreadsheet ID
   * @param {Object} bracketConfig - Complete bracket configuration
   * @returns {Promise<Object>} Applied formula results
   */
  async applyCompleteBracketFormulas(spreadsheetId, bracketConfig) {
    const template = FormulaTemplates.completeBracketFormulas(bracketConfig);
    const results = {
      seeding: null,
      advancement: [],
      statistics: null,
      navigation: null,
    };

    // Apply seeding formulas
    if (template.templates.seeding) {
      results.seeding = await this.applySeedingFormulas(
        spreadsheetId,
        bracketConfig.bracketSheet,
        bracketConfig.qualifierSheet,
        bracketConfig.bracketSize,
        bracketConfig.getPlayerCellRef
      );
    }

    // Apply advancement formulas for each round
    for (const advancementTemplate of template.templates.advancement) {
      const result = await this.applyAdvancementFormulas(
        spreadsheetId,
        bracketConfig.bracketSheet,
        advancementTemplate.round,
        bracketConfig.getCellRef
      );
      results.advancement.push(result);
    }

    return {
      success: true,
      results,
      template: template.type,
    };
  }

  /**
   * Get applied formulas for a sheet
   * @param {string} sheetName - Sheet name
   * @returns {Array} Applied formulas for the sheet
   */
  getAppliedFormulas(sheetName) {
    return this.appliedFormulas.get(sheetName) || [];
  }

  /**
   * Clear formula tracking for a sheet
   * @param {string} sheetName - Sheet name to clear
   */
  clearFormulaTracking(sheetName) {
    this.appliedFormulas.delete(sheetName);
  }

  /**
   * Get formula statistics
   * @returns {Object} Statistics about applied formulas
   */
  getFormulaStatistics() {
    const stats = {
      sheetsWithFormulas: this.appliedFormulas.size,
      totalFormulaSets: 0,
      formulasByType: {},
    };

    for (const [sheetName, formulas] of this.appliedFormulas) {
      stats.totalFormulaSets += formulas.length;

      formulas.forEach((formula) => {
        const type = formula.template.type || 'unknown';
        stats.formulasByType[type] = (stats.formulasByType[type] || 0) + 1;
      });
    }

    return stats;
  }

  /**
   * Parse A1 notation to row/column indices
   * @param {string} a1Notation - A1 notation (e.g., "B5")
   * @returns {Object} Row and column indices (0-based)
   */
  _parseA1Notation(a1Notation) {
    const match = a1Notation.match(/^([A-Z]+)(\d+)$/);
    if (!match) {
      throw new Error(`Invalid A1 notation: ${a1Notation}`);
    }

    const columnLetters = match[1];
    const rowNumber = parseInt(match[2], 10);

    let column = 0;
    for (let i = 0; i < columnLetters.length; i++) {
      column = column * 26 + (columnLetters.charCodeAt(i) - 65 + 1);
    }
    column -= 1; // Convert to 0-based

    return {
      row: rowNumber - 1, // Convert to 0-based
      column: column,
    };
  }

  /**
   * Get sheet ID from name (placeholder - would need actual implementation)
   * @param {string} sheetName - Sheet name
   * @returns {number} Sheet ID
   */
  _getSheetId(sheetName) {
    // This is a placeholder - in real implementation, this would
    // query the spreadsheet to get the actual sheet ID
    return 0; // Default to first sheet for now
  }

  /**
   * Track applied formulas
   * @param {string} sheetName - Sheet name
   * @param {string} formulaType - Type of formula applied
   * @param {Object} template - Formula template that was applied
   */
  _trackAppliedFormulas(sheetName, formulaType, template) {
    if (!this.appliedFormulas.has(sheetName)) {
      this.appliedFormulas.set(sheetName, []);
    }

    this.appliedFormulas.get(sheetName).push({
      type: formulaType,
      template,
      appliedAt: new Date().toISOString(),
    });
  }
}

export { FormulaManager };
