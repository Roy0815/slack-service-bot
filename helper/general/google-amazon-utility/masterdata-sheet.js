import * as types from './types.js';
import * as sheet from './sheet.js';

/**
 * @readonly
 * @enum {string}
 */
export const sheetNames = {
  allgDaten: 'Allg Daten',
  stunden: 'Arbeitseinsätze',
  stundenSumme: 'Summe Stunden'
};

/**
 * @readonly
 * @enum {number}
 */
export const allgDatenColumns = {
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

//* ******************* Public functions ********************//
/**
 *
 * @param {string[]} userLine
 * @returns {types.user}
 */
export function moveUserLineToObject(userLine) {
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
export function moveUserLineToContactCard(userLine) {
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
 * Get a user line from sheet file by slack id
 * @param {object} ids
 * @param {number} [ids.id] ID of user (line)
 * @param {string} [ids.slackId] Slack ID of user
 * @returns {Promise<types.userContactCard|undefined>}
 */
export async function getUserContactCard({ id, slackId }) {
  if (!id && !slackId) return undefined;

  /** @type {string[][]} */
  const data = await sheet.getCells(sheetNames.allgDaten);
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
