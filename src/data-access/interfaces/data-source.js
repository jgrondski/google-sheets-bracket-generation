/**
 * Data Source Interface
 * Defines the contract for all data sources in the application
 */
class DataSource {
  /**
   * Get players from the data source
   * @param {Object} options - Query options
   * @returns {Promise<Player[]>} Array of Player domain objects
   */
  async getPlayers(options = {}) {
    throw new Error('getPlayers must be implemented by subclass');
  }

  /**
   * Get matches from the data source
   * @param {Object} options - Query options
   * @returns {Promise<Match[]>} Array of Match domain objects
   */
  async getMatches(options = {}) {
    throw new Error('getMatches must be implemented by subclass');
  }

  /**
   * Get tournament configuration
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Tournament configuration object
   */
  async getConfiguration(options = {}) {
    throw new Error('getConfiguration must be implemented by subclass');
  }

  /**
   * Save/update players
   * @param {Player[]} players - Array of Player domain objects
   * @param {Object} options - Save options
   * @returns {Promise<void>}
   */
  async savePlayers(players, options = {}) {
    throw new Error('savePlayers must be implemented by subclass');
  }

  /**
   * Save/update matches
   * @param {Match[]} matches - Array of Match domain objects
   * @param {Object} options - Save options
   * @returns {Promise<void>}
   */
  async saveMatches(matches, options = {}) {
    throw new Error('saveMatches must be implemented by subclass');
  }

  /**
   * Check if the data source is available/connected
   * @returns {Promise<boolean>} True if data source is available
   */
  async isAvailable() {
    throw new Error('isAvailable must be implemented by subclass');
  }

  /**
   * Get data source type identifier
   * @returns {string} Data source type
   */
  getType() {
    throw new Error('getType must be implemented by subclass');
  }
}

export { DataSource };
