// References
import * as functions from './functions.js';
import * as slack from '@slack/bolt';
import * as util from '../general/util.js';

// Create Bolt App
// @ts-ignore
const app = new slack.default.App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

/**
 * Run Lambda funtion (built for scheduled job)
 * @param {import('@slack/bolt/dist/receivers/AwsLambdaReceiver.js').AwsEvent} event
 * @param {any} context
 */
export async function run(event, context) {
  // cleanup old messages
  const result = await functions.cleanup(app);

  // log job execution
  console.log(`deleted ${result.length} Messages`);

  if (!process.env.CRONJOB_LOG_TO_ADMIN) return;

  // log deleted messages
  await app.client.filesUploadV2({
    channel_id: process.env.APP_ADMIN_CHANNEL,
    filetype: 'javascript',
    initial_comment: `Job ran at ${util.formatDate(
      new Date()
    )} ${util.formatTime(new Date())} and deleted ${result.length} Message${
      result.length === 1 ? '' : 's'
    }`,
    title: 'Messages',
    content: JSON.stringify(result, null, '\t')
  });
}
