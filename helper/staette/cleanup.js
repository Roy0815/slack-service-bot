// References
const functions = require("./functions");
const { App } = require("@slack/bolt");
const util = require("../general/util");

// Create Bolt App
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// log job execution
app.client.chat.postMessage({
  token: process.env.SLACK_BOT_TOKEN,
  channel: "D041KC005C2",
  text: `Job ran at ${util.formatDate(new Date())} and ${util.formatTime(
    new Date()
  )}`,
});

// cleanup old messages
functions.cleanup(app);
