// Require the Bolt package (github.com/slackapi/bolt)
const { App, ExpressReceiver } = require("@slack/bolt"); //, LogLevel

//local references
const views = require("./helper/views");
const sheet = require("./helper/sheet");
const general = require("./helper/general");

// Create receiver
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Create Bolt App
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

//******************** Commands ********************//
// display hours
app.command(
  "/arbeitsstunden_anzeigen",
  async ({ ack, command, respond, client }) => {
    await ack();
    let hours = await sheet.getHoursFromSlackId(command.user_id);

    // if registered, display
    if (hours != undefined) {
      respond(
        `Du hast dieses Jahr bereits ${hours.workedHours} Arbeitsstunden geleistet. Du musst noch ${hours.targetHours} Stunden leisten.`
      );
      return;
    }

    // not registered: start dialog
    await client.views.open(await views.getRegisterView(command.trigger_id));
  }
);

// Maintain hours
app.command(
  "/arbeitsstunden_erfassen",
  async ({ ack, command, respond, client }) => {
    await ack();

    // check user is registered
    if ((await sheet.getHoursFromSlackId(command.user_id)) == undefined) {
      // not registered: start dialog
      await client.views.open(await views.getRegisterView(command.trigger_id));
      return;
    }

    // registered: start maintenance dialog
    await client.views.open(
      await views.getMaintainHoursView(command.trigger_id)
    );
  }
);

// test
app.command("/test", async ({ ack, respond, command }) => {
  await ack();
  if ((await command.user_id) == "ULRBPGLUE")
    sheet.test("Testname", "Delete Me");
  else {
    respond(
      "Du bist nicht Ruben, du hast keine Berechtigung für dieses Kommando"
    );
  }
});

//******************** Actions ********************//
// handle buttons in Registration approval
app.action(
  new RegExp(`^register-(approve)*(reject)*-button$`),
  async ({ ack, action, client, respond, body }) => {
    await ack();

    //{ id, slackId, name, approved }
    let registerObj = JSON.parse(action.value);
    registerObj.approved = action.action_id.split("-")[1] == "approve";

    //notify requestor
    await client.chat.postMessage(views.getUserRegisterEndMessage(registerObj));

    //edit approval message to show final result
    await respond(
      `<@${body.user.id}> hat folgende Registrierung um ${general.formatTime(
        new Date()
      )} Uhr am ${general.formatDate(new Date())} ${
        registerObj.approved ? "freigegeben" : "abgelehnt"
      }:\n<@${registerObj.slackId}> => ${registerObj.name}`
    );

    if (!registerObj.approved) return;
    //update data in sheet
    sheet.saveSlackId(registerObj);
  }
);

// handle buttons in maintenance approval
app.action(
  new RegExp(`^maintain-(approve)*(reject)*-button$`),
  async ({ ack, action, client, respond, body }) => {
    await ack();

    //{ slackId, title, hours, date }
    let maintObj = JSON.parse(action.value);
    maintObj.approved = action.action_id.split("-")[1] == "approve";

    //notify requestor
    await client.chat.postMessage(views.getUserMaintainEndMessage(maintObj));

    //edit approval message to show final result
    let date = new Date(
      maintObj.date.split("-")[0],
      maintObj.date.split("-")[1] - 1,
      maintObj.date.split("-")[2]
    );

    await respond(
      `<@${body.user.id}> hat folgende Stunden um ${general.formatTime(
        new Date()
      )} Uhr am ${general.formatDate(new Date())} ${
        maintObj.approved ? "freigegeben" : "abgelehnt"
      }:\n${maintObj.title}: ${maintObj.hours} Stunde${
        maintObj.hours == 1 ? "" : "n"
      } am ${general.formatDate(date)}.`
    );

    //update data in sheet
    await sheet.saveHours(maintObj);
  }
);

// handle remaining actions
app.action(new RegExp(`.*`), async ({ ack }) => {
  await ack();
});

//******************** View Submissions ********************//
app.view(views.registerViewName, async ({ body, ack, client, payload }) => {
  await ack();

  //register object
  let obj = {
    id: body.view.state.values[views.registerBlockNameSelect][
      views.registerActionNameSelect
    ].selected_option.value,

    slackId: body.user.id,

    name: body.view.state.values[views.registerBlockNameSelect][
      views.registerActionNameSelect
    ].selected_option.text.text,
  };

  //register confirmation message
  await client.chat.postMessage(await views.getRegisterConfirmDialog(obj));

  //notify user that process has started
  await client.chat.postMessage(views.getUserRegisterStartMessage(obj));
});

app.view(
  views.maintainHoursViewName,
  async ({ body, ack, client, payload }) => {
    await ack();

    //build maintenance object
    let obj = {
      slackId: body.user.id,
      title:
        body.view.state.values[views.maintainHoursBlockDescription][
          views.maintainHoursActionDescription
        ].value,
      hours:
        body.view.state.values[views.maintainHoursBlockHours][
          views.maintainHoursActionHours
        ].value,
      date: body.view.state.values[views.maintainHoursBlockDate][
        views.maintainHoursActionDate
      ].selected_date,
    };

    //register confirmation message
    await client.chat.postMessage(await views.getMaintainConfirmDialog(obj));

    //notify user that process has started
    await client.chat.postMessage(views.getUserMaintainStartMessage(obj));
  }
);

//******************** Events Submissions ********************//
app.event("app_home_opened", async ({ event, client }) => {
  await client.views.publish(views.getHomeView(event.user));
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 8080);

  console.log("Slack Arbeitsstunden-Bot läuft auf Port " + process.env.PORT);
})();
