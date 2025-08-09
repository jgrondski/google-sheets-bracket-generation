import { JsonDataSource } from './sources/json-data-source.js';
import { SheetsDataSource } from './sources/sheets-data-source.js';

/**
 * Factory for creating data source instances
 * Provides a clean interface for creating different types of data sources
 */
class DataSourceFactory {
  /**
   * Create a JSON file data source
   * @param {string} configPath - Path to JSON configuration file
   * @returns {JsonDataSource}
   */
  static createJsonDataSource(configPath) {
    return new JsonDataSource(configPath);
  }

  /**
   * Create a Google Sheets data source
   * @param {Object} auth - Google OAuth2 client
   * @param {string} spreadsheetId - Google Sheets spreadsheet ID
   * @returns {SheetsDataSource}
   */
  static createSheetsDataSource(auth, spreadsheetId) {
    return new SheetsDataSource(auth, spreadsheetId);
  }

  /**
   * Create a data source from configuration
   * @param {Object} config - Data source configuration
   * @returns {DataSource}
   */
  static createFromConfig(config) {
    const { type, ...options } = config;

    switch (type) {
      case 'json':
        if (!options.configPath) {
          throw new Error('JSON data source requires configPath option');
        }
        return DataSourceFactory.createJsonDataSource(options.configPath);

      case 'sheets':
        if (!options.auth || !options.spreadsheetId) {
          throw new Error('Sheets data source requires auth and spreadsheetId options');
        }
        return DataSourceFactory.createSheetsDataSource(options.auth, options.spreadsheetId);

      default:
        throw new Error(`Unsupported data source type: ${type}`);
    }
  }

  /**
   * Auto-detect and create appropriate data source
   * @param {string|Object} input - File path for JSON or config object
   * @returns {DataSource}
   */
  static createAutoDetect(input) {
    if (typeof input === 'string') {
      // String input - assume it's a file path
      return DataSourceFactory.createJsonDataSource(input);
    }

    if (typeof input === 'object' && input.type) {
      // Object with type - use createFromConfig
      return DataSourceFactory.createFromConfig(input);
    }

    throw new Error('Unable to auto-detect data source type from input');
  }

  /**
   * Get list of supported data source types
   * @returns {Array<string>} Array of supported type names
   */
  static getSupportedTypes() {
    return ['json', 'sheets'];
  }

  /**
   * Validate data source configuration
   * @param {Object} config - Data source configuration to validate
   * @returns {Array<string>} Array of validation errors (empty if valid)
   */
  static validateConfig(config) {
    const errors = [];

    if (!config || typeof config !== 'object') {
      errors.push('Data source configuration must be an object');
      return errors;
    }

    const { type } = config;
    if (!type) {
      errors.push('Data source configuration must specify a type');
      return errors;
    }

    if (!DataSourceFactory.getSupportedTypes().includes(type)) {
      errors.push(
        `Unsupported data source type: ${type}. Supported types: ${DataSourceFactory.getSupportedTypes().join(', ')}`
      );
      return errors;
    }

    // Type-specific validation
    switch (type) {
      case 'json':
        if (!config.configPath) {
          errors.push('JSON data source requires configPath');
        }
        break;

      case 'sheets':
        if (!config.auth) {
          errors.push('Sheets data source requires auth');
        }
        if (!config.spreadsheetId) {
          errors.push('Sheets data source requires spreadsheetId');
        }
        break;
    }

    return errors;
  }
}

export { DataSourceFactory };
