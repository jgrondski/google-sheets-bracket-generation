// ==================== src/core/multi-bracket-tournament.js ====================

import { Tournament } from "./tournament.js";

/**
 * Multi-bracket tournament that can handle gold, silver, and potentially more bracket types
 */
class MultiBracketTournament {
  constructor(config) {
    this.config = config;
    this.brackets = {};
    this.bracketTypes = config.getAvailableBracketTypes();

    this.createBrackets();
  }

  /**
   * Create individual tournament brackets for each configured type
   */
  createBrackets() {
    this.bracketTypes.forEach((bracketType) => {
      // Create a sub-config for this bracket type
      const players = this.config.getPlayersByType(bracketType);
      const bracketConfig = this.createBracketSpecificConfig(
        bracketType,
        players
      );

      // Create a tournament for this bracket
      this.brackets[bracketType] = new Tournament(bracketConfig);
    });
  }

  /**
   * Create a bracket-specific configuration
   * @param {string} bracketType - 'gold' or 'silver'
   * @param {Array} players - Players for this bracket
   * @returns {Object} Bracket-specific configuration
   */
  createBracketSpecificConfig(bracketType, players) {
    const BracketConfig = this.config.constructor;

    // Create options object for this specific bracket
    const bracketOptions = {
      sheetName: this.config.getSheetName(),
      gold: {
        bracketSize: players.length.toString(),
        bracketType: this.config.getBracketTypeByCategory(bracketType),
        bracketName: this.config.getBracketNameByType(bracketType),
      },
    };

    return new BracketConfig(bracketOptions, players);
  }

  /**
   * Get all bracket types in this tournament
   * @returns {Array} Array of bracket type strings
   */
  getBracketTypes() {
    return this.bracketTypes;
  }

  /**
   * Get a specific bracket tournament
   * @param {string} bracketType - 'gold' or 'silver'
   * @returns {Tournament} Tournament instance for the bracket
   */
  getBracket(bracketType) {
    return this.brackets[bracketType];
  }

  /**
   * Get all brackets
   * @returns {Object} Object with bracket type keys and Tournament values
   */
  getAllBrackets() {
    return this.brackets;
  }

  /**
   * Validate all brackets in the tournament
   * @returns {Array} Array of validation errors across all brackets
   */
  validate() {
    const errors = [];

    // Validate the main configuration
    const configErrors = this.config.validate();
    errors.push(...configErrors);

    // Validate each individual bracket
    this.bracketTypes.forEach((bracketType) => {
      const bracket = this.brackets[bracketType];
      if (bracket) {
        const bracketErrors = bracket.validate();
        // Prefix errors with bracket type for clarity
        const prefixedErrors = bracketErrors.map(
          (error) => `${bracketType} bracket: ${error}`
        );
        errors.push(...prefixedErrors);
      }
    });

    return errors;
  }

  /**
   * Get summary information for all brackets
   * @returns {Object} Summary of the multi-bracket tournament
   */
  getSummary() {
    const summary = {
      sheetName: this.config.getSheetName(),
      totalPlayersConfigured: this.config.getAllPlayers().length,
      totalPlayersUsed: this.config.getTotalPlayersUsed(),
      brackets: {},
    };

    this.bracketTypes.forEach((bracketType) => {
      const bracket = this.brackets[bracketType];
      if (bracket) {
        summary.brackets[bracketType] = bracket.getSummary();
      }
    });

    return summary;
  }

  /**
   * Check if tournament is ready to generate
   * @returns {boolean} True if all brackets are ready
   */
  isReady() {
    return this.validate().length === 0;
  }

  /**
   * Get the number of brackets in this tournament
   * @returns {number} Number of brackets
   */
  getBracketCount() {
    return this.bracketTypes.length;
  }

  /**
   * Check if this tournament has multiple brackets
   * @returns {boolean} True if more than one bracket
   */
  isMultiBracket() {
    return this.getBracketCount() > 1;
  }

  /**
   * Check if silver bracket exists
   * @returns {boolean} True if silver bracket is configured
   */
  hasSilverBracket() {
    return this.bracketTypes.includes("silver");
  }
}

export { MultiBracketTournament };
export default { MultiBracketTournament };
