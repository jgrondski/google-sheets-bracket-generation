import { FormulaBuilder } from './formula-builder.js';

/**
 * Formula templates for common bracket patterns
 * Provides pre-configured formula patterns for different bracket scenarios
 */
class FormulaTemplates {
  /**
   * Generate formulas for single elimination bracket seeding
   * @param {string} qualifierSheet - Name of the qualifier sheet
   * @param {number} bracketSize - Size of the bracket (power of 2)
   * @returns {Object} Template with seeding formulas
   */
  static singleEliminationSeeding(qualifierSheet, bracketSize) {
    const firstRoundFormulas = [];
    const seedPairs = this._generateSeedPairs(bracketSize);

    for (let i = 0; i < seedPairs.length; i++) {
      const [seed1, seed2] = seedPairs[i];
      firstRoundFormulas.push({
        matchIndex: i,
        player1Formula: FormulaBuilder.seedLookup(qualifierSheet, seed1),
        player2Formula: FormulaBuilder.seedLookup(qualifierSheet, seed2),
        seeds: [seed1, seed2],
      });
    }

    return {
      type: 'single-elimination-seeding',
      bracketSize,
      qualifierSheet,
      firstRound: firstRoundFormulas,
    };
  }

  /**
   * Generate formulas for winner advancement through bracket rounds
   * @param {number} round - Current round number (1-based)
   * @param {number} matchesInRound - Number of matches in this round
   * @param {Function} getCellRef - Function to get cell references (row, col) => "A1"
   * @returns {Object} Template with advancement formulas
   */
  static winnerAdvancement(round, matchesInRound, getCellRef) {
    const advancementFormulas = [];

    for (let match = 0; match < matchesInRound; match++) {
      // Calculate source match indices from previous round
      const prevMatch1 = match * 2;
      const prevMatch2 = match * 2 + 1;

      advancementFormulas.push({
        matchIndex: match,
        round: round,
        winnerFormula: FormulaBuilder.winnerFormula(
          getCellRef(prevMatch1, 'player1'), // Previous round match 1 winner
          getCellRef(prevMatch1, 'player2'),
          getCellRef(prevMatch1, 'score1'),
          getCellRef(prevMatch1, 'score2')
        ),
        sourceMatches: [prevMatch1, prevMatch2],
      });
    }

    return {
      type: 'winner-advancement',
      round,
      matches: advancementFormulas,
    };
  }

  /**
   * Generate formulas for match result tracking
   * @param {Array} matches - Array of match objects with cell references
   * @returns {Object} Template with result tracking formulas
   */
  static matchResultTracking(matches) {
    const trackingFormulas = [];

    matches.forEach((match, index) => {
      trackingFormulas.push({
        matchIndex: index,
        matchId: match.id,
        completionFormula: FormulaBuilder.matchCompleteFormula(match.score1Cell, match.score2Cell),
        winnerFormula: FormulaBuilder.winnerFormula(
          match.player1Cell,
          match.player2Cell,
          match.score1Cell,
          match.score2Cell
        ),
        cells: {
          player1: match.player1Cell,
          player2: match.player2Cell,
          score1: match.score1Cell,
          score2: match.score2Cell,
        },
      });
    });

    return {
      type: 'match-result-tracking',
      matches: trackingFormulas,
    };
  }

  /**
   * Generate formulas for tournament statistics
   * @param {string} bracketSheet - Name of the bracket sheet
   * @param {Array} matchRanges - Ranges of match cells per round
   * @returns {Object} Template with statistics formulas
   */
  static tournamentStatistics(bracketSheet, matchRanges) {
    return {
      type: 'tournament-statistics',
      formulas: {
        totalMatches: `=COUNTA(${matchRanges.join(',')})`,
        completedMatches: `=SUMPRODUCT(--(${matchRanges.map((range) => `${range}<>""`).join(',--(')})`,
        progress: FormulaBuilder.progressFormula(matchRanges.join(':')),
        remainingMatches: `=COUNTA(${matchRanges.join(',')}) - SUMPRODUCT(--(${matchRanges.map((range) => `${range}<>""`).join(',--(')})`,
        tournamentComplete: `=SUMPRODUCT(--(${matchRanges.map((range) => `${range}<>""`).join(',--(')}) = COUNTA(${matchRanges.join(',')})`,
      },
    };
  }

  /**
   * Generate formulas for bracket navigation and references
   * @param {Object} bracketConfig - Bracket configuration
   * @returns {Object} Template with navigation formulas
   */
  static bracketNavigation(bracketConfig) {
    const { spreadsheetId, sheetNames } = bracketConfig;

    return {
      type: 'bracket-navigation',
      formulas: {
        qualifiersLink: FormulaBuilder.hyperlinkFormula(
          `#gid=${bracketConfig.qualifiersSheetId}`,
          'View Qualifiers'
        ),
        goldBracketLink: sheetNames.gold
          ? FormulaBuilder.hyperlinkFormula(`#gid=${bracketConfig.goldSheetId}`, 'Gold Bracket')
          : null,
        silverBracketLink: sheetNames.silver
          ? FormulaBuilder.hyperlinkFormula(`#gid=${bracketConfig.silverSheetId}`, 'Silver Bracket')
          : null,
      },
    };
  }

  /**
   * Generate complete bracket formula set
   * @param {Object} config - Complete bracket configuration
   * @returns {Object} Complete formula template set
   */
  static completeBracketFormulas(config) {
    const { qualifierSheet, bracketSize, bracketSheet, rounds, spreadsheetId } = config;

    const templates = {
      seeding: this.singleEliminationSeeding(qualifierSheet, bracketSize),
      advancement: [],
      statistics: this.tournamentStatistics(bracketSheet, []), // Will be populated with actual ranges
      navigation: this.bracketNavigation(config),
    };

    // Generate advancement formulas for each round
    let matchesInRound = bracketSize / 2;
    for (let round = 2; round <= rounds; round++) {
      matchesInRound = matchesInRound / 2;
      if (matchesInRound >= 1) {
        templates.advancement.push(
          this.winnerAdvancement(round, matchesInRound, config.getCellRef)
        );
      }
    }

    return {
      type: 'complete-bracket',
      config,
      templates,
    };
  }

  /**
   * Generate seed pairs for single elimination tournament
   * @param {number} bracketSize - Size of bracket (power of 2)
   * @returns {Array<Array<number>>} Array of seed pairs [[1,8], [2,7], etc.]
   */
  static _generateSeedPairs(bracketSize) {
    const seedPairs = [];
    const seeds = Array.from({ length: bracketSize }, (_, i) => i + 1);

    // Standard tournament seeding: 1 vs last, 2 vs second-to-last, etc.
    for (let i = 0; i < bracketSize / 2; i++) {
      seedPairs.push([seeds[i], seeds[bracketSize - 1 - i]]);
    }

    return seedPairs;
  }

  /**
   * Get formula template by type
   * @param {string} templateType - Type of template to retrieve
   * @param {Object} config - Template configuration
   * @returns {Object} Formula template
   */
  static getTemplate(templateType, config) {
    switch (templateType) {
      case 'single-elimination-seeding':
        return this.singleEliminationSeeding(config.qualifierSheet, config.bracketSize);
      case 'winner-advancement':
        return this.winnerAdvancement(config.round, config.matchesInRound, config.getCellRef);
      case 'match-result-tracking':
        return this.matchResultTracking(config.matches);
      case 'tournament-statistics':
        return this.tournamentStatistics(config.bracketSheet, config.matchRanges);
      case 'bracket-navigation':
        return this.bracketNavigation(config);
      case 'complete-bracket':
        return this.completeBracketFormulas(config);
      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }
  }
}

export { FormulaTemplates };
