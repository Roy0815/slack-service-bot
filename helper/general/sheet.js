const { google } = require('googleapis');

//* ******************* Private functions ********************//
async function auth () {
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  return google.sheets({ version: 'v4', auth });
}

//* ******************* Public functions ********************//
// gets an array of all cells
async function getCells (sheet) {
  const sheets = await auth();
  const request = {
    spreadsheetId: process.env.SHEET_ID,
    range: sheet
  };

  return (await sheets.spreadsheets.values.get(request)).data.values;
}

async function updateCell ({ range, value }) {
  const sheets = await auth();

  // Value needs to be an array holding arrays with 1 value each
  const request = {
    spreadsheetId: process.env.SHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: { range, values: value }
  };

  await sheets.spreadsheets.values.update(request);
}

async function clearCell ({ range }) {
  const sheets = await auth();

  const request = {
    spreadsheetId: process.env.SHEET_ID,
    range
  };

  await sheets.spreadsheets.values.clear(request);
}

async function appendRow ({ range, values }) {
  const sheets = await auth();

  // Value needs to be an array holding arrays with 1 value each
  const request = {
    spreadsheetId: process.env.SHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: { range, values, majorDimension: 'COLUMNS' }
  };

  await sheets.spreadsheets.values.append(request);
}

// gets the sheets in a spreadsheet
async function getSheets () {
  const sheets = await auth();
  const request = {
    spreadsheetId: process.env.SHEET_ID
  };
  const response = (await sheets.spreadsheets.get(request)).data.sheets;
  return response;
}

// creates a copy of a sheet
async function copySheet (sheetName) {
  const sheets = await auth();
  const sheetID = await getSheetID(sheetName);
  const request = {
    spreadsheetId: process.env.SHEET_ID,
    sheetId: sheetID,
    resource: {
      // The ID of the spreadsheet to copy the sheet to.
      destinationSpreadsheetId: process.env.SHEET_ID
    }
  };

  // return new name
  return (await sheets.spreadsheets.sheets.copyTo(request)).data.title;
}

// returns sheetID
async function getSheetID (sheetName) {
  const sheetArray = await getSheets();
  const sheet = await sheetArray.find((s) => s.properties.title == sheetName);
  return sheet.properties.sheetId;
}

// renames a sheet
async function renameSheet (oldName, newName) {
  const sheets = await auth();
  const sheetID = await getSheetID(oldName);

  const requests = [];
  requests.push({
    updateSheetProperties: {
      properties: {
        sheetId: sheetID,
        title: newName
      },
      fields: 'title'
    }
  });

  const spreadsheetId = process.env.SHEET_ID;
  const batchUpdateRequest = { requests };

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    resource: batchUpdateRequest
  });
}

//* ******************* Exports ********************//
module.exports = {
  getCells,
  updateCell,
  clearCell,
  appendRow,
  getSheets,
  copySheet,
  getSheetID,
  renameSheet
};
