// ==================== src/config/bracket-config.js ====================

import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Configuration manager for bracket generation
 */
class BracketConfig {
  constructor(options, players) {
    this.options = options;
    this.players = players;
  }

  /**
   * Create BracketConfig from a JSON file
   * @param {string} filePath - Path to the configuration file
   * @returns {BracketConfig} Parsed configuration
   */
  static fromFile(filePath) {
    try {
      const fullPath = resolve(filePath);
      const content = readFileSync(fullPath, "utf8");
      const data = JSON.parse(content);

      return new BracketConfig(data.options, data.players);
    } catch (error) {
      throw new Error(
        `Failed to load bracket configuration from ${filePath}: ${error.message}`
      );
    }
  }

  /**
   * Get the sheet name for the spreadsheet
   * @returns {string} Sheet name
   */
  getSheetName() {
    return this.options?.sheetName || "Tournament Bracket";
  }

  /**
   * Get the bracket configuration
   * @returns {Object} Bracket configuration
   */
  getBracketConfig() {
    return this.options?.gold || {};
  }

  /**
   * Get the bracket size (number of players to include from the list)
   * @returns {number} Number of players to include
   */
  getBracketSize() {
    const bracketSize = this.getBracketConfig().bracketSize;
    return parseInt(bracketSize, 10) || 8;
  }

  /**
   * Get the actual tournament bracket size (next power of 2)
   * @returns {number} Actual bracket size (power of 2)
   */
  getActualBracketSize() {
    const playerCount = this.getBracketSize();
    return Math.pow(2, Math.ceil(Math.log2(playerCount)));
  }

  /**
   * Get the bracket name
   * @returns {string} Bracket name
   */
  getBracketName() {
    return this.getBracketConfig().bracketName || "Bracket";
  }

  /**
   * Get the bracket type
   * @returns {string} Bracket type
   */
  getBracketType() {
    return this.getBracketConfig().bracketType || "standard";
  }

  /**
   * Get players limited to bracket size
   * @returns {Array} Array of player objects
   */
  getPlayers() {
    const bracketSize = this.getBracketSize();
    return this.players.slice(0, bracketSize).map((player, index) => ({
      seed: index + 1,
      name: player.name,
      ...player,
    }));
  }

  /**
   * Get all players (not limited by bracket size)
   * @returns {Array} Array of all player objects
   */
  getAllPlayers() {
    return this.players || [];
  }

  /**
   * Validate the configuration
   * @returns {Array} Array of validation errors (empty if valid)
   */
  validate() {
    const errors = [];

    if (!this.options) {
      errors.push("Missing options configuration");
    }

    if (!this.players || !Array.isArray(this.players)) {
      errors.push("Missing or invalid players array");
    }

    if (this.players && this.players.length === 0) {
      errors.push("No players configured");
    }

    const bracketSize = this.getBracketSize();
    if (bracketSize < 2) {
      errors.push("Bracket size must be at least 2");
    }

    // Note: We don't require bracket size to be a power of 2
    // The system will automatically expand to the next power of 2

    if (this.players && this.players.length > bracketSize) {
      console.warn(
        `Warning: ${this.players.length} players configured but bracket size is ${bracketSize}. Extra players will be ignored.`
      );
    }

    // Check for players without names
    if (this.players) {
      this.players.forEach((player, index) => {
        if (!player.name || player.name.trim() === "") {
          errors.push(`Player at index ${index} is missing a name`);
        }
      });
    }

    return errors;
  }

  /**
   * Get a summary of the configuration
   * @returns {Object} Configuration summary
   */
  getSummary() {
    return {
      sheetName: this.getSheetName(),
      bracketName: this.getBracketName(),
      bracketType: this.getBracketType(),
      bracketSize: this.getBracketSize(), // Number of players to include
      actualBracketSize: this.getActualBracketSize(), // Power of 2 bracket size
      playerCount: this.getPlayers().length,
      totalPlayersConfigured: this.getAllPlayers().length,
    };
  }
}

export { BracketConfig };
export default { BracketConfig };
