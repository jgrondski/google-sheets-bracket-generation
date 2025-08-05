// ==================== src/services/spreadsheet-creator.js ====================

const { GoogleSheetsService } = require('./google-sheets-service');

/**
 * Service for creating and setting up spreadsheets for brackets
 */
class SpreadsheetCreator {
  constructor(auth, targetFolderId = null) {
    this.sheetsService = new GoogleSheetsService(auth);
    this.targetFolderId = targetFolderId || process.env.TARGET_FOLDER_ID;
  }

  /**
   * Create a new spreadsheet for a tournament bracket
   * @param {Object} config - Tournament configuration
   * @returns {Promise<Object>} Spreadsheet information
   */
  async createTournamentSpreadsheet(config) {
    const title = config.getSheetName();
    const bracketName = config.getBracketName();

    // Create the spreadsheet
    const spreadsheetId = await this.sheetsService.createSpreadsheet(
      title,
      this.targetFolderId
    );

    // Rename the default sheet
    await this.sheetsService.renameSheet(spreadsheetId, 0, bracketName);

    const url = this.sheetsService.getSpreadsheetUrl(spreadsheetId);
    
    console.log(`✅ Spreadsheet created: ${url}`);

    return {
      spreadsheetId,
      url,
      title,
      bracketName,
      sheetId: 0, // Default sheet ID
    };
  }

  /**
   * Setup basic spreadsheet properties for bracket layout
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {number} columnCount - Required number of columns
   * @returns {Promise<void>}
   */
  async setupBracketLayout(spreadsheetId, columnCount) {
    await this.sheetsService.setColumnCount(spreadsheetId, 0, columnCount);
  }
}

module.exports = { SpreadsheetCreator };
