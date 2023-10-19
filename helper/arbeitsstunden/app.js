// local imports
const views = require('./views');
const sheet = require('./sheet');
const util = require('../general/util');
const types = require('./types');

/**
 *
 * @param {import("@slack/bolt").App} app
 */
function setupApp(app) {
  //* ******************* Commands ********************//
  // display hours
  app.command(
    '/arbeitsstunden_anzeigen',
    async ({ ack, command, respond, client }) => {
      await ack();

      // see if user wanted details
      const details = command.text.includes('details');

      // remove everything but numbers
      command.text = command.text.replace(/\D/g, '');

      // if year was filled, validate
      if (command.text !== '') {
        const currYear = new Date().getFullYear();
        if (Number(command.text) < 2022 || Number(command.text) > currYear) {
          await respond(
            `Bitte ein Jahr zwischen 2022 und ${currYear} eingeben`
          );
          return;
        }
      }

      const hoursObj = await sheet.getHoursFromSlackId({
        id: command.user_id,
        year: Number(command.text),
        details
      });

      // not registered: start dialog
      if (hoursObj === undefined) {
        await client.views.open(
          await views.getRegisterView(command.trigger_id)
        );
        return;
      }

      // if registered, display
      /** @type {import("@slack/bolt").RespondArguments} */
      const response = {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Du hast ${
                command.text !== '' ? command.text : 'dieses Jahr' // year
              } bereits ${
                hoursObj.workedHours
              } Arbeitsstunden geleistet. Du musst noch ${
                hoursObj.targetHours
              } Stunden leisten.`
            }
          }
        ]
      };

      if (hoursObj.details.length > 0) {
        response.blocks.push(
          {
            type: 'divider'
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Datum\t\t\tStunden\tTätigkeit'
            }
          },
          {
            type: 'divider'
          }
        );

        hoursObj.details.forEach((element) => {
          response.blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${element.date}*\t${element.hours}\t\t\t\t_${element.description}_`
            }
          });
        });
      }

      respond(response);
    }
  );

  // Maintain hours
  app.command('/arbeitsstunden_erfassen', async ({ ack, command, client }) => {
    await ack();

    // check user is registered
    if ((await sheet.getUserFromSlackId(command.user_id)) === undefined) {
      // not registered: start dialog
      await client.views.open(await views.getRegisterView(command.trigger_id));
      return;
    }

    // registered: start maintenance dialog
    await client.views.open(views.getMaintainHoursView(command.trigger_id));
  });

  //* ******************* Actions ********************//
  app.action(views.homeViewDisplayHours, async ({ ack, client, body }) => {
    await ack();

    const blckAction = /** @type {import("@slack/bolt").BlockAction} */ (body);

    const year =
      blckAction.view.state.values[views.homeViewInputBlockId][
        views.homeViewYearSelect
      ].selected_option.value;

    const details =
      blckAction.view.state.values[views.homeViewInputBlockId][
        views.homeViewDetailsSelect
      ].selected_options.length > 0;

    const hoursObj = await sheet.getHoursFromSlackId({
      id: body.user.id,
      year: Number(year),
      details
    });

    // not registered: start dialog
    if (hoursObj === undefined) {
      await client.views.open(
        await views.getRegisterView(blckAction.trigger_id)
      );
      return;
    }

    // build message
    /** @type {import("@slack/web-api").ChatPostMessageArguments} */
    const message = {
      channel: body.user.id,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Du hast ${year} bereits ${hoursObj.workedHours} Arbeitsstunden geleistet. Du musst noch ${hoursObj.targetHours} Stunden leisten.`
          }
        }
      ]
    };

    if (hoursObj.details.length > 0) {
      message.blocks.push(
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Datum\t\t\tStunden\tTätigkeit'
          }
        },
        {
          type: 'divider'
        }
      );

      hoursObj.details.forEach((element) => {
        message.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${element.date}*\t${element.hours}\t\t\t\t_${element.description}_`
          }
        });
      });
    }

    await client.chat.postMessage(message);
  });

  app.action(views.homeViewMaintainHours, async ({ ack, client, body }) => {
    await ack();

    const blckAction = /** @type {import("@slack/bolt").BlockAction} */ (body);

    // check user is registered
    if ((await sheet.getHoursFromSlackId({ id: body.user.id })) === undefined) {
      // not registered: start dialog

      await client.views.open(
        await views.getRegisterView(blckAction.trigger_id)
      );
      return;
    }

    // registered: start maintenance dialog

    await client.views.open(views.getMaintainHoursView(blckAction.trigger_id));
  });

  // handle buttons in Registration approval
  app.action(
    // eslint-disable-next-line prefer-regex-literals
    new RegExp('^register-(approve)*(reject)*-button$'),
    async ({ ack, action, client, respond, body }) => {
      await ack();

      const btnAction = /** @type {import("@slack/bolt").ButtonAction} */ (
        action
      );

      /** @type {types.registerObjectFinalizer} */
      const registerObj = JSON.parse(btnAction.value);

      registerObj.approved = btnAction.action_id.split('-')[1] === 'approve';

      // notify requestor
      await client.chat.postMessage(
        views.getUserRegisterEndMessage(registerObj)
      );

      // edit approval message to show final result
      await respond(
        `<@${body.user.id}> hat folgende Registrierung um ${util.formatTime(
          new Date()
        )} Uhr am ${util.formatDate(new Date())} ${
          registerObj.approved ? 'freigegeben' : 'abgelehnt'
        }:\n<@${registerObj.slackId}> => ${registerObj.name}`
      );

      if (!registerObj.approved) return;
      // update data in sheet
      sheet.saveSlackId(registerObj);
    }
  );

  // admin registration
  app.action(
    'auto-register-submit-button',
    async ({ ack, respond, body, action }) => {
      await ack();

      const blckAction = /** @type {import("@slack/bolt").BlockAction} */ (
        body
      );

      const btnAction = /** @type {import("@slack/bolt").ButtonAction} */ (
        action
      );

      const selOpt =
        blckAction.state.values[views.autoregisterInputBlock][
          views.registerActionNameSelect
        ].selected_option;

      if (selOpt === null) {
        return;
      }

      console.log(
        blckAction.state.values[views.autoregisterInputBlock][
          views.registerActionNameSelect
        ].selected_option
      );

      // edit approval message to show final result
      await respond(
        `<@${
          blckAction.user.id
        }> hat folgende Registrierung um ${util.formatTime(
          new Date()
        )} Uhr am ${util.formatDate(new Date())} vorgenommen:\n<@${
          btnAction.value
        }> => ${selOpt.text.text}`
      );

      // update data in sheet

      sheet.saveSlackId({ id: Number(selOpt.value), slackId: btnAction.value });
    }
  );

  // handle buttons in maintenance approval
  app.action(
    // eslint-disable-next-line prefer-regex-literals
    new RegExp('^maintain-(approve)*(reject)*-button$'),
    async ({ ack, action, client, respond, body }) => {
      await ack();

      const btnAction = /** @type {import("@slack/bolt").ButtonAction} */ (
        action
      );

      /** @type {types.hoursMaintFinalizer} */
      const maintObj = JSON.parse(btnAction.value);

      maintObj.approved = btnAction.action_id.split('-')[1] === 'approve';

      // notify requestor
      await client.chat.postMessage(views.getUserMaintainEndMessage(maintObj));

      // edit approval message to show final result
      const [year, month, day] = maintObj.date.split('-');
      const date = new Date(Number(year), Number(month) - 1, Number(day));

      await respond(
        `<@${body.user.id}> hat folgende Stunden um ${util.formatTime(
          new Date()
        )} Uhr am ${util.formatDate(new Date())} ${
          maintObj.approved ? 'freigegeben' : 'abgelehnt'
        }:\n${await sheet.getNameFromSlackId(maintObj)}: "${
          maintObj.description
        }" - ${maintObj.hours} Stunde${
          maintObj.hours === 1 ? '' : 'n'
        } am ${util.formatDate(date)}.`
      );

      if (!maintObj.approved) return;

      // update data in sheet
      await sheet.saveHours(maintObj);
    }
  );

  //* ******************* Options ********************//
  app.options(views.registerActionNameSelect, async ({ ack, options }) => {
    const users = await sheet.getAllUsers();

    if (!users) {
      await ack();
      return;
    }

    const userOptions = [];

    users
      .filter((user) =>
        `${user.firstname.toLowerCase()} ${user.lastname.toLowerCase()}`.includes(
          options.value.toLowerCase()
        )
      )
      .forEach((user) => {
        userOptions.push({
          text: {
            type: 'plain_text',
            text: `${user.firstname} ${user.lastname}`
          },
          value: user.id
        });
      });

    await ack({
      options: userOptions
    });
  });

  //* ******************* View Submissions ********************//
  app.view(views.registerViewName, async ({ body, ack, client }) => {
    await ack();

    if (
      !body.view.state.values[views.registerBlockNameSelect][
        views.registerActionNameSelect
      ].selected_option
    )
      return;

    /** @type {types.registerObj} */
    const obj = {
      id: Number(
        body.view.state.values[views.registerBlockNameSelect][
          views.registerActionNameSelect
        ].selected_option.value
      ),

      slackId: body.user.id,

      name: body.view.state.values[views.registerBlockNameSelect][
        views.registerActionNameSelect
      ].selected_option.text.text
    };

    // register confirmation message
    await client.chat.postMessage(await views.getRegisterConfirmDialog(obj));

    // notify user that process has started
    await client.chat.postMessage(views.getUserRegisterStartMessage(obj));
  });

  app.view(views.maintainHoursViewName, async ({ body, ack, client }) => {
    const year = Number(
      body.view.state.values[views.maintainHoursBlockDate][
        views.maintainHoursActionDate
      ].selected_date.split('-')[0]
    );

    const currYear = new Date().getFullYear();

    if (year < currYear - 1 || year > currYear + 1) {
      await ack({
        response_action: 'errors',
        errors: {
          [views.maintainHoursBlockDate]: `Du kannst nur Daten zwischen ${
            currYear - 1
          } und ${currYear + 1} pflegen`
        }
      });
      return;
    }

    await ack();

    // build maintenance object
    /** @type {types.hoursObjMaint} */
    const obj = {
      slackId: body.user.id,
      description:
        body.view.state.values[views.maintainHoursBlockDescription][
          views.maintainHoursActionDescription
        ].value,
      hours: Number(
        body.view.state.values[views.maintainHoursBlockHours][
          views.maintainHoursActionHours
        ].value
      ),
      date: body.view.state.values[views.maintainHoursBlockDate][
        views.maintainHoursActionDate
      ].selected_date
    };

    // register confirmation message
    await client.chat.postMessage(await views.getMaintainConfirmDialog(obj));

    // notify user that process has started
    await client.chat.postMessage(views.getUserMaintainStartMessage(obj));
  });

  //* ******************* Events Submissions ********************//
  app.event('team_join', async ({ event, client }) => {
    // log in case of bot user analysis
    console.log(event);

    await client.chat.postMessage(
      await views.getAutoRegisterMessage(event.user.id)
    );
  });
}

//* ******************* Exports ********************//
module.exports = {
  setupApp
};
