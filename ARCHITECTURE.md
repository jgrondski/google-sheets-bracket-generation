# Architecture Refactor

This directory contains the refactored, modular architecture for the bracket generation system using ES6 modules.

## Module System

This project uses **ES6 modules** (`import`/`export`) instead of CommonJS (`require`/`module.exports`). Key benefits:
- **Static analysis**: Better IDE support and tree-shaking
- **Explicit imports**: Clear dependency relationships
- **Modern standard**: Aligns with current JavaScript best practices
- **Future-proof**: Native browser and Node.js support

## Directory Structure

```
src/
├── commands/           # Command layer - orchestrates the application flow
│   ├── build-bracket-command.js
│   └── command-validator.js
├── config/            # Configuration management
│   ├── bracket-config.js
│   └── tournament-config.js
├── core/              # Core business logic (independent of external systems)
│   ├── tournament.js
│   ├── bracket-layout.js
│   └── bracket-validator.js
├── factories/         # Object creation and request building
│   ├── bracket-factory.js
│   └── request-builder.js
├── services/          # External system integrations (Google Sheets)
│   ├── google-sheets-service.js
│   ├── spreadsheet-creator.js
│   └── bracket-renderer.js
├── utils/             # Pure utility functions
│   ├── math-utils.js
│   └── array-utils.js
├── models/            # Data models (existing)
├── styles/            # Dynamic styling system
│   ├── styles.js           # Main styles interface
│   ├── dynamic-styles.js   # Dynamic color generation
│   └── color-utils.js      # Color manipulation utilities
├── connectors/        # Connector logic (existing)
├── data/             # Configuration data (existing)
└── bracket-builder.js # Legacy compatibility wrapper
```

## Key Principles

### Separation of Concerns
- **Core**: Business logic independent of external systems
- **Services**: Handle external system integrations (Google Sheets API)
- **Commands**: Orchestrate the application flow
- **Config**: Handle configuration parsing and validation

### Dynamic Color System

The styling system has been refactored to support dynamic color generation from any hex color input:

#### Architecture Overview
- **`color-utils.js`**: Core color manipulation utilities (hex-to-RGB, luminance, contrast)
- **`dynamic-styles.js`**: Generates complete style sets from any color input
- **`styles.js`**: Simplified interface that maintains backward compatibility

#### Key Features
- **Dynamic Generation**: Replaces ~200 lines of hardcoded color variants with ~50 lines of dynamic logic
- **Custom Colors**: Users can specify any hex color (`#FF5733`) without code changes
- **Preset Support**: Maintains built-in presets (`"gold"`, `"silver"`) for backward compatibility
- **Smart Contrast**: Automatically calculates readable text colors based on background luminance
- **Border Generation**: Creates harmonious border colors based on the primary color

#### Color Flow
```
User Config → resolveColorScheme() → generateCellFormats() → Google Sheets API
     ↓              ↓                      ↓
"#FF5733"  →  RGB values  →  Complete style object  →  Rendered bracket
```

#### Backward Compatibility
- Existing configurations without `colorScheme` use bracket type as default color
- All existing APIs remain unchanged
- Gold/silver presets preserved for legacy support
- **Utils**: Pure, reusable utility functions

### Testability
- Core logic can be tested without Google Sheets API
- Services can be mocked for testing
- Each layer has minimal dependencies

### Maintainability
- Single responsibility for each module
- Clear dependencies between layers
- Easy to locate and modify specific functionality

## Usage Examples

### New Modular Approach
```javascript
import buildBracketCommandDefault from './src/commands/build-bracket-command.js';
const { BuildBracketCommand } = buildBracketCommandDefault;

async function generateBracket(auth) {
  const command = new BuildBracketCommand(auth);
  const result = await command.execute('./src/data/playerlist.json');
  
  if (result.success) {
    console.log('Bracket created:', result.spreadsheet.url);
  } else {
    console.error('Error:', result.error);
  }
}
```

### Legacy Compatibility
```javascript
import bracketBuilder from './src/bracket-builder.js';
const { buildBracket } = bracketBuilder;

// This still works exactly as before
await buildBracket(auth);
```

### Using Individual Components
```javascript
import { BracketConfig } from './src/config/bracket-config.js';
import { Tournament } from './src/core/tournament.js';
import bracketValidatorDefault from './src/core/bracket-validator.js';
const { BracketValidator } = bracketValidatorDefault;

// Load and validate configuration
const config = BracketConfig.fromFile('./config.json');
const errors = BracketValidator.validateTournamentConfig(config);

if (errors.length === 0) {
  const tournament = new Tournament(config);
  console.log(tournament.getSummary());
}
```

## Migration Strategy

1. **Backward Compatibility**: Existing code continues to work through `bracket-builder.js`
2. **Gradual Migration**: New features use the modular architecture
3. **Testing**: Add tests for core components first
4. **Documentation**: Update docs to show new patterns

## Benefits

1. **Easier Testing**: Core logic can be unit tested without external dependencies
2. **Better Maintainability**: Clear separation makes changes safer and easier
3. **Extensibility**: Easy to add new bracket types or output formats
4. **Debugging**: Easier to isolate issues to specific layers
5. **Reusability**: Core bracket logic could work with other output systems
6. **Modern ES6 Modules**: 
   - Static imports enable better IDE support and error detection
   - Tree-shaking capabilities for optimized builds
   - Explicit dependency management
   - Native browser and Node.js support

## Next Steps

1. Add comprehensive unit tests for core components
2. Add integration tests for services
3. Create additional bracket types or formats
4. Add more sophisticated validation rules
5. Consider adding a CLI interface using the command pattern
