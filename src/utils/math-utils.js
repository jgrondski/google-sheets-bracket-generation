// ==================== src/utils/math-utils.js ====================

/**
 * Mathematical utility functions for bracket calculations
 */

/**
 * Find the next power of 2 greater than or equal to n
 * @param {number} n - Input number
 * @returns {number} Next power of 2
 */
function nextPowerOfTwo(n) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Calculate the number of rounds needed for a given number of players
 * @param {number} playerCount - Number of players
 * @returns {number} Number of rounds needed
 */
function calculateRounds(playerCount) {
  return Math.ceil(Math.log2(playerCount));
}

/**
 * Compute 1-based row & column for a PlayerGroup in a bracket grid
 * @param {number} roundIndex - Zero-based round index (0 → Round 1)
 * @param {number} matchIndex - Zero-based match index within that round
 * @returns {{row: number, col: number}} Position coordinates
 */
function getPosition(roundIndex, matchIndex) {
  // gap between groups = 2^(roundIndex+1) * 2
  const gap = Math.pow(2, roundIndex + 1) * 2;
  const row = gap / 2 + matchIndex * gap;
  // step of 5 cols between seed columns: seed, name, connector, connector → next seed
  const col = 2 + roundIndex * 5;
  return { row, col };
}

/**
 * Calculate the number of byes needed for a bracket
 * @param {number} playerCount - Actual number of players
 * @param {number} bracketSize - Target bracket size (power of 2)
 * @returns {number} Number of byes needed
 */
function calculateByes(playerCount, bracketSize) {
  return bracketSize - playerCount;
}

/**
 * Check if a number is a power of 2
 * @param {number} n - Number to check
 * @returns {boolean} True if n is a power of 2
 */
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

export { nextPowerOfTwo, calculateRounds, getPosition, calculateByes, isPowerOfTwo };
