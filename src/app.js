// Require the Bolt package (github.com/slackapi/bolt)
import * as slack from '@slack/bolt';

// local references
import * as views from './general/views.js';
import { apps } from './general/apps.js';
import { globalData } from './general/aws-runtime-api.js';

// Create AWS Lambda Receiver
/** @type {import('@slack/bolt').AwsLambdaReceiver} */
// @ts-ignore
const awsLambdaReceiver = new slack.default.AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// Create Bolt App
/** @type {import('@slack/bolt').App} */
// @ts-ignore
const app = new slack.default.App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: awsLambdaReceiver,
  extendedErrorHandler: true/*,
  // Sometimes useful for debugging
  developerMode: true,
  socketMode: false*/
});

//* ******************* Setup listeners ********************//
apps.forEach((element) => {
  element.setupApp(app);
});

app.event('app_home_opened', async ({ event, client }) => {
  await client.views.publish(views.getHomeView(event));
});

// handle remaining actions
// eslint-disable-next-line prefer-regex-literals
app.action(new RegExp('.*'), async ({ ack }) => {
  try {
    await ack();
  } catch (err) {} // ReceiverMultipleAckError
});

app.command('/test', async ({ ack, respond, command, client }) => {
  await ack();

  if (command.user_id !== process.env.APP_ADMIN) {
    await respond('Sorry, nur der Admin darf diesen Befehl ausführen.');
    return;
  }

  await respond('Test erfolgreich!');
});

//* ******************* Error notifies Admin ********************//
// @ts-ignore
app.error(async ({ error, context, body }) => {
  // catch server reponse time: notify user
  if (body.command && error.data.error === 'expired_trigger_id') {
    await app.client.chat.postMessage({
      channel: body.user_id,
      text: `Deine Aktion ${
        body.command
      } konnte leider vom Server nicht rechtzeitig verarbeitet werden. Bitte versuche es einfach nochmal. Sorry für die Umstände!${
        !process.env.APP_ADMIN
          ? ''
          : `\n\nSollte das Problem weiterhin bestehen, melde dich bitte bei <@${process.env.APP_ADMIN}>`
      }`
    });
  }

  // no admin maintained: no message
  if (!process.env.APP_ADMIN) return;

  await app.client.filesUploadV2({
    channel_id: process.env.APP_ADMIN_CHANNEL,
    filename: 'Context.js',
    initial_comment: `Error:\n${error}`,
    title: 'Context',
    content: JSON.stringify(context, null, '\t')
  });
  await app.client.filesUploadV2({
    channel_id: process.env.APP_ADMIN_CHANNEL,
    filename: 'body.js',
    title: 'Body',
    content: JSON.stringify(body, null, '\t')
  });
  console.log(JSON.stringify(error, null, '\t'));
});

//* ******************* Start App ********************//
/**
 * Handle the Lambda function event
 * @param {import('@slack/bolt/dist/receivers/AwsLambdaReceiver.js').AwsEvent} event
 * @param {any} context
 * @param {import('@slack/bolt/dist/receivers/AwsLambdaReceiver.js').AwsCallback} callback
 * @returns {Promise<import('@slack/bolt/dist/receivers/AwsLambdaReceiver.js').AwsResponse>} AWS Lambda response
 */
export async function handler(event, context, callback) {
  const handler = await awsLambdaReceiver.start();
  // buffer AWS Request ID to interact with the runtime API
  globalData.awsRequestId = context.awsRequestId;

  // In serverless-offline, avoid using callback (causes modal issues)
  // and ack() won't work properly
  if(process.env.IS_OFFLINE === 'true'){
    return handler(event, context);
  }

  return handler(event, context, callback);
}
