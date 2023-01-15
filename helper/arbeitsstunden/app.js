const views = require("./views");
const sheet = require("./sheet");
const util = require("../general/util");

function setupApp(app) {
  //******************** Commands ********************//
  // display hours
  app.command(
    "/arbeitsstunden_anzeigen",
    async ({ ack, command, respond, client }) => {
      await ack();

      //see if user wanted details
      let details = command.text.includes("details");

      //remove everything but numbers
      command.text = command.text.replace(/\D/g, "");

      //if year was filled, validate
      if (command.text != "") {
        let currYear = new Date().getFullYear();
        if (command.text < 2022 || command.text > currYear) {
          await respond(
            `Bitte ein Jahr zwischen 2022 und ${currYear} eingeben`
          );
          return;
        }
      }

      let hoursObj = await sheet.getHoursFromSlackId({
        id: command.user_id,
        year: command.text,
        details: details,
      });

      // not registered: start dialog
      if (hoursObj == undefined) {
        await client.views.open(
          await views.getRegisterView(command.trigger_id)
        );
        return;
      }

      // if registered, display
      let response = {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Du hast ${
                command.text != "" ? command.text : "dieses Jahr" //year
              } bereits ${
                hoursObj.workedHours
              } Arbeitsstunden geleistet. Du musst noch ${
                hoursObj.targetHours
              } Stunden leisten.`,
            },
          },
        ],
      };

      if (hoursObj.details.length > 0) {
        response.blocks.push(
          {
            type: "divider",
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Datum\t\t\tStunden\tTätigkeit",
            },
          },
          {
            type: "divider",
          }
        );

        hoursObj.details.forEach((element) => {
          response.blocks.push({
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${element.date}*\t${element.hours}\t\t\t\t_${element.description}_`,
            },
          });
        });
      }

      respond(response);
    }
  );

  // Maintain hours
  app.command("/arbeitsstunden_erfassen", async ({ ack, command, client }) => {
    await ack();

    // check user is registered
    if (
      (await sheet.getHoursFromSlackId({ id: command.user_id })) == undefined
    ) {
      // not registered: start dialog
      await client.views.open(await views.getRegisterView(command.trigger_id));
      return;
    }

    // registered: start maintenance dialog
    await client.views.open(
      await views.getMaintainHoursView(command.trigger_id)
    );
  });

  //******************** Actions ********************//
  app.action(views.homeViewDisplayHours, async ({ ack, client, body }) => {
    await ack();

    let year =
      body.view.state.values[views.homeViewInputBlockId][
        views.homeViewYearSelect
      ].selected_option.value;

    let details =
      body.view.state.values[views.homeViewInputBlockId][
        views.homeViewDetailsSelect
      ].selected_options.length > 0;

    let hoursObj = await sheet.getHoursFromSlackId({
      id: body.user.id,
      year: year,
      details: details,
    });

    // not registered: start dialog
    if (hoursObj == undefined) {
      await client.views.open(await views.getRegisterView(body.trigger_id));
      return;
    }

    //build message
    let message = {
      channel: body.user.id,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Du hast ${year} bereits ${hoursObj.workedHours} Arbeitsstunden geleistet. Du musst noch ${hoursObj.targetHours} Stunden leisten.`,
          },
        },
      ],
    };

    if (hoursObj.details.length > 0) {
      message.blocks.push(
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Datum\t\t\tStunden\tTätigkeit",
          },
        },
        {
          type: "divider",
        }
      );

      hoursObj.details.forEach((element) => {
        message.blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${element.date}*\t${element.hours}\t\t\t\t_${element.description}_`,
          },
        });
      });
    }

    await client.chat.postMessage(message);
  });

  app.action(views.homeViewMaintainHours, async ({ ack, client, body }) => {
    await ack();

    // check user is registered
    if ((await sheet.getHoursFromSlackId({ id: body.user.id })) == undefined) {
      // not registered: start dialog
      await client.views.open(await views.getRegisterView(body.trigger_id));
      return;
    }

    // registered: start maintenance dialog
    await client.views.open(await views.getMaintainHoursView(body.trigger_id));
  });

  // handle buttons in Registration approval
  app.action(
    new RegExp(`^register-(approve)*(reject)*-button$`),
    async ({ ack, action, client, respond, body }) => {
      await ack();

      //{ id, slackId, name, approved }
      let registerObj = JSON.parse(action.value);
      registerObj.approved = action.action_id.split("-")[1] == "approve";

      //notify requestor
      await client.chat.postMessage(
        views.getUserRegisterEndMessage(registerObj)
      );

      //edit approval message to show final result
      await respond(
        `<@${body.user.id}> hat folgende Registrierung um ${util.formatTime(
          new Date()
        )} Uhr am ${util.formatDate(new Date())} ${
          registerObj.approved ? "freigegeben" : "abgelehnt"
        }:\n<@${registerObj.slackId}> => ${registerObj.name}`
      );

      if (!registerObj.approved) return;
      //update data in sheet
      sheet.saveSlackId(registerObj);
    }
  );

  // admin registration
  app.action(
    "auto-register-submit-button",
    async ({ ack, respond, body, action }) => {
      let selOpt =
        body.state.values[views.autoregisterInputBlock][
          views.registerActionNameSelect
        ].selected_option;

      if (selOpt === null) {
        return;
      }

      console.log(
        body.state.values[views.autoregisterInputBlock][
          views.registerActionNameSelect
        ].selected_option
      );
      console.log(action);
      await ack();

      //edit approval message to show final result
      await respond(
        `<@${body.user.id}> hat folgende Registrierung um ${util.formatTime(
          new Date()
        )} Uhr am ${util.formatDate(new Date())} vorgenommen:\n<@${
          action.value
        }> => ${selOpt.text.text}`
      );

      //update data in sheet
      sheet.saveSlackId({ id: selOpt.value, slackId: action.value });
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
        `<@${body.user.id}> hat folgende Stunden um ${util.formatTime(
          new Date()
        )} Uhr am ${util.formatDate(new Date())} ${
          maintObj.approved ? "freigegeben" : "abgelehnt"
        }:\n${await sheet.getNameFromSlackId(maintObj)}: "${
          maintObj.title
        }" - ${maintObj.hours} Stunde${
          maintObj.hours == 1 ? "" : "n"
        } am ${util.formatDate(date)}.`
      );

      if (!maintObj.approved) return;

      //update data in sheet
      await sheet.saveHours(maintObj);
    }
  );

  //******************** View Submissions ********************//
  app.view(views.registerViewName, async ({ body, ack, client }) => {
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

  app.view(views.maintainHoursViewName, async ({ body, ack, client }) => {
    let year =
      body.view.state.values[views.maintainHoursBlockDate][
        views.maintainHoursActionDate
      ].selected_date.split("-")[0];

    let currYear = new Date().getFullYear;

    if (year < currYear - 1 || year > currYear + 1) {
      await ack({
        response_action: "errors",
        errors: {
          [views.maintainHoursBlockDate]: `Du kannst nur Daten zwischen ${
            currYear - 1
          } und ${currYear + 1} pflegen`,
        },
      });
      return;
    }

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
  });

  //******************** Events Submissions ********************//
  app.event("team_join", async ({ event, client }) => {
    if (event.user.is_bot) return;

    await client.chat.postMessage(
      await views.getAutoRegisterMessage(event.user.id)
    );
  });
}

//******************** Exports ********************//
module.exports = {
  setupApp,
};
