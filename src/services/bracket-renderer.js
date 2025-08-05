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

  /**
   * Render a complete bracket layout to a spreadsheet
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {BracketLayout} layout - Bracket layout instance
   * @returns {Promise<void>}
   */
  async renderBracket(spreadsheetId, layout) {
    const requests = [];

    // 1. Setup column count first
    const bounds = layout.calculateGridBounds();
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: 0,
          gridProperties: {
            columnCount: bounds.bgEndCol,
          },
        },
        fields: "gridProperties.columnCount",
      },
    });

    // 2. Setup background and dimensions
    const backgroundRequests = this.createBackgroundRequests(layout);
    requests.push(...backgroundRequests);

    // 3. Setup row and column dimensions
    const dimensionRequests = this.createDimensionRequests(layout);
    requests.push(...dimensionRequests);

    // 4. Create player groups
    const playerGroupRequests = this.createPlayerGroupRequests(layout);
    requests.push(...playerGroupRequests);

    // 5. Create connector borders
    const connectorRequests = await this.createConnectorRequests(layout);
    requests.push(...connectorRequests);

    // 6. Create champion styling
    const championRequests = this.createChampionRequests(layout);
    requests.push(...championRequests);

    // Apply all requests
    await this.sheetsService.batchUpdate(spreadsheetId, requests);
  }

  /**
   * Create background formatting requests
   * @param {BracketLayout} layout - Bracket layout
   * @returns {Array} Array of requests
   */
  createBackgroundRequests(layout) {
    const bounds = layout.calculateGridBounds();
    return this.requestBuilder.createBackgroundRequest(
      bounds.bgEndRow,
      bounds.bgEndCol
    );
  }

  /**
   * Create dimension setup requests (row heights and column widths)
   * @param {BracketLayout} layout - Bracket layout
   * @returns {Array} Array of requests
   */
  createDimensionRequests(layout) {
    const bounds = layout.calculateGridBounds();
    const columnConfig = layout.calculateColumnConfig();

    const requests = [];

    // Row dimensions
    const rowRequests = this.requestBuilder.createRowDimensionRequests(
      bounds.bgEndRow
    );
    requests.push(...rowRequests);

    // Column dimensions
    const colRequests = this.requestBuilder.createColumnDimensionRequests(
      bounds.bgEndCol,
      bounds.seedIdx,
      bounds.nameIdx,
      columnConfig.nameCols,
      columnConfig.connectorCols
    );
    requests.push(...colRequests);

    return requests;
  }

  /**
   * Create player group requests
   * @param {BracketLayout} layout - Bracket layout
   * @returns {Array} Array of requests
   */
  createPlayerGroupRequests(layout) {
    const requests = [];
    const rounds = layout.getRounds();
    const lastRoundIdx = layout.getLastRoundIndex();

    const connectorType = {
      TOP: "TOP",
      BOTTOM: "BOTTOM",
    };

    const playerGroups = [];

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
            requests.push(...group.toByeRequests());
          } else {
            // Prepare value objects for the group
            const seedValue = this.prepareValueObject(p.seed);
            const nameValue = { stringValue: p.name || "" };
            const scoreValue = this.prepareValueObject(p.score);

            requests.push(
              ...group.toRequests(seedValue, nameValue, scoreValue)
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
   * @returns {Array} Array of requests
   */
  async createConnectorRequests(layout) {
    const connectorBuilder = await import("../connectors/connector-builder.js");
    const { buildConnectors } = connectorBuilder.default;
    const lastRoundIdx = layout.getLastRoundIndex();

    // Only build connectors for non-final rounds
    const filteredGroups = this.playerGroups.filter(
      (pg) => pg.roundIndex < lastRoundIdx
    );
    return buildConnectors(filteredGroups);
  }

  /**
   * Create champion styling requests
   * @param {BracketLayout} layout - Bracket layout
   * @returns {Array} Array of requests
   */
  createChampionRequests(layout) {
    const championPos = layout.getChampionPosition();
    return this.requestBuilder.createChampionRequests(championPos);
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
