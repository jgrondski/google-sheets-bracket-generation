// styles.js
// Centralized styling definitions for bracket generation

// Color palette
const COLORS = {
  gold: { red: 1, green: 0.8588, blue: 0.4627 },
  black: { red: 0, green: 0, blue: 0 },
  gray: { red: 0.192156, green: 0.203922, blue: 0.215686 },
};

// Font definitions
const FONTS = {
  primary: { 
    fontFamily: "Montserrat", 
    bold: true 
  },
  champion: { 
    fontFamily: "Montserrat", 
    bold: true, 
    fontSize: 34 
  },
  championHeader: { 
    fontFamily: "Montserrat", 
    bold: true, 
    fontSize: 24 
  },
  seed: { 
    fontFamily: "Montserrat", 
    bold: true, 
    fontSize: 11 
  },
  name: { 
    fontFamily: "Montserrat", 
    bold: true, 
    fontSize: 12 
  },
  score: { 
    fontFamily: "Montserrat", 
    bold: true, 
    fontSize: 11 
  },
};

// Border definitions
const BORDERS = {
  primary: { 
    style: "SOLID_MEDIUM", 
    width: 2, 
    color: COLORS.gold 
  },
  medium: { 
    style: "SOLID_MEDIUM", 
    color: COLORS.gold 
  },
};

// Alignment constants
const ALIGNMENT = {
  center: "CENTER",
  middle: "MIDDLE",
};

// Cell format templates
const CELL_FORMATS = {
  seed: {
    backgroundColor: COLORS.gold,
    horizontalAlignment: ALIGNMENT.center,
    verticalAlignment: ALIGNMENT.middle,
    textFormat: { ...FONTS.seed, foregroundColor: COLORS.black },
    borders: { 
      top: BORDERS.primary, 
      bottom: BORDERS.primary, 
      left: BORDERS.primary, 
      right: BORDERS.primary 
    },
  },
  
  name: {
    backgroundColor: COLORS.black,
    horizontalAlignment: ALIGNMENT.center,
    verticalAlignment: ALIGNMENT.middle,
    textFormat: { ...FONTS.name, foregroundColor: COLORS.gold },
    borders: { 
      top: BORDERS.primary, 
      bottom: BORDERS.primary, 
      left: BORDERS.primary, 
      right: BORDERS.primary 
    },
  },
  
  score: {
    backgroundColor: COLORS.black,
    horizontalAlignment: ALIGNMENT.center,
    verticalAlignment: ALIGNMENT.middle,
    textFormat: { ...FONTS.score, foregroundColor: COLORS.gold },
    borders: { 
      top: BORDERS.primary, 
      bottom: BORDERS.primary, 
      left: BORDERS.primary, 
      right: BORDERS.primary 
    },
  },
  
  championSeed: {
    backgroundColor: COLORS.gold,
    horizontalAlignment: ALIGNMENT.center,
    verticalAlignment: ALIGNMENT.middle,
    textFormat: { ...FONTS.champion, foregroundColor: COLORS.black },
    borders: { 
      top: BORDERS.medium, 
      bottom: BORDERS.medium, 
      left: BORDERS.medium, 
      right: BORDERS.medium 
    },
  },
  
  championName: {
    backgroundColor: COLORS.black,
    horizontalAlignment: ALIGNMENT.center,
    verticalAlignment: ALIGNMENT.middle,
    textFormat: { ...FONTS.champion, foregroundColor: COLORS.gold },
    borders: { 
      top: BORDERS.medium, 
      bottom: BORDERS.medium, 
      left: BORDERS.medium, 
      right: BORDERS.medium 
    },
  },
  
  championHeader: {
    backgroundColor: COLORS.gray,
    horizontalAlignment: ALIGNMENT.center,
    verticalAlignment: ALIGNMENT.middle,
    textFormat: { ...FONTS.championHeader, foregroundColor: COLORS.gold },
  },
  
  bye: {
    backgroundColor: COLORS.gray,
    horizontalAlignment: ALIGNMENT.center,
    verticalAlignment: ALIGNMENT.middle,
  },
  
  background: {
    backgroundColor: COLORS.gray,
  },
};

// Dimension constants
const DIMENSIONS = {
  rowHeight: 14,
  columnWidths: {
    edge: 16,
    seed: 64,
    mainName: 336,
    otherName: 168,
    connector: 28,
  },
  connectorBorderWidth: 2,
};

module.exports = {
  COLORS,
  FONTS,
  BORDERS,
  ALIGNMENT,
  CELL_FORMATS,
  DIMENSIONS,
};
