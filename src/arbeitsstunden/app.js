// local imports
import * as controller from './controller.js';
import * as constants from './constants.js';
import * as util from '../general/util.js';
import * as types from './types.js';

import * as awsRtAPI from '../general/aws-runtime-api.js';
import { SlackViewSubmissionError } from '../general/types.js';
import { masterdataService } from '../general/masterdata/service.js';

/** @type {import('../general/types.js').appComponent} */
export const asApp = { setupApp, getHomeView: controller.getHomeView };

/**
 * @param {import("@slack/bolt").App} app
 */
function setupApp(app) {
  //* ******************* Commands ********************//
  // display hours
  app.command(
    '/arbeitsstunden_anzeigen',
    async ({ ack, command, respond, client }) => {
      await ack();
      // already send HTTP 200 that slack does not time out
      await awsRtAPI.sendResponse();

      // see if user wanted details
      const details = command.text.includes('details');

      // remove everything but numbers
      const year = command.text.replace(/\D/g, '');

      // if year was filled, validate
      if (year !== '') {
        const currYear = new Date().getFullYear();
        if (Number(year) < 2022 || Number(year) > currYear) {
          await respond(
            `Bitte ein Jahr zwischen 2022 und ${currYear} eingeben`
          );
          return;
        }
      }

      const hoursObj = await controller.getHoursFromSlackId({
        id: command.user_id,
        year: Number(year),
        details
      });

      // not registered: start dialog
      if (hoursObj === undefined) {
        await client.views.open(
          await controller.getRegisterView(command.trigger_id)
        );
        return;
      }

      // if registered, display
      await respond(controller.getHoursDisplayResponse(hoursObj, year));
    }
  );

  // Maintain hours
  app.command('/arbeitsstunden_erfassen', async ({ ack, command, client }) => {
    await ack();
    // already send HTTP 200 that slack does not time out
    await awsRtAPI.sendResponse();

    // check user is registered
    if (
      !(await masterdataService.isUserRegistered({ slackId: command.user_id }))
    ) {
      // not registered: start dialog
      await client.views.open(
        await controller.getRegisterView(command.trigger_id)
      );
      return;
    }

    // registered: start maintenance dialog
    await client.views.open(
      controller.getMaintainHoursView(command.trigger_id)
    );
  });

  //* ******************* Actions ********************//
  app.action(constants.homeView.displayHours, async ({ ack, client, body }) => {
    await ack();
    // already send HTTP 200 that slack does not time out
    await awsRtAPI.sendResponse();

    const blckAction = /** @type {import("@slack/bolt").BlockAction} */ (body);

    const year =
      blckAction.view.state.values[constants.homeView.inputBlockId][
        constants.homeView.yearSelect
      ].selected_option.value;

    const details =
      blckAction.view.state.values[constants.homeView.inputBlockId][
        constants.homeView.detailsSelect
      ].selected_options.length > 0;

    const hoursObj = await controller.getHoursFromSlackId({
      id: body.user.id,
      year: Number(year),
      details
    });

    // not registered: start dialog
    if (hoursObj === undefined) {
      await client.views.open(
        await controller.getRegisterView(blckAction.trigger_id)
      );
      return;
    }

    // build message
    const response = controller.getHoursDisplayResponse(hoursObj, year);

    /** @type {import("@slack/web-api").ChatPostMessageArguments} */
    await client.chat.postMessage({
      channel: body.user.id,
      text: response.text,
      blocks: 'blocks' in response ? response.blocks : undefined // required for correct typing
    });
  });

  app.action(
    constants.homeView.maintainHours,
    async ({ ack, client, body }) => {
      await ack();
      // already send HTTP 200 that slack does not time out
      await awsRtAPI.sendResponse();

      const blckAction = /** @type {import("@slack/bolt").BlockAction} */ (
        body
      );

      // check user is registered
      if (
        !(await masterdataService.isUserRegistered({ slackId: body.user.id }))
      ) {
        // not registered: start dialog

        await client.views.open(
          await controller.getRegisterView(blckAction.trigger_id)
        );
        return;
      }

      // registered: start maintenance dialog
      await client.views.open(
        controller.getMaintainHoursView(blckAction.trigger_id)
      );
    }
  );

  // handle buttons in Registration approval
  app.action(
    // eslint-disable-next-line prefer-regex-literals
    new RegExp(
      `^(${constants.registerApproval.approveButton})|(${constants.registerApproval.rejectButton})$`
    ),
    async ({ ack, action, client, respond, body }) => {
      await ack();
      // already send HTTP 200 that slack does not time out
      await awsRtAPI.sendResponse();

      const btnAction = /** @type {import("@slack/bolt").ButtonAction} */ (
        action
      );

      /** @type {types.registerObjectFinalizer} */
      const registerObj = JSON.parse(btnAction.value);

      registerObj.approved = btnAction.action_id.split('-')[1] === 'approve';

      // notify requestor
      await client.chat.postMessage(
        controller.getUserRegisterEndMessage(registerObj)
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
      await controller.saveSlackId(registerObj);
    }
  );

  // admin registration
  app.action(
    constants.autoRegisterApproval.submit,
    async ({ ack, respond, body, action }) => {
      await ack();
      // already send HTTP 200 that slack does not time out
      await awsRtAPI.sendResponse();

      const blckAction = /** @type {import("@slack/bolt").BlockAction} */ (
        body
      );

      const btnAction = /** @type {import("@slack/bolt").ButtonAction} */ (
        action
      );

      const selOpt =
        blckAction.state.values[constants.autoRegisterView.inputBlock][
          constants.autoRegisterView.actionNameSelect
        ].selected_option;

      if (selOpt === null) {
        return;
      }

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
      await controller.saveSlackId({
        id: Number(selOpt.value),
        slackId: btnAction.value
      });

      // provide admins the contact
      const contact = await controller.getContactCardFromId(
        Number(selOpt.value)
      );

      await app.client.filesUploadV2({
        channel_id: await controller.getAdminChannel(),
        filename: `${contact.firstname} ${contact.lastname}.vcf`,
        title: `${contact.firstname} ${contact.lastname}`,
        content: contact.vCardContent
      });
    }
  );

  // handle buttons in maintenance approval
  app.action(
    // eslint-disable-next-line prefer-regex-literals
    new RegExp(
      `^(${constants.maintenanceApproval.approveButton})|(${constants.maintenanceApproval.rejectButton})$`
    ),
    async ({ ack, action, client, respond, body }) => {
      await ack();
      // already send HTTP 200 that slack does not time out
      await awsRtAPI.sendResponse();

      const btnAction = /** @type {import("@slack/bolt").ButtonAction} */ (
        action
      );

      /** @type {types.hoursMaintFinalizer} */
      const maintObj = JSON.parse(btnAction.value);

      maintObj.approved = btnAction.action_id.split('-')[1] === 'approve';

      // edit approval message to show final result
      const [year, month, day] = maintObj.date.split('-');
      const date = new Date(Number(year), Number(month) - 1, Number(day));

      await respond(
        `<@${body.user.id}> hat folgende Stunden um ${util.formatTime(
          new Date()
        )} Uhr am ${util.formatDate(new Date())} ${
          maintObj.approved ? '`freigegeben`' : '`abgelehnt`'
        }:\n<@${maintObj.slackId}>: "${maintObj.description}" - ${
          maintObj.hours
        } Stunde${maintObj.hours === 1 ? '' : 'n'} am ${util.formatDate(date)}.`
      );

      // notify requestor
      await client.chat.postMessage(
        controller.getUserMaintainEndMessage(maintObj)
      );

      if (!maintObj.approved) return;

      // update data in sheet
      await controller.saveHours(maintObj);
    }
  );

  //* ******************* Options ********************//
  app.options(
    constants.autoRegisterView.actionNameSelect,
    async ({ ack, options }) => {
      const users = await controller.getAllUsers();

      if (!users) {
        await ack();
        return;
      }

      /** @type {import("@slack/types").PlainTextOption[]} */
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
            value: user.id.toString()
          });
        });

      await ack({
        options: userOptions
      });
    }
  );

  //* ******************* View Submissions ********************//
  app.view(constants.registerView.viewName, async ({ body, ack, client }) => {
    await ack();
    // already send HTTP 200 that slack does not time out
    await awsRtAPI.sendResponse();

    if (
      !body.view.state.values[constants.registerView.blockNameSelect][
        constants.registerView.actionNameSelect
      ].selected_option
    )
      return;

    /** @type {types.registerObj} */
    const registerObj = {
      id: Number(
        body.view.state.values[constants.registerView.blockNameSelect][
          constants.registerView.actionNameSelect
        ].selected_option.value
      ),

      slackId: body.user.id,

      name: body.view.state.values[constants.registerView.blockNameSelect][
        constants.registerView.actionNameSelect
      ].selected_option.text.text
    };

    // register confirmation message
    await client.chat.postMessage(
      await controller.getRegisterConfirmDialog(registerObj)
    );

    // notify user that process has started
    await client.chat.postMessage(
      controller.getUserRegisterStartMessage(registerObj)
    );
  });

  app.view(
    constants.maintainHoursView.viewName,
    async ({ body, ack, client }) => {
      try {
        // build maintenance object
        const obj = controller.getDataFromHoursMaintView(body);

        await ack();
        // already send HTTP 200 that slack does not time out
        await awsRtAPI.sendResponse();

        // maintenance approval request message
        await client.chat.postMessage(
          await controller.getMaintainConfirmDialog(obj)
        );

        // notify user that process has started
        await client.chat.postMessage(
          controller.getUserMaintainStartMessage(obj)
        );
      } catch (error) {
        if (error instanceof SlackViewSubmissionError) {
          await ack(error.getAckObject());
          return;
        }
        throw error;
      }
    }
  );

  //* ******************* Events Submissions ********************//
  app.event('team_join', async ({ event, client }) => {
    // acknowledge event
    awsRtAPI.sendResponse();

    // ignore bot users
    if (event.user && event.user.is_bot) return;

    await client.chat.postMessage(
      await controller.getAutoRegisterMessage(event.user.id)
    );
  });
}
