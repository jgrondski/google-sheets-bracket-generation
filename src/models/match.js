import { Player } from './player.js';
import { FormulaBuilder } from '../formulas/formula-builder.js';

/**
 * Match domain model
 * Represents a single match between two players in a tournament
 */
class Match {
  constructor(player1, player2, round, bracketType, matchNumber = null) {
    this.player1 = player1 instanceof Player ? player1 : new Player(player1?.name || 'TBD');
    this.player2 = player2 instanceof Player ? player2 : new Player(player2?.name || 'TBD');
    this.round = round;
    this.bracketType = bracketType;
    this.matchNumber = matchNumber;
    this.winner = null;
    this.loser = null;
    this.games = [];
  }

  /**
   * Create a match from seed numbers (for bracket generation)
   * @param {number} seed1 - First player's seed
   * @param {number} seed2 - Second player's seed
   * @param {number} round - Round number
   * @param {string} bracketType - Bracket type
   * @param {number} matchNumber - Match number in the round
   * @returns {Match}
   */
  static fromSeeds(seed1, seed2, round, bracketType, matchNumber = null) {
    const player1 = new Player('TBD', seed1, bracketType);
    const player2 = new Player('TBD', seed2, bracketType);
    return new Match(player1, player2, round, bracketType, matchNumber);
  }

  /**
   * Generate Google Sheets formula to lookup player name from Qualifiers sheet
   * @param {string} qualifierSheetName - Name of the qualifiers sheet
   * @param {number} seed - Seed number to lookup
   * @returns {string}
   */
  static generatePlayerLookupFormula(qualifierSheetName, seed) {
    return FormulaBuilder.playerLookup(qualifierSheetName, seed);
  }

  /**
   * Get formula for player 1 name lookup
   * @param {string} qualifierSheetName - Name of the qualifiers sheet
   * @returns {string}
   */
  getPlayer1Formula(qualifierSheetName) {
    if (!this.player1.hasValidSeed()) return 'TBD';
    return FormulaBuilder.playerLookup(qualifierSheetName, this.player1.seed);
  }

  /**
   * Get formula for player 2 name lookup
   * @param {string} qualifierSheetName - Name of the qualifiers sheet
   * @returns {string}
   */
  getPlayer2Formula(qualifierSheetName) {
    if (!this.player2.hasValidSeed()) return 'TBD';
    return FormulaBuilder.playerLookup(qualifierSheetName, this.player2.seed);
  }

  /**
   * Generate winner advancement formula
   * @param {string} scoreCell1 - Cell reference for player 1 score
   * @param {string} scoreCell2 - Cell reference for player 2 score  
   * @returns {string}
   */
  getWinnerFormula(scoreCell1, scoreCell2) {
    const player1Cell = `"${this.player1.name}"`;
    const player2Cell = `"${this.player2.name}"`;
    return FormulaBuilder.winnerFormula(player1Cell, player2Cell, scoreCell1, scoreCell2);
  }

  /**
   * Check if match has a bye (one player is TBD or missing)
   * @returns {boolean}
   */
  isBye() {
    return !this.player1.hasValidSeed() || !this.player2.hasValidSeed() ||
           this.player1.name === 'TBD' || this.player2.name === 'TBD';
  }

  /**
   * Get match description for display
   * @returns {string}
   */
  getDescription() {
    const roundStr = `Round ${this.round}`;
    const matchStr = this.matchNumber ? ` Match ${this.matchNumber}` : '';
    const bracket = this.bracketType ? ` (${this.bracketType})` : '';
    return `${roundStr}${matchStr}${bracket}`;
  }

  /**
   * Add a game to this match
   * @param {Game} game - Game to add
   */
  addGame(game) {
    this.games.push(game);
  }

  /**
   * Set the winner of the match
   * @param {Player} winner - Winning player
   */
  setWinner(winner) {
    this.winner = winner;
    this.loser = winner === this.player1 ? this.player2 : this.player1;
  }

  /**
   * Get the color scheme for this match based on bracket type
   * @param {BracketConfig} config - Configuration object
   * @returns {string}
   */
  getColorScheme(config) {
    return config.getColorSchemeByCategory(this.bracketType);
  }
}

/**
 * Game domain model
 * Represents a single game within a match (for detailed scoring)
 */
class Game {
  constructor(match, gameNumber) {
    this.match = match;
    this.gameNumber = gameNumber;
    this.player1Score = null;
    this.player2Score = null;
    this.winner = null;
    this.tetrisStats = {
      player1: { tetrises: 0, lines: 0, level: 0 },
      player2: { tetrises: 0, lines: 0, level: 0 }
    };
  }

  /**
   * Set scores for the game
   * @param {number} player1Score - Player 1's score
   * @param {number} player2Score - Player 2's score
   */
  setScores(player1Score, player2Score) {
    this.player1Score = player1Score;
    this.player2Score = player2Score;
    this.winner = player1Score > player2Score ? this.match.player1 : this.match.player2;
  }

  /**
   * Set Tetris statistics for a player
   * @param {Player} player - Player to set stats for
   * @param {Object} stats - Stats object { tetrises, lines, level }
   */
  setTetrisStats(player, stats) {
    const isPlayer1 = player === this.match.player1;
    this.tetrisStats[isPlayer1 ? 'player1' : 'player2'] = { ...stats };
  }

  /**
   * Get game result summary
   * @returns {string}
   */
  getSummary() {
    if (!this.winner) return 'Game in progress';
    const score1 = this.player1Score || 0;
    const score2 = this.player2Score || 0;
    return `${this.winner.name} wins ${Math.max(score1, score2)} - ${Math.min(score1, score2)}`;
  }
}

export { Match, Game };
