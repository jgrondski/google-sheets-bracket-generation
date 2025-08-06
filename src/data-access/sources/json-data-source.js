import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { DataSource } from '../interfaces/data-source.js';
import { Player } from '../../models/player.js';
import { Match } from '../../models/match.js';

/**
 * JSON File Data Source Implementation
 * Loads tournament data from JSON files
 */
class JsonDataSource extends DataSource {
  constructor(configPath) {
    super();
    this.configPath = resolve(configPath);
    this._cachedData = null;
  }

  /**
   * Load and cache the JSON data
   * @returns {Object} Parsed JSON data
   */
  _loadData() {
    if (!this._cachedData) {
      if (!existsSync(this.configPath)) {
        throw new Error(`Configuration file not found: ${this.configPath}`);
      }
      
      const content = readFileSync(this.configPath, 'utf8');
      this._cachedData = JSON.parse(content);
    }
    return this._cachedData;
  }

  /**
   * Get players from JSON data
   * @param {Object} options - Query options (bracketType, asDomainObjects)
   * @returns {Promise<Player[]>} Array of Player domain objects
   */
  async getPlayers(options = {}) {
    const data = this._loadData();
    const { bracketType = null, asDomainObjects = true } = options;
    
    if (!data.players || !Array.isArray(data.players)) {
      return [];
    }

    // If no specific bracket type is requested, return players for all brackets
    if (!bracketType) {
      const allPlayers = [];
      const availableBracketTypes = [];
      
      // Determine available bracket types from options
      if (data.options?.gold) availableBracketTypes.push('gold');
      if (data.options?.silver) availableBracketTypes.push('silver');
      
      // If no bracket config, default to gold
      if (availableBracketTypes.length === 0) {
        availableBracketTypes.push('gold');
      }
      
      for (const currentBracketType of availableBracketTypes) {
        const players = await this.getPlayers({ bracketType: currentBracketType, asDomainObjects });
        allPlayers.push(...players);
      }
      
      return allPlayers;
    }

    // Handle specific bracket type
    const bracketConfig = data.options?.[bracketType];
    if (!bracketConfig) {
      return [];
    }

    const bracketSize = bracketConfig.bracketSize || 8;
    let startIndex = 0;
    
    // Calculate start index for silver bracket
    if (bracketType === 'silver') {
      startIndex = data.options?.gold?.bracketSize || 0;
    }
    
    const players = data.players.slice(startIndex, startIndex + bracketSize);

    // Convert to domain objects if requested
    if (asDomainObjects) {
      return players.map((player, index) => {
        const seed = index + 1;
        return Player.fromJson(player, seed, bracketType);
      });
    }

    return players;
  }

  /**
   * Get matches from JSON data (currently returns empty - for future expansion)
   * @param {Object} options - Query options
   * @returns {Promise<Match[]>} Array of Match domain objects
   */
  async getMatches(options = {}) {
    // For now, JSON files don't contain match data
    // This will be used when we add match tracking features
    return [];
  }

  /**
   * Get tournament configuration
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Tournament configuration object
   */
  async getConfiguration(options = {}) {
    const data = this._loadData();
    return {
      sheetName: data.options?.sheetName || 'Tournament Bracket',
      brackets: data.options || {},
      players: data.players || []
    };
  }

  /**
   * Save players (not implemented for JSON - read-only for now)
   * @param {Player[]} players - Array of Player domain objects
   * @param {Object} options - Save options
   * @returns {Promise<void>}
   */
  async savePlayers(players, options = {}) {
    throw new Error('JsonDataSource is read-only. Cannot save players.');
  }

  /**
   * Save matches (not implemented for JSON - read-only for now)
   * @param {Match[]} matches - Array of Match domain objects
   * @param {Object} options - Save options
   * @returns {Promise<void>}
   */
  async saveMatches(matches, options = {}) {
    throw new Error('JsonDataSource is read-only. Cannot save matches.');
  }

  /**
   * Check if the JSON file is available
   * @returns {Promise<boolean>} True if file exists and is readable
   */
  async isAvailable() {
    try {
      return existsSync(this.configPath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get data source type identifier
   * @returns {string} Data source type
   */
  getType() {
    return 'json';
  }

  /**
   * Clear cached data (useful for testing or if file changes)
   */
  clearCache() {
    this._cachedData = null;
  }
}

export { JsonDataSource };
