// References
import * as functions from './functions.js';
import { App } from '@slack/bolt';
import * as util from '../general/util.js';

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
    )} ${util.formatTime(new Date())} and deleted ${result.length} Message${
      result.length === 1 ? '' : 's'
    }`,
    title: 'Messages',
    content: JSON.stringify(result, null, '\t')
  });
});
