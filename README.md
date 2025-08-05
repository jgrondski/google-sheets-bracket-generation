# google-sheets-bracket-generation
A simple tool that can generate brackets and push that bracket to a Google Sheet (initially with CTWC-styling)

## Installation

```bash
npm install
```

## Setup

1. Set up Google Sheets API credentials (see Google Sheets API documentation)
2. Place your credentials in `oauth-credentials.json`
3. Configure your tournament in `src/data/playerlist.json` (this file contains both player list and bracket configuration, including color schemes)

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

## Color Scheme Configuration

The bracket generator supports flexible color customization through the `colorScheme` property in your bracket configuration file (`src/data/playerlist.json`).

**Note**: The color scheme is configured in the same file where you define your player list (`src/data/playerlist.json`).

### Default Behavior

If no `colorScheme` is specified in `src/data/playerlist.json`, the system uses built-in presets based on the bracket type:
- **Gold bracket**: Uses gold color scheme (warm gold/yellow tones)
- **Silver bracket**: Uses silver color scheme (cool gray/silver tones)

### Custom Colors

You can specify any hex color for custom bracket styling by adding a `colorScheme` property to each bracket section in `src/data/playerlist.json`:

```json
{
  "options": {
    "gold": {
      "bracketSize": "16",
      "bracketType": "standard",
      "bracketName": "Gold Bracket",
      "colorScheme": "#1E90FF"
    },
    "silver": {
      "bracketSize": "23",
      "bracketType": "standard", 
      "bracketName": "Silver Bracket",
      "colorScheme": "#FF5733"
    }
  }
}
```

### Color Scheme Options

| Option | Description | Example |
|--------|-------------|---------|
| `"gold"` | Built-in gold preset (default for gold brackets) | Warm gold/yellow styling |
| `"silver"` | Built-in silver preset (default for silver brackets) | Cool gray/silver styling |
| `"#RRGGBB"` | Custom hex color | `"#FF5733"` (orange), `"#1E90FF"` (blue) |

### Color Features

- **Dynamic Generation**: Colors are automatically calculated to ensure proper contrast and readability
- **Smart Borders**: Border colors are dynamically generated based on your chosen color
- **Backwards Compatible**: Existing configurations without `colorScheme` continue to work with default presets
- **No Code Changes**: Add new colors without modifying any source code

### Example Configuration

Here's how your `src/data/playerlist.json` file should look with custom colors:

```json
{
  "options": {
    "sheetName": "My Tournament 2025",
    "gold": {
      "bracketSize": "16",
      "bracketType": "standard",
      "bracketName": "Championship Bracket",
      "colorScheme": "#FF6B35"
    },
    "silver": {
      "bracketSize": "32", 
      "bracketType": "standard",
      "bracketName": "Consolation Bracket"
    }
  },
  "players": [...]
}
```

In this example:
- Championship bracket uses custom orange color (`#FF6B35`)
- Consolation bracket uses default silver preset (no `colorScheme` specified)

**To customize colors**: Edit your `src/data/playerlist.json` file and add the `colorScheme` property to any bracket section (gold, silver, etc.) where you want custom colors.

### More Examples

See `examples/custom-colors-example.json` for a complete configuration showing custom color usage.

## Scripts

- `npm start` - Run the bracket generation
- `npm run example` - Run the architecture example
- `npm run validate-config` - Validate the configuration file

## Architecture

This project uses a modular ES6 architecture with clear separation of concerns. See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed information about the project structure and design patterns.
