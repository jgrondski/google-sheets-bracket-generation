// styles.js
// Centralized styling definitions for bracket generation - now using dynamic generation

import { generateCellFormats, generateBorders } from './dynamic-styles.js';

// Font definitions
const FONTS = {
  primary: {
    fontFamily: 'Montserrat',
    bold: true,
  },
  champion: {
    fontFamily: 'Montserrat',
    bold: true,
    fontSize: 34,
  },
  championHeader: {
    fontFamily: 'Montserrat',
    bold: true,
    fontSize: 24,
  },
  seed: {
    fontFamily: 'Montserrat',
    bold: true,
    fontSize: 11,
  },
  name: {
    fontFamily: 'Montserrat',
    bold: true,
    fontSize: 12,
  },
  score: {
    fontFamily: 'Montserrat',
    bold: true,
    fontSize: 11,
  },
};

// Alignment constants
const ALIGNMENT = {
  center: 'CENTER',
  middle: 'MIDDLE',
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
 * @param {string} colorScheme - Color scheme identifier or hex color
 * @returns {Object} Cell formats for the color scheme
 */
function getCellFormats(colorScheme = 'gold') {
  return generateCellFormats(colorScheme);
}

/**
 * Get border styles for a specific color scheme
 * @param {string} colorScheme - Color scheme identifier or hex color
 * @returns {Object} Border styles for the color scheme
 */
function getBorders(colorScheme = 'gold') {
  return generateBorders(colorScheme);
}

export { FONTS, ALIGNMENT, DIMENSIONS, getCellFormats, getBorders };
