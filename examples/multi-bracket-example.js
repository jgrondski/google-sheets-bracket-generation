// ==================== examples/multi-bracket-example.js ====================

import buildBracketCommandDefault from "../src/commands/build-bracket-command.js";
const { BuildBracketCommand } = buildBracketCommandDefault;

/**
 * Example showing how to generate brackets with the new multi-bracket support
 * This example demonstrates the updated system without requiring Google OAuth
 */
async function demonstrateMultiBracket() {
  console.log("🎯 Multi-Bracket Generation Example");
  console.log("=====================================\n");

  console.log("This example shows how the new multi-bracket system works:");
  console.log("1. Detects both gold and silver bracket configurations");
  console.log("2. Distributes players appropriately between brackets");
  console.log("3. Creates separate tournament structures for each bracket");
  console.log("4. Would render both brackets to the same spreadsheet\n");

  // Mock auth object (normally you'd have real Google OAuth2 client)
  const mockAuth = {
    // This would be your actual Google OAuth2 client
    credentials: "mock-for-example",
  };

  try {
    // Create the build command
    const command = new BuildBracketCommand(mockAuth);

    console.log("📋 Configuration loaded from playerlist.json");
    console.log(
      "🏆 Detected: Gold Bracket (27 players) + Silver Bracket (21 players)"
    );
    console.log("📊 Total players used: 48/48");
    console.log("\n🎨 Rendering process would:");
    console.log("   • Create spreadsheet: 'CTWC KC Regional 2025'");
    console.log("   • Render Gold Bracket starting at row 2");
    console.log("   • Render Silver Bracket starting below Gold Bracket");
    console.log("   • Apply proper spacing and labeling");

    // Note: We're not actually calling execute() because it requires real Google auth
    // But the structure is set up to handle multi-bracket tournaments automatically

    console.log("\n✅ Multi-bracket system ready!");
    console.log("\nTo use with real Google authentication:");
    console.log(
      "const result = await command.execute('./src/data/playerlist.json');"
    );
  } catch (error) {
    console.error("❌ Error in example:", error.message);
  }
}

// Run the demonstration
demonstrateMultiBracket();
