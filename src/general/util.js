//* ******************* Functions ********************//
/**
 * Format time to 24 hour format UTC+2
 * @param {Date} date
 * @returns {string} formatted time
 */
export function formatTime(date) {
  // only way to adjust time zone natively in JavaScript
  const dateString = date.toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin'
  });

  return dateString.split(', ')[1].slice(0, 5); // HH:mm
}

/**
 * Format time to DD.MM.YYYY format
 * @param {Date} date
 * @returns {string} formatted date
 */
export function formatDate(date) {
  // only way to adjust time zone natively in JavaScript
  const dateArray = date
    .toLocaleString('de-DE', {
      timeZone: 'Europe/Berlin'
    })
    .split(', ')[0]
    .split('.');

  return `${dateArray[0].length === 1 ? '0' : ''}${dateArray[0]}.${
    dateArray[1].length === 1 ? '0' : ''
  }${dateArray[1]}.${dateArray[2]}`; // DD.MM.YYYY
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

/**
 * Check if bot is member in channel
 * @param {string} channelName
 * @param {import('@slack/web-api').WebClient} client
 * @returns {Promise<import('@slack/web-api/dist/types/response/ConversationsListResponse').Channel|null>} channel
 */
export async function getChannelInfo(channelName, client) {
  const channels = (
    await client.conversations.list({
      exclude_archived: true,
      limit: 999,
      types: 'public_channel,private_channel,mpim'
    })
  ).channels.filter((channel) => channel.id === channelName);

  return channels.length > 0 ? channels[0] : null;
}

/**
 * Bot joins channel
 * @param {string} channelName
 * @param {import('@slack/web-api').WebClient} client
 * @returns {Promise<boolean>} success
 */
export async function joinChannel(channelName, client) {
  return (await client.conversations.join({ channel: channelName })).ok;
}

/**
 * convert string date to Date object
 * @param {string} dateString
 * @returns {Date} date
 */
export function convertStringToDate(dateString) {
  const [year, month, day] = dateString.split('.');
  return new Date(Number(year), Number(month) - 1, Number(day));
}
