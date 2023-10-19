//* ******************* Functions ********************//
/**
 * Format time to 24 hour format UTC+2
 * @param {Date} date
 * @returns {string} formatted time
 */
export function formatTime(date) {
  return `${date.getUTCHours() + 2 < 10 ? '0' : ''}${date.getUTCHours() + 2}:${
    date.getMinutes() < 10 ? '0' : ''
  }${date.getMinutes()}`;
}

/**
 * Format time to DD.MM.YYYY format
 * @param {Date} date
 * @returns {string} formatted date
 */
export function formatDate(date) {
  return `${date.getDate() < 10 ? '0' : ''}${date.getDate()}.${
    date.getMonth() + 1 < 10 ? '0' : ''
  }${date.getMonth() + 1}.${date.getFullYear()}`;
}

/**
 * Convert number to column letters
 * @param {number} number
 * @returns {string} column letter(s)
 */
export function convertNumberToColumn(number) {
  let column = '';
  while (number >= 0) {
    column = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[(number % 26) - 1] + column;
    number = Math.floor(number / 26) - 1;
  }
  return column;
}

/**
 * Deep copy of an object
 * @template {{[key: string]: any}} T
 * @param {T} source
 * @returns {T} target
 */
export function deepCopy(source) {
  return JSON.parse(JSON.stringify(source));
}
