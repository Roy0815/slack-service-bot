/**
 * @typedef {object} user
 * @property {number} id
 * @property {string} firstname
 * @property {string} lastname
 * @property {string} leaveDate
 * @property {string} slackId
 */

/**
 * @typedef {object} userDetails
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
 * @typedef {object} slackId
 * @property {string} slackId
 */

/**
 * @typedef {userDetails & slackId} approvalObject
 */

/**
 * @typedef vCardContent
 * @property {string} [vCardContent]
 */

/**
 * @typedef {userDetails & vCardContent} userContactCard
 */

export {};
