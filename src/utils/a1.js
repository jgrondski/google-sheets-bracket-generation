// ==================== src/utils/a1.js ====================

/**
 * Utilities for A1 conversions and 0-based index math used across sheets
 */
export function colToA1(index) {
  let result = '';
  while (index >= 0) {
    result = String.fromCharCode(65 + (index % 26)) + result;
    index = Math.floor(index / 26) - 1;
  }
  return result;
}

export function rowToA1(index0) {
  return index0 + 1;
}

/**
 * Convert (row0, col0) -> A1 string
 */
export function toA1(row0, col0) {
  return `${colToA1(col0)}${rowToA1(row0)}`;
}
