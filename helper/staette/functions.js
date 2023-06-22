//* ******************* Public Functions ********************//
async function cleanup ({ client }) {
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
      msg.bot_id == botId && // messages from this user
      msg.blocks &&
      msg.blocks.length > 0 &&
      msg.blocks[0].text &&
      /^`[0-3]\d\.[0-1]\d\.20[2-9]\d`$/.test(msg.blocks[0].text.text) // messages with date
  );

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 1);

  const returnObj = { count: 0, messages: [] };

  filtered.forEach((msg) => {
    // get date from message
    const text = msg.blocks[0].text.text.replace(/`/g, '');
    const dateArr = text.split('.');
    dateArr[0] = parseInt(dateArr[0]);
    dateArr[1] = parseInt(dateArr[1]) - 1;
    dateArr[2] = parseInt(dateArr[2]);

    const date = new Date(dateArr[2], dateArr[1], dateArr[0]);

    if (date < cutoffDate) {
      // ASYNC! delete message
      client.chat.delete({
        channel: process.env.STAETTE_CHANNEL,
        ts: msg.ts,
        token: process.env.SLACK_BOT_TOKEN
      });
      returnObj.messages.push(msg);
      returnObj.count++;
    }
  });

  return returnObj;
}

async function sortMessages ({ client, date }) {
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
      msg.bot_id == botId && // messages from this user
      msg.blocks &&
      msg.blocks.length > 0 &&
      msg.blocks[0].text &&
      /^`[0-3]\d\.[0-1]\d\.20[2-9]\d`$/.test(msg.blocks[0].text.text) && // messages with date
      msg.blocks[0].text.text != `\`${date}\`` // not current date
  );

  // get messages with date later than current message
  const messagesOrdered = [];
  const currDate = new Date(
    date.split('.')[2],
    date.split('.')[1] - 1,
    date.split('.')[0]
  );

  filtered.forEach((msg) => {
    const text = msg.blocks[0].text.text.replace(/`/g, '');

    const msgDate = new Date(
      text.split('.')[2],
      text.split('.')[1] - 1,
      text.split('.')[0]
    );

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

async function dateIsUnique ({ client, date }) {
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
      msg.bot_id == botId && // messages from this user
      msg.blocks &&
      msg.blocks.length > 0 &&
      msg.blocks[0].text &&
      msg.blocks[0].text.text == `\`${date}\`` // current date
  );

  return !(filtered.length > 0);
}

//* ******************* Exports ********************//
module.exports = {
  cleanup,
  sortMessages,
  dateIsUnique
};
