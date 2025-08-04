// ==================== src/models/PlayerGroup.js ====================
class PlayerGroup {
  constructor(rowStart, colStart, seed, name, score) {
    this.rowStart = rowStart;
    this.colStart = colStart;
    this.seed = seed;
    this.name = name;
    this.score = score;
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
    requests.push({
      updateCells: {
        start: { rowIndex: this.rowStart, columnIndex: this.colStart },
        rows: [
          {
            values: [
              {
                userEnteredValue: { numberValue: this.seed },
                userEnteredFormat: {
                  backgroundColor: gold,
                  horizontalAlignment: "CENTER",
                  verticalAlignment: "MIDDLE",
                  textFormat: { ...font, fontSize: 11, foregroundColor: black },
                  borders: {
                    top: border,
                    bottom: border,
                    left: border,
                    right: border,
                  },
                },
              },
              {
                userEnteredValue: { stringValue: this.name },
                userEnteredFormat: {
                  backgroundColor: black,
                  horizontalAlignment: "CENTER",
                  verticalAlignment: "MIDDLE",
                  textFormat: { ...font, fontSize: 12, foregroundColor: gold },
                  borders: {
                    top: border,
                    bottom: border,
                    left: border,
                    right: border,
                  },
                },
              },
              {
                userEnteredValue: { numberValue: this.score },
                userEnteredFormat: {
                  backgroundColor: black,
                  horizontalAlignment: "CENTER",
                  verticalAlignment: "MIDDLE",
                  textFormat: { ...font, fontSize: 11, foregroundColor: gold },
                  borders: {
                    top: border,
                    bottom: border,
                    left: border,
                    right: border,
                  },
                },
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

module.exports = PlayerGroup;
