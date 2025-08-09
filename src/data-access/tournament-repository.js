import { DataSourceFactory } from './data-source-factory.js';

/**
 * Tournament data repository
 * Provides high-level data access operations for tournament management
 */
class TournamentRepository {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Create repository from configuration
   * @param {Object} config - Data source configuration
   * @returns {TournamentRepository}
   */
  static fromConfig(config) {
    const dataSource = DataSourceFactory.createFromConfig(config);
    return new TournamentRepository(dataSource);
  }

  /**
   * Create repository from file path (convenience method)
   * @param {string} configPath - Path to JSON configuration file
   * @returns {TournamentRepository}
   */
  static fromFile(configPath) {
    const dataSource = DataSourceFactory.createJsonDataSource(configPath);
    return new TournamentRepository(dataSource);
  }

  /**
   * Get all players for a tournament
   * @param {Object} options - Query options
   * @returns {Promise<Player[]>} Array of Player domain objects
   */
  async getAllPlayers(options = {}) {
    return await this.dataSource.getPlayers({ asDomainObjects: true, ...options });
  }

  /**
   * Get players by bracket type
   * @param {string} bracketType - Bracket type (gold, silver, etc.)
   * @param {Object} options - Additional options
   * @returns {Promise<Player[]>} Array of Player domain objects for the bracket
   */
  async getPlayersByBracket(bracketType, options = {}) {
    return await this.dataSource.getPlayers({
      bracketType,
      asDomainObjects: true,
      ...options,
    });
  }

  /**
   * Get tournament configuration
   * @returns {Promise<Object>} Tournament configuration
   */
  async getConfiguration() {
    return await this.dataSource.getConfiguration();
  }

  /**
   * Get all matches for a tournament
   * @param {Object} options - Query options
   * @returns {Promise<Match[]>} Array of Match domain objects
   */
  async getAllMatches(options = {}) {
    return await this.dataSource.getMatches(options);
  }

  /**
   * Get matches by bracket type
   * @param {string} bracketType - Bracket type (gold, silver, etc.)
   * @param {Object} options - Additional options
   * @returns {Promise<Match[]>} Array of Match domain objects for the bracket
   */
  async getMatchesByBracket(bracketType, options = {}) {
    return await this.dataSource.getMatches({ bracketType, ...options });
  }

  /**
   * Save match results
   * @param {Match[]} matches - Array of Match domain objects with results
   * @param {Object} options - Save options
   * @returns {Promise<void>}
   */
  async saveMatchResults(matches, options = {}) {
    return await this.dataSource.saveMatches(matches, options);
  }

  /**
   * Update player seeding
   * @param {Player[]} players - Array of Player domain objects with updated seeds
   * @param {Object} options - Save options
   * @returns {Promise<void>}
   */
  async updatePlayerSeeding(players, options = {}) {
    return await this.dataSource.savePlayers(players, options);
  }

  /**
   * Check if the data source is available
   * @returns {Promise<boolean>} True if data source is available
   */
  async isAvailable() {
    return await this.dataSource.isAvailable();
  }

  /**
   * Get data source type
   * @returns {string} Data source type identifier
   */
  getDataSourceType() {
    return this.dataSource.getType();
  }

  /**
   * Get data source statistics
   * @returns {Promise<Object>} Statistics about the data source
   */
  async getStatistics() {
    const config = await this.getConfiguration();
    const allPlayers = await this.getAllPlayers();
    const allMatches = await this.getAllMatches();

    return {
      dataSourceType: this.getDataSourceType(),
      isAvailable: await this.isAvailable(),
      playerCount: allPlayers.length,
      matchCount: allMatches.length,
      sheetName: config.sheetName || 'Unknown',
      brackets: this._getBracketStatistics(allPlayers),
    };
  }

  /**
   * Get bracket statistics from players
   * @param {Player[]} players - Array of players
   * @returns {Object} Bracket statistics
   */
  _getBracketStatistics(players) {
    const brackets = {};

    for (const player of players) {
      const bracketType = player.bracketType || 'unknown';

      if (!brackets[bracketType]) {
        brackets[bracketType] = {
          playerCount: 0,
          seedRange: { min: null, max: null },
        };
      }

      brackets[bracketType].playerCount++;

      if (player.hasValidSeed()) {
        const seed = player.seed;
        if (
          brackets[bracketType].seedRange.min === null ||
          seed < brackets[bracketType].seedRange.min
        ) {
          brackets[bracketType].seedRange.min = seed;
        }
        if (
          brackets[bracketType].seedRange.max === null ||
          seed > brackets[bracketType].seedRange.max
        ) {
          brackets[bracketType].seedRange.max = seed;
        }
      }
    }

    return brackets;
  }

  /**
   * Validate tournament data integrity
   * @returns {Promise<Object>} Validation results
   */
  async validateData() {
    const errors = [];
    const warnings = [];

    try {
      // Check data source availability
      if (!(await this.isAvailable())) {
        errors.push('Data source is not available');
        return { valid: false, errors, warnings };
      }

      // Load and validate players
      const players = await this.getAllPlayers();
      if (players.length === 0) {
        warnings.push('No players found in data source');
      }

      // Check for duplicate seeds within each bracket (not across brackets)
      const brackets = this._getBracketStatistics(players);
      for (const bracketType of Object.keys(brackets)) {
        const bracketPlayers = players.filter((p) => p.bracketType === bracketType);
        const bracketSeeds = bracketPlayers.filter((p) => p.hasValidSeed()).map((p) => p.seed);
        const uniqueBracketSeeds = new Set(bracketSeeds);
        if (bracketSeeds.length !== uniqueBracketSeeds.size) {
          errors.push(`Duplicate player seeds found in ${bracketType} bracket`);
        }
      }

      // Check for empty player names
      const emptyNames = players.filter((p) => !p.name || p.name.trim() === '');
      if (emptyNames.length > 0) {
        errors.push(`${emptyNames.length} players have empty names`);
      }

      // Load and validate matches
      const matches = await this.getAllMatches();
      // Additional match validation could go here

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        playerCount: players.length,
        matchCount: matches.length,
      };
    } catch (error) {
      errors.push(`Validation failed: ${error.message}`);
      return { valid: false, errors, warnings };
    }
  }
}

export { TournamentRepository };
