// ==================== index.js ====================
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { google } = require("googleapis");
const { buildBracket } = require("./src/bracketBuilder");

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];
const TOKEN_PATH = process.env.TOKEN_PATH || path.join(__dirname, "token.json");
const CREDENTIALS_PATH =
  process.env.CREDENTIALS_PATH ||
  path.join(__dirname, "oauth-credentials.json");

fs.readFile(CREDENTIALS_PATH, (err, content) => {
  if (err) return console.error("❌ Error loading client secret file:", err);
  authorize(JSON.parse(content), buildBracket);
});

async function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  try {
    const token = await fs.promises.readFile(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    await callback(oAuth2Client);
  } catch {
    await getNewToken(oAuth2Client, callback);
  }
}

async function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this URL:", authUrl);

  const code = await new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question("Enter the code from that page here: ", (answer) => {
      rl.close();
      resolve(answer);
    });
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  await fs.promises.writeFile(TOKEN_PATH, JSON.stringify(tokens));
  console.log("✅ Token stored to", TOKEN_PATH);
  await callback(oAuth2Client);
}
