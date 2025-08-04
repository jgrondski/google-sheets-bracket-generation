// Ensure the sheet has enough columns for all formatting

const { google } = require("googleapis");
const PlayerGroup = require("./models/PlayerGroup");

const connectorType = {
  TOP: "TOP",
  BOTTOM: "BOTTOM",
};

const requests = [];

const TARGET_FOLDER_ID = process.env.TARGET_FOLDER_ID;
const BRACKET_TITLE = "Gold Bracket";

/**
 * Compute 1-based row & column for a PlayerGroup in a bracket grid.
 * @param {number} roundIndex zero-based (0 → Round 1)
 * @param {number} matchIndex zero-based within that round
 * @returns {{row:number, col:number}}
 */
function getPosition(roundIndex, matchIndex) {
  // gap between groups = 2^(roundIndex+1) * 2
  const gap = Math.pow(2, roundIndex + 1) * 2;
  const row = gap / 2 + matchIndex * gap;
  // step of 5 cols between seed columns: seed, name, connector, connector → next seed
  const col = 2 + roundIndex * 5;
  return { row, col };
}

async function buildBracket(auth) {
  const drive = google.drive({ version: "v3", auth });
  const sheets = google.sheets({ version: "v4", auth });

  // 1️⃣ Create spreadsheet
  const file = await drive.files.create({
    resource: {
      name: BRACKET_TITLE,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [TARGET_FOLDER_ID],
    },
    fields: "id",
  });
  const spreadsheetId = file.data.id;
  console.log(
    `✅ Spreadsheet created: https://docs.google.com/spreadsheets/d/${spreadsheetId}`
  );

  // 2️⃣ Prepare requests
  const requests = [];
  // Load player seeds (use only seeds 1-16 for gold bracket)
  const allPlayers = require("./data/goldseeds.json");
  const players = allPlayers.filter((p) => p.seed >= 1 && p.seed <= 16);
  // Generate rounds for single elimination (16 players = 4 rounds)
  const numRounds = Math.ceil(Math.log2(players.length));
  // Build bracket rounds using core bracket builder
  const { buildBracketData } = require("./bracketBuilderCore");
  // Convert bracketData to flat player objects for rendering
  const bracketData = buildBracketData(players);
  // Flatten matches for each round into player objects (for PlayerGroup rendering)
  const rounds = bracketData.map((round) => {
    // For each match, flatten to [{seed, name, score}, {seed, name, score}]
    return round.flat().map((p) => {
      if (p) return { seed: p.seed, name: p.name, score: "" };
      return { seed: "", name: "", score: "" };
    });
  });

  // Champion position overrides for widths & merges
  const lastRoundIdx = rounds.length - 1; // final round
  const { row: finalRow1b, col: finalCol1b } = getPosition(lastRoundIdx, 0);
  const finalRow0 = finalRow1b - 1; // zero-based start of final group
  const seedIdx = finalCol1b - 1;
  const nameIdx = seedIdx + 1;

  // Background fill through champion
  const gray = { red: 0.192156, green: 0.203922, blue: 0.215686 };
  // bottom of last round‑1 group
  const bgEndRow = getPosition(0, rounds[0].length - 1).row + 2;
  // one col after champion name, just 1 extra at far right
  const bgEndCol = nameIdx + 2;
  // Ensure the sheet has enough columns for all formatting
  requests.push({
    updateSheetProperties: {
      properties: {
        sheetId: 0,
        gridProperties: {
          columnCount: bgEndCol,
        },
      },
      fields: "gridProperties.columnCount",
    },
  });

  requests.push({
    repeatCell: {
      range: {
        sheetId: 0,
        startRowIndex: 0,
        endRowIndex: bgEndRow,
        startColumnIndex: 0,
        endColumnIndex: bgEndCol,
      },
      cell: { userEnteredFormat: { backgroundColor: gray } },
      fields: "userEnteredFormat.backgroundColor",
    },
  });

  // 2.5️⃣ Rows & Columns
  // rows → 14px
  for (let r = 0; r < bgEndRow; r++) {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: "ROWS",
          startIndex: r,
          endIndex: r + 1,
        },
        properties: { pixelSize: 14 },
        fields: "pixelSize",
      },
    });
  }
  // cols → first/last 16px, seedIdx 64px, nameIdx 336px, other name cols 168px, two connector cols (28px) between rounds
  const nameCols = rounds.map((_, r) => getPosition(r, 0).col - 1 + 1); // actual name columns
  // Build a set of connector columns (two after each name col except last round)
  const connectorCols = new Set();
  for (let r = 0; r < rounds.length - 1; r++) {
    const nameCol = getPosition(r, 0).col;
    connectorCols.add(nameCol + 1); // first connector col after name
    connectorCols.add(nameCol + 2); // second connector col after name
  }
  for (let c = 0; c < bgEndCol; c++) {
    let width;
    if (c === 0 || c === bgEndCol - 1) width = 16;
    else if (c === seedIdx) width = 64;
    else if (c === nameIdx) width = 336;
    else if (nameCols.includes(c)) width = 168;
    else if (connectorCols.has(c)) width = 28;
    else width = 28;

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

  const playerGroups = [];
  // 3️⃣ Player groups (all rounds except final)
  for (let r = 0; r < rounds.length - 1; r++) {
    for (let i = 0; i < rounds[r].length; i++) {
      const p = rounds[r][i];
      const { row, col } = getPosition(r, i);
      const conType = i % 2 === 0 ? connectorType.TOP : connectorType.BOTTOM;
      // Only set numberValue for valid numbers, otherwise use stringValue or undefined
      let seedValue = {};
      if (typeof p.seed === "number" && !isNaN(p.seed) && p.seed !== "") {
        seedValue = { numberValue: p.seed };
      } else {
        seedValue = { stringValue: "" };
      }
      let scoreValue = {};
      if (typeof p.score === "number" && !isNaN(p.score) && p.score !== "") {
        scoreValue = { numberValue: p.score };
      } else {
        scoreValue = { stringValue: "" };
      }
      // Build PlayerGroup as before
      const group = new PlayerGroup(
        row - 1,
        col - 1,
        p.seed,
        p.name,
        p.score,
        conType
      );
      playerGroups.push(group);
      // Patch: update toRequests to use correct value types
      // If PlayerGroup.toRequests expects raw values, this is handled there. If not, update here.
      requests.push(
        ...group.toRequests(
          seedValue,
          { stringValue: p.name || "" },
          scoreValue
        )
      );
    }
  }

  // 3️⃣.5 Connector borders between player groups
  const { buildConnectors } = require("./connectors/ConnectorBuilder");
  const connectorRequests = buildConnectors(playerGroups);
  requests.push(...connectorRequests);

  // 3.5️⃣ Champion styling (replaces final seed)
  const font = { fontFamily: "Montserrat", bold: true, fontSize: 34 };
  const border = {
    style: "SOLID_MEDIUM",
    color: { red: 1, green: 0.8588, blue: 0.4627 },
  };
  // new 6-row merge 2 rows above final
  const champMergeStart = finalRow0 - 2;
  const champMergeEnd = champMergeStart + 6;
  // Merge seed & name
  requests.push(
    ...[seedIdx, nameIdx].map((idx) => ({
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
    }))
  );
  const champ = rounds[lastRoundIdx][0]; // first element is the winner (matchIndex=0)
  // Render champion seed
  const champSeedCell = Number.isFinite(champ.seed)
    ? { userEnteredValue: { numberValue: champ.seed } }
    : { userEnteredValue: { stringValue: "" } };
  champSeedCell.userEnteredFormat = {
    backgroundColor: { red: 1, green: 0.8588, blue: 0.4627 },
    horizontalAlignment: "CENTER",
    verticalAlignment: "MIDDLE",
    textFormat: {
      ...font,
      fontSize: 34,
      foregroundColor: { red: 0, green: 0, blue: 0 },
    },
    borders: {
      top: border,
      bottom: border,
      left: border,
      right: border,
    },
  };
  requests.push({
    updateCells: {
      start: { rowIndex: champMergeStart, columnIndex: seedIdx },
      rows: [
        {
          values: [champSeedCell],
        },
      ],
      fields: "userEnteredValue,userEnteredFormat",
    },
  });
  // Render champion name
  requests.push({
    updateCells: {
      start: { rowIndex: champMergeStart, columnIndex: nameIdx },
      rows: [
        {
          values: [
            {
              userEnteredValue: { stringValue: champ.name },
              userEnteredFormat: {
                backgroundColor: { red: 0, green: 0, blue: 0 },
                horizontalAlignment: "CENTER",
                verticalAlignment: "MIDDLE",
                textFormat: {
                  ...font,
                  foregroundColor: { red: 1, green: 0.8588, blue: 0.4627 },
                },
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

  // header below champion merge: 4 rows tall, same col, gold text
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
              userEnteredFormat: {
                backgroundColor: gray,
                horizontalAlignment: "CENTER",
                verticalAlignment: "MIDDLE",
                textFormat: {
                  ...font,
                  fontSize: 24,
                  foregroundColor: { red: 1, green: 0.8588, blue: 0.4627 },
                },
              },
            },
          ],
        },
      ],
      fields: "userEnteredValue,userEnteredFormat",
    },
  });

  // 4️⃣ Apply
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests },
  });
  console.log("✅ Bracket layout applied successfully.");
}

module.exports = { buildBracket };
