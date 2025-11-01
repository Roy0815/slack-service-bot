/**
 * @typedef {object} ids
 * @property {number} [id] ID of user
 * @property {string} [slackId] Slack ID of user
 */

/**
 * @typedef {object} user
 * @property {number} id
 * @property {string} firstname
 * @property {string} lastname
 * @property {string} joinedDate
 * @property {string} leaveDate
 * @property {string} slackId
 * @property {string} birthday
 * @property {userSex} sex
 * @property {string} email
 * @property {string} phone
 * @property {string} street
 * @property {string} houseNumber
 * @property {string} zip
 * @property {string} city
 */

/**
 * @readonly
 * @enum {string}
 */
export const userSex = {
  male: 'm',
  female: 'w'
};

/**
 * @typedef {object} userMaintenanceDetails
 * @property {string} [firstname]
 * @property {string} [lastname]
 * @property {string} [email]
 * @property {string} [phone]
 * @property {string} [street]
 * @property {string} [houseNumber]
 * @property {string} [zip]
 * @property {string} [city]
 */

/**
 * @typedef {userMaintenanceDetails & {slackId: string}} approvalObject
 */

/**
 * @typedef vCardContent
 * @property {string} [vCardContent]
 */

/**
 * @typedef {user & vCardContent} userContactCard
 */

/**
 * @typedef {object} userJoiningDetails
 * @property {string} [joinedDate]
 * @property {string} [firstname]
 * @property {string} [lastname]
 * @property {string} [email]
 * @property {string} [phone]
 * @property {string} [birthday]
 * @property {string} [street]
 * @property {string} [houseNumber]
 * @property {string} [zip]
 * @property {string} [city]
 * @property {userSex} [sex]
 * @property {('aktiv'|'ermäßigt'|'passiv')} [membershipType]
 * @property {string} [IBAN]
 * @property {string} [BIC]
 * @property {string} [accountOwner]
 * @property {string} [signingDate]
 * @property {string} [docusealFileURL]
 */

// #region userJoiningFields
/**
 * @readonly
 * @type {string[]}
 */
export const userJoiningFields = [
  'joinedDate',
  'firstname',
  'lastname',
  'email',
  'phone',
  'birthday',
  'street',
  'houseNumber',
  'zip',
  'city',
  'sex',
  'membershipType',
  'IBAN',
  'BIC',
  'accountOwner',
  'signingDate'
];
// #endregion userJoiningFields

/**
 * @typedef {object} userJoiningReturn
 * @property {string} mandateReference
 * @property {string} recurringAmount
 * @property {string} initialAmount
 */

/** Interface */

/**
 * get User object from id
 * @callback getUserFromId
 * @param {ids} ids
 * @returns {Promise<user|undefined>}
 */

/**
 * get User object from email
 * @callback getUserFromEmail
 * @param {string} email
 * @returns {Promise<user|undefined>}
 */

/**
 * get contact card object from id
 * @callback getUserContactCardFromId
 * @param {ids} ids
 * @returns {Promise<userContactCard|undefined>}
 */

/**
 * save changes to the masterdata
 * @callback saveMasterdataChanges
 * @param {approvalObject} maintObj
 */

/**
 * check if user is registered
 * @callback isUserRegistered
 * @param {ids} ids
 * @returns {Promise<boolean>}
 */

/**
 * Get all active users from sheet
 * @callback getAllActiveUsers
 * @returns {Promise<user[]>}
 */

/**
 * save slack id of user to database
 * @callback saveSlackId
 * @param {number} id
 * @param {string} slackId
 */

/**
 * save leave date of user to database
 * @callback saveLeaveDate
 * @param {ids} ids
 * @param {string} leaveDate
 */

/**
 * save new member to sheet
 * @callback saveNewMember
 * @param {userJoiningDetails} userJoiningDetails
 * @returns {Promise<userJoiningReturn>}
 */

/**
 * Interface to be implemented by the active userservice
 * @typedef {object} userService
 * @property {getUserFromId} getUserFromId
 * @property {getUserFromEmail} getUserFromEmail
 * @property {getUserContactCardFromId} getUserContactCardFromId
 * @property {saveMasterdataChanges} saveMasterdataChanges
 * @property {isUserRegistered} isUserRegistered
 * @property {getAllActiveUsers} getAllActiveUsers
 * @property {saveSlackId} saveSlackId
 * @property {saveLeaveDate} saveLeaveDate
 * @property {saveNewMember} saveNewMember
 */

export {};
