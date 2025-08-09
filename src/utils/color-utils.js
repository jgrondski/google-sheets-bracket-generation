// ==================== src/utils/color-utils.js ====================

/**
 * Color utility functions for dynamic bracket styling
 */

/**
 * Default color schemes
 */
const DEFAULT_COLOR_SCHEMES = {
  gold: '#FFDA75', // Original gold color
  silver: '#D9D9D9', // Original silver color
  bronze: '#CD7F32', // Bronze for future use
};

/**
 * Fixed colors that don't change with color scheme
 */
const FIXED_COLORS = {
  black: { red: 0, green: 0, blue: 0 },
  white: { red: 1, green: 1, blue: 1 },
  gray: { red: 0.192156, green: 0.203922, blue: 0.215686 },
};

/**
 * Convert hex color to RGB object for Google Sheets API
 * @param {string} hex - Hex color (e.g., "#FFDA75")
 * @returns {Object} RGB object with red, green, blue values (0-1)
 */
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse hex values
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  return { red: r, green: g, blue: b };
}

/**
 * Calculate luminance of a color to determine if it's light or dark
 * @param {Object} rgb - RGB object with red, green, blue values (0-1)
 * @returns {number} Luminance value (0-1)
 */
function getLuminance(rgb) {
  const { red, green, blue } = rgb;

  // Convert to linear RGB
  const toLinear = (val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };

  const rLinear = toLinear(red);
  const gLinear = toLinear(green);
  const bLinear = toLinear(blue);

  // Calculate luminance using standard formula
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Get contrasting text color (black or white) for a given background color
 * @param {Object} backgroundColor - RGB object
 * @returns {Object} RGB object for text color
 */
function getContrastColor(backgroundColor) {
  const luminance = getLuminance(backgroundColor);

  // Use black text for light backgrounds, white for dark backgrounds
  // Threshold of 0.5 works well for most cases
  return luminance > 0.5
    ? { red: 0, green: 0, blue: 0 } // Black text
    : { red: 1, green: 1, blue: 1 }; // White text
}

/**
 * Resolve color scheme to actual hex color
 * @param {string} colorScheme - Color scheme identifier or hex color
 * @returns {string} Hex color
 */
function resolveColorScheme(colorScheme) {
  // If it's a hex color (starts with #), return as-is
  if (colorScheme.startsWith('#')) {
    return colorScheme;
  }

  // If it's a preset, return the default
  if (DEFAULT_COLOR_SCHEMES[colorScheme]) {
    return DEFAULT_COLOR_SCHEMES[colorScheme];
  }

  // Fallback to gold
  return DEFAULT_COLOR_SCHEMES.gold;
}

export {
  DEFAULT_COLOR_SCHEMES,
  FIXED_COLORS,
  hexToRgb,
  getLuminance,
  getContrastColor,
  resolveColorScheme,
};
