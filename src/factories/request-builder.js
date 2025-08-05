// ==================== src/factories/request-builder.js ====================

import { COLORS, CELL_FORMATS, DIMENSIONS } from "../styles/styles.js";

/**
 * Factory for building Google Sheets API requests
 */
class RequestBuilder {
  /**
   * Create background formatting request
   * @param {number} endRow - End row for background
   * @param {number} endCol - End column for background
   * @returns {Array} Array of requests
   */
  createBackgroundRequest(endRow, endCol) {
    return [
      {
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: endRow,
            startColumnIndex: 0,
            endColumnIndex: endCol,
          },
          cell: { userEnteredFormat: CELL_FORMATS.background },
          fields: "userEnteredFormat.backgroundColor",
        },
      },
    ];
  }

  /**
   * Create row dimension requests
   * @param {number} rowCount - Number of rows to set
   * @returns {Array} Array of requests
   */
  createRowDimensionRequests(rowCount) {
    const requests = [];

    for (let r = 0; r < rowCount; r++) {
      requests.push({
        updateDimensionProperties: {
          range: {
            sheetId: 0,
            dimension: "ROWS",
            startIndex: r,
            endIndex: r + 1,
          },
          properties: { pixelSize: DIMENSIONS.rowHeight },
          fields: "pixelSize",
        },
      });
    }

    return requests;
  }

  /**
   * Create column dimension requests
   * @param {number} colCount - Total number of columns
   * @param {number} seedIdx - Seed column index
   * @param {number} nameIdx - Main name column index
   * @param {Array} nameCols - Array of name column indices
   * @param {Set} connectorCols - Set of connector column indices
   * @returns {Array} Array of requests
   */
  createColumnDimensionRequests(
    colCount,
    seedIdx,
    nameIdx,
    nameCols,
    connectorCols
  ) {
    const requests = [];

    for (let c = 0; c < colCount; c++) {
      let width;
      if (c === 0 || c === colCount - 1) {
        width = DIMENSIONS.columnWidths.edge;
      } else if (c === seedIdx) {
        width = DIMENSIONS.columnWidths.seed;
      } else if (c === nameIdx) {
        width = DIMENSIONS.columnWidths.mainName;
      } else if (nameCols.includes(c)) {
        width = DIMENSIONS.columnWidths.otherName;
      } else if (connectorCols.has(c)) {
        width = DIMENSIONS.columnWidths.connector;
      } else {
        width = DIMENSIONS.columnWidths.connector;
      }

      requests.push({
        updateDimensionProperties: {
          range: {
            sheetId: 0,
            dimension: "COLUMNS",
            startIndex: c,
            endIndex: c + 1,
          },
          properties: { pixelSize: width },
          fields: "pixelSize",
        },
      });
    }

    return requests;
  }

  /**
   * Create champion styling requests
   * @param {Object} championPos - Champion position data
   * @returns {Array} Array of requests
   */
  createChampionRequests(championPos) {
    const requests = [];
    const { champion, champMergeStart, champMergeEnd, seedIdx, nameIdx } =
      championPos;

    // Create merge requests for seed and name cells
    const mergeRequests = [seedIdx, nameIdx].map((idx) => ({
      mergeCells: {
        range: {
          sheetId: 0,
          startRowIndex: champMergeStart,
          endRowIndex: champMergeEnd,
          startColumnIndex: idx,
          endColumnIndex: idx + 1,
        },
        mergeType: "MERGE_ALL",
      },
    }));
    requests.push(...mergeRequests);

    // Champion seed cell
    const champSeedCell = Number.isFinite(champion.seed)
      ? { userEnteredValue: { numberValue: champion.seed } }
      : { userEnteredValue: { stringValue: "" } };
    champSeedCell.userEnteredFormat = CELL_FORMATS.championSeed;

    requests.push({
      updateCells: {
        start: { rowIndex: champMergeStart, columnIndex: seedIdx },
        rows: [{ values: [champSeedCell] }],
        fields: "userEnteredValue,userEnteredFormat",
      },
    });

    // Champion name cell
    requests.push({
      updateCells: {
        start: { rowIndex: champMergeStart, columnIndex: nameIdx },
        rows: [
          {
            values: [
              {
                userEnteredValue: { stringValue: champion.name || "" },
                userEnteredFormat: CELL_FORMATS.championName,
              },
            ],
          },
        ],
        fields: "userEnteredValue,userEnteredFormat",
      },
    });

    // Champion header
    const hdrStart = champMergeEnd;
    const hdrEnd = hdrStart + 4;

    requests.push({
      mergeCells: {
        range: {
          sheetId: 0,
          startRowIndex: hdrStart,
          endRowIndex: hdrEnd,
          startColumnIndex: nameIdx,
          endColumnIndex: nameIdx + 1,
        },
        mergeType: "MERGE_ALL",
      },
    });

    requests.push({
      updateCells: {
        start: { rowIndex: hdrStart, columnIndex: nameIdx },
        rows: [
          {
            values: [
              {
                userEnteredValue: { stringValue: "Champion" },
                userEnteredFormat: CELL_FORMATS.championHeader,
              },
            ],
          },
        ],
        fields: "userEnteredValue,userEnteredFormat",
      },
    });

    return requests;
  }
}

export default { RequestBuilder };
