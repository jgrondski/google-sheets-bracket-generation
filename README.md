# google-sheets-bracket-generation
A simple tool that can generate brackets and push that bracket to a Google Sheet (initially with CTWC-styling)

## Installation

```bash
npm install
```

## Setup

1. Set up Google Sheets API credentials (see Google Sheets API documentation)
2. Place your credentials in `oauth-credentials.json`
3. Configure your player list in `src/data/playerlist.json`

## Usage

### Basic Usage (ES6 Modules)

```javascript
import bracketBuilder from './src/bracket-builder.js';
const { buildBracket } = bracketBuilder;

// Generate bracket with Google OAuth2 client
await buildBracket(auth);
```

### Advanced Usage with New Architecture

```javascript
import buildBracketCommandDefault from './src/commands/build-bracket-command.js';
const { BuildBracketCommand } = buildBracketCommandDefault;

async function generateBracket(auth) {
  const command = new BuildBracketCommand(auth);
  const result = await command.execute('./src/data/playerlist.json');
  
  if (result.success) {
    console.log('Bracket created:', result.spreadsheet.url);
    console.log('Tournament summary:', result.tournament);
  } else {
    console.error('Error:', result.error);
  }
}
```

### Configuration Validation

```javascript
import { BracketConfig } from './src/config/bracket-config.js';

const config = BracketConfig.fromFile('./src/data/playerlist.json');
const errors = config.validate();

if (errors.length === 0) {
  console.log('Configuration is valid');
  console.log('Config summary:', config.getSummary());
} else {
  console.error('Configuration errors:', errors);
}
```

## Scripts

- `npm start` - Run the bracket generation
- `npm run example` - Run the architecture example
- `npm run validate-config` - Validate the configuration file

## Architecture

This project uses a modular ES6 architecture with clear separation of concerns. See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed information about the project structure and design patterns.
