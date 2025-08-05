// ==================== src/commands/command-validator.js ====================

const fs = require('fs');

/**
 * Validation utilities for commands
 */
class CommandValidator {
  /**
   * Validate that a file exists and is readable
   * @param {string} filePath - Path to validate
   * @returns {Object} Validation result
   */
  static validateFilePath(filePath) {
    try {
      if (!filePath) {
        return { valid: false, error: 'File path is required' };
      }

      if (!fs.existsSync(filePath)) {
        return { valid: false, error: `File does not exist: ${filePath}` };
      }

      fs.accessSync(filePath, fs.constants.R_OK);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Cannot read file: ${error.message}` };
    }
  }

  /**
   * Validate Google OAuth2 client
   * @param {Object} auth - OAuth2 client
   * @returns {Object} Validation result
   */
  static validateAuth(auth) {
    if (!auth) {
      return { valid: false, error: 'Authentication client is required' };
    }

    if (typeof auth.getAccessToken !== 'function') {
      return { valid: false, error: 'Invalid authentication client' };
    }

    return { valid: true };
  }

  /**
   * Validate command parameters
   * @param {Object} params - Parameters to validate
   * @param {Object} schema - Validation schema
   * @returns {Object} Validation result
   */
  static validateParams(params, schema) {
    const errors = [];

    Object.entries(schema).forEach(([key, rules]) => {
      const value = params[key];

      if (rules.required && (value === undefined || value === null)) {
        errors.push(`${key} is required`);
        return;
      }

      if (value !== undefined && value !== null) {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${key} must be of type ${rules.type}`);
        }

        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${key} must be at least ${rules.minLength} characters`);
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${key} must be no more than ${rules.maxLength} characters`);
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${key} format is invalid`);
        }

        if (rules.validator && !rules.validator(value)) {
          errors.push(`${key} validation failed`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate environment variables
   * @param {Array} requiredVars - Array of required environment variable names
   * @returns {Object} Validation result
   */
  static validateEnvironment(requiredVars = []) {
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    return {
      valid: missing.length === 0,
      missing,
      error: missing.length > 0 ? `Missing environment variables: ${missing.join(', ')}` : null
    };
  }

  /**
   * Create a comprehensive validation report
   * @param {Object} validationResults - Object with validation results
   * @returns {Object} Comprehensive report
   */
  static createValidationReport(validationResults) {
    const allErrors = [];
    const allWarnings = [];
    let isValid = true;

    Object.entries(validationResults).forEach(([category, result]) => {
      if (result.valid === false) {
        isValid = false;
        if (result.error) {
          allErrors.push(`${category}: ${result.error}`);
        }
        if (result.errors) {
          allErrors.push(...result.errors.map(err => `${category}: ${err}`));
        }
      }
      if (result.warnings) {
        allWarnings.push(...result.warnings.map(warn => `${category}: ${warn}`));
      }
    });

    return {
      valid: isValid,
      errors: allErrors,
      warnings: allWarnings,
      summary: isValid ? 'All validations passed' : `${allErrors.length} validation errors found`
    };
  }
}

module.exports = { CommandValidator };
