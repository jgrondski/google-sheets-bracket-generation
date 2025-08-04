# Connectors Module

This module provides utilities and a builder for generating bracket connector borders in Google Sheets.

## Files

- `connectorUtils.js`: Utility functions for cell conversion and border formatting.
- `ConnectorBuilder.js`: Main builder for generating connector border requests for bracket rounds.

## Usage

Import `buildConnectors` in your bracket builder and call it after rendering player groups:

```js
const { buildConnectors } = require("./connectors/ConnectorBuilder");
const connectorRequests = buildConnectors(rounds, getPosition);
requests.push(...connectorRequests);
```

## Testing

Unit tests can be added for connector cell calculation and border formatting.
