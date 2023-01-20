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

  //filter for messages from this user
  let filtered = result.messages.filter((msg) => msg.bot_id == botId);

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

//******************** Exports ********************//
module.exports = {
  cleanup,
};
