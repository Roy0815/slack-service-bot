// References
const functions = require("./functions");
const { App } = require("@slack/bolt");
const util = require("../general/util");

// Create Bolt App
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// cleanup old messages
let count = functions.cleanup(app);

// log job execution
app.client.chat.postMessage({
  token: process.env.SLACK_BOT_TOKEN,
  channel: "GPD9S0RU2",
  text: `Job ran at ${util.formatDate(new Date())} ${util.formatTime(
    new Date()
  )} and deleted ${count} Message${count == 1 ? "" : "s"}`,
});
