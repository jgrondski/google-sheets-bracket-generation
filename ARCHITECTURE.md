# Architecture Refactor

This directory contains the refactored, modular architecture for the bracket generation system.

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
├── styles/            # Styling definitions (existing)
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
const { BuildBracketCommand } = require('./src/commands/build-bracket-command');

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
const { buildBracket } = require('./src/bracket-builder');

// This still works exactly as before
await buildBracket(auth);
```

### Using Individual Components
```javascript
const { BracketConfig } = require('./src/config/bracket-config');
const { Tournament } = require('./src/core/tournament');
const { BracketValidator } = require('./src/core/bracket-validator');

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

## Next Steps

1. Add comprehensive unit tests for core components
2. Add integration tests for services
3. Create additional bracket types or formats
4. Add more sophisticated validation rules
5. Consider adding a CLI interface using the command pattern
