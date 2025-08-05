// ==================== Legacy bracket-builder.js ====================
// This file is maintained for backward compatibility
// New development should use the modular architecture in src/commands/

const { buildBracket: newBuildBracket } = require('./commands/build-bracket-command');

/**
 * Legacy buildBracket function - redirects to new modular implementation
 * @param {Object} auth - Google OAuth2 client
 * @returns {Promise<void>}
 */
async function buildBracket(auth) {
  return await newBuildBracket(auth);
}

module.exports = { buildBracket };
