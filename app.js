// ==================== index.js ====================
import dotenv from "dotenv";
dotenv.config();

import { readFile, promises } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";
import { google } from "googleapis";
import bracketBuilder from "./src/bracket-builder.js";

const { buildBracket } = bracketBuilder;

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];
const TOKEN_PATH = process.env.TOKEN_PATH || join(__dirname, "token.json");
const CREDENTIALS_PATH =
  process.env.CREDENTIALS_PATH || join(__dirname, "oauth-credentials.json");

readFile(CREDENTIALS_PATH, (err, content) => {
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
    const token = await promises.readFile(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    await callback(oAuth2Client);
  } catch (err) {
    // Only reauthorize if the error is due to missing/invalid token
    if (
      err.code === "ENOENT" ||
      (err.message && err.message.includes("invalid_grant"))
    ) {
      await getNewToken(oAuth2Client, callback);
    } else {
      console.error("❌ Error during authorization:", err);
    }
  }
}

async function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this URL:", authUrl);

  const code = await new Promise((resolve) => {
    const rl = createInterface({
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
  await promises.writeFile(TOKEN_PATH, JSON.stringify(tokens));
  console.log("✅ Token stored to", TOKEN_PATH);
  await callback(oAuth2Client);
}
