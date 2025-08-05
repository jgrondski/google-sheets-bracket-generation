// Ensure the sheet has enough columns for all formatting

const { google } = require("googleapis");
const PlayerGroup = require("./models/player-group");
const { COLORS, CELL_FORMATS, DIMENSIONS } = require("./styles/styles");

const connectorType = {
  TOP: "TOP",
  BOTTOM: "BOTTOM",
};

const requests = [];

const TARGET_FOLDER_ID = process.env.TARGET_FOLDER_ID;
// BRACKET_TITLE will be set from config

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
  // Load config and player names from playerlist.json
  const playerConfig = require("./data/playerlist.json");
  const { sheetName, gold } = playerConfig.options;
  const { bracketSize, bracketName } = gold;
  // Use top bracketSize players
  const players = playerConfig.players
    .slice(0, parseInt(bracketSize, 10))
    .map((p, idx) => ({ seed: idx + 1, name: p.name }));
  // Generate rounds for single elimination
  const numRounds = Math.ceil(Math.log2(players.length));
  // Use sheetName for spreadsheet title and bracketName for sheet name
  const BRACKET_TITLE = sheetName;

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

  // Rename default sheet from 'Sheet1' to bracketName
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId: 0,
              title: bracketName,
            },
            fields: "title",
          },
        },
      ],
    },
  });

  // 2️⃣ Prepare requests
  const requests = [];

  // Use the new CompleteBracket system
  const { CompleteBracket } = require("./complete-bracket");
  const bracket = new CompleteBracket(players.map((p) => ({ name: p.name })));

  console.log(
    `Building ${bracket.actualPlayerCount}-player bracket (${bracket.bracketSize} bracket size, ${bracket.numByes} byes)`
  );

  // Convert bracket structure to rounds for rendering
  let rounds = [];

  // Process each round from the bracket model
  for (let r = 0; r < bracket.numRounds; r++) {
    const roundPlayers = [];
    const allMatches = bracket.getMatchesForRound(r); // Get ALL matches, not just renderable ones

    allMatches.forEach((match) => {
      const p1 = match.position1;
      const p2 = match.position2;

      // Add player 1 - always add to maintain bracket structure
      if (p1 && p1.visible) {
        if (p1.type === "seeded") {
          roundPlayers.push({ seed: p1.seed, name: p1.name, score: "" });
        } else {
          roundPlayers.push({ seed: "", name: "", score: "" }); // Winner placeholder
        }
      } else {
        // Invisible bye - render as background space but maintain position
        roundPlayers.push({ seed: "", name: "", score: "", isBye: true });
      }

      // Add player 2 - always add to maintain bracket structure, handle null case
      if (p2) {
        if (p2.visible) {
          if (p2.type === "seeded") {
            roundPlayers.push({ seed: p2.seed, name: p2.name, score: "" });
          } else {
            roundPlayers.push({ seed: "", name: "", score: "" }); // Winner placeholder
          }
        } else {
          // Invisible bye - render as background space but maintain position
          roundPlayers.push({ seed: "", name: "", score: "", isBye: true });
        }
      } else {
        // No p2 (shouldn't happen in proper bracket, but handle gracefully)
        roundPlayers.push({ seed: "", name: "", score: "", isBye: true });
      }
    });

    rounds.push(roundPlayers);
  }

  // Add champion round manually - single position for winner
  const championRound = [{ seed: "", name: "", score: "" }]; // Champion winner placeholder
  rounds.push(championRound);

  // Champion position overrides for widths & merges
  const lastRoundIdx = rounds.length - 1; // final round
  const { row: finalRow1b, col: finalCol1b } = getPosition(lastRoundIdx, 0);
  const finalRow0 = finalRow1b - 1; // zero-based start of final group
  const seedIdx = finalCol1b - 1;
  const nameIdx = seedIdx + 1;

  // Background fill through champion
  const gray = COLORS.gray;
  // bottom of last round‑1 group
  const bgEndRow = getPosition(0, rounds[0].length - 1).row + 2;
  // one col after champion name, plus extra for final connectors
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
      cell: { userEnteredFormat: CELL_FORMATS.background },
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
        properties: { pixelSize: DIMENSIONS.rowHeight },
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
    if (c === 0 || c === bgEndCol - 1) width = DIMENSIONS.columnWidths.edge;
    else if (c === seedIdx) width = DIMENSIONS.columnWidths.seed;
    else if (c === nameIdx) width = DIMENSIONS.columnWidths.mainName;
    else if (nameCols.includes(c)) width = DIMENSIONS.columnWidths.otherName;
    else if (connectorCols.has(c)) width = DIMENSIONS.columnWidths.connector;
    else width = DIMENSIONS.columnWidths.connector;

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
  // 3️⃣ Player groups (include final round for semifinals and finals)
  for (let r = 0; r < rounds.length; r++) {
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
        group.isBye = p.isBye || false; // Mark if this is a bye position
        playerGroups.push(group);

        // For bye positions, just render background cells (no special styling)
        if (p.isBye) {
          // Just background cells - no content, no borders, just gray background
          requests.push(...group.toByeRequests());
        } else {
          // Normal player group rendering
          requests.push(
            ...group.toRequests(
              seedValue,
              { stringValue: p.name || "" },
              scoreValue
            )
          );
        }
      }
    }
  }

  // 3️⃣.5 Connector borders between player groups
  const { buildConnectors } = require("./connectors/connector-builder");
  // Only build connectors for non-final rounds to stay within grid
  const connectorRequests = buildConnectors(
    playerGroups.filter((pg) => pg.roundIndex < lastRoundIdx)
  );
  requests.push(...connectorRequests);

  // 3.5️⃣ Champion styling (replaces final seed)
  const border = {
    style: "SOLID_MEDIUM",
    color: COLORS.gold,
  };
  // new 6-row merge 2 rows above final
  const champMergeStart = finalRow0 - 2;
  const champMergeEnd = champMergeStart + 6;
  // Merge only seed & name (no score cell for champion)
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
  champSeedCell.userEnteredFormat = CELL_FORMATS.championSeed;
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
              userEnteredFormat: CELL_FORMATS.championName,
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
              userEnteredFormat: CELL_FORMATS.championHeader,
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
