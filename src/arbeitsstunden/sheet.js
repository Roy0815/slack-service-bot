import * as types from './types.js';
import * as util from '../general/util.js';
import * as sheet from '../general/sheet.js';
import { masterdataService } from '../general/masterdata/service.js';
import * as masterdataTypes from '../general/masterdata/types.js';

/**
 * @readonly
 * @enum {string}
 */
const sheetNames = {
  stunden: 'Arbeitseinsätze',
  stundenSumme: 'Summe Stunden'
};

/**
 * @readonly
 * @enum {number}
 */
const stundenColumns = {
  date: 1,
  name: 2,
  description: 3,
  hours: 4,
  /** @type {string} */
  lastColumn: 'D'
};

/**
 * @readonly
 * @enum {number}
 */
const stundenSummeColumns = {
  workedHours: 3,
  targetHours: 4,
  year: 9,
  adminChannel: 15
};

/**
 * Copies previous year sheet to a new sheet for requested year
 * @param {string} nameBase
 * @param {number} year
 */
async function copySheetToNewYear(nameBase, year) {
  let currYear;
  if (year) {
    currYear = year;
  } else {
    currYear = new Date().getFullYear();
  }

  // get previous year to the one requested
  const oldYear = currYear - 1;

  // recursive call to check if it exists, if not it will be created
  await checkYearSheetsExists(oldYear);

  const copiedName = await sheet.copySheet(process.env.SPREADSHEET_ID_MASTERDATA, `${nameBase} ${oldYear}`);
  const newName = `${nameBase} ${currYear}`;

  await sheet.renameSheet(process.env.SPREADSHEET_ID_MASTERDATA, copiedName, newName);

  if (nameBase === sheetNames.stundenSumme) {
    // update year field in sheet
    await sheet.updateCell(process.env.SPREADSHEET_ID_MASTERDATA, {
      range: `'${newName}'!${util.convertNumberToColumn(
        stundenSummeColumns.year
      )}1`,
      values: [[currYear]]
    });
    return;
  }

  if (nameBase === sheetNames.stunden) {
    // clear all hours
    await sheet.clearCell(process.env.SPREADSHEET_ID_MASTERDATA, {
      range: `'${newName}'!$A2:${stundenColumns.lastColumn}`
    });
  }
}

/**
 * Checks if year sheets exists for requested year
 * @param {number} year
 */
async function checkYearSheetsExists(year) {
  try {
    await sheet.getSheetID(process.env.SPREADSHEET_ID_MASTERDATA, getSheetNameYear(sheetNames.stunden, year));
  } catch (err) {
    await copySheetToNewYear(sheetNames.stunden, year);
  }
  try {
    await sheet.getSheetID(process.env.SPREADSHEET_ID_MASTERDATA, getSheetNameYear(sheetNames.stundenSumme, year));
  } catch (err) {
    await copySheetToNewYear(sheetNames.stundenSumme, year);
  }
}

/**
 * Get sheet name for requested year
 * @param {string} name
 * @param {number} [year]
 * @returns {string}
 */
function getSheetNameYear(name, year) {
  if (year) return `${name} ${year}`;
  return `${name} ${new Date().getFullYear()}`;
}

/**
 * Get lines of worked hours for a specific year and user
 * @param {object} getDetailsObj
 * @param {string} getDetailsObj.fullname user fullname
 * @param {number} getDetailsObj.year year to get
 * @returns {Promise<types.hoursObj[]>}
 */
async function getDetails({ fullname, year }) {
  const dataDetails = await sheet.getCells(process.env.SPREADSHEET_ID_MASTERDATA,

    getSheetNameYear(sheetNames.stunden, year)
  );

  if (!dataDetails) return [];

  /**
   * @type {types.hoursObj[]}
   */
  const returnObj = [];

  dataDetails
    .filter((row) => row[stundenColumns.name - 1] === fullname)
    .forEach((element) =>
      returnObj.push({
        description: element[stundenColumns.description - 1],
        hours: element[stundenColumns.hours - 1],
        date: element[stundenColumns.date - 1]
      })
    );

  return returnObj;
}

//* ******************* Public functions ********************//
/**
 * Get worked hours for a specific year. Optionally get details.
 * @param {object} getHours
 * @param {string} getHours.id user id to get
 * @param {number} [getHours.year] year to get
 * @param {boolean} [getHours.details] get lines of working hours
 *
 * @returns {Promise<types.workedHours|undefined>}
 */
export async function getHoursFromSlackId({ id, year, details }) {
  const user = await masterdataService.getUserFromId({ slackId: id });
  if (user === undefined) return undefined;

  if (year === undefined) year = new Date().getFullYear();

  await checkYearSheetsExists(year);

  const dataSum = await sheet.getCells(process.env.SPREADSHEET_ID_MASTERDATA,
    getSheetNameYear(sheetNames.stundenSumme, year)
  );

  if (!dataSum) return undefined;

  /** @type {types.workedHours} */
  const returnObj = {
    workedHours: dataSum[user.id][stundenSummeColumns.workedHours - 1],
    targetHours: dataSum[user.id][stundenSummeColumns.targetHours - 1].includes(
      '-'
    )
      ? 0
      : dataSum[user.id][stundenSummeColumns.targetHours - 1],
    details: []
  };

  if (details) {
    returnObj.details = await getDetails({
      fullname: `${user.firstname} ${user.lastname}`,
      year
    });
  }

  return returnObj;
}

/**
 * Get all active users from sheet
 * @returns {Promise<masterdataTypes.user[]>}
 */
export async function getAllUsers() {
  return await masterdataService.getAllActiveUsers();
}

/**
 * Get admin channel from sheet
 * @returns {Promise<string>}
 */
export async function getAdminChannel() {
  await checkYearSheetsExists(new Date().getFullYear());
  const sumData = await sheet.getCells(process.env.SPREADSHEET_ID_MASTERDATA,
    getSheetNameYear(sheetNames.stundenSumme)
  );

  if (!sumData) return '';

  return sumData[0][stundenSummeColumns.adminChannel - 1];
}

/**
 * Saves the slack id to the column of the user in the sheet
 * @param {types.registerObj} registerObj
 */
export async function saveSlackId({ id, slackId }) {
  masterdataService.saveSlackId(id, slackId);
}

/**
 *
 * @param {types.hoursObjMaint} hoursObjMaint
 */
export async function saveHours({ slackId, description, hours, date }) {
  const user = await masterdataService.getUserFromId({ slackId });
  await checkYearSheetsExists(Number(date.split('-')[0]));

  await sheet.appendRow(process.env.SPREADSHEET_ID_MASTERDATA, {
    range: `'${getSheetNameYear(
      sheetNames.stunden,
      Number(date.split('-')[0])
    )}'!A:D`,
    values: [
      [date],
      [`${user?.firstname} ${user?.lastname}`],
      [description],
      [hours]
    ]
  });
}

/**
 *
 * @param {object} id
 * @param {string} id.slackId
 * @returns {Promise<string|undefined>}
 */
export async function getNameFromSlackId({ slackId }) {
  const user = await masterdataService.getUserFromId({ slackId });
  if (user === undefined) return undefined;

  return `${user.firstname} ${user.lastname}`;
}

/**
 * build a contact card file from id
 * @param {number} id
 * @returns {Promise<masterdataTypes.userContactCard|undefined>}
 */
export async function getContactCardFromId(id) {
  const contactCard = await masterdataService.getUserContactCardFromId({ id });
  if (contactCard === undefined) return undefined;

  // build vcard
  // ADR;TYPE=postal:;;${contactCard.street} ${contactCard.houseNumber};${contactCard.city};;${contactCard.zip};
  // BDAY:${contactCard.birthday}
  contactCard.vCardContent = `BEGIN:VCARD
VERSION:3.0
N:${contactCard.lastname};${contactCard.firstname}
EMAIL:${contactCard.email}
TEL;TYPE=voice:${contactCard.phone}
END:VCARD`;

  return contactCard;
}
