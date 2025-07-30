// createGoldBracket.js
const { google } = require("googleapis");

const TARGET_FOLDER_ID = "1een5NAkLEfU-DeZo-8SeSNNqooqlqiBD";
const BRACKET_TITLE = "Gold Bracket";

const rounds = [
  [
    { seed: 1, name: "ALEX THACH", score: 1 },
    { seed: 16, name: "DENGLER", score: 3 },
    { seed: 8, name: "PIXELANDY", score: 3 },
    { seed: 9, name: "SAMVAUGHAN", score: 1 },
    { seed: 5, name: "FRACTAL", score: 1 },
    { seed: 12, name: "SCUTI", score: 3 },
    { seed: 4, name: "COBRA", score: 3 },
    { seed: 13, name: "DMJ", score: 0 },
    { seed: 2, name: "MEME", score: 3 },
    { seed: 15, name: "GWAFEY", score: 2 },
    { seed: 6, name: "DOG", score: 3 },
    { seed: 11, name: "TRISTOP", score: 0 },
    { seed: 7, name: "MYLES", score: 3 },
    { seed: 10, name: "SODIUM", score: 2 },
    { seed: 3, name: "IBALL", score: 1 },
    { seed: 14, name: "HUFF", score: 3 },
  ],
  [
    { seed: 16, name: "DENGLER", score: 2 },
    { seed: 8, name: "PIXELANDY", score: 3 },
    { seed: 12, name: "SCUTI", score: 0 },
    { seed: 4, name: "COBRA", score: 3 },
    { seed: 2, name: "MEME", score: 3 },
    { seed: 6, name: "DOG", score: 1 },
    { seed: 7, name: "MYLES", score: 1 },
    { seed: 14, name: "HUFF", score: 2 },
  ],
  [
    { seed: 8, name: "PIXELANDY", score: 3 },
    { seed: 4, name: "COBRA", score: 2 },
    { seed: 2, name: "MEME", score: 3 },
    { seed: 14, name: "HUFF", score: 2 },
  ],
  [
    { seed: 8, name: "PIXELANDY", score: 3 },
    { seed: 2, name: "MEME", score: 2 },
  ],
];

const champion = { seed: 2, name: "MEME" };

async function createGoldBracket(auth) {
  const drive = google.drive({ version: "v3", auth });
  const sheets = google.sheets({ version: "v4", auth });

  const file = await drive.files.create({
    resource: {
      name: BRACKET_TITLE,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [TARGET_FOLDER_ID],
    },
    fields: "id",
  });

  const spreadsheetId = file.data.id;
  console.log(
    `✅ Spreadsheet created: https://docs.google.com/spreadsheets/d/${spreadsheetId}`
  );

  const {
    generateBracketRequests,
  } = require("./utils/generateBracketRequests");
  const requests = generateBracketRequests(rounds, champion);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests },
  });

  console.log("✅ Full Gold Bracket layout and styling applied.");
}

module.exports = { createGoldBracket };
