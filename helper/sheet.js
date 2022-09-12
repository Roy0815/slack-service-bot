const { google } = require("googleapis");

const general = require("./general");

const sheetAllgDaten = "Allg Daten";
const idColumn = 1;
const firstNameColumn = 2;
const lastNameColumn = 3;
const leaveDateColumn = 5;
const slackIdColumn = 15;

const sheetStunden = "Arbeitseinsätze 2022";

const sheetStundenSumme = "Summe Stunden 2022";
const workedHoursColumn = 3;
const targetHoursColumn = 4;
const adminChannelColumn = 15;

//******************** Private functions ********************//
async function getUserFromSlackId(id) {
  let data = await getCells(sheetAllgDaten);
  return data.find((element) => element[slackIdColumn - 1] == id);
}

// gets an array of all cells
async function getCells(sheet) {
  const sheets = await auth();
  const request = {
    spreadsheetId: process.env.SHEET_ID,
    range: sheet,
  };

  return (await sheets.spreadsheets.values.get(request)).data.values;
}

async function updateCell({ range, value }) {
  const sheets = await auth();

  //Value needs to be an array holding arrays with 1 value each
  const request = {
    spreadsheetId: process.env.SHEET_ID,
    range: range,
    valueInputOption: "USER_ENTERED",
    resource: { range: range, values: value },
  };

  await sheets.spreadsheets.values.update(request);
}

async function appendRow({ range, values }) {
  const sheets = await auth();

  //Value needs to be an array holding arrays with 1 value each
  const request = {
    spreadsheetId: process.env.SHEET_ID,
    range: range,
    valueInputOption: "USER_ENTERED",
    resource: { range: range, values: values, majorDimension: "COLUMNS" },
  };

  await sheets.spreadsheets.values.append(request);
}

// gets the sheets in a spreadsheet
async function getSheets() {
  const sheets = await auth();
  const request = {
    spreadsheetId: process.env.SHEET_ID,
  };
  const response = (await sheets.spreadsheets.get(request)).data.sheets;
  return await response;
}

// creates a copy of a sheet
async function copySheet(sheetName) {
  const sheets = await auth();
  const sheetID = await getSheetID(sheetName);
  const request = {
    spreadsheetId: process.env.SHEET_ID,
    sheetId: sheetID,
    resource: {
      // The ID of the spreadsheet to copy the sheet to.
      destinationSpreadsheetId: process.env.SHEET_ID,
    },
  };
  await sheets.spreadsheets.sheets.copyTo(request);
}

// returns sheetID
async function getSheetID(sheetName) {
  const sheetArray = await getSheets();
  const sheet = await sheetArray.find((s) => s.properties.title == sheetName);
  return await sheet.properties.sheetId;
}

// renames a sheet
async function renameSheet(oldName, newName) {
  const sheets = await auth();
  const sheetID = await getSheetID(oldName);

  const requests = [];
  requests.push({
    updateSheetProperties: {
      properties: {
        sheetId: sheetID,
        title: newName,
      },
      fields: "title",
    },
  });

  const spreadsheetId = process.env.SHEET_ID;
  const batchUpdateRequest = { requests };

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    resource: batchUpdateRequest,
  });
}

async function auth() {
  const auth = await google.auth.getClient({
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

//******************** Public functions ********************//
async function getHoursFromSlackId(id) {
  let user = await getUserFromSlackId(id);
  if (user == undefined) return undefined;

  let data = await getCells(sheetStundenSumme);
  let userHours = data[user[idColumn - 1]];

  return {
    workedHours: userHours[workedHoursColumn - 1],
    targetHours: userHours[targetHoursColumn - 1].includes("-")
      ? 0
      : userHours[targetHoursColumn - 1],
  };
}

async function getNameFromSlackId({ slackId }) {
  let user = await getUserFromSlackId(slackId);
  if (user == undefined) return undefined;

  return `${user[firstNameColumn - 1]} ${user[lastNameColumn - 1]}`;
}

async function getAllUsers() {
  let array = await getCells(sheetAllgDaten);
  array.shift();
  let activeUsers = [];
  let today = new Date();

  for (let user of array) {
    // if leave date empty: active
    if (user[leaveDateColumn - 1] == "") {
      activeUsers.push({
        id: user[idColumn - 1],
        name: `${user[firstNameColumn - 1]} ${user[lastNameColumn - 1]}`,
      });
      continue;
    }

    //get leave date
    let splitDate = user[leaveDateColumn - 1].split(".");
    let leaveDate = new Date(splitDate[2], splitDate[1] - 1, splitDate[0]);

    if (leaveDate > today)
      activeUsers.push({
        id: user[idColumn - 1],
        name: `${user[firstNameColumn - 1]} ${user[lastNameColumn - 1]}`,
      });
  }

  return activeUsers;
}

async function getAdminChannel() {
  return (await getCells(sheetStundenSumme))[0][adminChannelColumn - 1];
}

async function saveSlackId({ id, slackId }) {
  //find line with user
  let data = await getCells(sheetAllgDaten);
  let index = data.findIndex((element) => element[idColumn - 1] == id) + 1;

  updateCell({
    range: `'${sheetAllgDaten}'!${general.convertNumberToColumn(
      slackIdColumn
    )}${index}`,
    value: [[slackId]],
  });
}

async function saveHours({ slackId, title, hours, date }) {
  let user = await getUserFromSlackId(slackId);

  await appendRow({
    range: `'${sheetStunden}'!A:D`,
    values: [
      [date],
      [`${user[firstNameColumn - 1]} ${user[lastNameColumn - 1]}`],
      [title],
      [hours],
    ],
  });
}

//exports
module.exports = {
  getAllUsers,
  getAdminChannel,
  getHoursFromSlackId,
  getNameFromSlackId,
  saveSlackId,
  saveHours,
};
