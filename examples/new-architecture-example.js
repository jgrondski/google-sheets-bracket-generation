// ==================== examples/new-architecture-example.js ====================

/**
 * Example showing how to use the new modular architecture
 * Run this after setting up Google OAuth credentials
 */

const { BuildBracketCommand } = require('../src/commands/build-bracket-command');
const { BracketFactory } = require('../src/factories/bracket-factory');
const { BracketConfig } = require('../src/config/bracket-config');
const { BracketValidator } = require('../src/core/bracket-validator');

async function exampleUsage() {
  console.log('🎯 Example: New Modular Architecture Usage\n');

  try {
    // Example 1: Using BracketFactory to create tournaments
    console.log('1️⃣ Creating tournament from player list:');
    const players = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const tournament = BracketFactory.fromPlayerList(players, {
      sheetName: 'Example Tournament',
      bracketName: 'Championship Bracket'
    });
    console.log('   Tournament:', tournament.getSummary());
    console.log();

    // Example 2: Loading and validating configuration
    console.log('2️⃣ Loading configuration from file:');
    const config = BracketConfig.fromFile('./src/data/playerlist.json');
    console.log('   Config summary:', config.getSummary());
    
    const errors = config.validate();
    const warnings = BracketValidator.getValidationWarnings(config);
    console.log('   Validation errors:', errors.length);
    console.log('   Validation warnings:', warnings.length);
    if (warnings.length > 0) {
      console.log('   Warnings:', warnings);
    }
    console.log();

    // Example 3: Manual tournament creation with validation
    console.log('3️⃣ Manual tournament creation:');
    const manualTournament = BracketFactory.fromConfigData({
      options: {
        sheetName: 'Custom Tournament',
        gold: {
          bracketSize: '8',
          bracketType: 'standard',
          bracketName: 'Custom Bracket'
        }
      },
      players: [
        { name: 'Player 1' },
        { name: 'Player 2' },
        { name: 'Player 3' },
        { name: 'Player 4' }
      ]
    });
    
    const tournamentErrors = manualTournament.validate();
    console.log('   Tournament validation:', tournamentErrors.length === 0 ? 'PASSED' : 'FAILED');
    if (tournamentErrors.length > 0) {
      console.log('   Errors:', tournamentErrors);
    }
    console.log('   Tournament details:', manualTournament.getSummary());
    console.log();

    // Example 4: Using the BuildBracketCommand (would require auth)
    console.log('4️⃣ Build bracket command usage:');
    console.log('   // const command = new BuildBracketCommand(auth);');
    console.log('   // const result = await command.execute("./config.json");');
    console.log('   // if (result.success) {');
    console.log('   //   console.log("Bracket created:", result.spreadsheet.url);');
    console.log('   // }');
    console.log();

    console.log('✅ All examples completed successfully!');

  } catch (error) {
    console.error('❌ Example failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  exampleUsage();
}

module.exports = { exampleUsage };
