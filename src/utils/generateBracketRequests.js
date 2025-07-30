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

  // Fill background
  requests.push({
    repeatCell: {
      range: {
        sheetId: 0,
        startRowIndex: 0,
        endRowIndex: 64,
        startColumnIndex: 0,
        endColumnIndex: 11,
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

  // Column widths
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
  };

  // Set sideWidth columns
  for (const key of ["A", "B", "D", "E", "F", "G", "I", "J", "K"]) {
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

  // Set nameWidth columns
  for (const key of ["C", "H"]) {
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
