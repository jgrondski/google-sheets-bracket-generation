// ==================== src/core/tournament.js ====================

import { CompleteBracket } from "../complete-bracket.js";
import bracketValidatorDefault from "./bracket-validator.js";
const { BracketValidator } = bracketValidatorDefault;

/**
 * Core tournament logic and bracket management
 */
class Tournament {
  constructor(config) {
    this.config = config;
    this.players = config.getPlayers();
    this.bracket = this.createBracket();
  }

  /**
   * Create the bracket structure from players
   * @returns {CompleteBracket} Complete bracket instance
   */
  createBracket() {
    // Convert players to the format expected by CompleteBracket
    const bracketPlayers = this.players.map((player) => ({
      name: player.name,
    }));
    return new CompleteBracket(bracketPlayers);
  }

  /**
   * Get tournament summary information
   * @returns {Object} Tournament summary
   */
  getSummary() {
    return {
      actualPlayerCount: this.bracket.actualPlayerCount,
      bracketSize: this.bracket.bracketSize,
      numByes: this.bracket.numByes,
      numRounds: this.bracket.numRounds,
      tournamentName: this.config.getSheetName(),
      bracketName: this.config.getBracketName(),
    };
  }

  /**
   * Get all players in the tournament
   * @returns {Array} Array of player objects
   */
  getPlayers() {
    return this.players;
  }

  /**
   * Get the bracket instance
   * @returns {CompleteBracket} The bracket instance
   */
  getBracket() {
    return this.bracket;
  }

  /**
   * Get matches for a specific round
   * @param {number} roundIndex - Zero-based round index
   * @returns {Array} Array of matches for the round
   */
  getMatchesForRound(roundIndex) {
    return this.bracket.getMatchesForRound(roundIndex);
  }

  /**
   * Validate the tournament setup
   * @returns {Array} Array of validation errors (empty if valid)
   */
  validate() {
    const errors = [];

    // Validate configuration
    const configErrors = BracketValidator.validateTournamentConfig(this.config);
    errors.push(...configErrors);

    // Validate bracket structure
    const bracketErrors = BracketValidator.validateBracketStructure(
      this.bracket
    );
    errors.push(...bracketErrors);

    // Validate seeding
    const seedingErrors = BracketValidator.validateSeeding(this.players);
    errors.push(...seedingErrors);

    return errors;
  }

  /**
   * Get tournament type
   * @returns {string} Tournament type (e.g., 'single-elimination')
   */
  getType() {
    return "single-elimination"; // For now, only support single elimination
  }

  /**
   * Check if tournament is ready to generate
   * @returns {boolean} True if tournament is ready
   */
  isReady() {
    return this.validate().length === 0;
  }
}

export { Tournament };
export default { Tournament };
