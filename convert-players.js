#!/usr/bin/env node

/**
 * Simple utility to convert a list of player names to bracket-data.json format
 * Usage: node convert-players.js
 */

import { writeFileSync } from 'fs';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('🏆 Player List Converter');
console.log('');
console.log('Paste your player names (one per line) and press Enter twice when done:');
console.log('Example:');
console.log('  John Smith');
console.log('  Jane Doe');
console.log('  Bob Wilson');
console.log('');

let playerNames = [];
let emptyLineCount = 0;

rl.on('line', (line) => {
  const trimmed = line.trim();

  if (trimmed === '') {
    emptyLineCount++;
    if (emptyLineCount >= 2) {
      rl.close();
    }
  } else {
    emptyLineCount = 0;
    playerNames.push(trimmed);
  }
});

rl.on('close', () => {
  if (playerNames.length === 0) {
    console.log('❌ No players entered. Exiting.');
    process.exit(1);
  }

  console.log(`\n✅ Found ${playerNames.length} players`);

  // Convert to the required format
  const players = playerNames.map((name) => ({ name }));

  // Create basic bracket configuration
  const bracketData = {
    options: {
      sheetName: 'My Tournament 2025',
      gold: {
        bracketSize: playerNames.length.toString(),
        bracketType: 'standard',
        bracketName: 'Main Bracket',
        bestOf: '5',
      },
    },
    players,
  };

  // Write to file
  const filename = 'bracket-data.json';
  const jsonString = JSON.stringify(bracketData, null, 2)
    // Format players array with one player per line
    .replace(/{\s*"name":\s*"([^"]+)"\s*}/g, '{ "name": "$1" }');

  writeFileSync(filename, jsonString);

  console.log(`\n🎉 Created ${filename} with ${playerNames.length} players!`);
  console.log('\nNext steps:');
  console.log('1. Edit bracket-data.json to adjust tournament settings');
  console.log('2. Run: npm start');
});
