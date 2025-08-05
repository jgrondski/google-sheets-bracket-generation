// ==================== src/core/bracket-layout.js ====================

const { getPosition } = require('../utils/math-utils');

/**
 * Core bracket layout calculations and positioning logic
 */
class BracketLayout {
  constructor(tournament) {
    this.tournament = tournament;
    this.rounds = this.generateRounds();
  }

  /**
   * Generate rounds data structure from tournament
   * @returns {Array} Array of rounds, each containing player data
   */
  generateRounds() {
    const rounds = [];
    const bracket = this.tournament.bracket;

    // Process each round from the bracket model
    for (let r = 0; r < bracket.numRounds; r++) {
      const roundPlayers = [];
      const allMatches = bracket.getMatchesForRound(r);

      allMatches.forEach((match) => {
        const p1 = match.position1;
        const p2 = match.position2;

        // Add player 1 - always add to maintain bracket structure
        if (p1 && p1.visible) {
          if (p1.type === "seeded") {
            roundPlayers.push({ seed: p1.seed, name: p1.name, score: "" });
          } else {
            roundPlayers.push({ seed: "", name: "", score: "" }); // Winner placeholder
          }
        } else {
          // Invisible bye - render as background space but maintain position
          roundPlayers.push({ seed: "", name: "", score: "", isBye: true });
        }

        // Add player 2 - always add to maintain bracket structure, handle null case
        if (p2) {
          if (p2.visible) {
            if (p2.type === "seeded") {
              roundPlayers.push({ seed: p2.seed, name: p2.name, score: "" });
            } else {
              roundPlayers.push({ seed: "", name: "", score: "" }); // Winner placeholder
            }
          } else {
            // Invisible bye - render as background space but maintain position
            roundPlayers.push({ seed: "", name: "", score: "", isBye: true });
          }
        } else {
          // No p2 (shouldn't happen in proper bracket, but handle gracefully)
          roundPlayers.push({ seed: "", name: "", score: "", isBye: true });
        }
      });

      rounds.push(roundPlayers);
    }

    // Add champion round manually - single position for winner
    const championRound = [{ seed: "", name: "", score: "" }]; // Champion winner placeholder
    rounds.push(championRound);

    return rounds;
  }

  /**
   * Calculate the grid boundaries for the bracket
   * @returns {Object} Grid boundaries with rows and columns
   */
  calculateGridBounds() {
    const lastRoundIdx = this.rounds.length - 1;
    const { row: finalRow1b, col: finalCol1b } = getPosition(lastRoundIdx, 0);
    const finalRow0 = finalRow1b - 1; // zero-based start of final group
    const seedIdx = finalCol1b - 1;
    const nameIdx = seedIdx + 1;

    // bottom of last round‑1 group
    const bgEndRow = getPosition(0, this.rounds[0].length - 1).row + 2;
    // one col after champion name, plus extra for final connectors
    const bgEndCol = nameIdx + 2;

    return {
      finalRow0,
      finalRow1b,
      seedIdx,
      nameIdx,
      bgEndRow,
      bgEndCol,
    };
  }

  /**
   * Calculate column widths configuration
   * @returns {Object} Column configuration with name columns and connector columns
   */
  calculateColumnConfig() {
    const nameCols = this.rounds.map((_, r) => getPosition(r, 0).col - 1 + 1); // actual name columns
    
    // Build a set of connector columns (two after each name col except last round)
    const connectorCols = new Set();
    for (let r = 0; r < this.rounds.length - 1; r++) {
      const nameCol = getPosition(r, 0).col;
      connectorCols.add(nameCol + 1); // first connector col after name
      connectorCols.add(nameCol + 2); // second connector col after name
    }

    return {
      nameCols,
      connectorCols,
    };
  }

  /**
   * Get champion positioning information
   * @returns {Object} Champion position details
   */
  getChampionPosition() {
    const bounds = this.calculateGridBounds();
    const championRound = this.rounds[this.rounds.length - 1];
    
    // new 6-row merge 2 rows above final
    const champMergeStart = bounds.finalRow0 - 2;
    const champMergeEnd = champMergeStart + 6;

    return {
      champion: championRound[0],
      champMergeStart,
      champMergeEnd,
      seedIdx: bounds.seedIdx,
      nameIdx: bounds.nameIdx,
    };
  }

  /**
   * Get all rounds data
   * @returns {Array} Array of rounds
   */
  getRounds() {
    return this.rounds;
  }

  /**
   * Get the last round index
   * @returns {number} Last round index
   */
  getLastRoundIndex() {
    return this.rounds.length - 1;
  }
}

module.exports = { BracketLayout };
