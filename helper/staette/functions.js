//******************** Public Functions ********************//
async function cleanup({ client }) {
  //get bot ID
  const botId = (
    await client.auth.test({
      token: process.env.SLACK_BOT_TOKEN,
    })
  ).bot_id;

  //get messages in channel
  let result = await client.conversations.history({
    // The token you used to initialize your app
    token: process.env.SLACK_BOT_TOKEN,
    channel: process.env.STAETTE_CHANNEL,
  });

  let filtered = result.messages.filter(
    (msg) =>
      msg.bot_id == botId && //messages from this user
      msg.blocks &&
      msg.blocks.length > 0 &&
      msg.blocks[0].text &&
      /^`[0-3]\d\.[0-1]\d\.20[2-9]\d`$/.test(msg.blocks[0].text.text) //messages with date
  );

  let cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 1);

  let returnObj = { count: 0, messages: [] };

  filtered.forEach((msg) => {
    //get date from message
    let text = msg.blocks[0].text.text.replace("`", "");
    let dateArr = text.split(".");
    dateArr[0] = parseInt(dateArr[0]);
    dateArr[1] = parseInt(dateArr[1]) - 1;
    dateArr[2] = parseInt(dateArr[2]);

    let date = new Date(dateArr[2], dateArr[1], dateArr[0]);

    if (date < cutoffDate) {
      //ASYNC! delete message
      client.chat.delete({
        channel: process.env.STAETTE_CHANNEL,
        ts: msg.ts,
        token: process.env.SLACK_BOT_TOKEN,
      });
      returnObj.messages.push(msg);
      returnObj.count++;
    }
  });

  return returnObj;
}

async function sortMessages(client) {
  //get bot ID
  const botId = (
    await client.auth.test({
      token: process.env.SLACK_BOT_TOKEN,
    })
  ).bot_id;

  //get messages in channel
  let result = await client.conversations.history({
    // The token you used to initialize your app
    token: process.env.SLACK_BOT_TOKEN,
    channel: process.env.STAETTE_CHANNEL,
  });

  let filtered = result.messages.filter(
    (msg) =>
      msg.bot_id == botId && //messages from this user
      msg.blocks &&
      msg.blocks.length > 0 &&
      msg.blocks[0].text &&
      /^`[0-3]\d\.[0-1]\d\.20[2-9]\d`$/.test(msg.blocks[0].text.text) //messages with date
  );

  //sort by date
  filtered.sort((a, b) => {
    let textA = a.blocks[0].text.text.replace("`", "");
    let textB = b.blocks[0].text.text.replace("`", "");

    let dateA = new Date(
      textA.split(".")[2],
      textA.split(".")[1] - 1,
      textA.split(".")[0]
    );
    let dateB = new Date(
      textB.split(".")[2],
      textB.split(".")[1] - 1,
      textB.split(".")[0]
    );
    return dateA - dateB;
  });
}

//******************** Exports ********************//
module.exports = {
  cleanup,
  sortMessages,
};
