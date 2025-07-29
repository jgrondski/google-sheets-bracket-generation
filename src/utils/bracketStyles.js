// src/utils/bracketStyles.js

const GOLD = '#FFDB76';
const BLACK = '#000000';
const BACKGROUND = '#313437';

const FONT_MONTSERRAT = {
  fontFamily: 'Montserrat',
  bold: true,
};

const borderThickGold = {
  style: 'SOLID_THICK',
  color: { rgbColor: hexToRgb(GOLD) },
};

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return {
    red: ((bigint >> 16) & 255) / 255,
    green: ((bigint >> 8) & 255) / 255,
    blue: (bigint & 255) / 255,
  };
}

function getCellFormat(type) {
  const base = { userEnteredFormat: {} };
  const format = base.userEnteredFormat;

  format.textFormat = { ...FONT_MONTSERRAT };
  format.horizontalAlignment = 'CENTER';
  format.verticalAlignment = 'MIDDLE';
  format.backgroundColor = hexToRgb(BLACK);
  format.borders = {
    top: borderThickGold,
    bottom: borderThickGold,
    left: borderThickGold,
    right: borderThickGold,
  };

  if (type === 'seed') {
    format.textFormat.fontSize = 11;
    format.backgroundColor = hexToRgb(GOLD);
    format.textFormat.foregroundColor = hexToRgb(BLACK);
  } else if (type === 'name') {
    format.textFormat.fontSize = 12;
    format.textFormat.foregroundColor = hexToRgb(GOLD);
  } else if (type === 'score') {
    format.textFormat.fontSize = 11;
    format.textFormat.foregroundColor = hexToRgb(GOLD);
  } else if (type === 'championLabel') {
    format.textFormat.fontSize = 26;
    format.textFormat.foregroundColor = hexToRgb(GOLD);
    format.backgroundColor = hexToRgb(BACKGROUND);
  } else if (type === 'champion') {
    format.textFormat.fontSize = 34;
    format.textFormat.foregroundColor = hexToRgb(GOLD);
  }

  return base;
}

function getBackgroundFillRequests(rowStart, rowEnd, colStart, colEnd) {
  return [{
    repeatCell: {
      range: {
        startRowIndex: rowStart,
        endRowIndex: rowEnd,
        startColumnIndex: colStart,
        endColumnIndex: colEnd,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: hexToRgb(BACKGROUND),
        },
      },
      fields: 'userEnteredFormat.backgroundColor',
    },
  }];
}

module.exports = {
  getCellFormat,
  getBackgroundFillRequests,
  GOLD,
  BLACK,
  BACKGROUND,
  hexToRgb,
};
