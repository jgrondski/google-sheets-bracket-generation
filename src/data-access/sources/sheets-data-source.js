import { DataSource } from '../interfaces/data-source.js';
import { Player } from '../../models/player.js';
import { Match } from '../../models/match.js';
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
   * @returns {Promise<Player[]>} Array of Player domain objects
   */
  async getPlayers(options = {}) {
    const { bracketType = null, sheetName = 'Qualifiers' } = options;
    
    try {
      // Read data from the Qualifiers sheet
      const range = `${sheetName}!A:D`; // Columns A-D contain qualifier data
      const response = await this.sheetsService.getSheetData(this.spreadsheetId, range);
      
      if (!response.data.values) {
        return [];
      }

      const rows = response.data.values;
      const players = [];

      // Skip header rows and process player data
      for (let i = 2; i < rows.length; i++) { // Start from row 3 (index 2)
        const row = rows[i];
        if (row.length >= 3 && row[1] && row[2]) { // Seed and Name columns
          const seed = parseInt(row[1], 10);
          const name = row[2].toString().trim();
          
          if (seed && name) {
            // Determine bracket type based on seed or other logic
            const playerBracketType = bracketType || (seed <= 16 ? 'gold' : 'silver');
            
            const player = new Player(name, seed, playerBracketType);
            players.push(player);
          }
        }
      }

      // Filter by bracket type if specified
      if (bracketType) {
        return players.filter(p => p.bracketType === bracketType);
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
   * @returns {Promise<Match[]>} Array of Match domain objects
   */
  async getMatches(options = {}) {
    const { bracketType = 'gold', sheetName = null } = options;
    const targetSheetName = sheetName || `${bracketType.charAt(0).toUpperCase() + bracketType.slice(1)} Bracket`;
    
    try {
      // This is a placeholder for future implementation
      // Will read match results from bracket sheets and convert to Match domain objects
      // For now, return empty array
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
        sheets: spreadsheet.data.sheets.map(sheet => ({
          title: sheet.properties.title,
          sheetId: sheet.properties.sheetId,
          sheetType: sheet.properties.sheetType
        }))
      };
    } catch (error) {
      console.error('Error loading configuration from Google Sheets:', error.message);
      return {};
    }
  }

  /**
   * Save players to Google Sheets (update Qualifiers sheet)
   * @param {Player[]} players - Array of Player domain objects
   * @param {Object} options - Save options
   * @returns {Promise<void>}
   */
  async savePlayers(players, options = {}) {
    const { sheetName = 'Qualifiers' } = options;
    
    try {
      // This would implement updating the Qualifiers sheet with new player data
      // For now, throw an error as this is complex and requires careful implementation
      throw new Error('SheetsDataSource.savePlayers() not yet implemented');
    } catch (error) {
      console.error('Error saving players to Google Sheets:', error.message);
      throw error;
    }
  }

  /**
   * Save matches to Google Sheets (update bracket sheets with results)
   * @param {Match[]} matches - Array of Match domain objects  
   * @param {Object} options - Save options
   * @returns {Promise<void>}
   */
  async saveMatches(matches, options = {}) {
    try {
      // This would implement updating bracket sheets with match results
      // For now, throw an error as this is complex and requires careful implementation
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
