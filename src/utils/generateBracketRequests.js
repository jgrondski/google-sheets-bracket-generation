function generateBracketRequests(rounds, champion) {
  const requests = [];

  const cellHeight = 14;
  const nameWidth = 160;
  const sideWidth = 32;

  const gold = { red: 1, green: 0.8588, blue: 0.4627 };
  const black = { red: 0, green: 0, blue: 0 };
  const gray = { red: 0.192, green: 0.2039, blue: 0.2157 };

  const font = {
    fontFamily: "Montserrat",
    bold: true,
  };

  const borderStyle = {
    style: "SOLID_MEDIUM",
    width: 2,
    color: gold,
  };

  // Fill background (A through N)
  requests.push({
    repeatCell: {
      range: {
        sheetId: 0,
        startRowIndex: 0,
        endRowIndex: 64,
        startColumnIndex: 0,
        endColumnIndex: 14, // extend to column N
      },
      cell: {
        userEnteredFormat: { backgroundColor: gray },
      },
      fields: "userEnteredFormat.backgroundColor",
    },
  });

  let row = 1;

  // Round 1
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

  // Connector lines between rounds 1 and 2
  const eCol = 4;
  const fCol = 5;
  const gCol = 6;
  row = 1;
  for (let i = 0; i < rounds[1].length; i++) {
    const topStart = row;
    const bottomStart = row + 4;
    const topMid = topStart + 1;
    const bottomMid = bottomStart + 1;

    // Vertical right borders on E
    for (let r = topMid; r < bottomMid; r++) {
      requests.push({
        updateBorders: {
          range: {
            sheetId: 0,
            startRowIndex: r,
            endRowIndex: r + 1,
            startColumnIndex: eCol,
            endColumnIndex: eCol + 1,
          },
          right: borderStyle,
        },
      });
    }
    // Bottom border on E
    requests.push({
      updateBorders: {
        range: {
          sheetId: 0,
          startRowIndex: topMid - 1,
          endRowIndex: topMid,
          startColumnIndex: eCol,
          endColumnIndex: eCol + 1,
        },
        bottom: borderStyle,
      },
    });
    // Bottom border on F
    requests.push({
      updateBorders: {
        range: {
          sheetId: 0,
          startRowIndex: topMid + 1,
          endRowIndex: topMid + 2,
          startColumnIndex: fCol,
          endColumnIndex: fCol + 1,
        },
        bottom: borderStyle,
      },
    });
    // Bottom+right on E bottom
    requests.push({
      updateBorders: {
        range: {
          sheetId: 0,
          startRowIndex: bottomMid - 1,
          endRowIndex: bottomMid,
          startColumnIndex: eCol,
          endColumnIndex: eCol + 1,
        },
        bottom: borderStyle,
        right: borderStyle,
      },
    });
    // Final bottom on G
    const connectorRow12 = topMid + Math.floor((bottomMid - topMid) / 2) - 1;
    requests.push({
      updateBorders: {
        range: {
          sheetId: 0,
          startRowIndex: connectorRow12,
          endRowIndex: connectorRow12 + 1,
          startColumnIndex: gCol,
          endColumnIndex: gCol + 1,
        },
        bottom: borderStyle,
      },
    });
    row += 8;
  }

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

  // Connector lines between rounds 2 and 3
  const jCol = 9;
  const kCol = 10;
  const lCol = 11;
  row = 3;
  for (let i = 0; i < rounds[2].length; i++) {
    const topStart = row;
    const bottomStart = row + 8;
    const topMid = topStart + 1;
    const bottomMid = bottomStart + 1;

    // Vertical right borders on J
    for (let r = topMid; r < bottomMid; r++) {
      requests.push({
        updateBorders: {
          range: {
            sheetId: 0,
            startRowIndex: r,
            endRowIndex: r + 1,
            startColumnIndex: jCol,
            endColumnIndex: jCol + 1,
          },
          right: borderStyle,
        },
      });
    }
    // Bottom on J
    requests.push({
      updateBorders: {
        range: {
          sheetId: 0,
          startRowIndex: topMid - 1,
          endRowIndex: topMid,
          startColumnIndex: jCol,
          endColumnIndex: jCol + 1,
        },
        bottom: borderStyle,
      },
    });
    // Bottom on K (shifted down 2 rows)
    requests.push({
      updateBorders: {
        range: {
          sheetId: 0,
          startRowIndex: topMid + 3,
          endRowIndex: topMid + 4,
          startColumnIndex: kCol,
          endColumnIndex: kCol + 1,
        },
        bottom: borderStyle,
      },
    });
    // Bottom+right on J bottom
    requests.push({
      updateBorders: {
        range: {
          sheetId: 0,
          startRowIndex: bottomMid - 1,
          endRowIndex: bottomMid,
          startColumnIndex: jCol,
          endColumnIndex: jCol + 1,
        },
        bottom: borderStyle,
        right: borderStyle,
      },
    });
    // Final bottom on L
    const connectorRow23 = topMid + Math.floor((bottomMid - topMid) / 2) - 1;
    requests.push({
      updateBorders: {
        range: {
          sheetId: 0,
          startRowIndex: connectorRow23,
          endRowIndex: connectorRow23 + 1,
          startColumnIndex: lCol,
          endColumnIndex: lCol + 1,
        },
        bottom: borderStyle,
      },
    });
    row += 16;
  }

  // Set row heights
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

  // Column widths (A through N)
  const colIndices = {
    A: 0,
    B: 1,
    C: 2,
    D: 3,
    E: 4,
    F: 5,
    G: 6,
    H: 7,
    I: 8,
    J: 9,
    K: 10,
    L: 11,
    M: 12,
    N: 13,
  };
  // Apply sideWidth (seed, score, connectors)
  for (const key of ["A", "B", "D", "E", "F", "G", "I", "J", "K", "L", "N"]) {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: "COLUMNS",
          startIndex: colIndices[key],
          endIndex: colIndices[key] + 1,
        },
        properties: { pixelSize: sideWidth },
        fields: "pixelSize",
      },
    });
  }
  // Apply nameWidth (name columns)
  for (const key of ["C", "H", "M"]) {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: "COLUMNS",
          startIndex: colIndices[key],
          endIndex: colIndices[key] + 1,
        },
        properties: { pixelSize: nameWidth },
        fields: "pixelSize",
      },
    });
  }

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
    {
      key: "seed",
      colOffset: 0,
      backgroundColor: gold,
      textColor: black,
      fontSize: 11,
      value: { numberValue: player.seed },
    },
    {
      key: "name",
      colOffset: 1,
      backgroundColor: black,
      textColor: gold,
      fontSize: 12,
      value: { stringValue: player.name },
    },
    {
      key: "score",
      colOffset: 2,
      backgroundColor: black,
      textColor: gold,
      fontSize: 11,
      value: { numberValue: player.score },
    },
  ];
  for (const { colOffset } of positions) {
    requests.push({
      mergeCells: {
        range: {
          startRowIndex: rowStart,
          endRowIndex: rowStart + 2,
          startColumnIndex: colStart + colOffset,
          endColumnIndex: colStart + colOffset + 1,
        },
        mergeType: "MERGE_ALL",
      },
    });
  }
  requests.push({
    updateCells: {
      rows: [
        {
          values: positions.map((pos) => ({
            userEnteredValue: pos.value,
            userEnteredFormat: {
              backgroundColor: pos.backgroundColor,
              horizontalAlignment: "CENTER",
              verticalAlignment: "MIDDLE",
              textFormat: {
                fontFamily: font.fontFamily,
                bold: true,
                fontSize: pos.fontSize,
                foregroundColor: pos.textColor,
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

module.exports = { generateBracketRequests };
