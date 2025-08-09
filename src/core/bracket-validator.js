// ==================== src/core/bracket-validator.js ====================

/**
 * Validation logic for tournament brackets
 */
class BracketValidator {
  /**
   * Validate a tournament configuration
   * @param {Object} config - Tournament configuration
   * @returns {Array} Array of validation errors
   */
  static validateTournamentConfig(config) {
    const errors = [];

    if (!config) {
      errors.push('Configuration is required');
      return errors;
    }

    // Validate players
    const players = config.getPlayers();
    if (!players || players.length === 0) {
      errors.push('At least one player is required');
    }

    if (players && players.length < 2) {
      errors.push('Tournament must have at least 2 players');
    }

    // Validate bracket size
    const bracketSize = config.getBracketSize();
    if (!Number.isInteger(bracketSize) || bracketSize < 2) {
      errors.push('Bracket size must be an integer >= 2');
    }

    // Note: We don't require bracket size to be a power of 2
    // The system automatically expands to the next power of 2

    // Check if bracket size accommodates all players
    if (players && players.length > bracketSize) {
      errors.push(`Bracket size (${bracketSize}) is smaller than player count (${players.length})`);
    }

    // Validate player names
    if (players) {
      const duplicateNames = this.findDuplicatePlayerNames(players);
      if (duplicateNames.length > 0) {
        errors.push(`Duplicate player names found: ${duplicateNames.join(', ')}`);
      }

      const emptyNames = players.filter((p) => !p.name || p.name.trim() === '');
      if (emptyNames.length > 0) {
        errors.push(`${emptyNames.length} players have empty names`);
      }
    }

    return errors;
  }

  /**
   * Validate bracket structure after creation
   * @param {Object} bracket - Bracket instance
   * @returns {Array} Array of validation errors
   */
  static validateBracketStructure(bracket) {
    const errors = [];

    if (!bracket) {
      errors.push('Bracket is required');
      return errors;
    }

    // Validate basic bracket properties
    if (!bracket.numRounds || bracket.numRounds < 1) {
      errors.push('Bracket must have at least 1 round');
    }

    if (bracket.actualPlayerCount < 1) {
      errors.push('Bracket must have at least 1 player');
    }

    if (bracket.bracketSize < bracket.actualPlayerCount) {
      errors.push('Bracket size cannot be smaller than actual player count');
    }

    // Note: bracket.bracketSize should be a power of 2 (handled by CompleteBracket)
    // We don't validate this here since CompleteBracket manages it automatically

    // Validate rounds structure
    try {
      for (let r = 0; r < bracket.numRounds; r++) {
        const matches = bracket.getMatchesForRound(r);
        if (!matches || matches.length === 0) {
          errors.push(`Round ${r + 1} has no matches`);
        }
      }
    } catch (error) {
      errors.push(`Error validating rounds: ${error.message}`);
    }

    return errors;
  }

  /**
   * Find duplicate player names
   * @param {Array} players - Array of player objects
   * @returns {Array} Array of duplicate names
   */
  static findDuplicatePlayerNames(players) {
    const nameCount = {};
    const duplicates = [];

    players.forEach((player) => {
      const name = player.name?.trim();
      if (name) {
        nameCount[name] = (nameCount[name] || 0) + 1;
      }
    });

    Object.keys(nameCount).forEach((name) => {
      if (nameCount[name] > 1) {
        duplicates.push(name);
      }
    });

    return duplicates;
  }

  /**
   * Validate seeding order
   * @param {Array} players - Array of player objects with seeds
   * @returns {Array} Array of validation errors
   */
  static validateSeeding(players) {
    const errors = [];

    if (!players || players.length === 0) {
      return errors;
    }

    const seeds = players.map((p) => p.seed).filter((s) => s != null);

    // Check for duplicate seeds
    const uniqueSeeds = new Set(seeds);
    if (uniqueSeeds.size !== seeds.length) {
      errors.push('Duplicate seeds found');
    }

    // Check for valid seed range
    const maxSeed = Math.max(...seeds);
    const minSeed = Math.min(...seeds);

    if (minSeed < 1) {
      errors.push('Seeds must start from 1');
    }

    if (maxSeed > players.length) {
      errors.push(`Highest seed (${maxSeed}) exceeds player count (${players.length})`);
    }

    // Check for gaps in seeding
    const expectedSeeds = Array.from({ length: players.length }, (_, i) => i + 1);
    const missingSeeds = expectedSeeds.filter((seed) => !seeds.includes(seed));

    if (missingSeeds.length > 0) {
      errors.push(`Missing seeds: ${missingSeeds.join(', ')}`);
    }

    return errors;
  }

  /**
   * Get validation warnings (non-blocking issues)
   * @param {Object} config - Tournament configuration
   * @returns {Array} Array of warnings
   */
  static getValidationWarnings(config) {
    const warnings = [];

    if (!config) return warnings;

    const players = config.getPlayers();
    const allPlayers = config.getAllPlayers();
    const bracketSize = config.getBracketSize();

    // Warn about unused players
    if (allPlayers.length > players.length) {
      const unused = allPlayers.length - players.length;
      warnings.push(`${unused} players will not be included due to bracket size limit`);
    }

    // Warn about excessive bracket size
    if (bracketSize > players.length * 2) {
      warnings.push(
        `Bracket size (${bracketSize}) is much larger than needed for ${players.length} players`
      );
    }

    // Warn about many byes
    const byes = bracketSize - players.length;
    if (byes > players.length / 2) {
      warnings.push(`High number of byes (${byes}) relative to player count (${players.length})`);
    }

    return warnings;
  }
}

export { BracketValidator };
