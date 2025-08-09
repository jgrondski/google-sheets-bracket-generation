# Tournament Bracket Generator for Google Sheets

Automatically generate tournament brackets in Google Sheets with player seeding, multiple bracket support, and custom styling.

## Quick Start Guide

### Prerequisites

- **[Node.js](https://nodejs.org/)** (version 16+) - [Full setup details](#prerequisites)
- **Google account** with Drive/Sheets access
- **Text editor** for editing JSON files

### Setup (5 minutes)

1. **Clone and install**

   ```bash
   git clone https://github.com/jgrondski/google-sheets-bracket-generation.git
   cd google-sheets-bracket-generation
   npm install
   ```

2. **Get Google API credentials** - [Detailed Google setup guide](#google-api-setup)

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google Sheets API + Google Drive API
   - Create OAuth credentials → Download → Rename to `oauth-credentials.json`

3. **Configure your tournament** - [Configuration examples](#tournament-configuration)

   **For a few players:** Edit `bracket-data.json` directly

   ```json
   // Edit bracket-data.json
   {
     "options": {
       "sheetName": "My Tournament",
       "gold": {
         "bracketSize": "8",
         "bracketType": "standard",
         "bracketName": "Main Bracket"
       }
     },
     "players": [
       { "name": "Player 1" },
       { "name": "Player 2" },
       { "name": "Player 3" },
       { "name": "Player 4" },
       { "name": "Player 5" },
       { "name": "Player 6" },
       { "name": "Player 7" },
       { "name": "Player 8" }
     ]
   }
   ```

   **For many players (64+):** Use the player converter utility

   ```bash
   node convert-players.js
   # Paste your list of names (one per line), press Enter twice when done
   ```

4. **Run it!**
   ```bash
   npm start
   ```
   Follow the OAuth prompts (first time only) - [Authentication help](#step-3-first-run-authentication)

**That's it!** Your tournament bracket will be created in Google Sheets.

**Need help?** Check [Troubleshooting](#troubleshooting) • [Advanced Configuration](#multiple-brackets-configuration) • [Color Customization](#color-customization)

---

## Detailed Documentation

## Prerequisites

Before getting started, make sure you have:

### Required Software

- **[Node.js](https://nodejs.org/)** (version 16 or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation:
    ```bash
    node --version
    npm --version
    ```
- **Git** (for cloning the repository)
  - Download from [git-scm.com](https://git-scm.com/)
  - Or use GitHub Desktop

### Recommended Tools

- **Text Editor** (choose one):
  - [Visual Studio Code](https://code.visualstudio.com/) (recommended - great JSON editing)
  - [Sublime Text](https://www.sublimetext.com/)
  - Any text editor that handles JSON well
- **Google Account** with access to Google Drive and Sheets

### System Requirements

- **Internet connection** (required for Google Sheets API)
- **Terminal/Command Prompt** access
- **Web browser** (for Google OAuth authentication)

## Google API Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Create a new project**:
   - Click the project dropdown at the top (next to "Google Cloud")
   - Click "NEW PROJECT"
   - Enter a project name (e.g., "Tournament Brackets")
   - Click "CREATE"
   - Wait for the project to be created and make sure it's selected

### Step 2: Enable Google APIs

1. In your Google Cloud project, go to **APIs & Services > Library**
2. Search for and enable these APIs (click each, then click "ENABLE"):
   - **Google Sheets API**
   - **Google Drive API**

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **+ CREATE CREDENTIALS > OAuth client ID**
3. Choose **Desktop application**
4. Download the JSON file
5. **Rename it to `oauth-credentials.json`** and place it in your project root

Your `oauth-credentials.json` should look like this:

```json
{
  "installed": {
    "client_id": "your-client-id.googleusercontent.com",
    "client_secret": "your-client-secret",
    "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
  }
}
```

### Step 4: First Run Authentication

The first time you run `npm start`, you'll be prompted to:

1. Visit a Google authorization URL
2. Grant permissions to access Google Sheets and Drive
3. **Important**: After granting permissions, you'll be redirected to a page that may not load properly or show an error
4. **Don't worry!** The authorization code you need is in the URL of that "broken" page
5. Copy the authorization code from the URL (it will be after `code=` in the address bar)
6. Paste it into your terminal where prompted

**Example**: If the redirect URL looks like:

```
https://localhost/?code=4/0AX4XfWjabc123def456ghi789&scope=https://www.googleapis.com/auth/spreadsheets
```

You would copy: `4/0AX4XfWjab123def456ghi789`

This creates a `token.json` file that stores your authentication - **keep this file secure and don't share it**.

### Optional: Environment Configuration (.env file)

You can create a `.env` file in your project root to customize file paths and specify where your brackets are saved in Google Drive:

```env
TARGET_FOLDER_ID=your_google_drive_folder_id_here
CREDENTIALS_PATH=./oauth-credentials.json
TOKEN_PATH=./token.json
```

**Environment Variables:**

- **`TARGET_FOLDER_ID`** (optional) - Google Drive folder ID where brackets will be saved
  - If not set, brackets are created in the root of your Google Drive
  - To find your folder ID: Go to Google Drive → Open the desired folder → Copy the ID from the URL
  - Example: `https://drive.google.com/drive/folders/1ABC123def456GHI789` → Use `1ABC123def456GHI789`

- **`CREDENTIALS_PATH`** (optional) - Path to your OAuth credentials file
  - Default: `./oauth-credentials.json` (project root)
  - Only change if you want to store credentials elsewhere

- **`TOKEN_PATH`** (optional) - Path to your authentication token file  
  - Default: `./token.json` (project root)
  - Only change if you want to store the token elsewhere

## Tournament Configuration

Edit `bracket-data.json` to configure your tournament:

### For Large Player Lists (64+ players)

Use the included converter utility to avoid manual JSON formatting:

```bash
node convert-players.js
```

Then paste your player list (one name per line) and press Enter twice:

```
John Smith
Jane Doe
Bob Wilson
Alice Johnson
[... paste all your players ...]

[press Enter twice when done]
```

This creates `bracket-data.json` automatically with all your players in the correct format.

### Example Files

- `bracket-data-example.json` - Simple 8-player single bracket
- `bracket-data-multi-example.json` - Multi-bracket with gold/silver + custom colors

### For Small Player Lists (Manual Editing)

### Minimal Configuration (Single Bracket)

```json
{
  "options": {
    "sheetName": "My Tournament 2025",
    "gold": {
      "bracketSize": "8",
      "bracketType": "standard",
      "bracketName": "Main Bracket"
    }
  },
  "players": [
    { "name": "Player 1" },
    { "name": "Player 2" },
    { "name": "Player 3" },
    { "name": "Player 4" },
    { "name": "Player 5" },
    { "name": "Player 6" },
    { "name": "Player 7" },
    { "name": "Player 8" }
  ]
}
```

### Multiple Brackets Configuration

```json
{
  "options": {
    "sheetName": "Championship Tournament 2025",
    "gold": {
      "bracketSize": "16",
      "bracketType": "standard",
      "bracketName": "Championship Bracket",
      "colorScheme": "#FFD700"
    },
    "silver": {
      "bracketSize": "16",
      "bracketType": "standard",
      "bracketName": "Consolation Bracket",
      "colorScheme": "#C0C0C0"
    }
  },
  "players": [
    { "name": "Top Player" },
    { "name": "Second Player" }
    // ... add as many players as needed
    // First 16 players → gold bracket
    // Next 16 players → silver bracket
  ]
}
```

### Configuration Options

| Option        | Description                       | Example                           |
| ------------- | --------------------------------- | --------------------------------- |
| `sheetName`   | Name of the Google Sheet          | `"My Tournament 2025"`            |
| `bracketSize` | Number of players in this bracket | `"16"`                            |
| `bracketType` | Tournament format                 | `"standard"`                      |
| `bracketName` | Display name for this bracket     | `"Championship"`                  |
| `colorScheme` | Color theme (optional)            | `"#FF5733"`, `"gold"`, `"silver"` |

**Player Allocation:**

- **Gold bracket** gets the first N players (where N = gold bracketSize)
- **Silver bracket** gets the next N players after gold
- Players are allocated in the order they appear in the `players` array

## Running the Application

### Generate Tournament

```bash
npm start
```

### Validate Configuration (without generating)

```bash
npm run validate-config
```

### Alternative Commands

```bash
node app.js
```

### Available Commands

- `npm start` - Generate brackets and create Google Sheet
- `npm run validate-config` - Check configuration for errors
- `node app.js` - Alternative way to run the generator
- `node convert-players.js` - Convert a list of player names to JSON format

## Color Customization

### Built-in Presets

- `"gold"` - Warm gold/yellow styling (default for gold brackets)
- `"silver"` - Cool gray/silver styling (default for silver brackets)

### Custom Colors

Use any hex color code:

```json
{
  "gold": {
    "colorScheme": "#FF6B35"
  }
}
```

### Color Features

- **Smart contrast** - Text colors automatically adjust for readability
- **Dynamic borders** - Border colors calculated from your chosen color
- **No defaults overridden** - Only brackets with `colorScheme` use custom colors

## Troubleshooting

### "Error: ENOENT: no such file or directory, open 'oauth-credentials.json'"

- Make sure you've downloaded your OAuth credentials from Google Cloud Console
- Rename the file to exactly `oauth-credentials.json`
- Place it in your project root directory

### "Error: invalid_grant" or authentication issues

- Delete `token.json` and run `npm start` again to re-authenticate
- Make sure your Google Cloud project has the correct APIs enabled

### "Configuration errors: No players configured"

- Check that your `bracket-data.json` has a `players` array with at least 2 players
- Make sure each player has a `name` property

### Brackets appear empty or wrong

- Verify `bracketSize` matches or is less than your player count
- For multiple brackets, ensure total bracket sizes don't exceed player count

## Files Overview

- `bracket-data.json` - Your tournament configuration and player list
- `oauth-credentials.json` - Google API credentials (you create this)
- `token.json` - Authentication token (created automatically)
- `app.js` - Main application entry point
