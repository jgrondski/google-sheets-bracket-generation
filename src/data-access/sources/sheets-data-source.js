import { DataSource } from '../interfaces/data-source.js';
import { GoogleSheetsService } from '../../services/google-sheets-service.js';

/**
 * Google Sheets Data Source Implementation
 * Loads tournament data from Google Sheets (for dynamic bracket population)
 */
class SheetsDataSource extends DataSource {
  constructor(auth, spreadsheetId) {
    super();
    this.auth = auth;
    this.spreadsheetId = spreadsheetId;
    this.sheetsService = new GoogleSheetsService(auth);
  }

  /**
   * Get players from Google Sheets (from Qualifiers sheet)
   * @param {Object} options - Query options
   * @returns {Promise<[]>} Array of player-like objects
   */
  async getPlayers(options = {}) {
    const { bracketType = null, sheetName = 'Qualifiers', goldBracketSize = 16 } = options;

    try {
      const range = `${sheetName}!A:D`;
      const response = await this.sheetsService.getSheetData(this.spreadsheetId, range);

      if (!response.data.values) {
        return [];
      }

      const rows = response.data.values;
      const players = [];

      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (row.length >= 3 && row[1] && row[2]) {
          const seed = parseInt(row[1], 10);
          const name = row[2].toString().trim();

          if (seed && name) {
            const playerBracketType = bracketType || (seed <= goldBracketSize ? 'gold' : 'silver');
            players.push({ name, seed, bracketType: playerBracketType });
          }
        }
      }

      if (bracketType) {
        return players.filter((p) => p.bracketType === bracketType);
      }

      return players;
    } catch (error) {
      console.error('Error loading players from Google Sheets:', error.message);
      return [];
    }
  }

  /**
   * Get matches from Google Sheets (from bracket sheets with results)
   * @param {Object} options - Query options
   * @returns {Promise<[]>} Array of match-like objects
   */
  async getMatches(options = {}) {
    const { bracketType = 'gold', sheetName = null } = options;

    try {
      return [];
    } catch (error) {
      console.error('Error loading matches from Google Sheets:', error.message);
      return [];
    }
  }

  /**
   * Get tournament configuration from spreadsheet properties/metadata
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Tournament configuration object
   */
  async getConfiguration(options = {}) {
    try {
      const spreadsheet = await this.sheetsService.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      return {
        sheetName: spreadsheet.data.properties.title,
        spreadsheetId: this.spreadsheetId,
        lastModified: spreadsheet.data.properties.timeZone,
        sheets: spreadsheet.data.sheets.map((sheet) => ({
          title: sheet.properties.title,
          sheetId: sheet.properties.sheetId,
          sheetType: sheet.properties.sheetType,
        })),
      };
    } catch (error) {
      console.error('Error loading configuration from Google Sheets:', error.message);
      return {};
    }
  }

  /**
   * Save players to Google Sheets (update Qualifiers sheet)
   * @param {Array} players - Array of player-like objects
   * @param {Object} options - Save options
   * @returns {Promise<void>}
   */
  async savePlayers(players, options = {}) {
    const { sheetName = 'Qualifiers' } = options;

    try {
      throw new Error('SheetsDataSource.savePlayers() not yet implemented');
    } catch (error) {
      console.error('Error saving players to Google Sheets:', error.message);
      throw error;
    }
  }

  /**
   * Save matches to Google Sheets (update bracket sheets with results)
   * @param {Array} matches - Array of match-like objects
   * @param {Object} options - Save options
   * @returns {Promise<void>}
   */
  async saveMatches(matches, options = {}) {
    try {
      throw new Error('SheetsDataSource.saveMatches() not yet implemented');
    } catch (error) {
      console.error('Error saving matches to Google Sheets:', error.message);
      throw error;
    }
  }

  /**
   * Check if Google Sheets is available and accessible
   * @returns {Promise<boolean>} True if spreadsheet is accessible
   */
  async isAvailable() {
    try {
      await this.sheetsService.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get data source type identifier
   * @returns {string} Data source type
   */
  getType() {
    return 'sheets';
  }
}

export { SheetsDataSource };
