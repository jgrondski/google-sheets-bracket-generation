// styles.js
// Centralized styling definitions for bracket generation

// Color palette
const COLORS = {
  gold: { red: 1, green: 0.8588, blue: 0.4627 },
  silver: { red: 0.851, green: 0.851, blue: 0.851 }, // #d9d9d9 / rgb(217, 217, 217)
  black: { red: 0, green: 0, blue: 0 },
  gray: { red: 0.192156, green: 0.203922, blue: 0.215686 },
};

// Font definitions
const FONTS = {
  primary: {
    fontFamily: "Montserrat",
    bold: true,
  },
  champion: {
    fontFamily: "Montserrat",
    bold: true,
    fontSize: 34,
  },
  championHeader: {
    fontFamily: "Montserrat",
    bold: true,
    fontSize: 24,
  },
  seed: {
    fontFamily: "Montserrat",
    bold: true,
    fontSize: 11,
  },
  name: {
    fontFamily: "Montserrat",
    bold: true,
    fontSize: 12,
  },
  score: {
    fontFamily: "Montserrat",
    bold: true,
    fontSize: 11,
  },
};

// Border definitions
const BORDERS = {
  primary: {
    style: "SOLID_MEDIUM",
    width: 2,
    color: COLORS.gold,
  },
  medium: {
    style: "SOLID_MEDIUM",
    color: COLORS.gold,
  },
  silverPrimary: {
    style: "SOLID_MEDIUM",
    width: 2,
    color: COLORS.silver,
  },
  silverMedium: {
    style: "SOLID_MEDIUM",
    color: COLORS.silver,
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
      right: BORDERS.primary,
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
      right: BORDERS.primary,
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
      right: BORDERS.primary,
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
      right: BORDERS.medium,
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
      right: BORDERS.medium,
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

  // Silver bracket variants
  silverSeed: {
    backgroundColor: COLORS.silver,
    horizontalAlignment: ALIGNMENT.center,
    verticalAlignment: ALIGNMENT.middle,
    textFormat: { ...FONTS.seed, foregroundColor: COLORS.black },
    borders: {
      top: BORDERS.silverPrimary,
      bottom: BORDERS.silverPrimary,
      left: BORDERS.silverPrimary,
      right: BORDERS.silverPrimary,
    },
  },

  silverName: {
    backgroundColor: COLORS.black,
    horizontalAlignment: ALIGNMENT.center,
    verticalAlignment: ALIGNMENT.middle,
    textFormat: { ...FONTS.name, foregroundColor: COLORS.silver },
    borders: {
      top: BORDERS.silverPrimary,
      bottom: BORDERS.silverPrimary,
      left: BORDERS.silverPrimary,
      right: BORDERS.silverPrimary,
    },
  },

  silverScore: {
    backgroundColor: COLORS.black,
    horizontalAlignment: ALIGNMENT.center,
    verticalAlignment: ALIGNMENT.middle,
    textFormat: { ...FONTS.score, foregroundColor: COLORS.silver },
    borders: {
      top: BORDERS.silverPrimary,
      bottom: BORDERS.silverPrimary,
      left: BORDERS.silverPrimary,
      right: BORDERS.silverPrimary,
    },
  },

  silverChampionSeed: {
    backgroundColor: COLORS.silver,
    horizontalAlignment: ALIGNMENT.center,
    verticalAlignment: ALIGNMENT.middle,
    textFormat: { ...FONTS.champion, foregroundColor: COLORS.black },
    borders: {
      top: BORDERS.silverMedium,
      bottom: BORDERS.silverMedium,
      left: BORDERS.silverMedium,
      right: BORDERS.silverMedium,
    },
  },

  silverChampionName: {
    backgroundColor: COLORS.black,
    horizontalAlignment: ALIGNMENT.center,
    verticalAlignment: ALIGNMENT.middle,
    textFormat: { ...FONTS.champion, foregroundColor: COLORS.silver },
    borders: {
      top: BORDERS.silverMedium,
      bottom: BORDERS.silverMedium,
      left: BORDERS.silverMedium,
      right: BORDERS.silverMedium,
    },
  },

  silverChampionHeader: {
    backgroundColor: COLORS.gray,
    horizontalAlignment: ALIGNMENT.center,
    verticalAlignment: ALIGNMENT.middle,
    textFormat: { ...FONTS.championHeader, foregroundColor: COLORS.silver },
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

/**
 * Get cell formats for a specific color scheme
 * @param {string} colorScheme - 'gold' or 'silver'
 * @returns {Object} Cell formats for the color scheme
 */
function getCellFormats(colorScheme = "gold") {
  if (colorScheme === "silver") {
    return {
      seed: CELL_FORMATS.silverSeed,
      name: CELL_FORMATS.silverName,
      score: CELL_FORMATS.silverScore,
      championSeed: CELL_FORMATS.silverChampionSeed,
      championName: CELL_FORMATS.silverChampionName,
      championHeader: CELL_FORMATS.silverChampionHeader,
      bye: CELL_FORMATS.bye,
      background: CELL_FORMATS.background,
    };
  }

  // Default to gold formats
  return {
    seed: CELL_FORMATS.seed,
    name: CELL_FORMATS.name,
    score: CELL_FORMATS.score,
    championSeed: CELL_FORMATS.championSeed,
    championName: CELL_FORMATS.championName,
    championHeader: CELL_FORMATS.championHeader,
    bye: CELL_FORMATS.bye,
    background: CELL_FORMATS.background,
  };
}

/**
 * Get border styles for a specific color scheme
 * @param {string} colorScheme - 'gold' or 'silver'
 * @returns {Object} Border styles for the color scheme
 */
function getBorders(colorScheme = "gold") {
  if (colorScheme === "silver") {
    return {
      primary: BORDERS.silverPrimary,
      medium: BORDERS.silverMedium,
    };
  }

  // Default to gold borders
  return {
    primary: BORDERS.primary,
    medium: BORDERS.medium,
  };
}

export {
  COLORS,
  FONTS,
  BORDERS,
  ALIGNMENT,
  CELL_FORMATS,
  DIMENSIONS,
  getCellFormats,
  getBorders,
};
