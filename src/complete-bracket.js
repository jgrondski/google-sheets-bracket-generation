/**
 * Complete bracket modeling system that handles all bracket sizes
 * Models the entire bracket structure before rendering
 */

function nextPowerOfTwo(n) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

function generateTournamentSeeding(size) {
  if (size === 2) return [1, 2];

  const prevOrder = generateTournamentSeeding(size / 2);
  const newOrder = [];

  for (const seed of prevOrder) {
    newOrder.push(seed);
    newOrder.push(size + 1 - seed);
  }

  return newOrder;
}

/**
 * Represents a single bracket position that can contain:
 * - A seeded player (visible)
 * - A bye (reserved but invisible)
 * - A match winner placeholder (empty until filled)
 */
class BracketPosition {
  constructor(roundIndex, positionIndex, type = 'empty') {
    this.roundIndex = roundIndex;
    this.positionIndex = positionIndex + 1; // 1-indexed
    this.type = type; // 'seeded', 'bye', 'winner', 'empty'
    this.seed = null;
    this.name = null;
    this.visible = true;
  }

  setSeededPlayer(seed, name) {
    this.type = 'seeded';
    this.seed = seed;
    this.name = name;
    this.visible = true;
  }

  setBye(seed, name) {
    this.type = 'bye';
    this.seed = seed;
    this.name = name;
    this.visible = false; // Reserved but invisible
  }

  setWinnerPlaceholder() {
    this.type = 'winner';
    this.seed = null;
    this.name = null;
    this.visible = true;
  }

  setChampion(seed, name) {
    this.type = 'champion';
    this.seed = seed;
    this.name = name;
    this.visible = true;
  }
}

/**
 * Models the complete bracket structure
 */
class CompleteBracket {
  constructor(players) {
    this.players = players;
    this.actualPlayerCount = players.length;
    this.bracketSize = nextPowerOfTwo(this.actualPlayerCount);
    this.numByes = this.bracketSize - this.actualPlayerCount;
    this.seedOrder = generateTournamentSeeding(this.bracketSize);

    // Determine number of rounds based on bracket size
    this.numRounds = Math.log2(this.bracketSize);
    this.rounds = [];

    this.buildCompleteStructure();
  }

  buildCompleteStructure() {
    // Build all rounds from first to champion
    for (let r = 0; r < this.numRounds; r++) {
      const roundSize = this.bracketSize / Math.pow(2, r);
      const round = [];

      for (let p = 0; p < roundSize; p++) {
        round.push(new BracketPosition(r, p));
      }

      this.rounds.push(round);
    }

    // Add champion round
    this.rounds.push([new BracketPosition(this.numRounds, 0)]);

    // Fill in the bracket structure
    this.fillRound1();
    this.fillSubsequentRounds();
    this.fillChampionRound();
  }

  fillRound1() {
    const round1 = this.rounds[0];

    // Fill positions based on tournament seeding
    for (let i = 0; i < this.bracketSize; i++) {
      const seed = this.seedOrder[i];
      const position = round1[i];

      if (seed <= this.actualPlayerCount) {
        // Real player
        const player = this.players[seed - 1];
        position.setSeededPlayer(seed, player.name);
      } else {
        // Bye - this position exists but is invisible
        position.setBye(null, null);
      }
    }

    // Handle byes for top seeds - they should not appear in round 1
    // Find which seeds got byes and mark their round 1 positions as byes
    const byeSeeds = [];
    for (let seed = 1; seed <= this.numByes; seed++) {
      byeSeeds.push(seed);
    }

    // Find positions of bye seeds in round 1 and mark them as byes
    for (let i = 0; i < this.bracketSize; i++) {
      const seed = this.seedOrder[i];
      const position = round1[i];

      if (byeSeeds.includes(seed)) {
        // This top seed gets a bye - should not appear in round 1
        position.setBye(seed, null);
      } else if (seed <= this.actualPlayerCount) {
        // Regular player that plays in round 1
        const player = this.players[seed - 1];
        position.setSeededPlayer(seed, player.name);
      } else {
        // Non-existent seed (beyond actual player count)
        position.setBye(null, null);
      }
    }
  }

  fillSubsequentRounds() {
    // Fill rounds 2 through semifinals
    for (let r = 1; r < this.numRounds; r++) {
      const currentRound = this.rounds[r];
      const prevRound = this.rounds[r - 1];

      for (let p = 0; p < currentRound.length; p++) {
        const position = currentRound[p];
        const leftPos = prevRound[p * 2];
        const rightPos = prevRound[p * 2 + 1];

        // Determine what goes in this position
        const leftIsBye = leftPos.type === 'bye';
        const rightIsBye = rightPos.type === 'bye';

        if (leftIsBye && rightIsBye) {
          // Check if either bye represents a top seed entering the bracket
          if (leftPos.seed && leftPos.seed <= this.actualPlayerCount) {
            // Left bye is a top seed entering the bracket
            const player = this.players[leftPos.seed - 1];
            position.setSeededPlayer(leftPos.seed, player.name);
          } else if (rightPos.seed && rightPos.seed <= this.actualPlayerCount) {
            // Right bye is a top seed entering the bracket
            const player = this.players[rightPos.seed - 1];
            position.setSeededPlayer(rightPos.seed, player.name);
          } else {
            // Both are empty byes - this position is also a bye
            position.setBye(null, null);
          }
        } else if (leftIsBye && !rightIsBye) {
          // Left is bye, right advances automatically
          if (leftPos.seed && leftPos.seed <= this.actualPlayerCount) {
            // Left bye is actually a top seed - they should win this "match"
            const player = this.players[leftPos.seed - 1];
            position.setSeededPlayer(leftPos.seed, player.name);
          } else if (rightPos.type === 'seeded') {
            // Right player advances (left is empty bye)
            position.setSeededPlayer(rightPos.seed, rightPos.name);
          } else {
            position.setWinnerPlaceholder();
          }
        } else if (!leftIsBye && rightIsBye) {
          // Right is bye, left advances automatically
          if (rightPos.seed && rightPos.seed <= this.actualPlayerCount) {
            // Right bye is actually a top seed - they should win this "match"
            const player = this.players[rightPos.seed - 1];
            position.setSeededPlayer(rightPos.seed, player.name);
          } else if (leftPos.type === 'seeded') {
            // Left player advances (right is empty bye)
            position.setSeededPlayer(leftPos.seed, leftPos.name);
          } else {
            position.setWinnerPlaceholder();
          }
        } else {
          // Both positions have players/winners - this is a real match
          position.setWinnerPlaceholder();
        }
      }
    }
  }

  fillChampionRound() {
    const championRound = this.rounds[this.rounds.length - 1];

    // Champion is winner of finals
    championRound[0].setChampion(null, null); // Will be filled by finals winner
  }

  /**
   * Get bracket matches for rendering (pairs positions into matches)
   */
  getMatchesForRound(roundIndex) {
    const round = this.rounds[roundIndex];
    const matches = [];

    // Pair up adjacent positions into matches
    for (let i = 0; i < round.length; i += 2) {
      const pos1 = round[i];
      const pos2 = round[i + 1] || null; // Handle odd number of positions

      const match = {
        matchIndex: i / 2 + 1, // 1-indexed
        position1: pos1,
        position2: pos2,
        visible: pos1.visible || (pos2 && pos2.visible),
        // For round 1, determine if this is a real match or bye
        isRealMatch: roundIndex === 0 ? pos1.visible && pos2 && pos2.visible : true,
      };

      matches.push(match);
    }

    return matches;
  }

  /**
   * Get only the matches that should actually be rendered (excludes bye matches)
   */
  getRenderableMatches(roundIndex) {
    const matches = this.getMatchesForRound(roundIndex);

    if (roundIndex === 0) {
      // For round 1, only show matches where both players are visible
      return matches.filter((match) => match.isRealMatch);
    } else {
      // For other rounds, show all matches
      return matches;
    }
  }

  /**
   * Get all visible positions for a given round (excludes byes)
   */
  getVisiblePositions(roundIndex) {
    return this.rounds[roundIndex].filter((pos) => pos.visible);
  }

  /**
   * Get all positions for a given round (includes byes for structure)
   */
  getAllPositions(roundIndex) {
    return this.rounds[roundIndex];
  }

  /**
   * Export bracket structure for debugging/visualization
   */
  exportStructure() {
    const structure = {};

    this.rounds.forEach((round, roundIndex) => {
      const roundName =
        roundIndex === this.rounds.length - 1 ? 'Champion' : `Round ${roundIndex + 1}`;
      structure[roundName] = round.map((pos) => ({
        position: pos.positionIndex,
        type: pos.type,
        seed: pos.seed,
        name: pos.name,
        visible: pos.visible,
      }));
    });

    return structure;
  }
}

export { CompleteBracket, BracketPosition };
