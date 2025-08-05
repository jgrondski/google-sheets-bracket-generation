// connector-builder.js
// Main connector builder for bracket borders

import { formatBorderRequest } from "./connector-utils.js";
import { getConnectorColor } from "../styles/dynamic-styles.js";
import { DIMENSIONS } from "../styles/styles.js";

/**
 * Build connector border requests for all rounds
 * @param {Array} playerGroups - Array of PlayerGroup instances
 * @param {number} sheetId - Target sheet ID
 * @param {string} colorScheme - 'gold' or 'silver'
 * @returns {Array} Array of Google Sheets API requests for connector borders
 */
function buildConnectors(playerGroups, sheetId = 0, colorScheme = "gold") {
  const requests = [];

  const connectorColor = getConnectorColor(colorScheme);
  const borderWidth = DIMENSIONS.connectorBorderWidth;

  for (let i = 0; i < playerGroups.length - 1; i += 2) {
    const curGroup = playerGroups[i];
    const nextGroup = playerGroups[i + 1];

    // Skip connectors only if BOTH groups are bye positions
    // If one is a bye and one is real, we still want connectors
    if (curGroup.isBye && nextGroup.isBye) {
      continue;
    }

    // Only process if current group is TOP
    if (curGroup.conType === "TOP") {
      // 4. Set cell at [curGroup.connectorRow, curGroup.connectorCol] to top+right border
      const req1 = formatBorderRequest(
        curGroup.connectorRow,
        curGroup.connectorCol,
        ["top", "right"],
        connectorColor,
        borderWidth,
        sheetId
      );
      requests.push(req1);
      // 5. Set cell at [nextGroup.connectorRow, nextGroup.connectorCol] to top border
      const req2 = formatBorderRequest(
        nextGroup.connectorRow,
        nextGroup.connectorCol,
        ["top"],
        connectorColor,
        borderWidth,
        sheetId
      );
      requests.push(req2);

      // 6. Set all cells between above two (same col, different rows) to right border
      const minRow = Math.min(curGroup.connectorRow, nextGroup.connectorRow);
      const maxRow = Math.max(curGroup.connectorRow, nextGroup.connectorRow);
      for (let r = minRow + 1; r < maxRow; r++) {
        const req3 = formatBorderRequest(
          r,
          curGroup.connectorCol,
          ["right"],
          connectorColor,
          borderWidth,
          sheetId
        );
        requests.push(req3);
      }
      // 7. Calculate connector row midpoint
      const conRow = Math.floor(
        (curGroup.connectorRow + nextGroup.connectorRow) / 2
      );
      // 8. Set cell at (col+1, conRow) to top border
      const req4 = formatBorderRequest(
        conRow,
        curGroup.connectorCol + 1,
        ["top"],
        connectorColor,
        borderWidth,
        sheetId
      );
      requests.push(req4);
      // If current group is BOTTOM, skip
    }
  }
  return requests;
}

export default { buildConnectors };
