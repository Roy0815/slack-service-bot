import * as util from '../general/util.js';
import * as sheet from '../general/sheet.js';
import * as types from './types.js';

/**
 * @readonly
 * @enum {string}
 */
const sheetNames = {
  allgDaten: 'Allg Daten',
  stunden: 'Arbeitseinsätze',
  stundenSumme: 'Summe Stunden'
};

/**
 * @readonly
 * @enum {number}
 */
const allgDatenColumns = {
  id: 1,
  firstName: 2,
  lastName: 3,
  leaveDate: 5,
  email: 10,
  street: 11,
  houseNumber: 12,
  zip: 13,
  city: 14,
  phone: 15,
  slackId: 16
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

//* ******************* Private functions ********************//
/**
 *
 * @param {string[]} userLine
 * @returns {types.user}
 */
function moveUserLineToObject(userLine) {
  return {
    id: Number(userLine[allgDatenColumns.id - 1]),
    firstname: userLine[allgDatenColumns.firstName - 1],
    lastname: userLine[allgDatenColumns.lastName - 1],
    leaveDate: userLine[allgDatenColumns.leaveDate - 1],
    slackId: userLine[allgDatenColumns.slackId - 1]
  };
}

/**
 *
 * @param {string[]} userLine
 * @returns {types.userContactCard}
 */
function moveUserLineToContactCard(userLine) {
  return {
    firstname: userLine[allgDatenColumns.firstName - 1],
    lastname: userLine[allgDatenColumns.lastName - 1],
    email: userLine[allgDatenColumns.email - 1],
    phone: userLine[allgDatenColumns.phone - 1],
    street: userLine[allgDatenColumns.street - 1],
    houseNumber: userLine[allgDatenColumns.houseNumber - 1],
    zip: userLine[allgDatenColumns.zip - 1],
    city: userLine[allgDatenColumns.city - 1]
  };
}

/**
 * Copies base sheet (2022) to a new sheet for requested year
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

  const copiedName = await sheet.copySheet(`${nameBase} ${oldYear}`);
  const newName = `${nameBase} ${currYear}`;

  await sheet.renameSheet(copiedName, newName);

  if (nameBase === sheetNames.stundenSumme) {
    // update year field in sheet
    await sheet.updateCell({
      range: `'${newName}'!${util.convertNumberToColumn(
        stundenSummeColumns.year
      )}1`,
      values: [[currYear]]
    });
    return;
  }

  if (nameBase === sheetNames.stunden) {
    // clear all hours
    await sheet.clearCell({
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
    await sheet.getSheetID(getSheetNameYear(sheetNames.stunden, year));
  } catch (err) {
    await copySheetToNewYear(sheetNames.stunden, year);
  }
  try {
    await sheet.getSheetID(getSheetNameYear(sheetNames.stundenSumme, year));
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
  const dataDetails = await sheet.getCells(
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
 * Get a user line from sheet file by slack id
 * @param {string} id
 * @returns {Promise<types.user|undefined>}
 */
export async function getUserFromSlackId(id) {
  const data = await sheet.getCells(sheetNames.allgDaten);
  if (!data) return undefined;

  const user = data.find(
    (element) => element[allgDatenColumns.slackId - 1] === id
  );
  if (!user) return undefined;

  return moveUserLineToObject(user);
}

/**
 * Get a user line from sheet file by slack id
 * @param {number} id ID of user (line)
 * @returns {Promise<types.userContactCard|undefined>}
 */
export async function getUserContactCard(id) {
  /** @type {string[][]} */
  const data = await sheet.getCells(sheetNames.allgDaten);
  if (!data) return undefined;

  if (data.length < id + 1) return undefined;

  const user = data[id];

  return moveUserLineToContactCard(user);
}

/**
 * Get worked hours for a specific year. Optionally get details.
 * @param {object} getHours
 * @param {string} getHours.id user id to get
 * @param {number} [getHours.year] year to get
 * @param {boolean} [getHours.details] get lines of working hours
 *
 * @typedef {object} workedHours
 * @property {number} workedHours hours that were actually worked
 * @property {number} targetHours target hours to fulfill
 * @property {types.hoursObj[]} details lines of working hours
 *
 * @returns {Promise<workedHours|undefined>}
 */
export async function getHoursFromSlackId({ id, year, details }) {
  const user = await getUserFromSlackId(id);
  if (user === undefined) return undefined;

  if (year === undefined) year = new Date().getFullYear();

  await checkYearSheetsExists(year);

  const dataSum = await sheet.getCells(
    getSheetNameYear(sheetNames.stundenSumme, year)
  );

  if (!dataSum) return undefined;

  /**
   * @type {workedHours}
   */
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
 * @returns {Promise<types.user[]>}
 */
export async function getAllUsers() {
  const array = await sheet.getCells(sheetNames.allgDaten);
  if (!array) return [];

  array.shift();

  /** @type {types.user[]} */
  const activeUsers = [];
  const today = new Date();

  for (const user of array) {
    const userObject = moveUserLineToObject(user);

    // firstname and lastname empty: skip
    if (userObject.firstname === '' && userObject.lastname === '') {
      continue;
    }

    // if leave date empty: active
    if (userObject.leaveDate === '') {
      activeUsers.push(userObject);
      continue;
    }

    // get leave date
    const [year, month, day] = userObject.leaveDate.split('.');
    const leaveDate = new Date(Number(year), Number(month) - 1, Number(day));

    if (leaveDate > today) {
      activeUsers.push(userObject);
    }
  }

  return activeUsers;
}

/**
 * Get admin channel from sheet
 * @returns {Promise<string>}
 */
export async function getAdminChannel() {
  await checkYearSheetsExists(new Date().getFullYear());
  const sumData = await sheet.getCells(
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
  // find line with user
  const data = await sheet.getCells(sheetNames.allgDaten);
  if (!data) return;

  const index =
    data.findIndex(
      (element) => element[allgDatenColumns.id - 1] === id.toString()
    ) + 1;

  sheet.updateCell({
    range: `'${sheetNames.allgDaten}'!${util.convertNumberToColumn(
      allgDatenColumns.slackId
    )}${index}`,
    values: [[slackId]]
  });
}

/**
 *
 * @param {types.hoursObjMaint} hoursObjMaint
 */
export async function saveHours({ slackId, description, hours, date }) {
  const user = await getUserFromSlackId(slackId);
  await checkYearSheetsExists(Number(date.split('-')[0]));

  await sheet.appendRow({
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
  const user = await getUserFromSlackId(slackId);
  if (user === undefined) return undefined;

  return `${user.firstname} ${user.lastname}`;
}

/**
 * build a contact card file from id
 * @param {number} id
 * @returns {Promise<types.userContactCard|undefined>}
 */
export async function getContactCardFromId(id) {
  const contactCard = await getUserContactCard(id);
  if (contactCard === undefined) return undefined;

  // build vcard
  // ADR;TYPE=postal:;;${contactCard.street} ${contactCard.houseNumber};${contactCard.city};;${contactCard.zip};
  contactCard.vCardContent = `BEGIN:VCARD
VERSION:3.0
N:${contactCard.lastname};${contactCard.firstname}
EMAIL:${contactCard.email}
TEL;TYPE=voice:${contactCard.phone}
END:VCARD`;

  return contactCard;
}
