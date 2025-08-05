// ==================== src/models/player-group.js ====================

const { CELL_FORMATS } = require("../styles/styles");

class PlayerGroup {
  constructor(rowStart, colStart, seed, name, score, conType) {
    this.rowStart = rowStart;
    this.colStart = colStart;
    this.seed = seed;
    this.name = name;
    this.score = score;
    this.conType = conType;
    this.connectorRow = rowStart + 1; // connector row is always one below the group
    this.connectorCol = colStart + 3; // right connector is one column after the group
  }

  // Dimensions
  height() {
    return 2;
  }
  width() {
    return 3;
  }
  centerRow() {
    return this.rowStart + Math.floor(this.height() / 2);
  }
  rightCol() {
    return this.colStart + this.width() - 1;
  }

  // Builds merge & data requests for this group
  toRequests() {
    const requests = [];

    // Merge seed/name/score cells
    for (let i = 0; i < 3; i++) {
      requests.push({
        mergeCells: {
          range: {
            sheetId: 0,
            startRowIndex: this.rowStart,
            endRowIndex: this.rowStart + this.height(),
            startColumnIndex: this.colStart + i,
            endColumnIndex: this.colStart + i + 1,
          },
          mergeType: "MERGE_ALL",
        },
      });
    }

    // Update values & formatting
    // Only set numberValue for valid numbers, otherwise use stringValue

    const seedCell = Number.isFinite(this.seed)
      ? { userEnteredValue: { numberValue: this.seed } }
      : { userEnteredValue: { stringValue: "" } };

    const nameCell = { userEnteredValue: { stringValue: this.name || "" } };

    const scoreCell = Number.isFinite(this.score)
      ? { userEnteredValue: { numberValue: this.score } }
      : { userEnteredValue: { stringValue: "" } };

    // Add formatting to each cell
    seedCell.userEnteredFormat = CELL_FORMATS.seed;
    nameCell.userEnteredFormat = CELL_FORMATS.name;
    scoreCell.userEnteredFormat = CELL_FORMATS.score;

    requests.push({
      updateCells: {
        start: { rowIndex: this.rowStart, columnIndex: this.colStart },
        rows: [
          {
            values: [seedCell, nameCell, scoreCell],
          },
        ],
        fields: "userEnteredValue,userEnteredFormat",
      },
    });

    return requests;
  }

  // Builds requests for bye positions (just background cells)
  toByeRequests() {
    const requests = [];

    // Create 3 empty cells with gray background (same as bracket background)
    const seedCell = {
      userEnteredValue: { stringValue: "" },
      userEnteredFormat: CELL_FORMATS.bye,
    };

    const nameCell = {
      userEnteredValue: { stringValue: "" },
      userEnteredFormat: CELL_FORMATS.bye,
    };

    const scoreCell = {
      userEnteredValue: { stringValue: "" },
      userEnteredFormat: CELL_FORMATS.bye,
    };

    requests.push({
      updateCells: {
        start: { rowIndex: this.rowStart, columnIndex: this.colStart },
        rows: [
          {
            values: [seedCell, nameCell, scoreCell],
          },
        ],
        fields: "userEnteredValue,userEnteredFormat",
      },
    });

    return requests;
  }
}

module.exports = PlayerGroup;
