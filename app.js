// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require("@slack/bolt");

//local references
const views = require("./helper/general/views");
const apps = require("./helper/general/apps");

// Create Bolt App
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  extendedErrorHandler: true,
});

//******************** Setup listeners ********************//
Object.entries(apps).forEach((element) => {
  element[1].setupApp(app);
});

app.event("app_home_opened", async ({ event, client }) => {
  await client.views.publish(views.getHomeView(event));
});

// handle remaining actions
app.action(new RegExp(`.*`), async ({ ack }) => {
  try {
    await ack();
  } catch (err) {} //ReceiverMultipleAckError
});

//******************** Error notifies Admin ********************//
app.error(async ({ error, context, body }) => {
  await app.client.files.upload({
    token: process.env.SLACK_BOT_TOKEN,
    channels: "UED3FPWE9",
    filetype: "javascript",
    initial_comment: `Error:\n${error}`,
    title: `Context`,
    content: JSON.stringify(context, null, "\t"),
  });
  await app.client.files.upload({
    token: process.env.SLACK_BOT_TOKEN,
    channels: "UED3FPWE9",
    filetype: "javascript",
    title: `Body`,
    content: JSON.stringify(body, null, "\t"),
  });
});

//******************** Start App ********************//
(async () => {
  // Start your app
  await app.start(process.env.PORT || 8080);

  console.log(
    "Schwerathletik Slack Service läuft auf Port " + process.env.PORT
  );
})();
