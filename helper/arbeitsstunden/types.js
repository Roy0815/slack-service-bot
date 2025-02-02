//* ******************* Types ********************//
/**
 * @typedef {object} hoursObj
 * @property {string} description
 * @property {number} hours
 * @property {string} date
 */

/**
 * @typedef {object} hoursObjMaintProps
 * @property {string} slackId
 */

/**
 * @typedef {hoursObj & hoursObjMaintProps} hoursObjMaint
 */

/**
 * @typedef {hoursObjMaint & approvedProperty} hoursMaintFinalizer
 */

/**
 * @typedef {object} user
 * @property {number} id
 * @property {string} firstname
 * @property {string} lastname
 * @property {string} leaveDate
 * @property {string} slackId
 */

/**
 * @typedef {object} registerObj
 * @property {number} id
 * @property {string} slackId
 * @property {string} [name]
 */

/**
 * @typedef {object} approvedProperty
 * @property {boolean} approved
 */

/**
 * @typedef {registerObj & approvedProperty} registerObjectFinalizer
 */

/**
 * @typedef {object} userContactCard
 * @property {string} firstname
 * @property {string} lastname
 * @property {string} email
 * @property {string} phone
 * @property {string} street
 * @property {string} houseNumber
 * @property {string} zip
 * @property {string} city
 * @property {string} [vCardContent]
 */

export {};
