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
 * @property {string} leaveDate
 * @property {string} slackId
 * @property {string} birthday
 * @property {string} email
 * @property {string} phone
 * @property {string} street
 * @property {string} houseNumber
 * @property {string} zip
 * @property {string} city
 */

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

/** Interface */

/**
 * get User object from id
 * @callback getUserFromId
 * @param {ids} ids
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
 * Interface to be implemented by the active userservice
 * @typedef {object} userService
 * @property {getUserFromId} getUserFromId
 * @property {getUserContactCardFromId} getUserContactCardFromId
 * @property {saveMasterdataChanges} saveMasterdataChanges
 * @property {isUserRegistered} isUserRegistered
 * @property {getAllActiveUsers} getAllActiveUsers
 * @property {saveSlackId} saveSlackId
 */

export {};
