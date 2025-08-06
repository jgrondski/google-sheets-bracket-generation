/**
 * Player domain model
 * Represents a tournament participant with consistent data structure
 */
class Player {
  constructor(name, seed = null, bracketType = null) {
    this.name = name?.toUpperCase() || '';
    this.seed = seed;
    this.bracketType = bracketType;
  }

  /**
   * Create Player from raw JSON data
   * @param {Object} playerData - Raw player data from JSON
   * @param {number} seed - Player's seed number
   * @param {string} bracketType - Bracket type (gold, silver, etc.)
   * @returns {Player}
   */
  static fromJson(playerData, seed = null, bracketType = null) {
    return new Player(playerData.name, seed, bracketType);
  }

  /**
   * Get display name (always uppercase)
   * @returns {string}
   */
  getDisplayName() {
    return this.name;
  }

  /**
   * Check if player has a valid seed
   * @returns {boolean}
   */
  hasValidSeed() {
    return this.seed !== null && this.seed > 0;
  }

  /**
   * Get player's color scheme based on bracket type
   * @param {BracketConfig} config - Configuration object
   * @returns {string}
   */
  getColorScheme(config) {
    if (!this.bracketType) return 'gold'; // Default fallback
    return config.getColorSchemeByCategory(this.bracketType);
  }

  /**
   * Convert to string representation
   * @returns {string}
   */
  toString() {
    const seedStr = this.seed ? `(${this.seed})` : '';
    const bracketStr = this.bracketType ? `[${this.bracketType}]` : '';
    return `${this.name} ${seedStr} ${bracketStr}`.trim();
  }

  /**
   * Create a copy of the player with new properties
   * @param {Object} updates - Properties to update
   * @returns {Player}
   */
  withUpdates(updates) {
    return new Player(
      updates.name ?? this.name,
      updates.seed ?? this.seed,
      updates.bracketType ?? this.bracketType
    );
  }
}

export { Player };
