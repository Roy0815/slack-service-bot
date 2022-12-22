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

      //if year was filled, validate
      if (command.text != "") {
        //validate number
        let text = /^[0-9]+$/;
        if (!text.test(command.text)) {
          await respond("Bitte ein gültiges Jahr eingeben");
          return;
        }

        let currYear = new Date().getFullYear();
        if (command.text < 2022 || command.text > currYear) {
          await respond(
            `Bitte ein Jahr zwischen 2022 und ${currYear} eingeben`
          );
          return;
        }
      }

      let hours = await sheet.getHoursFromSlackId({
        id: command.user_id,
        year: command.text,
      });

      // if registered, display
      if (hours != undefined) {
        respond(
          `Du hast ${
            command.text != "" ? command.text : "dieses Jahr" //year
          } bereits ${
            hours.workedHours
          } Arbeitsstunden geleistet. Du musst noch ${
            hours.targetHours
          } Stunden leisten.`
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
      if (
        (await sheet.getHoursFromSlackId({ id: command.user_id })) == undefined
      ) {
        // not registered: start dialog
        await client.views.open(
          await views.getRegisterView(command.trigger_id)
        );
        return;
      }

      // registered: start maintenance dialog
      await client.views.open(
        await views.getMaintainHoursView(command.trigger_id)
      );
    }
  );

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
    if (event.is_bot) return;

    await client.chat.postMessage(
      await views.getAutoRegisterMessage(event.user.id)
    );
  });
}

//******************** Exports ********************//
module.exports = {
  setupApp,
};