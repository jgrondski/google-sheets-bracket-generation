// ==================== src/commands/build-bracket-command.js ====================

import { BracketConfig } from "../config/bracket-config.js";
import { Tournament } from "../core/tournament.js";
import { MultiBracketTournament } from "../core/multi-bracket-tournament.js";
import _default from "../core/bracket-layout.js";
const { BracketLayout } = _default;
import { SpreadsheetCreator } from "../services/spreadsheet-creator.js";
import { BracketRenderer } from "../services/bracket-renderer.js";
import __default from "./command-validator.js";
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
  async execute(configPath = "./src/data/playerlist.json") {
    try {
      console.log("🏆 Starting bracket generation...");

      // Validate inputs
      const validationResults = {
        auth: CommandValidator.validateAuth(this.auth),
        configFile: CommandValidator.validateFilePath(configPath),
      };

      const report = CommandValidator.createValidationReport(validationResults);
      if (!report.valid) {
        throw new Error(`Validation failed: ${report.errors.join(", ")}`);
      }

      // 1. Load and validate configuration
      const config = BracketConfig.fromFile(configPath);
      const configErrors = config.validate();
      if (configErrors.length > 0) {
        throw new Error(`Configuration errors: ${configErrors.join(", ")}`);
      }

      console.log("✅ Configuration loaded and validated");
      console.log("📊 Config summary:", config.getSummary());

      // 2. Determine if we have multiple brackets
      const bracketTypes = config.getAvailableBracketTypes();
      const isMultiBracket = bracketTypes.length > 1;

      console.log(
        `🏆 Tournament type: ${
          isMultiBracket ? "Multi-bracket" : "Single bracket"
        }`
      );
      console.log(`📋 Brackets: ${bracketTypes.join(", ")}`);

      // 3. Create appropriate tournament model
      let tournament;
      if (isMultiBracket) {
        tournament = new MultiBracketTournament(config);
      } else {
        tournament = new Tournament(config);
      }

      const tournamentErrors = tournament.validate();
      if (tournamentErrors.length > 0) {
        throw new Error(`Tournament errors: ${tournamentErrors.join(", ")}`);
      }

      console.log("✅ Tournament created");
      console.log("🎯 Tournament summary:", tournament.getSummary());

      // 4. Create spreadsheet
      const targetFolderId = process.env.TARGET_FOLDER_ID || null;
      const creator = new SpreadsheetCreator(this.auth, targetFolderId);
      let spreadsheet;

      if (isMultiBracket) {
        spreadsheet = await creator.createMultiBracketSpreadsheet(config);
      } else {
        spreadsheet = await creator.createTournamentSpreadsheet(config);
      }

      // 5. Handle rendering based on tournament type
      if (isMultiBracket) {
        await this.renderMultiSheetTournament(spreadsheet, tournament);
      } else {
        // 5a. Generate bracket layout for single bracket
        const layout = new BracketLayout(tournament);
        console.log("✅ Bracket layout calculated");

        // 5b. Render bracket to spreadsheet
        const renderer = new BracketRenderer(this.auth);
        await renderer.renderBracket(spreadsheet.spreadsheetId, layout);
      }

      console.log("✅ Bracket layout applied successfully");

      return {
        success: true,
        spreadsheet,
        tournament: tournament.getSummary(),
        message: "Bracket generated successfully",
      };
    } catch (error) {
      console.error("❌ Error building bracket:", error.message);
      return {
        success: false,
        error: error.message,
        message: "Failed to generate bracket",
      };
    }
  }

  /**
   * Render multiple brackets to separate sheets in the same spreadsheet
   * @param {Object} spreadsheet - The multi-bracket spreadsheet info
   * @param {MultiBracketTournament} multiBracketTournament - The multi-bracket tournament
   */
  async renderMultiSheetTournament(spreadsheet, multiBracketTournament) {
    const renderer = new BracketRenderer(this.auth);
    const bracketTypes = multiBracketTournament.getBracketTypes();

    console.log(
      `📐 Rendering ${bracketTypes.length} brackets to separate sheets...`
    );

    for (const bracketType of bracketTypes) {
      console.log(`🎨 Rendering ${bracketType} bracket...`);

      const tournament = multiBracketTournament.getBracket(bracketType);
      const layout = new BracketLayout(tournament);
      const sheetInfo = spreadsheet.sheets[bracketType];

      // Render this bracket to its dedicated sheet
      // Use bracketType (gold/silver) as the color scheme
      await renderer.renderBracketOnSheet(
        spreadsheet.spreadsheetId,
        layout,
        sheetInfo.sheetId,
        bracketType // bracketType here is the bracket identifier (gold/silver), used as colorScheme
      );

      console.log(
        `✅ ${bracketType} bracket rendered to sheet: ${sheetInfo.sheetName}`
      );
    }

    console.log("✅ All brackets rendered to separate sheets successfully");
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
 * @returns {Promise<void>}
 */
async function buildBracket(auth) {
  const command = new BuildBracketCommand(auth);
  const result = await command.execute();

  if (!result.success) {
    throw new Error(result.error);
  }
}

export default { BuildBracketCommand, buildBracket };
