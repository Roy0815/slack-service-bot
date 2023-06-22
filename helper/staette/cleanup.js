// References
const functions = require('./functions');
const { App } = require('@slack/bolt');
const util = require('../general/util');

// Create Bolt App
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// cleanup old messages
functions.cleanup(app).then((result) => {
  // log job execution
  if (!process.env.CRONJOB_LOG_TO_ADMIN) return;

  app.client.files.upload({
    token: process.env.SLACK_BOT_TOKEN,
    channels: process.env.APP_ADMIN,
    filetype: 'javascript',
    initial_comment: `Job ran at ${util.formatDate(
      new Date()
    )} ${util.formatTime(new Date())} and deleted ${result.count} Message${
      result.count == 1 ? '' : 's'
    }`,
    title: 'Messages',
    content: JSON.stringify(result.messages, null, '\t')
  });
});
