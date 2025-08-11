// ==================== src/services/match-sheet-creator.js ====================

import { GoogleSheetsService } from './google-sheets-service.js';
import {
  getColumnsPerRound as getColumnsPerRoundUtil,
  getRoundStartColumns,
  getRoundTotalCols,
} from '../utils/sheet-layout.js';

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
    const sheetName = 'Gold Matches';
    const bracketType = 'gold';

    console.log(`🎯 Creating match tracking sheet: ${sheetName}`);

    // Calculate required columns per round (variable by round)
    const maxRounds = tournament.getBracket().numRounds;
    let columnCount = 0;
    for (let r = 0; r < maxRounds; r++) {
      columnCount += getRoundTotalCols(config, bracketType, r, maxRounds);
    }
    columnCount += 5; // small buffer

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
      config,
      bracketType
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
  async createMultiBracketMatchSheets(spreadsheetId, multiBracketTournament, config) {
    const results = [];
    const bracketTypes = multiBracketTournament.getBracketTypes();

    for (const bracketType of bracketTypes) {
      const bracketName = config.getBracketNameByType(bracketType);
      const sheetName = `${bracketName.split(' ')[0]} Matches`; // "Gold Matches", "Silver Matches"

      console.log(`🎯 Creating match tracking sheet: ${sheetName}`);

      // Calculate required columns per round (variable by round)
      const bracketTournament = multiBracketTournament.getBracket(bracketType);
      const maxRounds = bracketTournament.getBracket().numRounds;
      let columnCount = 0;
      for (let r = 0; r < maxRounds; r++) {
        columnCount += getRoundTotalCols(config, bracketType, r, maxRounds);
      }
      columnCount += 5; // small buffer

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
  async renderMatchSheet(spreadsheetId, sheetId, matchData, sheetName, config, bracketType = null) {
    const requests = [];

    // Create the headers (per round, variable game count)
    requests.push(...this.createHeaderRequests(sheetId, config, matchData.numRounds, bracketType));

    // Render each round
  const startCols = getRoundStartColumns(config, bracketType, matchData.numRounds);
  for (let r = 0; r < matchData.rounds.length; r++) {
      const round = matchData.rounds[r];
      const startColumn = startCols[r];
      requests.push(
        ...this.createRoundRequests(
          sheetId,
          round,
          startColumn,
      getRoundTotalCols(config, bracketType, r, matchData.numRounds),
      bracketType,
      config
        )
      );
    }

    // Apply the requests
    if (requests.length > 0) {
      await this.sheetsService.batchUpdate(spreadsheetId, requests);
    }

    // Apply formatting and validation
    await this.applyMatchSheetFormatting(spreadsheetId, sheetId, matchData, config, bracketType);

    // Apply winner advancement formulas
    await this.applyWinnerAdvancementFormulas(
      spreadsheetId,
      sheetId,
      matchData,
      config,
      bracketType
    );

    // Apply Loss T formulas
    await this.applyLossTFormulas(spreadsheetId, sheetId, matchData, config, bracketType);
  }

  /**
   * Calculate columns needed per round based on bestOf setting
   * @param {BracketConfig} config - Configuration
   * @param {string} bracketType - Optional bracket type for bracket-specific settings
   * @returns {number} Number of columns per round
   */
  getColumnsPerRound(config, bracketType = null) {
    return getColumnsPerRoundUtil(config, bracketType);
  }

  /**
   * Create header requests for the match sheet
   * @param {number} sheetId - Sheet ID
   * @param {BracketConfig} config - Configuration for bestOf settings
   * @param {number} numRounds - Number of rounds in the tournament
   * @param {string} bracketType - Bracket type for header bestOf
   * @returns {Array} Array of requests
   */
  createHeaderRequests(sheetId, config, numRounds, bracketType) {
    const baseHeaders = ['Match', 'Seed', 'Username'];
    const rows = [];
    for (let r = 0; r < numRounds; r++) {
      const roundBestOf = config.getRoundBestOf
        ? config.getRoundBestOf(bracketType, r, numRounds)
        : config.getBestOf(bracketType);
      const gameHeaders = [];
      for (let i = 1; i <= roundBestOf; i++) gameHeaders.push(`Game ${i}`);
      const headers = [...baseHeaders, 'Score', ...gameHeaders, 'Loss T', ''];
      rows.push(
        ...headers.map((header) => ({
          userEnteredValue: { stringValue: header },
          userEnteredFormat: {
            textFormat: { bold: true },
            horizontalAlignment: 'CENTER',
          },
        }))
      );
    }
    return [
      {
        updateCells: {
          rows: [
            {
              values: rows,
            },
          ],
          fields: 'userEnteredValue,userEnteredFormat',
          start: { sheetId, rowIndex: 0, columnIndex: 0 },
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
  createRoundRequests(sheetId, round, startColumn, columnsInRound, bracketType, config) {
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
        columnsInRound,
        bracketType,
        config
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
    columnsInRound,
    bracketType,
    config
  ) {
    const requests = [];
    const columnsPerRound = columnsInRound;

    // Create the match rows data
    const matchRows = [];

    // Player 1 row
    const player1Values = new Array(columnsPerRound).fill({
      userEnteredValue: { stringValue: '' },
    });
    player1Values[0] = { userEnteredValue: { numberValue: match.matchNumber } }; // Match number

    // Set seed and username for position 1
    if (match.position1) {
      player1Values[1] = {
        userEnteredValue: {
          numberValue: this.getBracketRelativeSeed(match.position1.seed),
        },
      };
      player1Values[2] = {
        userEnteredValue: {
          formulaValue: this.createUsernameFormula(match.position1, bracketType, config),
        },
      };
    } else {
      // Show bye
      player1Values[1] = { userEnteredValue: { stringValue: 'BYE' } };
      player1Values[2] = { userEnteredValue: { stringValue: 'BYE' } };
    }

    matchRows.push({ values: player1Values });

    // Player 2 row
    const player2Values = new Array(columnsPerRound).fill({
      userEnteredValue: { stringValue: '' },
    });

    // Set seed and username for position 2
    if (match.position2) {
      player2Values[1] = {
        userEnteredValue: {
          numberValue: this.getBracketRelativeSeed(match.position2.seed),
        },
      };
      player2Values[2] = {
        userEnteredValue: {
          formulaValue: this.createUsernameFormula(match.position2, bracketType, config),
        },
      };
    } else {
      // Show bye
      player2Values[1] = { userEnteredValue: { stringValue: 'BYE' } };
      player2Values[2] = { userEnteredValue: { stringValue: 'BYE' } };
    }

    matchRows.push({ values: player2Values });

    // Spacing row (empty)
    const spacingValues = new Array(columnsPerRound).fill({
      userEnteredValue: { stringValue: '' },
    });
    matchRows.push({ values: spacingValues });

    // Create the update request
    requests.push({
      updateCells: {
        rows: matchRows,
        fields: 'userEnteredValue',
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
   * @returns {number} Bracket-relative seed (1-based)
   */
  getBracketRelativeSeed(positionSeed) {
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
      return '';
    }

    let row;

    if (bracketType === 'gold') {
      // Gold bracket: position.seed should be 1-N, maps to rows 3-(N+2) in Qualifiers
      row = position.seed + 2;
    } else if (bracketType === 'silver') {
      // Silver bracket: position.seed should be 1-M, but we need to map to global rows
      // Silver players start after gold players + 2 header rows
      const goldBracketSize = config.getBracketSizeByType('gold');
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
  async applyMatchSheetFormatting(spreadsheetId, sheetId, matchData, config, bracketType = null) {
    const requests = [];
    const startCols = getRoundStartColumns(config, bracketType, matchData.numRounds);

    // Define colors using proper hex values converted to RGB decimals
    const lightBlue3 = { red: 0.812, green: 0.886, blue: 0.953 }; // #cfe2f3 (207/255, 226/255, 243/255)
    const lightYellow3 = { red: 1.0, green: 0.949, blue: 0.8 }; // #fff2cc (255/255, 242/255, 204/255)
    const lightGrey1 = { red: 0.851, green: 0.851, blue: 0.851 }; // #d9d9d9 (217/255, 217/255, 217/255)
    const black = { red: 0.0, green: 0.0, blue: 0.0 };

    // Calculate the actual data range based on Round 1 (which has the most matches)
    // This determines how far down we need to apply background colors
    const round1 = matchData.rounds[0];
    const maxDataRow = 1 + round1.matches.length * 3; // Header + matches * 3 rows each, includes all match data

    // 1. Set column widths per round using roundBestOf
    const columnWidthRequests = [];
    for (let round = 0; round < matchData.numRounds; round++) {
      const startCol = startCols[round];
      const roundBestOf = config.getRoundBestOf
        ? config.getRoundBestOf(bracketType, round, matchData.numRounds)
        : config.getBestOf(bracketType);
      const widths = [46, 35, 130, 40];
      for (let i = 0; i < roundBestOf; i++) widths.push(65);
      widths.push(65); // Loss T
      widths.push(50); // Spacer
      for (let i = 0; i < widths.length; i++) {
        columnWidthRequests.push({
          updateDimensionProperties: {
            range: {
              sheetId: sheetId,
              dimension: 'COLUMNS',
              startIndex: startCol + i,
              endIndex: startCol + i + 1,
            },
            properties: { pixelSize: widths[i] },
            fields: 'pixelSize',
          },
        });
      }
    }

    // Apply column widths immediately (separate batch like bracket renderer)
    if (columnWidthRequests.length > 0) {
      await this.sheetsService.batchUpdate(spreadsheetId, columnWidthRequests);
    }

    // 2. Add score dropdowns to the SCORE column only for actual match rows
    for (let round = 0; round < matchData.numRounds; round++) {
      const roundData = matchData.rounds[round];
      const scoreColumnIndex = startCols[round] + 3; // Score is 4th column within round

      // Create dropdown values from per-round maxScore to 0 (reverse sorted)
      const maxScore = config.getRoundMaxScore
        ? config.getRoundMaxScore(bracketType, round, matchData.numRounds)
        : config.getMaxScore(bracketType);
      const dropdownValues = [];
      for (let i = maxScore; i >= 0; i--) {
        dropdownValues.push({ userEnteredValue: i.toString() });
      }

      // Apply dropdowns only to actual match rows (not spacer rows)
      for (let matchIndex = 0; matchIndex < roundData.matches.length; matchIndex++) {
        const match = roundData.matches[matchIndex];
        const baseRow = 2 + matchIndex * 3; // Starting row for this match

        // Apply to both player rows in the match (skip the spacer row)
        for (let playerRow = 0; playerRow < 2; playerRow++) {
          const currentRow = baseRow + playerRow;

          // Only add dropdown if this position has a player or will get a formula
          const hasPlayer = playerRow === 0 ? match.position1 : match.position2;
          const willGetFormula = this.positionWillGetFormula(
            round,
            matchIndex,
            playerRow,
            matchData
          );

          if (hasPlayer || willGetFormula) {
            requests.push({
              setDataValidation: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: currentRow - 1, // Convert to 0-indexed
                  endRowIndex: currentRow,
                  startColumnIndex: scoreColumnIndex,
                  endColumnIndex: scoreColumnIndex + 1,
                },
                rule: {
                  condition: {
                    type: 'ONE_OF_LIST',
                    values: dropdownValues,
                  },
                  strict: true,
                  showCustomUi: true,
                },
              },
            });
          }
        }
      }
    }

    // Apply dropdown requests
    if (requests.length > 0) {
      await this.sheetsService.batchUpdate(spreadsheetId, requests);
    }

    // 3. Add integer validation and comma formatting to Game and Loss T columns
    await this.applyGameAndLossTFormatting(
      spreadsheetId,
      sheetId,
      matchData,
      config,
      bracketType,
      maxDataRow
    );

    // 4. Apply background colors
    await this.applyBackgroundColors(
      spreadsheetId,
      sheetId,
      matchData,
      config,
      bracketType,
      maxDataRow,
      lightBlue3,
      lightYellow3,
      lightGrey1,
      black
    );
  }

  /**
   * Check if a position will receive a formula (advancement from previous round)
   */
  positionWillGetFormula(roundIndex, matchIndex, positionIndex, matchData) {
    if (roundIndex === 0) return false; // Round 1 positions don't get formulas

    // Check if there's an advancement mapping that targets this position
    const currentRound = matchData.rounds[roundIndex];
    const previousRound = matchData.rounds[roundIndex - 1];

    if (!currentRound || !previousRound) return false;

    const mappings = this.getAdvancementMappings(
      previousRound,
      currentRound,
      roundIndex - 1,
      roundIndex
    );

    return mappings.some(
      (mapping) =>
        mapping.destMatchIndex === matchIndex && mapping.destPlayerIndex === positionIndex
    );
  }

  /**
   * Apply integer validation and comma formatting to Game and Loss T columns
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {number} sheetId - Sheet ID
   * @param {Object} matchData - Match data structure
   * @param {BracketConfig} config - Configuration
   * @param {string} bracketType - Optional bracket type for bracket-specific settings
   * @param {number} maxDataRow - Maximum data row to format
   */
  async applyGameAndLossTFormatting(
    spreadsheetId,
    sheetId,
    matchData,
    config,
    bracketType,
    maxDataRow
  ) {
    const requests = [];
    const startCols = getRoundStartColumns(config, bracketType, matchData.numRounds);

    for (let round = 0; round < matchData.numRounds; round++) {
      const startCol = startCols[round];
      const roundBestOf = config.getRoundBestOf
        ? config.getRoundBestOf(bracketType, round, matchData.numRounds)
        : config.getBestOf(bracketType);
      const gameColsStart = startCol + 4; // Game columns start after Match, Seed, Username, Score
      const gameColsEnd = gameColsStart + roundBestOf; // Game columns end
      const lossTCol = startCol + 4 + roundBestOf; // Loss T column is after Score + Game columns

      // Apply to Game columns (Game 1, Game 2, etc.)
      for (let gameCol = gameColsStart; gameCol < gameColsEnd; gameCol++) {
        requests.push({
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1, // Skip header row
              endRowIndex: maxDataRow,
              startColumnIndex: gameCol,
              endColumnIndex: gameCol + 1,
            },
            cell: {
              userEnteredFormat: {
                numberFormat: {
                  type: 'NUMBER',
                  pattern: '#,##0', // Integer with comma separators
                },
              },
            },
            fields: 'userEnteredFormat.numberFormat',
          },
        });

        // Add data validation to only allow whole numbers
        requests.push({
          setDataValidation: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1, // Skip header row
              endRowIndex: maxDataRow,
              startColumnIndex: gameCol,
              endColumnIndex: gameCol + 1,
            },
            rule: {
              condition: {
                type: 'NUMBER_GREATER_THAN_EQ',
                values: [{ userEnteredValue: '0' }],
              },
              strict: true,
              showCustomUi: true,
              inputMessage: 'Please enter a whole number (0 or greater)',
            },
          },
        });
      }

      // Apply to Loss T column
      requests.push({
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 1, // Skip header row
            endRowIndex: maxDataRow,
            startColumnIndex: lossTCol,
            endColumnIndex: lossTCol + 1,
          },
          cell: {
            userEnteredFormat: {
              numberFormat: {
                type: 'NUMBER',
                pattern: '#,##0', // Integer with comma separators
              },
            },
          },
          fields: 'userEnteredFormat.numberFormat',
        },
      });

      // Add data validation to Loss T column
      requests.push({
        setDataValidation: {
          range: {
            sheetId: sheetId,
            startRowIndex: 1, // Skip header row
            endRowIndex: maxDataRow,
            startColumnIndex: lossTCol,
            endColumnIndex: lossTCol + 1,
          },
          rule: {
            condition: {
              type: 'NUMBER_GREATER_THAN_EQ',
              values: [{ userEnteredValue: '0' }],
            },
            strict: true,
            showCustomUi: true,
            inputMessage: 'Please enter a whole number (0 or greater)',
          },
        },
      });
    }

    // Apply Game and Loss T formatting requests
    if (requests.length > 0) {
      await this.sheetsService.batchUpdate(spreadsheetId, requests);
    }
  }

  /**
   * Apply background colors with systematic approach based on data presence
   */
  async applyBackgroundColors(
    spreadsheetId,
    sheetId,
    matchData,
    config,
    bracketType,
    maxDataRow,
    lightBlue3,
    lightYellow3,
    lightGrey1,
    black
  ) {
    const white = { red: 1.0, green: 1.0, blue: 1.0 };

    // Calculate data boundaries for each round
    const roundDataBoundaries = this.calculateRoundDataBoundaries(matchData);

    // Pass 1 (4th to last): Apply colors to rows with data (blue, yellow, grey)
    await this.applyDataRowBackgrounds(
      spreadsheetId,
      sheetId,
      matchData,
      config.getMaxBestOf ? config.getMaxBestOf(bracketType) : config.getBestOf(bracketType),
      config,
      bracketType,
      roundDataBoundaries,
      lightBlue3,
      lightYellow3,
      lightGrey1
    );

    // Pass 2 (3rd to last): Apply grey to spacer rows
    await this.applySpacerRowBackgrounds(
      spreadsheetId,
      sheetId,
      matchData,
      config,
      bracketType,
      lightGrey1
    );

    // Pass 3 (2nd to last): Apply white to spacer columns
    await this.applySpacerColumnBackgrounds(
      spreadsheetId,
      sheetId,
      matchData,
      config,
      bracketType,
      white,
      maxDataRow
    );

    // Pass 4 (last): Apply black backgrounds to rounds with fewer matches
    await this.applyBlackBackgrounds(
      spreadsheetId,
      sheetId,
      matchData,
      config,
      bracketType,
      black
    );
  }

  /**
   * Calculate data boundaries for each round to determine which rows contain actual data
   */
  calculateRoundDataBoundaries(matchData) {
    const boundaries = [];

    for (let roundIndex = 0; roundIndex < matchData.numRounds; roundIndex++) {
      const round = matchData.rounds[roundIndex];
      const matchCount = round.matches.length;

      // Calculate the last row with actual data (excludes final spacer row)
      const lastDataRow = 1 + matchCount * 3 - 1; // Header + matches * 3 rows, minus final spacer

      boundaries.push({
        roundIndex,
        matchCount,
        lastDataRow,
        hasData: matchCount > 0,
      });
    }

    return boundaries;
  }

  /**
   * Apply background colors to rows that contain data (formulas or text)
   */
  async applyDataRowBackgrounds(
    spreadsheetId,
    sheetId,
    matchData,
    bestOf,
    config,
    bracketType,
    boundaries,
    lightBlue3,
    lightYellow3,
    lightGrey1
  ) {
    const requests = [];
    const startCols = getRoundStartColumns(config, bracketType, matchData.numRounds);

    for (let roundIndex = 0; roundIndex < matchData.numRounds; roundIndex++) {
      const boundary = boundaries[roundIndex];
      if (!boundary.hasData) continue;

  const startCol = startCols[roundIndex];
      const usernameCol = startCol + 2; // Username column
      const scoreCol = startCol + 3; // Score column
      const gameColsStart = startCol + 4; // Game columns start
      const seedCol = startCol + 1; // Seed column

      // Determine per-round game count (for coloring relevant vs irrelevant)
      const roundBestOf = config.getRoundBestOf
        ? config.getRoundBestOf(bracketType, roundIndex, matchData.numRounds)
        : bestOf;
      const gameColsEnd = gameColsStart + roundBestOf; // Game columns end (per round)
      const lossTCol = startCol + 4 + roundBestOf; // Loss T column (per round)

      // Apply grey background to all data columns first (Match + Seed columns)
      requests.push({
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 1, // Skip header
            endRowIndex: boundary.lastDataRow,
            startColumnIndex: startCol, // Match column
            endColumnIndex: startCol + 2, // Up to (but not including) Username
          },
          cell: {
            userEnteredFormat: { backgroundColor: lightGrey1 },
          },
          fields: 'userEnteredFormat.backgroundColor',
        },
      });

      // Apply blue background to Username column
      requests.push({
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 1,
            endRowIndex: boundary.lastDataRow,
            startColumnIndex: usernameCol,
            endColumnIndex: usernameCol + 1,
          },
          cell: {
            userEnteredFormat: { backgroundColor: lightBlue3 },
          },
          fields: 'userEnteredFormat.backgroundColor',
        },
      });

      // Apply blue background to Seed column (same logic as Username, one column left)
      requests.push({
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 1,
            endRowIndex: boundary.lastDataRow,
            startColumnIndex: seedCol,
            endColumnIndex: seedCol + 1,
          },
          cell: {
            userEnteredFormat: { backgroundColor: lightBlue3 },
          },
          fields: 'userEnteredFormat.backgroundColor',
        },
      });

      // Apply yellow background to Score column
      requests.push({
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 1,
            endRowIndex: boundary.lastDataRow,
            startColumnIndex: scoreCol,
            endColumnIndex: scoreCol + 1,
          },
          cell: {
            userEnteredFormat: { backgroundColor: lightYellow3 },
          },
          fields: 'userEnteredFormat.backgroundColor',
        },
      });

      // Apply yellow background to Game columns (per-round bestOf)
      requests.push({
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 1,
            endRowIndex: boundary.lastDataRow,
            startColumnIndex: gameColsStart,
            endColumnIndex: gameColsEnd,
          },
          cell: {
            userEnteredFormat: { backgroundColor: lightYellow3 },
          },
          fields: 'userEnteredFormat.backgroundColor',
        },
      });

      // Apply blue background to Loss T column
      requests.push({
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 1,
            endRowIndex: boundary.lastDataRow,
            startColumnIndex: lossTCol,
            endColumnIndex: lossTCol + 1,
          },
          cell: {
            userEnteredFormat: { backgroundColor: lightBlue3 },
          },
          fields: 'userEnteredFormat.backgroundColor',
        },
      });
    }

    if (requests.length > 0) {
      await this.sheetsService.batchUpdate(spreadsheetId, requests);
    }
  }

  /**
   * Apply light grey 1 background to spacer rows (4, 7, 10, 13, etc)
   */
  async applySpacerRowBackgrounds(
    spreadsheetId,
    sheetId,
    matchData,
    config,
    bracketType,
    lightGrey1
  ) {
    const requests = [];
    const startCols = getRoundStartColumns(config, bracketType, matchData.numRounds);

    for (let roundIndex = 0; roundIndex < matchData.numRounds; roundIndex++) {
      const round = matchData.rounds[roundIndex];
      const startCol = startCols[roundIndex];
      const endCol =
        startCol + getRoundTotalCols(config, bracketType, roundIndex, matchData.numRounds);

      // Apply light grey 1 to spacer rows (every 3rd row starting from row 4: rows 4, 7, 10, 13, etc)
      // BUT skip the spacer row for the last match in each round
      for (let matchIndex = 0; matchIndex < round.matches.length; matchIndex++) {
        // Skip spacer row for the last match in the round
        if (matchIndex === round.matches.length - 1) {
          continue; // Don't add spacer row background for the last match
        }

        const spacerRow = 2 + matchIndex * 3 + 2 - 1; // Match starts at row 2, spacer is 3rd row of each match, corrected by -1

        requests.push({
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: spacerRow, // 0-indexed (row 4 = index 3, etc)
              endRowIndex: spacerRow + 1,
              startColumnIndex: startCol,
              endColumnIndex: endCol,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: lightGrey1,
              },
            },
            fields: 'userEnteredFormat.backgroundColor',
          },
        });
      }
    }

    // Apply spacer row background requests
    if (requests.length > 0) {
      await this.sheetsService.batchUpdate(spreadsheetId, requests);
    }
  }

  /**
   * Apply white background to spacer columns (last column of each round)
   */
  async applySpacerColumnBackgrounds(
    spreadsheetId,
    sheetId,
    matchData,
    config,
    bracketType,
    white,
    maxDataRow
  ) {
    const requests = [];
    const startCols = getRoundStartColumns(config, bracketType, matchData.numRounds);

    for (let round = 0; round < matchData.numRounds; round++) {
      const startCol = startCols[round];
      const spacerCol =
        startCol + getRoundTotalCols(config, bracketType, round, matchData.numRounds) - 1; // Last column in each round is spacer

      requests.push({
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 1, // Skip header row
            endRowIndex: maxDataRow, // Use corrected maxDataRow
            startColumnIndex: spacerCol,
            endColumnIndex: spacerCol + 1,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: white,
            },
          },
          fields: 'userEnteredFormat.backgroundColor',
        },
      });
    }

    // Apply spacer column background requests
    if (requests.length > 0) {
      await this.sheetsService.batchUpdate(spreadsheetId, requests);
    }
  }

  /**
   * Apply black backgrounds to rounds that have fewer matches than the previous round
   */
  async applyBlackBackgrounds(spreadsheetId, sheetId, matchData, config, bracketType, black) {
    const requests = [];
    const startCols = getRoundStartColumns(config, bracketType, matchData.numRounds);

    // Calculate the final round's Loss T column (end of all data)
    const finalRoundIndex = matchData.numRounds - 1;
    const finalRoundStartCol = startCols[finalRoundIndex];
    const finalRoundBestOf = config.getRoundBestOf
      ? config.getRoundBestOf(bracketType, finalRoundIndex, matchData.numRounds)
      : config.getBestOf(bracketType);
    const finalRoundLossTCol = finalRoundStartCol + 4 + finalRoundBestOf; // Loss T column

    // Only apply to rounds after round 1
    for (let roundIndex = 1; roundIndex < matchData.numRounds; roundIndex++) {
      const currentRound = matchData.rounds[roundIndex];
      const previousRound = matchData.rounds[roundIndex - 1];

      // Only apply if current round has fewer matches than previous round
      if (currentRound.matches.length >= previousRound.matches.length) {
        continue;
      }

  const startCol = startCols[roundIndex];
      // Black extends from current round start ALL THE WAY to the end of final round (Loss T column)
      const endCol = finalRoundLossTCol + 1; // +1 because endColumnIndex is exclusive

      // Calculate boundaries: from row after last data row of current round to last data row of previous round
      const currentRoundLastDataRow = 1 + currentRound.matches.length * 3 - 1; // Exclude final spacer
      const previousRoundLastDataRow = 1 + previousRound.matches.length * 3 - 1; // Exclude final spacer

      // Only apply black if there's a gap to fill
      if (currentRoundLastDataRow < previousRoundLastDataRow) {
        requests.push({
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: currentRoundLastDataRow, // Start after current round's data (0-indexed)
              endRowIndex: previousRoundLastDataRow, // End at previous round's boundary (exclusive)
              startColumnIndex: startCol,
              endColumnIndex: endCol, // Extend all the way to final round Loss T column
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: black,
                textFormat: {
                  foregroundColor: black,
                },
              },
            },
            fields:
              'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat.foregroundColor',
          },
        });
      }
    }

    if (requests.length > 0) {
      await this.sheetsService.batchUpdate(spreadsheetId, requests);
    }
  }

  /**
   * Apply winner advancement formulas to populate match winners in subsequent rounds
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {number} sheetId - Sheet ID
   * @param {Object} matchData - Match data structure
   * @param {BracketConfig} config - Configuration
   * @param {string} bracketType - Optional bracket type for bracket-specific settings
   */
  async applyWinnerAdvancementFormulas(
    spreadsheetId,
    sheetId,
    matchData,
    config,
    bracketType = null
  ) {
    const requests = [];
  const startCols = getRoundStartColumns(config, bracketType, matchData.numRounds);
    // maxScore is per-round now when playersRemaining is set

    // Process each round to create advancement formulas for the next round
    for (let roundIndex = 0; roundIndex < matchData.numRounds - 1; roundIndex++) {
      const maxScore = config.getRoundMaxScore
        ? config.getRoundMaxScore(bracketType, roundIndex, matchData.numRounds)
        : config.getMaxScore(bracketType);
      const currentRound = matchData.rounds[roundIndex];
      const nextRoundIndex = roundIndex + 1;
      const nextRound = matchData.rounds[nextRoundIndex];

      if (!currentRound || !nextRound) continue;

      // Create advancement formulas based on bracket structure
      const advancementMappings = this.getAdvancementMappings(
        currentRound,
        nextRound,
        roundIndex,
        nextRoundIndex
      );

      for (const mapping of advancementMappings) {
        const sourceMatch = currentRound.matches[mapping.sourceMatchIndex];
        if (!sourceMatch) continue;

        // Calculate source cell positions (updated for new column layout)
  const sourceStartColumn = startCols[roundIndex];
        const sourceRow1 = 2 + mapping.sourceMatchIndex * 3; // Player 1 row (starts at row 2)
        const sourceRow2 = sourceRow1 + 1; // Player 2 row
        const sourceScoreCol = sourceStartColumn + 3; // Score column (Match=0, Seed=1, Username=2, Score=3)
        const sourceSeedCol = sourceStartColumn + 1; // Seed column
        const sourceUsernameCol = sourceStartColumn + 2; // Username column

        // Calculate destination cell positions
  const destStartColumn = startCols[nextRoundIndex];
        const destRow = 2 + mapping.destMatchIndex * 3 + mapping.destPlayerIndex;
        const destSeedCol = destStartColumn + 1;
        const destUsernameCol = destStartColumn + 2;

        // Convert column indices to Excel column letters
        const sourceSeedColLetter = this.getColumnLetter(sourceSeedCol);
        const sourceUsernameColLetter = this.getColumnLetter(sourceUsernameCol);
        const sourceScoreColLetter = this.getColumnLetter(sourceScoreCol);

        // Create simplified winner formulas
        const seedFormula = `=IF(${sourceScoreColLetter}${sourceRow1}=${maxScore},${sourceSeedColLetter}${sourceRow1},IF(${sourceScoreColLetter}${sourceRow2}=${maxScore},${sourceSeedColLetter}${sourceRow2},""))`;
        const usernameFormula = `=IF(${sourceScoreColLetter}${sourceRow1}=${maxScore},${sourceUsernameColLetter}${sourceRow1},IF(${sourceScoreColLetter}${sourceRow2}=${maxScore},${sourceUsernameColLetter}${sourceRow2},""))`;

        // Add seed formula request
        requests.push({
          updateCells: {
            rows: [
              {
                values: [
                  {
                    userEnteredValue: { formulaValue: seedFormula },
                  },
                ],
              },
            ],
            fields: 'userEnteredValue.formulaValue',
            start: {
              sheetId: sheetId,
              rowIndex: destRow - 1, // Convert to 0-indexed
              columnIndex: destSeedCol,
            },
          },
        });

        // Add username formula request
        requests.push({
          updateCells: {
            rows: [
              {
                values: [
                  {
                    userEnteredValue: { formulaValue: usernameFormula },
                  },
                ],
              },
            ],
            fields: 'userEnteredValue.formulaValue',
            start: {
              sheetId: sheetId,
              rowIndex: destRow - 1, // Convert to 0-indexed
              columnIndex: destUsernameCol,
            },
          },
        });
      }
    }

    // Apply all advancement formulas
    if (requests.length > 0) {
      await this.sheetsService.batchUpdate(spreadsheetId, requests);
    }
  }

  /**
   * Apply Loss T formulas to calculate accumulated losing scores for match losers
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {number} sheetId - Sheet ID
   * @param {Object} matchData - Match data structure
   * @param {BracketConfig} config - Configuration
   * @param {string} bracketType - Optional bracket type for bracket-specific settings
   */
  async applyLossTFormulas(spreadsheetId, sheetId, matchData, config, bracketType = null) {
    const requests = [];
  const startCols = getRoundStartColumns(config, bracketType, matchData.numRounds);

    for (let roundIndex = 0; roundIndex < matchData.numRounds; roundIndex++) {
      const round = matchData.rounds[roundIndex];

      for (let matchIndex = 0; matchIndex < round.matches.length; matchIndex++) {
        const match = round.matches[matchIndex];

        // Skip matches without real players
        if (!match.position1 || !match.position2) continue;

        // Calculate cell positions for this match
        const startColumn = startCols[roundIndex];
        const player1Row = 2 + matchIndex * 3; // Player 1 row
        const player2Row = player1Row + 1; // Player 2 row

        const scoreCol = startColumn + 3; // Score column
        const gameColsStart = startColumn + 4; // Game columns start
        const roundBestOf = config.getRoundBestOf
          ? config.getRoundBestOf(bracketType, roundIndex, matchData.numRounds)
          : config.getBestOf(bracketType);
        const lossTCol = startColumn + 4 + roundBestOf; // Loss T column

        // Convert to Excel letters
        const scoreColLetter = this.getColumnLetter(scoreCol);

        // Create Loss T formula for each player position
        for (let playerIndex = 0; playerIndex < 2; playerIndex++) {
          const currentPlayerRow = playerIndex === 0 ? player1Row : player2Row;
          const otherPlayerRow = playerIndex === 0 ? player2Row : player1Row;

          // Build game column references for both players
          const currentPlayerGameRefs = [];
          const otherPlayerGameRefs = [];

          for (let gameIndex = 0; gameIndex < roundBestOf; gameIndex++) {
            const gameColIndex = gameColsStart + gameIndex;
            const gameColLetter = this.getColumnLetter(gameColIndex);

            currentPlayerGameRefs.push(`${gameColLetter}${currentPlayerRow}`);
            otherPlayerGameRefs.push(`${gameColLetter}${otherPlayerRow}`);
          }

          // Build the Loss T formula
          // Logic: Only show result if this player is the loser (score ≠ maxScore) and other player is winner (score = maxScore)
          // and all game cells for both players are not blank

          // Check that all game cells are not blank
          const allGamesCellsCheck = [
            ...currentPlayerGameRefs.map((ref) => `${ref}<>""`),
            ...otherPlayerGameRefs.map((ref) => `${ref}<>""`),
          ].join(',');

          // Build the sum of losing scores
          const losingSumParts = [];
          for (let gameIndex = 0; gameIndex < roundBestOf; gameIndex++) {
            const currentRef = currentPlayerGameRefs[gameIndex];
            const otherRef = otherPlayerGameRefs[gameIndex];

            // Add current player's game score if it's less than other player's game score
            losingSumParts.push(`IF(${currentRef}<${otherRef},${currentRef},0)`);
          }
          const losingSumFormula = losingSumParts.join('+');

          // Complete Loss T formula
          const maxScore = config.getRoundMaxScore
            ? config.getRoundMaxScore(bracketType, roundIndex, matchData.numRounds)
            : config.getMaxScore(bracketType);
          const lossTFormula = `=IF(AND(${scoreColLetter}${currentPlayerRow}<>${maxScore},${scoreColLetter}${otherPlayerRow}=${maxScore},${allGamesCellsCheck}),${losingSumFormula},"")`;

          // Add Loss T formula request
          requests.push({
            updateCells: {
              rows: [
                {
                  values: [
                    {
                      userEnteredValue: { formulaValue: lossTFormula },
                    },
                  ],
                },
              ],
              fields: 'userEnteredValue.formulaValue',
              start: {
                sheetId: sheetId,
                rowIndex: currentPlayerRow - 1, // Convert to 0-indexed
                columnIndex: lossTCol,
              },
            },
          });
        }
      }
    }

    // Apply all Loss T formulas
    if (requests.length > 0) {
      await this.sheetsService.batchUpdate(spreadsheetId, requests);
    }
  }

  /**
   * Get advancement mappings for a round transition
   * @param {Object} currentRound - Current round data
   * @param {Object} nextRound - Next round data
   * @param {number} roundIndex - Current round index
   * @returns {Array} Array of advancement mappings
   */
  getAdvancementMappings(currentRound, nextRound, roundIndex) {
    const mappings = [];

    if (roundIndex === 0) {
      // Round 1 → Round 2: Smart mapping that handles bye structure dynamically
      return this.getSmartRound1ToRound2Mappings(currentRound, nextRound);
    } else {
      // Standard advancement: every 2 matches from current round feed 1 match in next round
      for (let nextMatchIndex = 0; nextMatchIndex < nextRound.matches.length; nextMatchIndex++) {
        const sourceMatch1Index = nextMatchIndex * 2;
        const sourceMatch2Index = nextMatchIndex * 2 + 1;

        // First source match winner goes to position 1
        if (sourceMatch1Index < currentRound.matches.length) {
          mappings.push({
            sourceMatchIndex: sourceMatch1Index,
            destMatchIndex: nextMatchIndex,
            destPlayerIndex: 0, // Position 1 (0-indexed)
          });
        }

        // Second source match winner goes to position 2
        if (sourceMatch2Index < currentRound.matches.length) {
          mappings.push({
            sourceMatchIndex: sourceMatch2Index,
            destMatchIndex: nextMatchIndex,
            destPlayerIndex: 1, // Position 2 (0-indexed)
          });
        }
      }
    }

    return mappings;
  }

  /**
   * Smart mapping for Round 1 → Round 2 that analyzes the bracket structure dynamically
   * @param {Object} round1 - Round 1 data
   * @param {Object} round2 - Round 2 data
   * @returns {Array} Array of advancement mappings
   */
  getSmartRound1ToRound2Mappings(round1, round2) {
    const mappings = [];
    let r1MatchIndex = 0; // Track which Round 1 match to assign next

    // Analyze Round 2 matches to determine where Round 1 winners should go
    for (let r2MatchIndex = 0; r2MatchIndex < round2.matches.length; r2MatchIndex++) {
      const r2Match = round2.matches[r2MatchIndex];

      // Check each position in the Round 2 match
      for (let positionIndex = 0; positionIndex < 2; positionIndex++) {
        const position = positionIndex === 0 ? r2Match.position1 : r2Match.position2;

        // A position should get a Round 1 winner if:
        // 1. It's null/undefined, OR
        // 2. It exists but has no seed (seed is null/undefined)
        // Positions with seed data are byes and should be left alone
        const shouldGetR1Winner = !position || !position.seed;

        if (shouldGetR1Winner && r1MatchIndex < round1.matches.length) {
          // Assign the next available Round 1 match to this position
          mappings.push({
            sourceMatchIndex: r1MatchIndex,
            destMatchIndex: r2MatchIndex,
            destPlayerIndex: positionIndex,
          });
          r1MatchIndex++; // Move to next Round 1 match
        }

        // If we've used all Round 1 matches, stop creating mappings
        if (r1MatchIndex >= round1.matches.length) break;
      }

      // If we've used all Round 1 matches, stop processing
      if (r1MatchIndex >= round1.matches.length) break;
    }

    return mappings;
  }

  /**
   * Convert column index to Excel column letter
   * @param {number} index - 0-based column index
   * @returns {string} Excel column letter
   */
  getColumnLetter(index) {
    let result = '';
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result;
      index = Math.floor(index / 26) - 1;
    }
    return result;
  }
}

export { MatchSheetCreator };
