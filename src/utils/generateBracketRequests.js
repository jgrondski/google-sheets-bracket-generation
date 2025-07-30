function generateBracketRequests(rounds, champion) {
  const requests = [];

  // dimensions
  const cellHeight = 14;
  const nameWidth = 160;
  const sideWidth = 32;

  // colors & formatting
  const gold = { red: 1, green: 0.8588, blue: 0.4627 };
  const black = { red: 0, green: 0, blue: 0 };
  const gray = { red: 0.192, green: 0.2039, blue: 0.2157 };
  const font = { fontFamily: "Montserrat", bold: true };
  const borderStyle = { style: "SOLID_MEDIUM", width: 2, color: gold };

  // fill background A–Y
  requests.push({
    repeatCell: {
      range: {
        sheetId: 0,
        startRowIndex: 0,
        endRowIndex: 64,
        startColumnIndex: 0,
        endColumnIndex: 25,
      },
      cell: { userEnteredFormat: { backgroundColor: gray } },
      fields: "userEnteredFormat.backgroundColor",
    },
  });

  // Round 1
  let row = 1;
  for (const player of rounds[0]) {
    addNameGroup(
      requests,
      row,
      1,
      player,
      gold,
      black,
      gray,
      font,
      borderStyle
    );
    row += 4;
  }

  // Round 2
  row = 3;
  for (const player of rounds[1]) {
    addNameGroup(
      requests,
      row,
      6,
      player,
      gold,
      black,
      gray,
      font,
      borderStyle
    );
    row += 8;
  }
  connectRounds(requests, rounds[1].length, 1, 4, 4, 5, 6, borderStyle);

  // Round 3
  row = 7;
  for (const player of rounds[2]) {
    addNameGroup(
      requests,
      row,
      11,
      player,
      gold,
      black,
      gray,
      font,
      borderStyle
    );
    row += 16;
  }
  connectRounds(requests, rounds[2].length, 3, 8, 9, 10, 11, borderStyle, 3);

  // Round 4
  row = 15;
  for (const player of rounds[3]) {
    addNameGroup(
      requests,
      row,
      16,
      player,
      gold,
      black,
      gray,
      font,
      borderStyle
    );
    row += 32;
  }
  connectRounds(requests, rounds[3].length, 7, 16, 14, 15, 16, borderStyle, 7);

  // Championship header (merge W26–29,X26–29 only)
  requests.push({
    mergeCells: {
      range: {
        sheetId: 0,
        startRowIndex: 25,
        endRowIndex: 29,
        startColumnIndex: 22,
        endColumnIndex: 24,
      },
      mergeType: "MERGE_ALL",
    },
  });
  requests.push({
    updateCells: {
      rows: [
        {
          values: [
            {
              userEnteredValue: { stringValue: "Champion" },
              userEnteredFormat: {
                backgroundColor: gray,
                horizontalAlignment: "CENTER",
                verticalAlignment: "MIDDLE",
                textFormat: {
                  fontFamily: font.fontFamily,
                  bold: true,
                  fontSize: 26,
                  foregroundColor: gold,
                },
              },
            },
          ],
        },
      ],
      fields: "userEnteredValue,userEnteredFormat",
      start: { rowIndex: 25, columnIndex: 22 },
    },
  });

  // connector R4→Champ
  connectRounds(requests, 1, 15, 32, 19, 20, 21, borderStyle, 7, true);
  // bottom border on T at row 48 (index 47)
  requests.push({
    updateBorders: {
      range: {
        sheetId: 0,
        startRowIndex: 47,
        endRowIndex: 48,
        startColumnIndex: 19,
        endColumnIndex: 20,
      },
      bottom: borderStyle,
    },
  });
  // bottom border on U at row 32 (index 31)
  requests.push({
    updateBorders: {
      range: {
        sheetId: 0,
        startRowIndex: 31,
        endRowIndex: 32,
        startColumnIndex: 20,
        endColumnIndex: 21,
      },
      bottom: borderStyle,
    },
  });

  // Champion group
  requests.push({
    mergeCells: {
      range: {
        sheetId: 0,
        startRowIndex: 29,
        endRowIndex: 35,
        startColumnIndex: 21,
        endColumnIndex: 22,
      },
      mergeType: "MERGE_ALL",
    },
  });
  requests.push({
    mergeCells: {
      range: {
        sheetId: 0,
        startRowIndex: 29,
        endRowIndex: 35,
        startColumnIndex: 22,
        endColumnIndex: 24,
      },
      mergeType: "MERGE_ALL",
    },
  });
  requests.push({
    updateCells: {
      rows: [
        {
          values: [
            {
              userEnteredValue: { numberValue: champion.seed },
              userEnteredFormat: {
                backgroundColor: gold,
                horizontalAlignment: "CENTER",
                verticalAlignment: "MIDDLE",
                textFormat: {
                  fontFamily: font.fontFamily,
                  bold: true,
                  fontSize: 34,
                  foregroundColor: black,
                },
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
      fields: "userEnteredValue,userEnteredFormat",
      start: { rowIndex: 29, columnIndex: 21 },
    },
  });
  requests.push({
    updateCells: {
      rows: [
        {
          values: [
            {
              userEnteredValue: { stringValue: champion.name },
              userEnteredFormat: {
                backgroundColor: black,
                horizontalAlignment: "CENTER",
                verticalAlignment: "MIDDLE",
                textFormat: {
                  fontFamily: font.fontFamily,
                  bold: true,
                  fontSize: 34,
                  foregroundColor: gold,
                },
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
      fields: "userEnteredValue,userEnteredFormat",
      start: { rowIndex: 29, columnIndex: 22 },
    },
  });

  // set dimensions
  setDimensions(requests, cellHeight, sideWidth, nameWidth);
  return requests;
}

function addNameGroup(
  requests,
  rowStart,
  colStart,
  player,
  gold,
  black,
  gray,
  font,
  borderStyle
) {
  const positions = [
    { value: { numberValue: player.seed }, bg: gold, fg: black, size: 11 },
    { value: { stringValue: player.name }, bg: black, fg: gold, size: 12 },
    { value: { numberValue: player.score }, bg: black, fg: gold, size: 11 },
  ];
  positions.forEach((pos, i) => {
    requests.push({
      mergeCells: {
        range: {
          sheetId: 0,
          startRowIndex: rowStart,
          endRowIndex: rowStart + 2,
          startColumnIndex: colStart + i,
          endColumnIndex: colStart + i + 1,
        },
        mergeType: "MERGE_ALL",
      },
    });
  });
  requests.push({
    updateCells: {
      rows: [
        {
          values: positions.map((pos) => ({
            userEnteredValue: pos.value,
            userEnteredFormat: {
              backgroundColor: pos.bg,
              horizontalAlignment: "CENTER",
              verticalAlignment: "MIDDLE",
              textFormat: {
                fontFamily: font.fontFamily,
                bold: true,
                fontSize: pos.size,
                foregroundColor: pos.fg,
              },
              borders: {
                top: borderStyle,
                bottom: borderStyle,
                left: borderStyle,
                right: borderStyle,
              },
            },
          })),
        },
      ],
      fields: "userEnteredValue,userEnteredFormat",
      start: { rowIndex: rowStart, columnIndex: colStart },
    },
  });
}

function connectRounds(
  requests,
  count,
  startRow,
  gap,
  colA,
  colB,
  colC,
  borderStyle,
  offset = 1,
  single = false
) {
  let r = startRow;
  for (let i = 0; i < count; i++) {
    const topStart = r;
    const bottomStart = r + gap;
    const topMid = topStart + 1;
    const bottomMid = bottomStart + 1;
    for (let x = topMid; x < bottomMid; x++) {
      requests.push({
        updateBorders: {
          range: {
            sheetId: 0,
            startRowIndex: x,
            endRowIndex: x + 1,
            startColumnIndex: colA,
            endColumnIndex: colA + 1,
          },
          right: borderStyle,
        },
      });
    }
    requests.push({
      updateBorders: {
        range: {
          sheetId: 0,
          startRowIndex: topMid - 1,
          endRowIndex: topMid,
          startColumnIndex: colA,
          endColumnIndex: colA + 1,
        },
        bottom: borderStyle,
      },
    });
    if (!single) {
      requests.push({
        updateBorders: {
          range: {
            sheetId: 0,
            startRowIndex: bottomMid - 1,
            endRowIndex: bottomMid,
            startColumnIndex: colA,
            endColumnIndex: colA + 1,
          },
          bottom: borderStyle,
          right: borderStyle,
        },
      });
      requests.push({
        updateBorders: {
          range: {
            sheetId: 0,
            startRowIndex: topMid + offset,
            endRowIndex: topMid + offset + 1,
            startColumnIndex: colB,
            endColumnIndex: colB + 1,
          },
          bottom: borderStyle,
        },
      });
    }
    const mid = topMid + Math.floor((bottomMid - topMid) / 2) - 1;
    requests.push({
      updateBorders: {
        range: {
          sheetId: 0,
          startRowIndex: mid,
          endRowIndex: mid + 1,
          startColumnIndex: colC,
          endColumnIndex: colC + 1,
        },
        bottom: borderStyle,
      },
    });
    r += gap * (single ? 1 : 2);
  }
}

function setDimensions(requests, cellHeight, sideWidth, nameWidth) {
  for (let r = 0; r < 64; r++) {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: "ROWS",
          startIndex: r,
          endIndex: r + 1,
        },
        properties: { pixelSize: cellHeight },
        fields: "pixelSize",
      },
    });
  }
  const cols = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const sideCols = [
    "A",
    "B",
    "D",
    "E",
    "F",
    "G",
    "I",
    "J",
    "K",
    "L",
    "N",
    "O",
    "P",
    "Q",
    "S",
    "T",
    "U",
    "X",
    "Y",
  ];
  const nameCols = ["C", "H", "M", "R", "W", "V"];
  const idx = {};
  cols.forEach((c, i) => (idx[c] = i));
  sideCols.forEach((c) => {
    const width = c === "P" ? sideWidth : sideWidth;
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: "COLUMNS",
          startIndex: idx[c],
          endIndex: idx[c] + 1,
        },
        properties: { pixelSize: sideWidth },
        fields: "pixelSize",
      },
    });
  });
  // Double W and double V
  nameCols.forEach((c) => {
    let width = nameWidth;
    if (c === "W") width = nameWidth * 2;
    if (c === "V") width = sideWidth * 2;
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: "COLUMNS",
          startIndex: idx[c],
          endIndex: idx[c] + 1,
        },
        properties: { pixelSize: width },
        fields: "pixelSize",
      },
    });
  });
}

module.exports = { generateBracketRequests };
