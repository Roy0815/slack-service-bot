// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require("@slack/bolt");

//local references
const views = require("./helper/general/views");
const asApp = require("./helper/arbeitsstunden/app");
const staetteApp = require("./helper/staette/app");

// Create Bolt App
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

//******************** Setup listeners ********************//
asApp.setupApp(app);
staetteApp.setupApp(app);

app.event("app_home_opened", async ({ event, client }) => {
  await client.views.publish(views.getHomeView(event));
});

// handle remaining actions
app.action(new RegExp(`.*`), async ({ ack }) => {
  try {
    await ack();
  } catch (err) {} //ReceiverMultipleAckError
});

//******************** Start App ********************//
(async () => {
  // Start your app
  await app.start(process.env.PORT || 8080);

  console.log(
    "Schwerathletik Slack Service läuft auf Port " + process.env.PORT
  );
})();
