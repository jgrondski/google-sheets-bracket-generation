// ==================== src/services/bracket-renderer.js ====================

import { GoogleSheetsService } from "./google-sheets-service.js";
import RequestBuilderDefault from "../factories/request-builder.js";
const { RequestBuilder } = RequestBuilderDefault;
import PlayerGroup from "../models/player-group.js";
import { getPosition } from "../utils/math-utils.js";

/**
 * Service for rendering bracket layouts to Google Sheets
 */
class BracketRenderer {
  constructor(auth) {
    this.sheetsService = new GoogleSheetsService(auth);
    this.requestBuilder = new RequestBuilder();
  }

  // Convert 0-based column index to A1 letter
  getColumnLetter(index) {
    let result = "";
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result;
      index = Math.floor(index / 26) - 1;
    }
    return result;
  }

  // Match sheet name for a bracket (e.g., "Gold Matches", "Silver Matches")
  getMatchesSheetName(config, bracketType = "gold") {
    const bracketName = config.getBracketNameByType
      ? config.getBracketNameByType(bracketType)
      : config.getBracketName();
    return `${bracketName.split(" ")[0]} Matches`;
  }

  // Must mirror MatchSheetCreator.getColumnsPerRound
  getMatchSheetColumnsPerRound(config, bracketType = null) {
    const bestOf = config.getBestOf
      ? config.getBestOf(bracketType)
      : config.getBestOf();
    // Match + Seed + Username + Score + Game1..N + Loss T + Spacer
    return 4 + bestOf + 1 + 1;
  }

  // Build an A1 reference into the Match sheet for a given round/match/player/field
  // field: "seed" | "username" | "score"
  getMatchSheetRefA1(
    config,
    bracketType,
    roundIndex,
    matchIndex,
    playerIndex,
    field
  ) {
    const sheet = this.getMatchesSheetName(config, bracketType);
    const colsPerRound = this.getMatchSheetColumnsPerRound(config, bracketType);
    const startCol = roundIndex * colsPerRound;
    const colOffset = field === "seed" ? 1 : field === "username" ? 2 : 3; // Score=3
    const col = this.getColumnLetter(startCol + colOffset);
    const row = 2 + matchIndex * 3 + playerIndex; // rows 2,3 then spacer
    return `='${sheet}'!${col}${row}`;
  }

  /**
   * Render a complete bracket layout to a spreadsheet
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {BracketLayout} layout - Bracket layout instance
   * @returns {Promise<void>}
   */
  async renderBracket(spreadsheetId, layout, config, bracketType = "gold") {
    return this.renderBracketOnSheet(
      spreadsheetId,
      layout,
      0,
      "gold",
      config,
      bracketType
    );
  }

  /**
   * Render a bracket layout to a specific sheet
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {BracketLayout} layout - Bracket layout instance
   * @param {number} sheetId - Target sheet ID
   * @returns {Promise<void>}
   */
  async renderBracketOnSheet(
    spreadsheetId,
    layout,
    sheetId,
    colorScheme = "gold",
    config = null,
    bracketType = "gold"
  ) {
    const requests = [];

    // 1. Setup column count first
    const bounds = layout.calculateGridBounds();
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: sheetId,
          gridProperties: {
            columnCount: bounds.bgEndCol,
          },
        },
        fields: "gridProperties.columnCount",
      },
    });

    // 2. Setup background and dimensions
    const backgroundRequests = this.createBackgroundRequests(
      layout,
      sheetId,
      colorScheme
    );
    requests.push(...backgroundRequests);

    // 3. Setup row and column dimensions
    const dimensionRequests = this.createDimensionRequests(layout, sheetId);
    requests.push(...dimensionRequests);

    // 4. Create player groups
    const playerGroupRequests = this.createPlayerGroupRequests(
      layout,
      sheetId,
      colorScheme,
      config,
      bracketType
    );
    requests.push(...playerGroupRequests);

    // 5. Create connector borders
    const connectorRequests = await this.createConnectorRequests(
      layout,
      sheetId,
      colorScheme
    );
    requests.push(...connectorRequests);

    // 6. Create champion styling
    const championRequests = this.createChampionRequests(
      layout,
      sheetId,
      colorScheme,
      config,
      bracketType
    );
    requests.push(...championRequests);

    // Apply all requests
    await this.sheetsService.batchUpdate(spreadsheetId, requests);
  }

  /**
   * Create background formatting requests
   * @param {BracketLayout} layout - Bracket layout
   * @param {number} sheetId - Target sheet ID
   * @returns {Array} Array of requests
   */
  createBackgroundRequests(layout, sheetId = 0, colorScheme = "gold") {
    const bounds = layout.calculateGridBounds();
    return this.requestBuilder.createBackgroundRequest(
      bounds.bgEndRow,
      bounds.bgEndCol,
      sheetId,
      colorScheme
    );
  }

  /**
   * Create dimension setup requests (row heights and column widths)
   * @param {BracketLayout} layout - Bracket layout
   * @param {number} sheetId - Target sheet ID
   * @returns {Array} Array of requests
   */
  createDimensionRequests(layout, sheetId = 0) {
    const bounds = layout.calculateGridBounds();
    const columnConfig = layout.calculateColumnConfig();

    const requests = [];

    // Row dimensions
    const rowRequests = this.requestBuilder.createRowDimensionRequests(
      bounds.bgEndRow,
      sheetId
    );
    requests.push(...rowRequests);

    // Column dimensions
    const colRequests = this.requestBuilder.createColumnDimensionRequests(
      bounds.bgEndCol,
      bounds.seedIdx,
      bounds.nameIdx,
      columnConfig.nameCols,
      columnConfig.connectorCols,
      sheetId
    );
    requests.push(...colRequests);

    return requests;
  }

  /**
   * Create player group requests
   * @param {BracketLayout} layout - Bracket layout
   * @param {number} sheetId - Target sheet ID
   * @returns {Array} Array of requests
   */
  createPlayerGroupRequests(
    layout,
    sheetId = 0,
    colorScheme = "gold",
    config = null,
    bracketType = "gold"
  ) {
    const requests = [];
    const rounds = layout.getRounds();
    const lastRoundIdx = layout.getLastRoundIndex();

    const connectorType = {
      TOP: "TOP",
      BOTTOM: "BOTTOM",
    };

    const playerGroups = [];

    // Precompute Round 1 compressed match index map (skip bye pairs)
    const r1PairToMatchIndex = new Map();
    if (rounds.length > 0) {
      let idx = 0;
      for (let i = 0; i < rounds[0].length; i += 2) {
        const p1 = rounds[0][i];
        const p2 = rounds[0][i + 1];
        const isReal = p1 && p2 && !p1.isBye && !p2.isBye;
        if (isReal) {
          r1PairToMatchIndex.set(i / 2, idx);
          idx += 1;
        } else {
          r1PairToMatchIndex.set(i / 2, -1);
        }
      }
    }

    // Create PlayerGroup instances for all rounds except final
    for (let r = 0; r < rounds.length; r++) {
      for (let i = 0; i < rounds[r].length; i++) {
        const p = rounds[r][i];
        const { row, col } = getPosition(r, i);
        const conType = i % 2 === 0 ? connectorType.TOP : connectorType.BOTTOM;

        // Skip PlayerGroup creation entirely for the final round to avoid score cell
        if (r !== lastRoundIdx) {
          const group = new PlayerGroup(
            row - 1,
            col - 1,
            p.seed,
            p.name,
            p.score,
            conType
          );
          group.roundIndex = r;
          group.isBye = p.isBye || false;
          playerGroups.push(group);

          // Generate requests for this group
          if (p.isBye) {
            requests.push(...group.toByeRequests(sheetId, colorScheme));
          } else {
            // Determine matchIndex and playerIndex for Match sheet mapping
            const pairIndex = Math.floor(i / 2);
            const playerIndex = i % 2; // 0 for top, 1 for bottom
            let matchIndex;
            if (r === 0) {
              matchIndex = r1PairToMatchIndex.get(pairIndex);
              if (matchIndex === -1 || matchIndex === undefined) {
                // This is a bye pair; render background already handled above, but if we get here, skip writing values
                requests.push(...group.toByeRequests(sheetId, colorScheme));
                continue;
              }
            } else {
              matchIndex = pairIndex; // later rounds map 1:1
            }

            // Build formula references to Match sheet
            const seedRef = this.getMatchSheetRefA1(
              config,
              bracketType,
              r,
              matchIndex,
              playerIndex,
              "seed"
            );
            const nameRef = this.getMatchSheetRefA1(
              config,
              bracketType,
              r,
              matchIndex,
              playerIndex,
              "username"
            );
            const scoreRef = this.getMatchSheetRefA1(
              config,
              bracketType,
              r,
              matchIndex,
              playerIndex,
              "score"
            );

            const seedValue = { formulaValue: seedRef };
            const nameValue = { formulaValue: nameRef };
            const scoreValue = { formulaValue: scoreRef };

            requests.push(
              ...group.toRequests(
                seedValue,
                nameValue,
                scoreValue,
                sheetId,
                colorScheme
              )
            );
          }
        }
      }
    }

    // Store player groups for connector generation
    this.playerGroups = playerGroups;

    return requests;
  }

  /**
   * Create connector border requests
   * @param {BracketLayout} layout - Bracket layout
   * @param {number} sheetId - Target sheet ID
   * @returns {Array} Array of requests
   */
  async createConnectorRequests(layout, sheetId = 0, colorScheme = "gold") {
    const connectorBuilder = await import("../connectors/connector-builder.js");
    const { buildConnectors } = connectorBuilder.default;
    const lastRoundIdx = layout.getLastRoundIndex();

    // Only build connectors for non-final rounds
    const filteredGroups = this.playerGroups.filter(
      (pg) => pg.roundIndex < lastRoundIdx
    );
    return buildConnectors(filteredGroups, sheetId, colorScheme);
  }

  /**
   * Create champion styling requests
   * Also writes formulas to pull the champion (seed and name) from the final match on the Matches sheet
   * @param {BracketLayout} layout - Bracket layout
   * @param {number} sheetId - Target sheet ID
   * @param {string} colorScheme - Color scheme
   * @param {BracketConfig} config - Bracket configuration
   * @param {string} bracketType - 'gold' | 'silver'
   * @returns {Array} Array of requests
   */
  createChampionRequests(
    layout,
    sheetId = 0,
    colorScheme = "gold",
    config = null,
    bracketType = "gold"
  ) {
    const championPos = layout.getChampionPosition();

    // Start with base merge/formatting/header requests
    const requests = this.requestBuilder.createChampionRequests(
      championPos,
      sheetId,
      colorScheme
    );

    // If we don't have config, we can't build references; return formatting only
    if (!config) return requests;

    // Compute final round references from Matches sheet
    const finalRoundIndex = layout.getLastRoundIndex() - 1; // last actual round before champion
    const colsPerRound = this.getMatchSheetColumnsPerRound(config, bracketType);
    const startCol = finalRoundIndex * colsPerRound;
    const seedColLetter = this.getColumnLetter(startCol + 1); // Seed
    const usernameColLetter = this.getColumnLetter(startCol + 2); // Username
    const scoreColLetter = this.getColumnLetter(startCol + 3); // Score

    const row1 = 2; // Final match player 1 row
    const row2 = 3; // Final match player 2 row
    const sheet = this.getMatchesSheetName(config, bracketType);
    const maxScore = config.getMaxScore(bracketType);

    // Build champion formulas based on final match winner
    const seedFormula = `=IF('${sheet}'!${scoreColLetter}${row1}=${maxScore},'${sheet}'!${seedColLetter}${row1},IF('${sheet}'!${scoreColLetter}${row2}=${maxScore},'${sheet}'!${seedColLetter}${row2},""))`;
    const nameFormula = `=IF('${sheet}'!${scoreColLetter}${row1}=${maxScore},'${sheet}'!${usernameColLetter}${row1},IF('${sheet}'!${scoreColLetter}${row2}=${maxScore},'${sheet}'!${usernameColLetter}${row2},""))`;

    // Write formulas into the merged champion seed and name cells (top-left only)
    requests.push(
      {
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
          fields: "userEnteredValue.formulaValue",
          start: {
            sheetId,
            rowIndex: championPos.champMergeStart,
            columnIndex: championPos.seedIdx,
          },
        },
      },
      {
        updateCells: {
          rows: [
            {
              values: [
                {
                  userEnteredValue: { formulaValue: nameFormula },
                },
              ],
            },
          ],
          fields: "userEnteredValue.formulaValue",
          start: {
            sheetId,
            rowIndex: championPos.champMergeStart,
            columnIndex: championPos.nameIdx,
          },
        },
      }
    );

    return requests;
  }

  /**
   * Prepare value object for Google Sheets API
   * @param {*} value - Value to prepare
   * @returns {Object} Prepared value object
   */
  prepareValueObject(value) {
    if (typeof value === "number" && !isNaN(value) && value !== "") {
      return { numberValue: value };
    } else {
      return { stringValue: String(value || "") };
    }
  }
}

export { BracketRenderer };
export default { BracketRenderer };
