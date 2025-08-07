// ==================== src/services/match-sheet-creator.js ====================

import { GoogleSheetsService } from "./google-sheets-service.js";

/**
 * Service for creating interactive match tracking sheets
 */
class MatchSheetCreator {
  constructor(auth) {
    this.auth = auth;
    this.sheetsService = new GoogleSheetsService(auth);
  }

  /**
   * Create match tracking sheet for single bracket tournament
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {Tournament} tournament - Tournament instance
   * @param {BracketConfig} config - Configuration
   * @returns {Promise<Object>} Sheet information
   */
  async createSingleBracketMatchSheet(spreadsheetId, tournament, config) {
    const sheetName = "Gold Matches";
    const bracketType = "gold";

    console.log(`🎯 Creating match tracking sheet: ${sheetName}`);

    // Calculate required columns based on bestOf and number of rounds
    const columnsPerRound = this.getColumnsPerRound(config);
    const maxRounds = tournament.getBracket().numRounds;
    const columnCount = columnsPerRound * maxRounds + 10; // Add buffer

    // Create the sheet with enough columns
    const sheetId = await this.sheetsService.addSheet(
      spreadsheetId,
      sheetName,
      1000, // rowCount
      columnCount
    );

    // Generate match data structure
    const matchData = this.generateMatchData(tournament, bracketType);

    // Create the match sheet content
    await this.renderMatchSheet(
      spreadsheetId,
      sheetId,
      matchData,
      sheetName,
      config
    );

    console.log(`✅ Match tracking sheet created: ${sheetName}`);

    return {
      sheetName,
      sheetId,
      matches: matchData.totalMatches,
    };
  }

  /**
   * Create match tracking sheets for multi-bracket tournament
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {MultiBracketTournament} multiBracketTournament - Tournament instance
   * @param {BracketConfig} config - Configuration
   * @returns {Promise<Array>} Array of sheet information
   */
  async createMultiBracketMatchSheets(
    spreadsheetId,
    multiBracketTournament,
    config
  ) {
    const results = [];
    const bracketTypes = multiBracketTournament.getBracketTypes();

    for (const bracketType of bracketTypes) {
      const bracketName = config.getBracketNameByType(bracketType);
      const sheetName = `${bracketName.split(" ")[0]} Matches`; // "Gold Matches", "Silver Matches"

      console.log(`🎯 Creating match tracking sheet: ${sheetName}`);

      // Calculate required columns based on bestOf and number of rounds
      const bracketTournament = multiBracketTournament.getBracket(bracketType);
      const columnsPerRound = this.getColumnsPerRound(config, bracketType);
      const maxRounds = bracketTournament.getBracket().numRounds;
      const columnCount = columnsPerRound * maxRounds + 10; // Add buffer

      // Create the sheet with enough columns
      const sheetId = await this.sheetsService.addSheet(
        spreadsheetId,
        sheetName,
        1000, // rowCount
        columnCount
      );

      // Generate match data structure
      const matchData = this.generateMatchData(bracketTournament, bracketType);

      // Create the match sheet content with bracket-specific config
      await this.renderMatchSheet(
        spreadsheetId,
        sheetId,
        matchData,
        sheetName,
        config,
        bracketType
      );

      console.log(`✅ Match tracking sheet created: ${sheetName}`);

      results.push({
        bracketType,
        sheetName,
        sheetId,
        matches: matchData.totalMatches,
      });
    }

    return results;
  }

  /**
   * Generate match data structure from tournament
   * @param {Tournament} tournament - Tournament instance
   * @param {string} bracketType - Bracket type ('gold', 'silver')
   * @returns {Object} Match data structure
   */
  generateMatchData(tournament, bracketType) {
    const bracket = tournament.getBracket();
    const matches = [];
    let totalMatchNumber = 1;

    // Stop at the championship round (don't create extra rounds)
    const maxRounds = bracket.numRounds;

    for (let roundIndex = 0; roundIndex < maxRounds; roundIndex++) {
      const roundMatches = bracket.getRenderableMatches(roundIndex);

      // Skip empty rounds
      if (roundMatches.length === 0) {
        continue;
      }

      const roundData = {
        roundIndex,
        roundNumber: roundIndex + 1,
        matches: [],
      };

      // Process matches in this round
      for (const match of roundMatches) {
        const matchData = {
          matchNumber: totalMatchNumber++,
          roundIndex,
          roundNumber: roundIndex + 1,
          position1: match.position1,
          position2: match.position2,
          isRealMatch: match.isRealMatch,
          bracketType, // Add bracket type for seeding context
        };

        roundData.matches.push(matchData);
      }

      matches.push(roundData);
    }

    return {
      rounds: matches,
      totalMatches: totalMatchNumber - 1,
      numRounds: maxRounds,
      bracketType,
    };
  }

  /**
   * Render the match sheet with headers, formulas, and formatting
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {number} sheetId - Sheet ID
   * @param {Object} matchData - Match data structure
   * @param {string} sheetName - Sheet name for reference
   * @param {BracketConfig} config - Configuration for bestOf settings
   * @param {string} bracketType - Optional bracket type for bracket-specific settings
   */
  async renderMatchSheet(
    spreadsheetId,
    sheetId,
    matchData,
    sheetName,
    config,
    bracketType = null
  ) {
    const requests = [];

    // Create the headers
    requests.push(
      ...this.createHeaderRequests(
        sheetId,
        config,
        matchData.numRounds,
        bracketType
      )
    );

    // Render each round
    let startColumn = 0; // Column A = 0

    for (const round of matchData.rounds) {
      requests.push(
        ...this.createRoundRequests(
          sheetId,
          round,
          startColumn,
          matchData.bracketType,
          config,
          bracketType
        )
      );

      // Calculate columns per round based on bestOf setting
      const columnsPerRound = this.getColumnsPerRound(config, bracketType);
      startColumn += columnsPerRound;
    }

    // Apply the requests
    if (requests.length > 0) {
      await this.sheetsService.batchUpdate(spreadsheetId, requests);
    }

    // Apply formatting and validation
    await this.applyMatchSheetFormatting(
      spreadsheetId,
      sheetId,
      matchData,
      config,
      bracketType
    );
  }

  /**
   * Calculate columns needed per round based on bestOf setting
   * @param {BracketConfig} config - Configuration
   * @param {string} bracketType - Optional bracket type for bracket-specific settings
   * @returns {number} Number of columns per round
   */
  getColumnsPerRound(config, bracketType = null) {
    const bestOf = config.getBestOf(bracketType);
    // Match + Seed + Username + Score + Loss T + Game columns + spacer
    return 5 + bestOf + 1; // 5 fixed columns + bestOf game columns + 1 spacer
  }

  /**
   * Create header requests for the match sheet
   * @param {number} sheetId - Sheet ID
   * @param {BracketConfig} config - Configuration for bestOf settings
   * @param {number} numRounds - Number of rounds in the tournament
   * @param {string} bracketType - Optional bracket type for bracket-specific settings
   * @returns {Array} Array of requests
   */
  createHeaderRequests(sheetId, config, numRounds, bracketType = null) {
    const bestOf = config.getBestOf(bracketType);
    const baseHeaders = ["Match", "Seed", "Username", "Score", "Loss T"];

    // Add game columns based on bestOf
    const gameHeaders = [];
    for (let i = 1; i <= bestOf; i++) {
      gameHeaders.push(`Game ${i}`);
    }

    // Complete header set for one round
    const headers = [...baseHeaders, ...gameHeaders, ""]; // "" is spacer column

    // Use actual number of rounds from tournament
    const headerRows = [];

    for (let round = 0; round < numRounds; round++) {
      headerRows.push(
        ...headers.map((header) => ({
          userEnteredValue: { stringValue: header },
          userEnteredFormat: {
            textFormat: { bold: true },
            horizontalAlignment: "CENTER",
          },
        }))
      );
    }

    return [
      {
        updateCells: {
          rows: [
            {
              values: headerRows,
            },
          ],
          fields: "userEnteredValue,userEnteredFormat",
          start: {
            sheetId: sheetId,
            rowIndex: 0,
            columnIndex: 0,
          },
        },
      },
    ];
  }

  /**
   * Create requests for a specific round
   * @param {number} sheetId - Sheet ID
   * @param {Object} round - Round data
   * @param {number} startColumn - Starting column (0-indexed)
   * @param {string} bracketType - Bracket type for determining bye logic
   * @param {BracketConfig} config - Configuration for bestOf settings
   * @param {string} configBracketType - Bracket type for config-specific settings
   * @returns {Array} Array of requests
   */
  createRoundRequests(
    sheetId,
    round,
    startColumn,
    bracketType,
    config,
    configBracketType = null
  ) {
    const requests = [];
    let currentRow = 2; // Start at row 2 (after headers)

    for (const match of round.matches) {
      // For round 1, show all matches including byes
      // For later rounds, show all matches
      const matchRequests = this.createMatchRequests(
        match,
        sheetId,
        startColumn,
        currentRow,
        bracketType,
        config,
        configBracketType
      );
      requests.push(...matchRequests);

      currentRow += 3; // 2 player rows + 1 spacing row
    }

    return requests;
  }

  /**
   * Create requests for a specific match
   * @param {Object} match - Match data
   * @param {number} sheetId - Sheet ID
   * @param {number} startColumn - Starting column (0-indexed)
   * @param {number} currentRow - Current row number (1-indexed)
   * @param {string} bracketType - Bracket type
   * @param {BracketConfig} config - Configuration for bestOf settings
   * @param {string} configBracketType - Bracket type for config-specific settings
   * @returns {Array} Array of requests
   */
  createMatchRequests(
    match,
    sheetId,
    startColumn,
    currentRow,
    bracketType,
    config,
    configBracketType = null
  ) {
    const requests = [];
    const columnsPerRound = this.getColumnsPerRound(config, configBracketType);

    // Create the match rows data
    const matchRows = [];

    // Player 1 row
    const player1Values = new Array(columnsPerRound).fill({
      userEnteredValue: { stringValue: "" },
    });
    player1Values[0] = { userEnteredValue: { numberValue: match.matchNumber } }; // Match number

    // Set seed and username for position 1
    if (match.position1) {
      player1Values[1] = {
        userEnteredValue: {
          numberValue: this.getBracketRelativeSeed(
            match.position1.seed,
            bracketType
          ),
        },
      };
      player1Values[2] = {
        userEnteredValue: {
          formulaValue: this.createUsernameFormula(
            match.position1,
            bracketType,
            config
          ),
        },
      };
    } else {
      // Show bye
      player1Values[1] = { userEnteredValue: { stringValue: "BYE" } };
      player1Values[2] = { userEnteredValue: { stringValue: "BYE" } };
    }

    matchRows.push({ values: player1Values });

    // Player 2 row
    const player2Values = new Array(columnsPerRound).fill({
      userEnteredValue: { stringValue: "" },
    });

    // Set seed and username for position 2
    if (match.position2) {
      player2Values[1] = {
        userEnteredValue: {
          numberValue: this.getBracketRelativeSeed(
            match.position2.seed,
            bracketType
          ),
        },
      };
      player2Values[2] = {
        userEnteredValue: {
          formulaValue: this.createUsernameFormula(
            match.position2,
            bracketType,
            config
          ),
        },
      };
    } else {
      // Show bye
      player2Values[1] = { userEnteredValue: { stringValue: "BYE" } };
      player2Values[2] = { userEnteredValue: { stringValue: "BYE" } };
    }

    matchRows.push({ values: player2Values });

    // Spacing row (empty)
    const spacingValues = new Array(columnsPerRound).fill({
      userEnteredValue: { stringValue: "" },
    });
    matchRows.push({ values: spacingValues });

    // Create the update request
    requests.push({
      updateCells: {
        rows: matchRows,
        fields: "userEnteredValue",
        start: {
          sheetId: sheetId,
          rowIndex: currentRow - 1, // Convert to 0-indexed
          columnIndex: startColumn,
        },
      },
    });

    return requests;
  }

  /**
   * Get bracket-relative seed (convert position seed to bracket-specific seed)
   * @param {number} positionSeed - Seed from the position (could be global or bracket-relative)
   * @param {string} bracketType - Bracket type ('gold', 'silver')
   * @returns {number} Bracket-relative seed (1-based)
   */
  getBracketRelativeSeed(positionSeed, bracketType) {
    // For bracket display, we want seeds 1 through bracketSize
    // The position.seed should already be bracket-relative from bracket generation
    // But if it's not, we need to ensure it's positive and within range

    if (!positionSeed || positionSeed <= 0) {
      return 1; // Default fallback
    }

    // Assume position.seed is already bracket-relative
    // Gold bracket: seeds 1-goldBracketSize, Silver bracket: seeds 1-silverBracketSize
    return positionSeed;
  }

  /**
   * Create formula to reference username from Qualifiers sheet
   * @param {Object} position - Position object with seed
   * @param {string} bracketType - Bracket type for correct row calculation
   * @param {BracketConfig} config - Configuration to get bracket sizes
   * @returns {string} Excel formula
   */
  createUsernameFormula(position, bracketType, config) {
    if (!position || !position.seed) {
      return "";
    }

    let row;

    if (bracketType === "gold") {
      // Gold bracket: position.seed should be 1-N, maps to rows 3-(N+2) in Qualifiers
      row = position.seed + 2;
    } else if (bracketType === "silver") {
      // Silver bracket: position.seed should be 1-M, but we need to map to global rows
      // Silver players start after gold players + 2 header rows
      const goldBracketSize = config.getBracketSizeByType("gold");
      row = position.seed + goldBracketSize + 2; // seed 1 -> row (goldSize+3), etc.
    } else {
      // Fallback
      row = position.seed + 2;
    }

    return `='Qualifiers'!C${row}`;
  }

  /**
   * Apply formatting and data validation to the match sheet
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {number} sheetId - Sheet ID
   * @param {Object} matchData - Match data structure
   * @param {BracketConfig} config - Configuration
   * @param {string} bracketType - Optional bracket type for bracket-specific settings
   */
  async applyMatchSheetFormatting(
    spreadsheetId,
    sheetId,
    matchData,
    config,
    bracketType = null
  ) {
    const requests = [];
    const columnsPerRound = this.getColumnsPerRound(config, bracketType);
    const maxScore = config.getMaxScore(bracketType);

    // Add score dropdowns for each round
    for (let round = 0; round < matchData.numRounds; round++) {
      const scoreColumnIndex = round * columnsPerRound + 3; // Score is 4th column (index 3) in each round

      // Create dropdown values from -1 to maxScore
      const dropdownValues = [];
      for (let i = -1; i <= maxScore; i++) {
        dropdownValues.push({ userEnteredValue: i.toString() });
      }

      requests.push({
        setDataValidation: {
          range: {
            sheetId: sheetId,
            startRowIndex: 1, // Skip header row
            endRowIndex: 1000,
            startColumnIndex: scoreColumnIndex,
            endColumnIndex: scoreColumnIndex + 1,
          },
          rule: {
            condition: {
              type: "ONE_OF_LIST",
              values: dropdownValues,
            },
            strict: true,
            showCustomUi: true,
          },
        },
      });
    }

    // Auto-resize columns
    requests.push({
      autoResizeDimensions: {
        dimensions: {
          sheetId: sheetId,
          dimension: "COLUMNS",
          startIndex: 0,
          endIndex: columnsPerRound * matchData.numRounds,
        },
      },
    });

    // Apply all formatting requests
    if (requests.length > 0) {
      await this.sheetsService.batchUpdate(spreadsheetId, requests);
      console.log(
        `🎨 Applied formatting: score dropdowns (-1 to ${maxScore}) and auto-sized columns`
      );
    }
  }
}

export { MatchSheetCreator };
