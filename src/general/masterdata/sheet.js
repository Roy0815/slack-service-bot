import * as types from './types.js';
import * as sheet from '../sheet.js';
import * as util from '../util.js';

/**
 * @readonly
 * @type {string}
 */
export const allgDatenSheetName = 'Allg Daten';

/**
 * @readonly
 * @type {string}
 */
export const bankDatenSheetName = 'SEPA Daten';

/**
 * @readonly
 * @enum {number}
 */
const allgDatenColumns = {
  id: 1,
  firstname: 2,
  lastname: 3,
  joinedDate: 4,
  leaveDate: 5,
  membershipType: 6,
  birthday: 7,
  sex: 9,
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
const bankDatenColumns = {
  IBAN: 4,
  BIC: 5,
  recurringAmount: 6,
  mandateReference: 8,
  signingDate: 9,
  accountOwner: 10,
  initialAmount: 11
};

//* ******************* Private functions ********************//
/**
 * TODO: refactor to dynamic keys
 * @param {string[]} userLine
 * @returns {types.user}
 */
function moveUserLineToObject(userLine) {
  return {
    id: Number(userLine[allgDatenColumns.id - 1]),
    firstname: userLine[allgDatenColumns.firstname - 1],
    lastname: userLine[allgDatenColumns.lastname - 1],
    joinedDate: userLine[allgDatenColumns.joinedDate - 1],
    leaveDate: userLine[allgDatenColumns.leaveDate - 1],
    birthday: userLine[allgDatenColumns.birthday - 1],
    sex: userLine[allgDatenColumns.sex - 1],
    email: userLine[allgDatenColumns.email - 1],
    phone: userLine[allgDatenColumns.phone - 1],
    slackId: userLine[allgDatenColumns.slackId - 1],
    street: userLine[allgDatenColumns.street - 1],
    houseNumber: userLine[allgDatenColumns.houseNumber - 1],
    zip: userLine[allgDatenColumns.zip - 1],
    city: userLine[allgDatenColumns.city - 1]
  };
}

/**
 * TODO: refactor to dynamic keys
 * @param {string[]} userLine
 * @returns {types.userContactCard}
 */
function moveUserLineToContactCard(userLine) {
  if (typeof userLine === 'undefined'){
    return undefined;
  }
  return {
    id: Number(userLine[allgDatenColumns.id - 1]),
    firstname: userLine[allgDatenColumns.firstname - 1],
    lastname: userLine[allgDatenColumns.lastname - 1],
    joinedDate: userLine[allgDatenColumns.joinedDate - 1],
    leaveDate: userLine[allgDatenColumns.leaveDate - 1],
    birthday: userLine[allgDatenColumns.birthday - 1],
    sex: userLine[allgDatenColumns.sex - 1],
    email: userLine[allgDatenColumns.email - 1],
    phone: userLine[allgDatenColumns.phone - 1],
    slackId: userLine[allgDatenColumns.slackId - 1],
    street: userLine[allgDatenColumns.street - 1],
    houseNumber: userLine[allgDatenColumns.houseNumber - 1],
    zip: userLine[allgDatenColumns.zip - 1],
    city: userLine[allgDatenColumns.city - 1]
  };
}

//* ******************* Public section ********************//
/**
 * Get a user line from sheet file by slack id
 * @param {types.ids} ids
 * @returns {Promise<types.user|undefined>}
 */
async function getUserFromId({ id, slackId }) {
  if (!id && !slackId) return undefined;

  const data = await sheet.getCells(
    process.env.SPREADSHEET_ID_MASTERDATA,
    allgDatenSheetName
  );
  if (!data) return undefined;

  // search by ID
  if (id && data.length > id) {
    return moveUserLineToObject(data[id]);
  }

  // search by slack ID
  if (!slackId) return undefined;

  const user = data.find(
    (element) => element[allgDatenColumns.slackId - 1] === slackId
  );
  if (!user) return undefined;

  return moveUserLineToObject(user);
}

/**
 * Get a user line from sheet file by slack id
 * @param {string} email
 * @returns {Promise<types.user|undefined>}
 */
async function getUserFromEmail(email) {
  if (!email || email === '') return undefined;

  const data = await sheet.getCells(
    process.env.SPREADSHEET_ID_MASTERDATA,
    allgDatenSheetName
  );
  if (!data) return undefined;

  // search by email
  const user = data.find(
    (element) => element[allgDatenColumns.email - 1] === email
  );
  if (!user) return undefined;

  return moveUserLineToObject(user);
}

/**
 * Get a user line from sheet file by slack id
 * @param {types.ids} ids
 * @returns {Promise<types.userContactCard|undefined>}
 */
async function getUserContactCardFromId({ id, slackId }) {
  if (!id && !slackId) return undefined;

  /** @type {string[][]} */
  const data = await sheet.getCells(
    process.env.SPREADSHEET_ID_MASTERDATA,
    allgDatenSheetName
  );
  if (!data) return undefined;

  // get by line or slack ID
  let user;
  try {
    user = id
      ? data[id]
      : data.filter(
          (line) => line[allgDatenColumns.slackId - 1] === slackId
        )[0];
  } catch (e) {
    return undefined;
  }

  return moveUserLineToContactCard(user);
}

/**
 * get text for changes
 * @param {types.approvalObject} maintObj
 */
async function saveMasterdataChanges(maintObj) {
  // get id
  const user = await getUserFromId({ slackId: maintObj.slackId });

  // if phone starts with +, modify so that sheets does not interprets it as formula
  if (maintObj.phone && maintObj.phone !== '' && /^\+\d+$/.test(maintObj.phone))
    maintObj.phone = `'${maintObj.phone}`;

  // get updated fields
  const updatedFields = Object.keys(maintObj).filter(
    (key) => key !== 'slackId' || maintObj[key] || maintObj[key] !== ''
  );

  // update fields
  // run all calls in parallel and wait until all finished
  await Promise.all(
    updatedFields.map(async (key) => {
      await sheet.updateCell(process.env.SPREADSHEET_ID_MASTERDATA, {
        range: `'${allgDatenSheetName}'!${util.convertNumberToColumn(
          allgDatenColumns[key]
        )}${user.id + 1}`,
        values: [[maintObj[key]]]
      });
    })
  );
}

/**
 * check if user is registered
 * @param {types.ids} ids
 * @returns {Promise<boolean>}
 */
async function isUserRegistered(ids) {
  const user = await getUserFromId(ids);

  return !!user;
}

/**
 * Get all active users from sheet
 * @returns {Promise<types.user[]>}
 */
async function getAllActiveUsers() {
  const array = await sheet.getCells(
    process.env.SPREADSHEET_ID_MASTERDATA,
    allgDatenSheetName
  );
  if (!array) return [];

  // remove header line
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

    if (
      util.convertStringToDate(userObject.leaveDate) > today ||
      userObject.leaveDate === util.formatDate(today)
    ) {
      activeUsers.push(userObject);
    }
  }

  return activeUsers;
}

/**
 * save slack id to google sheet
 * @param {number} id Row number in the sheet (0-based index)
 * @param {string} slackId
 */
async function saveSlackId(id, slackId) {
  await sheet.updateCell(process.env.SPREADSHEET_ID_MASTERDATA, {
    range: `'${allgDatenSheetName}'!${util.convertNumberToColumn(
      allgDatenColumns.slackId
    )}${id + 1}`, // google sheet functions count rows starting from 1
    values: [[slackId]]
  });
}

/**
 * save leave date to google sheet
 * @param {types.ids} ids
 * @param {string} leaveDate
 */
async function saveLeaveDate(ids, leaveDate) {
  // check any id is set
  if (!ids.id && !ids.slackId) return;

  // get id from slack id
  if (!ids.id) {
    const user = await getUserFromId({ slackId: ids.slackId });
    if (!user) return;
    ids.id = user.id;
  }

  await sheet.updateCell(process.env.SPREADSHEET_ID_MASTERDATA, {
    range: `'${allgDatenSheetName}'!${util.convertNumberToColumn(
      allgDatenColumns.leaveDate
    )}${ids.id + 1}`, // google sheet functions count rows starting from 1
    values: [[leaveDate]]
  });
}

/**
 * save new member to sheet
 * @param {types.userJoiningDetails} userJoiningDetails
 * @returns {Promise<types.userJoiningReturn>} mandateReference
 */
async function saveNewMember(userJoiningDetails) {
  // cleanup data
  // clear account owner if it is the same as the name
  userJoiningDetails.accountOwner =
    userJoiningDetails.accountOwner !==
    `${userJoiningDetails.firstname} ${userJoiningDetails.lastname}`
      ? userJoiningDetails.accountOwner
      : '';

  // escape + and spaces in phone numbers
  userJoiningDetails.phone = userJoiningDetails.phone
    .replace(/\s+/g, '')
    .replace(/^(\+)/, "'$1");

  // get last row
  const ids = await sheet.getCells(
    process.env.SPREADSHEET_ID_MASTERDATA,
    `${allgDatenSheetName}!${util.convertNumberToColumn(allgDatenColumns.id)}:${util.convertNumberToColumn(allgDatenColumns.id)}`
  );

  const newIdx =
    ids.filter((line) => line.length > 0 && line[0] !== '').length + 1;

  // update each field individually to not overwrite other data
  /** @type {Promise<void>[]} */
  const promises = [];

  Object.keys(userJoiningDetails).forEach((key) => {
    // not in general or bank infos
    if (!allgDatenColumns[key] && !bankDatenColumns[key]) return;

    // get correct sheet and column
    const sheetName = allgDatenColumns[key]
      ? allgDatenSheetName
      : bankDatenSheetName;

    const column = util.convertNumberToColumn(
      allgDatenColumns[key] || bankDatenColumns[key]
    );

    promises.push(
      sheet.updateCell(process.env.SPREADSHEET_ID_MASTERDATA, {
        range: `'${sheetName}'!${column}${newIdx}`,
        values: [[userJoiningDetails[key]]]
      })
    );
  });

  // Wait for all updates to finish in parallel
  await Promise.all(promises);

  // get return fields
  const fields = (
    await sheet.getCells(
      process.env.SPREADSHEET_ID_MASTERDATA,
      `${bankDatenSheetName}!A${newIdx}:${util.convertNumberToColumn(bankDatenColumns.initialAmount)}${newIdx}`
    )
  )[0];

  return {
    mandateReference: fields[bankDatenColumns.mandateReference - 1],
    recurringAmount: fields[bankDatenColumns.recurringAmount - 1],
    initialAmount: fields[bankDatenColumns.initialAmount - 1]
  };
}

/**
 * object with all masterdata functions
 * @type {types.userService}
 */
export const googleSheetMasterdataService = {
  getUserFromId,
  getUserFromEmail,
  getUserContactCardFromId,
  saveMasterdataChanges,
  isUserRegistered,
  getAllActiveUsers,
  saveSlackId,
  saveLeaveDate,
  saveNewMember
};
