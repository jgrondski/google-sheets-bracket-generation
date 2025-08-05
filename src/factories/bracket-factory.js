// ==================== src/factories/bracket-factory.js ====================

const { Tournament } = require('../core/tournament');
const { BracketConfig } = require('../config/bracket-config');

/**
 * Factory for creating different types of tournaments and brackets
 */
class BracketFactory {
  /**
   * Create a tournament from configuration file
   * @param {string} configPath - Path to configuration file
   * @returns {Tournament} Tournament instance
   */
  static fromConfigFile(configPath) {
    const config = BracketConfig.fromFile(configPath);
    return new Tournament(config);
  }

  /**
   * Create a tournament from configuration object
   * @param {Object} configData - Configuration data
   * @returns {Tournament} Tournament instance
   */
  static fromConfigData(configData) {
    const config = new BracketConfig(configData.options, configData.players);
    return new Tournament(config);
  }

  /**
   * Create a simple tournament from player list
   * @param {Array} players - Array of player names or objects
   * @param {Object} options - Tournament options
   * @returns {Tournament} Tournament instance
   */
  static fromPlayerList(players, options = {}) {
    const playerObjects = players.map((player, index) => ({
      name: typeof player === 'string' ? player : player.name,
      seed: index + 1,
      ...player
    }));

    const config = new BracketConfig(
      {
        sheetName: options.sheetName || 'Tournament Bracket',
        gold: {
          bracketSize: options.bracketSize || this.calculateBracketSize(players.length),
          bracketType: options.bracketType || 'standard',
          bracketName: options.bracketName || 'Bracket'
        }
      },
      playerObjects
    );

    return new Tournament(config);
  }

  /**
   * Create a tournament for testing purposes
   * @param {number} playerCount - Number of players to generate
   * @returns {Tournament} Tournament instance
   */
  static createTestTournament(playerCount = 8) {
    const players = Array.from({ length: playerCount }, (_, i) => ({
      name: `Player ${i + 1}`,
      seed: i + 1
    }));

    return this.fromPlayerList(players, {
      sheetName: 'Test Tournament',
      bracketName: 'Test Bracket'
    });
  }

  /**
   * Calculate appropriate bracket size for player count
   * @param {number} playerCount - Number of players
   * @returns {number} Bracket size (power of 2)
   */
  static calculateBracketSize(playerCount) {
    return Math.pow(2, Math.ceil(Math.log2(playerCount)));
  }

  /**
   * Validate tournament creation parameters
   * @param {Array} players - Array of players
   * @param {Object} options - Tournament options
   * @returns {Array} Array of validation errors
   */
  static validateCreationParams(players, options = {}) {
    const errors = [];

    if (!players || !Array.isArray(players)) {
      errors.push('Players must be provided as an array');
      return errors;
    }

    if (players.length < 2) {
      errors.push('At least 2 players are required');
    }

    if (options.bracketSize && options.bracketSize < players.length) {
      errors.push('Bracket size cannot be smaller than player count');
    }

    // Check for duplicate names
    const names = players.map(p => typeof p === 'string' ? p : p.name);
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      errors.push('Duplicate player names found');
    }

    // Check for empty names
    const emptyNames = names.filter(name => !name || name.trim() === '');
    if (emptyNames.length > 0) {
      errors.push(`${emptyNames.length} players have empty names`);
    }

    return errors;
  }

  /**
   * Get supported tournament types
   * @returns {Array} Array of supported tournament types
   */
  static getSupportedTypes() {
    return ['standard', 'single-elimination']; // Could expand in future
  }

  /**
   * Check if tournament type is supported
   * @param {string} type - Tournament type
   * @returns {boolean} True if supported
   */
  static isTypeSupported(type) {
    return this.getSupportedTypes().includes(type);
  }
}

module.exports = { BracketFactory };
