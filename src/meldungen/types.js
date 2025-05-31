//* ******************* Types ********************//
/**
 * @typedef {object} dropdownOptionPlainText Object representing the content of one
 * dropdown option
 * @property {string} text visible text on the dropdown option
 * @property {string} value literal value property of the option
 */

/**
 * @typedef {string} WeightClass
 */

/**
 * @typedef {string} HandlerNeeded
 */

/**
 * @typedef {object} competitionData all the data of one competition
 * @property {string} competition_id
 * @property {string} competition_name
 * @property {string} competition_date
 * @property {string} competition_location
 */

/**
 * @typedef {object} competitionRegistrationData all the data of one athlete's
 * registration for a competition
 * @property {string} slackID
 * @property {string} first_name
 * @property {string} last_name
 * @property {number} birthyear
 * @property {string} competition_id
 * @property {WeightClass} weight_class
 * @property {HandlerNeeded} handler_needed
 * @property {string} payment_record_file_permalink
 */

export {};
