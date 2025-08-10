import { hexToRgb, resolveColorScheme, FIXED_COLORS } from '../utils/color-utils.js';
import { GoogleSheetsService } from './google-sheets-service.js';
import { FONTS } from '../styles/styles.js';

class QualsSheetCreator {
  constructor(auth) {
    this.auth = auth;
    this.googleSheetsService = new GoogleSheetsService(auth);
  }

  async create(spreadsheetId, tournament, config) {
    const sheetName = 'Qualifiers';
    const sheetId = await this.googleSheetsService.addSheet(spreadsheetId, sheetName);

    // Get all bracket types and combine their players (using domain objects)
    const allPlayers = [];

    for (const bracketType of config.getAvailableBracketTypes()) {
      // Get players as domain objects with proper seeding
      const players = config.getPlayersByType(bracketType, true).map((player, index) => {
        // Update the seed to be continuous across all brackets
        player.seed = allPlayers.length + index + 1;
        return player;
      });

      allPlayers.push(...players);
    }

    const requests = this.buildSheetRequests(sheetId, allPlayers, config);
    await this.googleSheetsService.batchUpdate(spreadsheetId, requests);
  }

  buildSheetRequests(sheetId, allPlayers, config) {
    const grayBackgroundColor = FIXED_COLORS.gray;
    const whiteTextColor = FIXED_COLORS.white;
    const blackTextColor = FIXED_COLORS.black;

    // Calculate the number of rows we need (header + empty row + players + 1 extra row)
    const totalRows = allPlayers.length + 3;

    const requests = [
      // Resize columns
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
          properties: { pixelSize: 16 }, // Column A: 16px
          fields: 'pixelSize',
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 },
          properties: { pixelSize: 60 }, // Column B: 60px
          fields: 'pixelSize',
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 },
          properties: { pixelSize: 260 }, // Column C: 260px
          fields: 'pixelSize',
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 },
          properties: { pixelSize: 16 }, // Column D: 16px
          fields: 'pixelSize',
        },
      },
      // Auto-resize rows to fit font content
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId,
            dimension: 'ROWS',
            startIndex: 0,
            endIndex: totalRows,
          },
        },
      },
      // Set specific height for row 2 (the empty spacing row)
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: 'ROWS', startIndex: 1, endIndex: 2 },
          properties: { pixelSize: 8 },
          fields: 'pixelSize',
        },
      },
      // Set gray background for entire bounded area (A1 through D + final row)
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: totalRows,
            startColumnIndex: 0,
            endColumnIndex: 4,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: grayBackgroundColor,
            },
          },
          fields: 'userEnteredFormat.backgroundColor',
        },
      },
      // Headers (row 1 - all gray background)
      {
        updateCells: {
          rows: [
            {
              values: [
                {
                  userEnteredValue: { stringValue: '' },
                  userEnteredFormat: {
                    backgroundColor: grayBackgroundColor, // A1 gray background
                  },
                },
                {
                  userEnteredValue: { stringValue: 'Seed' },
                  userEnteredFormat: {
                    backgroundColor: grayBackgroundColor, // B1 gray background for header row
                    textFormat: { ...FONTS.name, fontSize: 15, foregroundColor: whiteTextColor },
                    horizontalAlignment: 'CENTER',
                    verticalAlignment: 'MIDDLE',
                  },
                },
                {
                  userEnteredValue: { stringValue: 'Player Name' },
                  userEnteredFormat: {
                    backgroundColor: grayBackgroundColor, // C1 gray background
                    textFormat: { ...FONTS.name, fontSize: 15, foregroundColor: whiteTextColor },
                    horizontalAlignment: 'CENTER',
                    verticalAlignment: 'MIDDLE',
                  },
                },
                {
                  userEnteredValue: { stringValue: '' },
                  userEnteredFormat: {
                    backgroundColor: grayBackgroundColor, // D1 gray background
                  },
                },
              ],
            },
          ],
          start: { sheetId, rowIndex: 0, columnIndex: 0 },
          fields:
            'userEnteredValue,userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
        },
      },
      // Empty row 2 (8px height, all gray background)
      {
        updateCells: {
          rows: [
            {
              values: [
                {
                  userEnteredValue: { stringValue: '' },
                  userEnteredFormat: {
                    backgroundColor: grayBackgroundColor,
                  },
                },
                {
                  userEnteredValue: { stringValue: '' },
                  userEnteredFormat: {
                    backgroundColor: grayBackgroundColor,
                  },
                },
                {
                  userEnteredValue: { stringValue: '' },
                  userEnteredFormat: {
                    backgroundColor: grayBackgroundColor,
                  },
                },
                {
                  userEnteredValue: { stringValue: '' },
                  userEnteredFormat: {
                    backgroundColor: grayBackgroundColor,
                  },
                },
              ],
            },
          ],
          start: { sheetId, rowIndex: 1, columnIndex: 0 },
          fields: 'userEnteredValue,userEnteredFormat(backgroundColor)',
        },
      },
    ];

    // Player data (now using Player domain objects)
    const playerRows = allPlayers.map((player) => {
      // Get the bracket-specific color using the Player model
      const colorScheme = player.getColorScheme(config);
      const primaryColor = resolveColorScheme(colorScheme);
      const seedBackgroundColor = hexToRgb(primaryColor);

      return {
        values: [
          {
            // Column A - empty with explicit gray background
            userEnteredFormat: {
              backgroundColor: grayBackgroundColor,
            },
          },
          {
            // Column B - Seed (continuous numbering)
            userEnteredValue: { numberValue: player.seed },
            userEnteredFormat: {
              backgroundColor: seedBackgroundColor, // Individual seeds use bracket color
              textFormat: { ...FONTS.seed, fontSize: 15, foregroundColor: blackTextColor },
              horizontalAlignment: 'CENTER',
              verticalAlignment: 'MIDDLE',
            },
          },
          {
            // Column C - Player Name
            userEnteredValue: { stringValue: player.getDisplayName() },
            userEnteredFormat: {
              backgroundColor: grayBackgroundColor, // Explicitly set gray background for player names
              textFormat: { ...FONTS.name, fontSize: 18, foregroundColor: whiteTextColor }, // 18pt for player names
              horizontalAlignment: 'CENTER',
              verticalAlignment: 'MIDDLE',
            },
          },
          {
            // Column D - empty with explicit gray background
            userEnteredFormat: {
              backgroundColor: grayBackgroundColor,
            },
          },
        ],
      };
    });

    requests.push({
      updateCells: {
        rows: playerRows,
        start: { sheetId, rowIndex: 2, columnIndex: 0 }, // Start at row 3 (index 2) because of header + empty row
        fields:
          'userEnteredValue,userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
      },
    });

    return requests;
  }
}

export { QualsSheetCreator };
