// ==================== src/utils/array-utils.js ====================

/**
 * Array utility functions for bracket generation
 */

/**
 * Chunk an array into groups of specified size
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} Array of chunks
 */
function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} New shuffled array
 */
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Group array elements by a key function
 * @param {Array} array - Array to group
 * @param {Function} keyFn - Function to generate group key
 * @returns {Object} Object with grouped elements
 */
function groupBy(array, keyFn) {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
}

/**
 * Remove duplicates from array based on key function
 * @param {Array} array - Array to deduplicate
 * @param {Function} keyFn - Function to generate comparison key
 * @returns {Array} Array with duplicates removed
 */
function uniqueBy(array, keyFn) {
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Flatten nested arrays to specified depth
 * @param {Array} array - Array to flatten
 * @param {number} depth - Depth to flatten (default: 1)
 * @returns {Array} Flattened array
 */
function flatten(array, depth = 1) {
  if (depth === 0) return array.slice();
  
  return array.reduce((acc, item) => {
    if (Array.isArray(item)) {
      acc.push(...flatten(item, depth - 1));
    } else {
      acc.push(item);
    }
    return acc;
  }, []);
}

module.exports = {
  chunk,
  shuffle,
  groupBy,
  uniqueBy,
  flatten,
};
