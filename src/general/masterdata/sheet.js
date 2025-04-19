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
 * @enum {number}
 */
const allgDatenColumns = {
  id: 1,
  firstname: 2,
  lastname: 3,
  leaveDate: 5,
  birthday: 7,
  email: 10,
  street: 11,
  houseNumber: 12,
  zip: 13,
  city: 14,
  phone: 15,
  slackId: 16
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
    leaveDate: userLine[allgDatenColumns.leaveDate - 1],
    birthday: userLine[allgDatenColumns.birthday - 1],
    email: userLine[allgDatenColumns.email - 1],
    phone: userLine[allgDatenColumns.phone - 1],
    slackId: userLine[allgDatenColumns.slackId - 1]
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
    leaveDate: userLine[allgDatenColumns.leaveDate - 1],
    birthday: userLine[allgDatenColumns.birthday - 1],
    email: userLine[allgDatenColumns.email - 1],
    phone: userLine[allgDatenColumns.phone - 1],
    slackId: userLine[allgDatenColumns.slackId - 1]
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

  const data = await sheet.getCells(allgDatenSheetName);
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
 * @param {types.ids} ids
 * @returns {Promise<types.userContactCard|undefined>}
 */
async function getUserContactCardFromId({ id, slackId }) {
  if (!id && !slackId) return undefined;

  /** @type {string[][]} */
  const data = await sheet.getCells(allgDatenSheetName);
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
      await sheet.updateCell({
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
  const array = await sheet.getCells(allgDatenSheetName);
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

    if (util.convertStringToDate(userObject.leaveDate) > today) {
      activeUsers.push(userObject);
    }
  }

  return activeUsers;
}

/**
 * save slack id to google sheet
 * @param {number} id
 * @param {string} slackId
 */
async function saveSlackId(id, slackId) {
  await sheet.updateCell({
    range: `'${allgDatenSheetName}'!${util.convertNumberToColumn(
      allgDatenColumns.slackId
    )}${id}`,
    values: [[slackId]]
  });
}

/**
 * object with all masterdata functions
 * @type {types.userService}
 */
export const googleSheetMasterdataService = {
  getUserFromId,
  getUserContactCardFromId,
  saveMasterdataChanges,
  isUserRegistered,
  getAllActiveUsers,
  saveSlackId
};
