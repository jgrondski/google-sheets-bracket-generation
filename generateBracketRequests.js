// generateBracketRequests.js
function generateBracketRequests(rounds, champion) {
  const requests = [];

  const seedCol = 'B'.charCodeAt(0);
  const nameCol = 'C'.charCodeAt(0);
  const scoreCol = 'D'.charCodeAt(0);

  const cellHeight = 14;
  const nameWidth = 160;
  const sideWidth = 32; // seed & score

  const gold = { red: 1, green: 0.8588, blue: 0.4627 };
  const black = { red: 0, green: 0, blue: 0 };
  const gray = { red: 0.192, green: 0.2039, blue: 0.2157 };

  const font = {
    fontFamily: 'Montserrat',
    bold: true,
  };

  const borderStyle = {
    style: 'SOLID_MEDIUM',
    width: 2,
    color: gold,
  };

  const nameGroups = [];
  let row = 1;

  // Fill background gray
  requests.push({
    repeatCell: {
      range: {
        sheetId: 0,
        startRowIndex: 0,
        endRowIndex: 64,
        startColumnIndex: 0,
        endColumnIndex: 5,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: gray,
        },
      },
      fields: 'userEnteredFormat.backgroundColor',
    },
  });

  for (const player of rounds[0]) {
    const group = {
      seed: { rowStart: row, col: seedCol },
      name: { rowStart: row, col: nameCol },
      score: { rowStart: row, col: scoreCol },
    };
    nameGroups.push(group);

    for (const key of ['seed', 'name', 'score']) {
      requests.push({
        mergeCells: {
          range: {
            startRowIndex: group[key].rowStart,
            endRowIndex: group[key].rowStart + 2,
            startColumnIndex: group[key].col - 65,
            endColumnIndex: group[key].col - 65 + 1,
          },
          mergeType: 'MERGE_ALL',
        },
      });
    }

    requests.push({
      updateCells: {
        rows: [
          {
            values: [
              {
                userEnteredValue: { numberValue: player.seed },
                userEnteredFormat: {
                  backgroundColor: gold,
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                  textFormat: { ...font, fontSize: 11, foregroundColor: black },
                  borders: {
                    top: borderStyle,
                    bottom: borderStyle,
                    left: borderStyle,
                    right: borderStyle,
                  },
                },
              },
              {
                userEnteredValue: { stringValue: player.name },
                userEnteredFormat: {
                  backgroundColor: black,
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                  textFormat: { ...font, fontSize: 12, foregroundColor: gold },
                  borders: {
                    top: borderStyle,
                    bottom: borderStyle,
                    left: borderStyle,
                    right: borderStyle,
                  },
                },
              },
              {
                userEnteredValue: { numberValue: player.score },
                userEnteredFormat: {
                  backgroundColor: black,
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                  textFormat: { ...font, fontSize: 11, foregroundColor: gold },
                  borders: {
                    top: borderStyle,
                    bottom: borderStyle,
                    left: borderStyle,
                    right: borderStyle,
                  },
                },
              },
            ],
          },
        ],
        fields: 'userEnteredValue,userEnteredFormat',
        start: { rowIndex: row, columnIndex: 1 },
      },
    });

    row += 4;
  }

  // Set all row heights and column widths
  for (let r = 0; r < 64; r++) {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'ROWS',
          startIndex: r,
          endIndex: r + 1,
        },
        properties: { pixelSize: cellHeight },
        fields: 'pixelSize',
      },
    });
  }

  requests.push(
    ...['A', 'B', 'D', 'E'].map((col, i) => ({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: col.charCodeAt(0) - 65,
          endIndex: col.charCodeAt(0) - 64,
        },
        properties: { pixelSize: sideWidth },
        fields: 'pixelSize',
      },
    })),
    {
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 2,
          endIndex: 3,
        },
        properties: { pixelSize: nameWidth },
        fields: 'pixelSize',
      },
    }
  );

  return requests;
}

module.exports = { generateBracketRequests };