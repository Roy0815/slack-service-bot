// imports
import * as views from './views.js';
import * as masterdataSheet from '../general/google-amazon-utility/masterdata-sheet.js';
import * as asViews from '../arbeitsstunden/views.js';
import * as types from '../general/google-amazon-utility/types.js';
import * as util from '../general/util.js';

import * as awsRtAPI from '../general/google-amazon-utility/aws-runtime-api.js';

/** @type {import('../general/types').appComponent} */
export const stammdatenApp = { setupApp, getHomeView: views.getHomeView };

/**
 * @param {import("@slack/bolt").App} app
 */
export function setupApp(app) {
  //* ******************* Commands ********************//
  app.command('/stammdaten', async ({ command, ack, client }) => {
    await ack();

    // already send HTTP 200 that slack does not time out
    await awsRtAPI.sendResponse();

    // check if user is registered
    if (
      !(await masterdataSheet.getUserContactCard({ slackId: command.user_id }))
    ) {
      // send the register view to the user
      await client.views.open(
        await asViews.getRegisterView(command.trigger_id)
      );
      return;
    }

    // open masterdata change view
    await client.views.open({
      trigger_id: command.trigger_id,
      view: await views.getChangeMasterdataView(command.user_id)
    });
  });

  //* ******************* View Submissions ********************//
  app.view(views.changeMasterdataViewName, async ({ body, ack, client }) => {
    // check inputs: phone number filled and correct format. Accept +xx notation as well as 0xx
    if (
      body.view.state.values[views.changeMasterdataViewBlocks.phone][
        views.changeMasterdataViewActions.phone
      ].value &&
      !/^(\++|0{1})\d*$/.test(
        body.view.state.values[views.changeMasterdataViewBlocks.phone][
          views.changeMasterdataViewActions.phone
        ].value
      )
    ) {
      // send error to user
      await ack({
        response_action: 'errors',
        errors: {
          [views.changeMasterdataViewBlocks.phone]:
            `Bitte die Telefonnummer im korrekten Format eingeben`
        }
      });
      return;
    }

    /** @type {types.approvalObject} */
    let maintObj = { slackId: '' };

    // inputs checked here as well
    try {
      maintObj = views.buildMaintainObject(body);
    } catch (error) {
      // send error to user
      await ack({
        response_action: 'errors',
        errors: {
          [views.changeMasterdataViewBlocks.firstname]: error.toString()
        }
      });
      return;
    }

    await ack();
    // already send HTTP 200 that slack does not time out
    await awsRtAPI.sendResponse();

    // get change message
    const changeMessage = await views.getChangesMessage(maintObj);

    // send request to admins
    await client.chat.postMessage(
      await views.getMaintainConfirmDialog(maintObj, changeMessage)
    );

    // send process start message to requestor
    await client.chat.postMessage({
      channel: maintObj.slackId,
      text: `Deine Stammdatenänderungen wurden zur Freigabe weitergeleitet. Du wirst informiert, sobald die Änderungen freigegeben wurden:${changeMessage}\n\nSolltest du die Anfrage zurückziehen wollen, wende dich bitte an <@${process.env.APP_ADMIN}>.`
    });
  });

  //* ******************* Actions ********************//
  // home view button
  app.action(views.homeViewCommand, async ({ ack, client, body }) => {
    await ack();
    // already send HTTP 200 that slack does not time out
    await awsRtAPI.sendResponse();

    // check if user is registered
    if (
      !(await masterdataSheet.getUserContactCard({ slackId: body.user.id }))
    ) {
      // send the register view to the user
      await client.views.open(
        await asViews.getRegisterView(
          /** @type {import("@slack/bolt").BlockAction} */ (body).trigger_id
        )
      );
      return;
    }

    // open masterdata change view
    await client.views.open({
      trigger_id: /** @type {import("@slack/bolt").BlockAction} */ (body)
        .trigger_id,
      view: await views.getChangeMasterdataView(body.user.id)
    });
  });

  // handle buttons in approval
  app.action(
    // eslint-disable-next-line prefer-regex-literals
    new RegExp(
      `^(${views.approvalActions.approve})|(${views.approvalActions.reject})$`
    ),
    async ({ ack, action, client, respond, body }) => {
      await ack();
      // already send HTTP 200 that slack does not time out
      await awsRtAPI.sendResponse();

      /** @type {types.approvalObject} */
      const maintObj = JSON.parse(
        /** @type {import("@slack/bolt").ButtonAction} */ (action).value
      );

      const approved =
        /** @type {import("@slack/bolt").ButtonAction} */ (action).action_id ===
        views.approvalActions.approve;

      // get change message
      const changeMessage = await views.getChangesMessage(maintObj);

      // edit approval message to show final result
      await respond(
        `<@${body.user.id}> hat folgende Stammdatenänderung um ${util.formatTime(
          new Date()
        )} Uhr am ${util.formatDate(new Date())} ${
          approved ? '`freigegeben`' : '`abgelehnt`'
        }:\n<@${maintObj.slackId}>${changeMessage}.`
      );

      // notify requestor
      await client.chat.postMessage({
        channel: maintObj.slackId,
        text: `Deine Stammdatenänderungen wurden ${approved ? '`freigegeben`' : '`abgelehnt`'}:${changeMessage}`
      });

      if (!approved) return;

      // update data in sheet
      await masterdataSheet.saveMasterdataChanges(maintObj);
    }
  );
}
