// ==================== src/styles/dynamic-styles.js ====================

import { hexToRgb, getContrastColor, resolveColorScheme, FIXED_COLORS } from "../utils/color-utils.js";
import { FONTS, ALIGNMENT } from "./styles.js";

/**
 * Generate cell formats dynamically for a given color scheme
 * @param {string} colorScheme - Color scheme identifier or hex color
 * @returns {Object} Complete set of cell formats
 */
function generateCellFormats(colorScheme) {
  const hexColor = resolveColorScheme(colorScheme);
  const primaryColor = hexToRgb(hexColor);
  const contrastColor = getContrastColor(primaryColor);
  
  // Create border styles for this color
  const borders = {
    primary: { 
      style: "SOLID_MEDIUM", 
      width: 2, 
      color: primaryColor 
    },
    medium: { 
      style: "SOLID_MEDIUM", 
      color: primaryColor 
    },
  };

  return {
    // Player cell formats
    seed: {
      backgroundColor: primaryColor,
      horizontalAlignment: ALIGNMENT.center,
      verticalAlignment: ALIGNMENT.middle,
      textFormat: { ...FONTS.seed, foregroundColor: contrastColor },
      borders: { 
        top: borders.primary, 
        bottom: borders.primary, 
        left: borders.primary, 
        right: borders.primary 
      },
    },
    
    name: {
      backgroundColor: FIXED_COLORS.black,
      horizontalAlignment: ALIGNMENT.center,
      verticalAlignment: ALIGNMENT.middle,
      textFormat: { ...FONTS.name, foregroundColor: primaryColor },
      borders: { 
        top: borders.primary, 
        bottom: borders.primary, 
        left: borders.primary, 
        right: borders.primary 
      },
    },
    
    score: {
      backgroundColor: FIXED_COLORS.black,
      horizontalAlignment: ALIGNMENT.center,
      verticalAlignment: ALIGNMENT.middle,
      textFormat: { ...FONTS.score, foregroundColor: primaryColor },
      borders: { 
        top: borders.primary, 
        bottom: borders.primary, 
        left: borders.primary, 
        right: borders.primary 
      },
    },
    
    // Champion formats
    championSeed: {
      backgroundColor: primaryColor,
      horizontalAlignment: ALIGNMENT.center,
      verticalAlignment: ALIGNMENT.middle,
      textFormat: { ...FONTS.champion, foregroundColor: contrastColor },
      borders: { 
        top: borders.medium, 
        bottom: borders.medium, 
        left: borders.medium, 
        right: borders.medium 
      },
    },
    
    championName: {
      backgroundColor: FIXED_COLORS.black,
      horizontalAlignment: ALIGNMENT.center,
      verticalAlignment: ALIGNMENT.middle,
      textFormat: { ...FONTS.champion, foregroundColor: primaryColor },
      borders: { 
        top: borders.medium, 
        bottom: borders.medium, 
        left: borders.medium, 
        right: borders.medium 
      },
    },
    
    championHeader: {
      backgroundColor: FIXED_COLORS.gray,
      horizontalAlignment: ALIGNMENT.center,
      verticalAlignment: ALIGNMENT.middle,
      textFormat: { ...FONTS.championHeader, foregroundColor: primaryColor },
    },
    
    // Shared formats (don't depend on color scheme)
    bye: {
      backgroundColor: FIXED_COLORS.gray,
      horizontalAlignment: ALIGNMENT.center,
      verticalAlignment: ALIGNMENT.middle,
    },
    
    background: {
      backgroundColor: FIXED_COLORS.gray,
    },
  };
}

/**
 * Generate border styles for a given color scheme
 * @param {string} colorScheme - Color scheme identifier or hex color
 * @returns {Object} Border styles
 */
function generateBorders(colorScheme) {
  const hexColor = resolveColorScheme(colorScheme);
  const primaryColor = hexToRgb(hexColor);
  
  return {
    primary: { 
      style: "SOLID_MEDIUM", 
      width: 2, 
      color: primaryColor 
    },
    medium: { 
      style: "SOLID_MEDIUM", 
      color: primaryColor 
    },
  };
}

/**
 * Get connector color for a given color scheme
 * @param {string} colorScheme - Color scheme identifier or hex color
 * @returns {Object} RGB color object for connectors
 */
function getConnectorColor(colorScheme) {
  const hexColor = resolveColorScheme(colorScheme);
  return hexToRgb(hexColor);
}

export {
  generateCellFormats,
  generateBorders,
  getConnectorColor,
};
