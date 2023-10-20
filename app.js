// Require the Bolt package (github.com/slackapi/bolt)
import { App } from '@slack/bolt';

// local references
import * as views from './helper/general/views';
import { apps } from './helper/general/apps';

// Create Bolt App
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  extendedErrorHandler: true
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

//* ******************* Error notifies Admin ********************//
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

  await app.client.files.upload({
    token: process.env.SLACK_BOT_TOKEN,
    channels: process.env.APP_ADMIN,
    filetype: 'javascript',
    initial_comment: `Error:\n${error}`,
    title: 'Context',
    content: JSON.stringify(context, null, '\t')
  });
  await app.client.files.upload({
    token: process.env.APP_ADMIN,
    channels: process.env.APP_ADMIN,
    filetype: 'javascript',
    title: 'Body',
    content: JSON.stringify(body, null, '\t')
  });
  console.log(error);
});

//* ******************* Start App ********************//
(async () => {
  // Start your app
  await app.start(process.env.PORT || 8080);

  console.log(
    'Schwerathletik Slack Service läuft auf Port ' + process.env.PORT
  );
})();
