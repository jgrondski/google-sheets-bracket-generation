// ==================== src/commands/build-bracket-command.js ====================

const { BracketConfig } = require('../config/bracket-config');
const { Tournament } = require('../core/tournament');
const { BracketLayout } = require('../core/bracket-layout');
const { SpreadsheetCreator } = require('../services/spreadsheet-creator');
const { BracketRenderer } = require('../services/bracket-renderer');
const { CommandValidator } = require('./command-validator');

/**
 * Main command for building tournament brackets
 */
class BuildBracketCommand {
  constructor(auth) {
    this.auth = auth;
  }

  /**
   * Execute the bracket building process
   * @param {string} configPath - Path to configuration file
   * @returns {Promise<Object>} Result information
   */
  async execute(configPath = './src/data/playerlist.json') {
    try {
      console.log('🏆 Starting bracket generation...');

      // Validate inputs
      const validationResults = {
        auth: CommandValidator.validateAuth(this.auth),
        configFile: CommandValidator.validateFilePath(configPath)
      };

      const report = CommandValidator.createValidationReport(validationResults);
      if (!report.valid) {
        throw new Error(`Validation failed: ${report.errors.join(', ')}`);
      }

      // 1. Load and validate configuration
      const config = BracketConfig.fromFile(configPath);
      const configErrors = config.validate();
      if (configErrors.length > 0) {
        throw new Error(`Configuration errors: ${configErrors.join(', ')}`);
      }

      console.log('✅ Configuration loaded and validated');
      console.log('📊 Config summary:', config.getSummary());

      // 2. Create tournament model
      const tournament = new Tournament(config);
      const tournamentErrors = tournament.validate();
      if (tournamentErrors.length > 0) {
        throw new Error(`Tournament errors: ${tournamentErrors.join(', ')}`);
      }

      console.log('✅ Tournament created');
      console.log('🎯 Tournament summary:', tournament.getSummary());

      // 3. Generate bracket layout
      const layout = new BracketLayout(tournament);
      console.log('✅ Bracket layout calculated');

      // 4. Create spreadsheet
      const creator = new SpreadsheetCreator(this.auth);
      const spreadsheet = await creator.createTournamentSpreadsheet(config);

      // 5. Render bracket to spreadsheet (includes dimension setup)
      const renderer = new BracketRenderer(this.auth);
      await renderer.renderBracket(spreadsheet.spreadsheetId, layout);

      console.log('✅ Bracket layout applied successfully');

      return {
        success: true,
        spreadsheet,
        tournament: tournament.getSummary(),
        message: 'Bracket generated successfully',
      };

    } catch (error) {
      console.error('❌ Error building bracket:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate bracket',
      };
    }
  }
}

/**
 * Legacy function wrapper for backward compatibility
 * @param {Object} auth - Google OAuth2 client
 * @returns {Promise<void>}
 */
async function buildBracket(auth) {
  const command = new BuildBracketCommand(auth);
  const result = await command.execute();
  
  if (!result.success) {
    throw new Error(result.error);
  }
}

module.exports = { BuildBracketCommand, buildBracket };
