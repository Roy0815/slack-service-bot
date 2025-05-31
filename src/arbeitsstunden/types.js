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
 * @typedef {object} workedHours
 * @property {number} workedHours hours that were actually worked
 * @property {number} targetHours target hours to fulfill
 * @property {hoursObj[]} details lines of working hours
 */

export {};
