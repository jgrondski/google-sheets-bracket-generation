// ==================== src/commands/build-bracket-command.js ====================

import { BracketConfig } from '../config/bracket-config.js';
import { Tournament } from '../core/tournament.js';
import { MultiBracketTournament } from '../core/multi-bracket-tournament.js';
import _default from '../core/bracket-layout.js';
const { BracketLayout } = _default;
import { SpreadsheetCreator } from '../services/spreadsheet-creator.js';
import { BracketRenderer } from '../services/bracket-renderer.js';
import { QualsSheetCreator } from '../services/quals-sheet-creator.js';
import { MatchSheetCreator } from '../services/match-sheet-creator.js';
import __default from './command-validator.js';
const { CommandValidator } = __default;

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
  async execute(configPath = './bracket-data.json') {
    try {
      console.log('🏆 Starting bracket generation...');

      // Validate inputs
      const validationResults = {
        auth: CommandValidator.validateAuth(this.auth),
        configFile: CommandValidator.validateFilePath(configPath),
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

      // 2. Determine if we have multiple brackets
      const bracketTypes = config.getAvailableBracketTypes();
      const isMultiBracket = bracketTypes.length > 1;

      console.log(`🏆 Tournament type: ${isMultiBracket ? 'Multi-bracket' : 'Single bracket'}`);
      console.log(`📋 Brackets: ${bracketTypes.join(', ')}`);

      // 3. Create appropriate tournament model
      let tournament;
      if (isMultiBracket) {
        tournament = new MultiBracketTournament(config);
      } else {
        tournament = new Tournament(config);
      }

      const tournamentErrors = tournament.validate();
      if (tournamentErrors.length > 0) {
        throw new Error(`Tournament errors: ${tournamentErrors.join(', ')}`);
      }

      console.log('✅ Tournament created');
      console.log('🎯 Tournament summary:', tournament.getSummary());

      // 4. Create spreadsheet
      const targetFolderId = process.env.TARGET_FOLDER_ID || null;
      const creator = new SpreadsheetCreator(this.auth, targetFolderId);
      let spreadsheet;

      if (isMultiBracket) {
        spreadsheet = await creator.createMultiBracketSpreadsheet(config);
      } else {
        spreadsheet = await creator.createTournamentSpreadsheet(config);
      }

      // 5. Create combined Quals sheet
      const qualsSheetCreator = new QualsSheetCreator(this.auth);
      await qualsSheetCreator.create(spreadsheet.spreadsheetId, tournament, config);

      // 6. Create match tracking sheets
      const matchSheetCreator = new MatchSheetCreator(this.auth);

      if (isMultiBracket) {
        await matchSheetCreator.createMultiBracketMatchSheets(
          spreadsheet.spreadsheetId,
          tournament,
          config
        );
      } else {
        await matchSheetCreator.createSingleBracketMatchSheet(
          spreadsheet.spreadsheetId,
          tournament,
          config
        );
      }

      // 7. Handle rendering based on tournament type
      if (isMultiBracket) {
        await this.renderMultiSheetTournament(spreadsheet, tournament, config);
      } else {
        // Generate bracket layout for single bracket
        const layout = new BracketLayout(tournament);
        console.log('✅ Bracket layout calculated');

        // Render bracket to spreadsheet
        const renderer = new BracketRenderer(this.auth);
        const colorScheme = config.getColorSchemeByCategory('gold');
        await renderer.renderBracketOnSheet(
          spreadsheet.spreadsheetId,
          layout,
          0,
          colorScheme,
          config,
          'gold'
        );
      }

      console.log('✅ Bracket generation complete!');

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

  /**
   * Render multiple brackets to separate sheets in the same spreadsheet
   * @param {Object} spreadsheet - The multi-bracket spreadsheet info
   * @param {MultiBracketTournament} multiBracketTournament - The multi-bracket tournament
   * @param {BracketConfig} config - The bracket configuration
   */
  async renderMultiSheetTournament(spreadsheet, multiBracketTournament, config) {
    const renderer = new BracketRenderer(this.auth);
    const bracketTypes = multiBracketTournament.getBracketTypes();

    console.log(`📐 Rendering ${bracketTypes.length} brackets to separate sheets...`);

    for (const bracketType of bracketTypes) {
      console.log(`🎨 Rendering ${bracketType} bracket...`);

      const tournament = multiBracketTournament.getBracket(bracketType);
      const layout = new BracketLayout(tournament);
      const sheetInfo = spreadsheet.sheets[bracketType];

      // Render this bracket to its dedicated sheet
      // Get the color scheme from bracket configuration
      const colorScheme = config.getColorSchemeByCategory(bracketType);
      await renderer.renderBracketOnSheet(
        spreadsheet.spreadsheetId,
        layout,
        sheetInfo.sheetId,
        colorScheme,
        config,
        bracketType
      );
    }
  }

  /**
   * Calculate the height (number of rows) needed for a bracket
   * @param {BracketLayout} layout - The bracket layout
   * @returns {number} Number of rows needed
   */
  calculateBracketHeight(layout) {
    const bounds = layout.calculateGridBounds();
    return Math.min(bounds.bgEndRow + 2, 50); // Cap at 50 rows to avoid grid limits
  }

  /**
   * Calculate the width (number of columns) needed for a bracket
   * @param {BracketLayout} layout - The bracket layout
   * @returns {number} Number of columns needed
   */
  calculateBracketWidth(layout) {
    const bounds = layout.calculateGridBounds();
    return bounds.bgEndCol + 2; // Add some padding
  }
}

/**
 * Legacy function wrapper for backward compatibility
 * @param {Object} auth - Google OAuth2 client
 * @param {string} configPath - Path to configuration file
 * @returns {Promise<void>}
 */
async function buildBracket(auth, configPath) {
  const command = new BuildBracketCommand(auth);
  const result = await command.execute(configPath);

  if (!result.success) {
    throw new Error(result.error);
  }
}

export default { BuildBracketCommand, buildBracket };
