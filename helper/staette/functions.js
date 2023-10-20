//* ******************* Public Functions ********************//
/**
 * Cleanup old messages
 * @param {import('@slack/bolt').App} app
 * @returns {Promise<import('@slack/web-api/dist/response/ConversationsHistoryResponse').Message[]>}
 */
async function cleanup({ client }) {
  // get bot ID
  const botId = (
    await client.auth.test({
      token: process.env.SLACK_BOT_TOKEN
    })
  ).bot_id;

  // get messages in channel
  const result = await client.conversations.history({
    // The token you used to initialize your app
    token: process.env.SLACK_BOT_TOKEN,
    channel: process.env.STAETTE_CHANNEL
  });

  const filtered = result.messages.filter(
    (msg) =>
      msg.bot_id === botId && // messages from this user
      msg.blocks &&
      msg.blocks.length > 0 &&
      msg.blocks[0].text &&
      /^`[0-3]\d\.[0-1]\d\.20[2-9]\d`$/.test(msg.blocks[0].text.text) // messages with date
  );

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 1);

  /** @type {import('@slack/web-api/dist/response/ConversationsHistoryResponse').Message[]} */
  const returnObj = [];

  filtered.forEach((msg) => {
    // get date from message
    const text = msg.blocks[0].text.text.replace(/`/g, '');

    const [year, month, day] = text.split('.');
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    if (date < cutoffDate) {
      // ASYNC! delete message
      client.chat.delete({
        channel: process.env.STAETTE_CHANNEL,
        ts: msg.ts,
        token: process.env.SLACK_BOT_TOKEN
      });
      returnObj.push(msg);
    }
  });

  return returnObj;
}

/**
 * sort messages to keep chronological
 * @param {object} obj
 * @param {string} obj.date
 * @param {import('@slack/web-api').WebClient} obj.client
 */
async function sortMessages({ client, date }) {
  // get bot ID
  const botId = (
    await client.auth.test({
      token: process.env.SLACK_BOT_TOKEN
    })
  ).bot_id;

  // get messages in channel
  const result = await client.conversations.history({
    token: process.env.SLACK_BOT_TOKEN,
    channel: process.env.STAETTE_CHANNEL
  });

  const filtered = result.messages.filter(
    (msg) =>
      msg.bot_id === botId && // messages from this user
      msg.blocks &&
      msg.blocks.length > 0 &&
      msg.blocks[0].text &&
      /^`[0-3]\d\.[0-1]\d\.20[2-9]\d`$/.test(msg.blocks[0].text.text) && // messages with date
      msg.blocks[0].text.text !== `\`${date}\`` // not current date
  );

  // get messages with date later than current message
  const [year, month, day] = date.split('.');
  const currDate = new Date(Number(year), Number(month) - 1, Number(day));
  const messagesOrdered = [];

  filtered.forEach((msg) => {
    const text = msg.blocks[0].text.text.replace(/`/g, '');

    const [year, month, day] = text.split('.');
    const msgDate = new Date(Number(year), Number(month) - 1, Number(day));

    if (msgDate < currDate) return;

    messagesOrdered.splice(0, 0, msg);
  });

  messagesOrdered.forEach((msg) => {
    client.chat.delete({
      channel: process.env.STAETTE_CHANNEL,
      ts: msg.ts,
      token: process.env.SLACK_BOT_TOKEN
    });
  });

  for (let index = 0; index < messagesOrdered.length; index++) {
    const msg = {
      channel: process.env.STAETTE_CHANNEL,
      text: messagesOrdered[index].blocks[1].text.text,
      blocks: messagesOrdered[index].blocks
    };

    await client.chat.postMessage(msg);
  }
}

/**
 * Check if date is unique
 * @param {object} obj
 * @param {string} obj.date
 * @param {import('@slack/web-api').WebClient} obj.client
 * @returns {Promise<boolean>}
 */
async function dateIsUnique({ client, date }) {
  // get bot ID
  const botId = (
    await client.auth.test({
      token: process.env.SLACK_BOT_TOKEN
    })
  ).bot_id;

  // get messages in channel
  const result = await client.conversations.history({
    token: process.env.SLACK_BOT_TOKEN,
    channel: process.env.STAETTE_CHANNEL
  });

  const filtered = result.messages.filter(
    (msg) =>
      msg.bot_id === botId && // messages from this user
      msg.blocks &&
      msg.blocks.length > 0 &&
      msg.blocks[0].text &&
      msg.blocks[0].text.text === `\`${date}\`` // current date
  );

  return !(filtered.length > 0);
}

//* ******************* Exports ********************//
module.exports = {
  cleanup,
  sortMessages,
  dateIsUnique
};
