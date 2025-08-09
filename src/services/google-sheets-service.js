// ==================== src/services/google-sheets-service.js ====================

import { google } from 'googleapis';

/**
 * Service for Google Sheets API operations
 */
class GoogleSheetsService {
  constructor(auth) {
    this.auth = auth;
    this.sheets = google.sheets({ version: 'v4', auth });
    this.drive = google.drive({ version: 'v3', auth });
  }

  /**
   * Create a new spreadsheet
   * @param {string} title - Spreadsheet title
   * @param {string} folderId - Parent folder ID (optional)
   * @returns {Promise<string>} Spreadsheet ID
   */
  async createSpreadsheet(title, folderId = null) {
    const resource = {
      name: title,
      mimeType: 'application/vnd.google-apps.spreadsheet',
    };

    if (folderId) {
      resource.parents = [folderId];
    }

    const file = await this.drive.files.create({
      resource,
      fields: 'id',
    });

    return file.data.id;
  }

  /**
   * Rename a sheet within a spreadsheet
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {number} sheetId - Sheet ID (usually 0 for first sheet)
   * @param {string} newName - New sheet name
   * @returns {Promise<void>}
   */
  async renameSheet(spreadsheetId, sheetId, newName) {
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId,
                title: newName,
              },
              fields: 'title',
            },
          },
        ],
      },
    });
  }

  /**
   * Apply batch updates to a spreadsheet
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {Array} requests - Array of batch update requests
   * @returns {Promise<void>}
   */
  async batchUpdate(spreadsheetId, requests) {
    if (!requests || requests.length === 0) {
      console.log('No requests to apply');
      return;
    }

    // Google Sheets API allows up to ~1000 requests per batch safely.
    const chunkSize = 500;
    for (let i = 0; i < requests.length; i += chunkSize) {
      const chunk = requests.slice(i, i + chunkSize);
      await this._batchUpdateWithRetry(spreadsheetId, chunk);
    }
  }

  async _batchUpdateWithRetry(spreadsheetId, requests, retries = 3) {
    let attempt = 0;
    let delay = 500; // ms
    while (true) {
      try {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests },
        });
        return;
      } catch (err) {
        const status = err?.code || err?.response?.status;
        const isRetryable = status === 429 || (status >= 500 && status < 600);
        if (!isRetryable || attempt >= retries) {
          throw err;
        }
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
        attempt += 1;
      }
    }
  }

  /**
   * Get spreadsheet URL
   * @param {string} spreadsheetId - Spreadsheet ID
   * @returns {string} Spreadsheet URL
   */
  getSpreadsheetUrl(spreadsheetId) {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  }

  /**
   * Update sheet properties (dimensions, etc.)
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {number} sheetId - Sheet ID
   * @param {Object} properties - Properties to update
   * @returns {Promise<void>}
   */
  async updateSheetProperties(spreadsheetId, sheetId, properties) {
    const requests = [
      {
        updateSheetProperties: {
          properties: {
            sheetId,
            ...properties,
          },
          fields: Object.keys(properties).join(','),
        },
      },
    ];

    await this.batchUpdate(spreadsheetId, requests);
  }

  /**
   * Set column count for a sheet
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {number} sheetId - Sheet ID
   * @param {number} columnCount - Number of columns
   * @returns {Promise<void>}
   */
  async setColumnCount(spreadsheetId, sheetId, columnCount) {
    const requests = [
      {
        updateSheetProperties: {
          properties: {
            sheetId: sheetId,
            gridProperties: { columnCount },
          },
          fields: 'gridProperties.columnCount',
        },
      },
    ];

    await this.batchUpdate(spreadsheetId, requests);
  }

  /**
   * Resize an existing sheet
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {number} sheetId - Sheet ID to resize
   * @param {number} rowCount - New row count
   * @param {number} columnCount - New column count
   * @returns {Promise<void>}
   */
  async resizeSheet(spreadsheetId, sheetId, rowCount, columnCount) {
    const request = {
      updateSheetProperties: {
        properties: {
          sheetId: sheetId,
          gridProperties: {
            rowCount: rowCount,
            columnCount: columnCount,
          },
        },
        fields: 'gridProperties(rowCount,columnCount)',
      },
    };

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [request] },
    });
  }

  /**
   * Add a new sheet with specified dimensions
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} sheetName - Name for the new sheet
   * @param {number} rowCount - Number of rows (optional, defaults to 1000)
   * @param {number} columnCount - Number of columns (optional, defaults to 26)
   * @returns {Promise<number>} New sheet ID
   */
  async addSheet(spreadsheetId, sheetName, rowCount = 1000, columnCount = 26) {
    const request = {
      addSheet: {
        properties: {
          title: sheetName,
          gridProperties: {
            rowCount: rowCount,
            columnCount: columnCount,
          },
        },
      },
    };

    const response = await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [request] },
    });

    // Return the new sheet ID
    return response.data.replies[0].addSheet.properties.sheetId;
  }

  /**
   * Get basic sheet metadata by title
   */
  async getSheetByTitle(spreadsheetId, title) {
    const resp = await this.sheets.spreadsheets.get({ spreadsheetId });
    const sheet = resp.data.sheets?.find((s) => s.properties.title === title);
    if (!sheet) return null;
    return {
      id: sheet.properties.sheetId,
      title: sheet.properties.title,
      index: sheet.properties.index,
      gridProperties: sheet.properties.gridProperties,
    };
  }

  /**
   * Idempotently find or create a sheet and optionally resize
   */
  async findOrCreateSheet(spreadsheetId, title, rowCount = 1000, columnCount = 26) {
    const existing = await this.getSheetByTitle(spreadsheetId, title);
    if (existing) {
      // Ensure minimum size
      const currentRows = existing.gridProperties?.rowCount ?? 0;
      const currentCols = existing.gridProperties?.columnCount ?? 0;
      const needsResize = currentRows < rowCount || currentCols < columnCount;
      if (needsResize) {
        await this.resizeSheet(
          spreadsheetId,
          existing.id,
          Math.max(currentRows, rowCount),
          Math.max(currentCols, columnCount)
        );
      }
      return existing.id;
    }
    return await this.addSheet(spreadsheetId, title, rowCount, columnCount);
  }

  /**
   * Simple values.get wrapper
   */
  async getSheetData(spreadsheetId, range) {
    return await this.sheets.spreadsheets.values.get({ spreadsheetId, range });
  }
}

export { GoogleSheetsService };
export default { GoogleSheetsService };
