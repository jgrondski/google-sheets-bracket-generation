// ==================== src/models/PlayerGroup.js ====================

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
    const gold = { red: 1, green: 0.8588, blue: 0.4627 };
    const black = { red: 0, green: 0, blue: 0 };
    const font = { fontFamily: "Montserrat", bold: true };
    const border = { style: "SOLID_MEDIUM", width: 2, color: gold };
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
    seedCell.userEnteredFormat = {
      backgroundColor: gold,
      horizontalAlignment: "CENTER",
      verticalAlignment: "MIDDLE",
      textFormat: { ...font, fontSize: 11, foregroundColor: black },
      borders: { top: border, bottom: border, left: border, right: border },
    };
    nameCell.userEnteredFormat = {
      backgroundColor: black,
      horizontalAlignment: "CENTER",
      verticalAlignment: "MIDDLE",
      textFormat: { ...font, fontSize: 12, foregroundColor: gold },
      borders: { top: border, bottom: border, left: border, right: border },
    };
    scoreCell.userEnteredFormat = {
      backgroundColor: black,
      horizontalAlignment: "CENTER",
      verticalAlignment: "MIDDLE",
      textFormat: { ...font, fontSize: 11, foregroundColor: gold },
      borders: { top: border, bottom: border, left: border, right: border },
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

  // Builds requests for bye positions (just background cells)
  toByeRequests() {
    const requests = [];
    const gray = { red: 0.192156, green: 0.203922, blue: 0.215686 };

    // Create 3 empty cells with gray background (same as bracket background)
    const seedCell = {
      userEnteredValue: { stringValue: "" },
      userEnteredFormat: {
        backgroundColor: gray,
        horizontalAlignment: "CENTER",
        verticalAlignment: "MIDDLE",
      },
    };

    const nameCell = {
      userEnteredValue: { stringValue: "" },
      userEnteredFormat: {
        backgroundColor: gray,
        horizontalAlignment: "CENTER",
        verticalAlignment: "MIDDLE",
      },
    };

    const scoreCell = {
      userEnteredValue: { stringValue: "" },
      userEnteredFormat: {
        backgroundColor: gray,
        horizontalAlignment: "CENTER",
        verticalAlignment: "MIDDLE",
      },
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
