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
   * Get bracket configuration by type
   * @param {string} bracketType - 'gold' or 'silver'
   * @returns {Object} Bracket configuration
   */
  getBracketConfigByType(bracketType = "gold") {
    return this.options?.[bracketType] || {};
  }

  /**
   * Get available bracket types
   * @returns {Array} Array of available bracket types
   */
  getAvailableBracketTypes() {
    const types = [];
    if (this.options?.gold) types.push("gold");
    if (this.options?.silver) types.push("silver");
    return types;
  }

  /**
   * Check if silver bracket is configured
   * @returns {boolean} True if silver bracket exists
   */
  hasSilverBracket() {
    return !!this.options?.silver;
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
   * Get bracket size by type
   * @param {string} bracketType - 'gold' or 'silver'
   * @returns {number} Number of players to include
   */
  getBracketSizeByType(bracketType = "gold") {
    const bracketConfig = this.getBracketConfigByType(bracketType);
    const bracketSize = bracketConfig.bracketSize;
    return parseInt(bracketSize, 10) || 8;
  }

  /**
   * Get bracket name by type
   * @param {string} bracketType - 'gold' or 'silver'
   * @returns {string} Bracket name
   */
  getBracketNameByType(bracketType = "gold") {
    const bracketConfig = this.getBracketConfigByType(bracketType);
    return (
      bracketConfig.bracketName ||
      `${bracketType.charAt(0).toUpperCase() + bracketType.slice(1)} Bracket`
    );
  }

  /**
   * Get bracket type by bracket category
   * @param {string} bracketType - 'gold' or 'silver'
   * @returns {string} Bracket type
   */
  getBracketTypeByCategory(bracketType = "gold") {
    const bracketConfig = this.getBracketConfigByType(bracketType);
    return bracketConfig.bracketType || "standard";
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
   * Get players for a specific bracket type
   * @param {string} bracketType - 'gold' or 'silver'
   * @returns {Array} Array of player objects for the specified bracket
   */
  getPlayersByType(bracketType = "gold") {
    if (bracketType === "gold") {
      return this.getPlayers(); // Use existing logic for gold bracket
    }

    if (bracketType === "silver") {
      const goldBracketSize = this.getBracketSizeByType("gold");
      const silverBracketSize = this.getBracketSizeByType("silver");

      // Silver bracket gets players after the gold bracket allocation
      const startIndex = goldBracketSize;
      const silverPlayers = this.players.slice(
        startIndex,
        startIndex + silverBracketSize
      );

      return silverPlayers.map((player, index) => ({
        seed: index + 1,
        name: player.name,
        ...player,
      }));
    }

    return [];
  }

  /**
   * Get total players used across all brackets
   * @returns {number} Total number of players used
   */
  getTotalPlayersUsed() {
    let total = 0;
    const types = this.getAvailableBracketTypes();

    types.forEach((type) => {
      total += this.getBracketSizeByType(type);
    });

    return Math.min(total, this.players.length);
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

    // Validate each bracket type
    const bracketTypes = this.getAvailableBracketTypes();
    if (bracketTypes.length === 0) {
      errors.push(
        "No bracket configurations found (need at least 'gold' bracket)"
      );
    }

    bracketTypes.forEach((bracketType) => {
      const bracketSize = this.getBracketSizeByType(bracketType);
      if (bracketSize < 2) {
        errors.push(`${bracketType} bracket size must be at least 2`);
      }
    });

    // Check total players vs total bracket capacity
    const totalPlayersUsed = this.getTotalPlayersUsed();
    if (this.players && totalPlayersUsed > this.players.length) {
      errors.push(
        `Total bracket sizes (${totalPlayersUsed}) exceed available players (${this.players.length})`
      );
    }

    // Warn about unused players
    if (this.players && this.players.length > totalPlayersUsed) {
      const unused = this.players.length - totalPlayersUsed;
      console.warn(
        `Warning: ${unused} players will not be included in any bracket`
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
    const bracketTypes = this.getAvailableBracketTypes();
    const brackets = {};

    bracketTypes.forEach((type) => {
      const players = this.getPlayersByType(type);
      brackets[type] = {
        bracketName: this.getBracketNameByType(type),
        bracketType: this.getBracketTypeByCategory(type),
        bracketSize: this.getBracketSizeByType(type),
        actualBracketSize: Math.pow(
          2,
          Math.ceil(Math.log2(this.getBracketSizeByType(type)))
        ),
        playerCount: players.length,
      };
    });

    return {
      sheetName: this.getSheetName(),
      totalPlayersConfigured: this.getAllPlayers().length,
      totalPlayersUsed: this.getTotalPlayersUsed(),
      brackets,
      // Legacy properties for backward compatibility
      bracketName: this.getBracketName(),
      bracketType: this.getBracketType(),
      bracketSize: this.getBracketSize(),
      actualBracketSize: this.getActualBracketSize(),
      playerCount: this.getPlayers().length,
    };
  }
}

export { BracketConfig };
export default { BracketConfig };
