// ==================== src/services/spreadsheet-creator.js ====================

import { GoogleSheetsService } from './google-sheets-service.js';

/**
 * Service for creating and setting up spreadsheets for brackets
 */
class SpreadsheetCreator {
  constructor(auth, targetFolderId = null) {
    this.sheetsService = new GoogleSheetsService(auth);
    this.targetFolderId = targetFolderId;
  }

  /**
   * Create a tournament spreadsheet with proper layout
   * @param {BracketConfig} config - Bracket configuration
   * @returns {Promise<Object>} Spreadsheet details
   */
  async createTournamentSpreadsheet(config) {
    const title = config.getSheetName();

    const spreadsheetId = await this.sheetsService.createSpreadsheet(title, this.targetFolderId);

    // Calculate required dimensions
    const columnCount = 24; // Standard bracket column count
    await this.setupBracketLayout(spreadsheetId, columnCount);

    const url = this.sheetsService.getSpreadsheetUrl(spreadsheetId);
    console.log(`✅ Tournament spreadsheet created: ${url}`);

    return {
      spreadsheetId,
      sheetId: 0,
      sheetName: title,
      url,
    };
  }

  /**
   * Create a multi-bracket spreadsheet with separate sheets for each bracket
   * @param {BracketConfig} config - Bracket configuration
   * @returns {Promise<Object>} Spreadsheet details with sheet information
   */
  async createMultiBracketSpreadsheet(config) {
    const title = config.getSheetName();
    const bracketTypes = config.getAvailableBracketTypes();

    const spreadsheetId = await this.sheetsService.createSpreadsheet(title, this.targetFolderId);

    const sheets = {};

    // Set up each bracket sheet
    for (let i = 0; i < bracketTypes.length; i++) {
      const bracketType = bracketTypes[i];
      const bracketName = config.getBracketNameByType(bracketType);

      // Use generous dimensions to ensure we have enough space
      const requiredRows = 150; // Should be enough for most brackets
      const requiredCols = 35; // Should be enough for most brackets

      if (i === 0) {
        // Rename the default sheet for the first bracket (usually gold)
        await this.sheetsService.renameSheet(spreadsheetId, 0, bracketName);

        // Resize the default sheet to required dimensions
        await this.sheetsService.resizeSheet(spreadsheetId, 0, requiredRows, requiredCols);

        sheets[bracketType] = {
          sheetId: 0,
          sheetName: bracketName,
        };
      } else {
        // Add new sheets for additional brackets with proper dimensions
        const sheetId = await this.sheetsService.addSheet(
          spreadsheetId,
          bracketName,
          requiredRows,
          requiredCols
        );
        sheets[bracketType] = {
          sheetId,
          sheetName: bracketName,
        };
      }

      console.log(`✅ Sheet created: ${bracketName} (ID: ${sheets[bracketType].sheetId})`);
    }

    const url = this.sheetsService.getSpreadsheetUrl(spreadsheetId);
    console.log(`✅ Multi-bracket spreadsheet created: ${url}`);

    return {
      spreadsheetId,
      sheets,
      url,
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

export { SpreadsheetCreator };
export default { SpreadsheetCreator };
