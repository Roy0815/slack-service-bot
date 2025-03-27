//* ******************* Functions ********************//
/**
 * Format time to 24 hour format UTC+2
 * @param {Date} date
 * @returns {string} formatted time
 */
export function formatTime(date) {
  return `${date.getHours() < 10 ? '0' : ''}${date.getHours()}:${
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
