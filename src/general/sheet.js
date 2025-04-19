import { google } from 'googleapis/build/src/index.js';
// eslint-disable-next-line camelcase
import { sheets_v4 } from 'googleapis/build/src/apis/sheets/index.js';

//* ******************* Types ********************//
/**
 * @typedef {object} updateCellsObj
 * @property {string} range
 * @property {any[][]} [values]
 */

//* ******************* Private functions ********************//
/**
 * Authenticates with the Google Sheets API
 * @returns {Promise<sheets_v4.Sheets>}
 */
async function auth() {
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACC_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACC_PRIVATE_KEY
    }
  });

  return google.sheets({ version: 'v4', auth });
}

//* ******************* Public functions ********************//
/**
 * gets an array of all cells
 * @param {string} spreadsheetID
 * @param {string} sheetname
 * @returns {Promise<any[][]>}
 */
export async function getCells(spreadsheetID, sheetname) {
  const sheets = await auth();
  const request = {
    spreadsheetId: spreadsheetID,
    range: sheetname
  };

  return (await sheets.spreadsheets.values.get(request)).data.values;
}

/**
 * Update one or more cells
 * @param {string} spreadsheetID
 * @param {updateCellsObj} updateCellsObj
 */
export async function updateCell(spreadsheetID, { range, values }) {
  const sheets = await auth();

  // Value needs to be an array holding arrays with 1 value each
  const request = {
    spreadsheetId: spreadsheetID,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: { range, values }
  };

  await sheets.spreadsheets.values.update(request);
}

/**
 * Clear one or more cells
 * @param {string} spreadsheetID
 * @param {updateCellsObj} updateCellsObj
 */
export async function clearCell(spreadsheetID, { range }) {
  const sheets = await auth();

  const request = {
    spreadsheetId: spreadsheetID,
    range
  };

  await sheets.spreadsheets.values.clear(request);
}

/**
 * Append row
 * @param {string} spreadsheetID
 * @param {updateCellsObj} updateCellsObj
 */
export async function appendRow(spreadsheetID, { range, values }) {
  const sheets = await auth();

  // Value needs to be an array holding arrays with 1 value each
  const request = {
    spreadsheetId: spreadsheetID,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: { range, values, majorDimension: 'COLUMNS' }
  };

  await sheets.spreadsheets.values.append(request);
}

/**
 * gets the sheets in a spreadsheet
 * @param {string} spreadsheetID
 * @returns {Promise<sheets_v4.Schema$Sheet[]>}
 */
export async function getSheets(spreadsheetID) {
  const sheets = await auth();
  const request = {
    spreadsheetId: spreadsheetID
  };
  return (await sheets.spreadsheets.get(request)).data.sheets;
}

/**
 * creates a copy of a sheet
 * @param {string} spreadsheetID
 * @param {string} sheetName
 * @returns {Promise<string>} title of the new sheet
 */
export async function copySheet(spreadsheetID, sheetName) {
  const sheets = await auth();
  const sheetID = await getSheetID(sheetName);
  const request = {
    spreadsheetId: spreadsheetID,
    sheetId: sheetID,
    resource: {
      // The ID of the spreadsheet to copy the sheet to.
      destinationSpreadsheetId: spreadsheetID
    }
  };

  // return new name
  return (await sheets.spreadsheets.sheets.copyTo(request)).data.title;
}

/**
 * returns sheetID
 * @param {string} sheetName
 * @returns {Promise<number>}
 */
export async function getSheetID(sheetName) {
  const sheetArray = await getSheets(process.env.SPREADSHEET_ID_MASTERDATA);
  const sheet = sheetArray.find((s) => s.properties.title === sheetName);
  return sheet.properties.sheetId;
}

/**
 * renames a sheet
 * @param {string} spreadsheetID
 * @param {string} oldName
 * @param {string} newName
 */
export async function renameSheet(spreadsheetID, oldName, newName) {
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

  const spreadsheetId = spreadsheetID;
  const batchUpdateRequest = { requests };

  // @ts-ignore
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    resource: batchUpdateRequest
  });
}
