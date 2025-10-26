// local imports
import * as controller from './controller.js';
import * as constants from './constants.js';
import * as types from './types.js';
import * as util from '../general/util.js';
import * as asController from '../arbeitsstunden/controller.js';
import * as meldungenSheets from './sheet.js';
import { masterdataService } from '../general/masterdata/service.js';
import * as masterdataTypes from '../general/masterdata/types.js';
import * as awsRtAPI from '../general/aws-runtime-api.js';

/** @type {import('../general/types.js').appComponent} */
export const meldungenApp = { setupApp, getHomeView: controller.getHomeView };

/**
 * @param {import("@slack/bolt").App} app
 */
function setupApp(app) {
  //* ****************** Commands ******************//
  // Allow a user to register for a competition
  app.command('/meldung', async ({ ack, command, client }) => {
    await ack();
    // already send HTTP 200 so slack does not time out
    await awsRtAPI.sendResponse();

    /** @type {masterdataTypes.user} */
    const user = await masterdataService.getUserFromId({
      slackId: command.user_id
    });

    /** @todo do i need to await? */
    await meldungCommand(client, command.trigger_id, command.channel_id, user);
  });

  // Create a new competition
  app.command('/wettkampf-erstellen', async ({ ack, command, client }) => {
    await ack();
    // already send HTTP 200 so slack does not time out
    await awsRtAPI.sendResponse();

    // check if command was sent from meldungen admin channel
    if (command.channel_id !== process.env.MELDUNGEN_ADMIN_CHANNEL) {
      await client.chat.postMessage({
        channel: command.user_id,
        text:
          'Dieser Befehl kann nur im <#' +
          process.env.MELDUNGEN_ADMIN_CHANNEL +
          '> Kanal verwendet werden.'
      });
      return;
    }

    await client.views.open(
      controller.getCompetitionCreationView(command.trigger_id)
    );
  });

  //* ****************** Views ******************//
  // Runs when the /meldung form is submitted
  app.view(
    constants.competitionRegistrationView.viewName,
    async ({ body, ack, client }) => {
      await ack();
      // already send HTTP 200 that slack does not time out
      await awsRtAPI.sendResponse();

      /** User inputs into modal */
      const selectedValues = body.view.state.values;

      /** @type {masterdataTypes.user} */
      const userDataFromSheet = await masterdataService.getUserFromId({
        slackId: body.user.id
      });

      /** @type {types.competitionRegistrationData} */
      const competitionRegistrationData =
        await controller.extractCompetitionRegistrationData(
          selectedValues,
          userDataFromSheet
        );

      if (
        (await controller.saveCompetitionRegistration(
          competitionRegistrationData
        )) === false
      ) {
        await client.chat.postMessage({
          channel: body.user.id,
          text:
            `Du hast dich bereits für diesen Wettkampf angemeldet. ` +
            `<https://docs.google.com/spreadsheets/d/${process.env.SPREADSHEET_ID_MELDUNGEN}/edit#gid=${competitionRegistrationData.competition.ID}|${competitionRegistrationData.competition.name}>\n\n` +
            `Bitte kontaktiere uns, wenn du deine Anmeldung ändern möchtest.\n` +
            `kdk@schwerathletik-mannheim.de`
        });
        return;
      }

      // Send to admin channel for validation
      await client.chat.postMessage(
        await controller.getAdminConfirmMessageCompetitionRegistration(
          competitionRegistrationData
        )
      );

      // Send confirmation message to user
      await client.chat.postMessage(
        await controller.getUserConfirmMessageCompetitionCreation(
          competitionRegistrationData
        )
      );
    }
  );

  // Runs when the /wettkampf-erstellen form is submitted
  app.view(
    constants.competitionCreationView.viewName,
    async ({ body, ack, client }) => {
      try {
        await ack();
        // already send HTTP 200 that slack does not time out
        await awsRtAPI.sendResponse();

        const selectedValues = body.view.state.values;

        // convert selected date to our format
        const dateInput =
          selectedValues[
            constants.competitionCreationView.blockCompetitionDate
          ][constants.competitionCreationView.actionCompetitionDate]
            .selected_date;

        const convertedCompetitionDate = util.formatDate(
          /** @type {Date} */
          new Date(dateInput)
        );

        /** @type {types.competitionData} */
        const competitionData = {
          name: selectedValues[
            constants.competitionCreationView.blockCompetitionName
          ][constants.competitionCreationView.actionCompetitionName].value,
          date: convertedCompetitionDate,
          location:
            selectedValues[
              constants.competitionCreationView.blockCompetitionLocation
            ][constants.competitionCreationView.actionCompetitionLocation]
              .value,
          ID: '' // will be set later
        };

        if (
          (await meldungenSheets.createNewCompetition(competitionData)) ===
          false
        ) {
          await client.chat.postMessage({
            channel: body.user.id,
            text:
              `Wettkampf erstellen fehlgeschlagen!\n\n` +
              `Ein Wettkampf mit diesen Daten:\n` +
              `\t*Name:* ${competitionData.name}\n` +
              `\t*Datum:* ${competitionData.date}\n` +
              `\t*Ort:* ${competitionData.location}\n` +
              `existiert bereits!`
          });
          return;
        }

        // Notify admin channel about new competition and who created it
        await client.chat.postMessage(
          await controller.getAdminConfirmMessageCompetitionCreation(
            competitionData,
            body.user.id
          )
        );
      } catch (err) {
        console.error('Unexpected error before or after ack:', err);
      }
    }
  );

  //* ****************** Actions ******************//
  app.action(
    constants.homeView.actionMeldungInput,
    async ({ ack, body, client, action }) => {
      await ack();
      // already send HTTP 200 that slack does not time out
      await awsRtAPI.sendResponse();

      /** @type {masterdataTypes.user} */
      const user = await masterdataService.getUserFromId({
        slackId: body.user.id
      });

      const blockAction = /** @type {import("@slack/bolt").BlockAction} */ (
        body
      );

      /** @todo do i need to await? */
      await meldungCommand(client, blockAction.trigger_id, body.user.id, user);
    }
  );

  app.action(
    new RegExp(
      `^(${constants.competitionRegistrationAdminActions.confirm})|(${constants.competitionRegistrationAdminActions.deny})$`
    ),
    async ({ ack, body, client, action }) => {
      await ack();
      // already send HTTP 200 that slack does not time out
      await awsRtAPI.sendResponse();

      // get the competition registration data from the action value
      const btnAction = /** @type {import("@slack/bolt").ButtonAction} */ (
        action
      );

      const blockAction = /** @type {import("@slack/bolt").BlockAction} */ (
        body
      );

      /** @type {constants.competitionRegistrationAdminActions} */
      const actionID = btnAction.action_id;

      /** @type {types.competitionRegistrationData} */
      const competitionRegistrationData = JSON.parse(btnAction.value);

      /** @type {string} Text that depends on the which button was pressed */
      let actionSpecificText;

      switch (actionID) {
        case constants.competitionRegistrationAdminActions.confirm:
          actionSpecificText = `*angenommen*:heavy_check_mark:`;
          break;
        case constants.competitionRegistrationAdminActions.deny:
          actionSpecificText = `*Abgelehnt*:x:. Bitte wende dich an per mail an kdk@schwerathletik-mannheim.de`;
          break;
      }

      // Notify user
      await client.chat.postMessage({
        channel: competitionRegistrationData.slackID,
        text: `Deine Wettkampfmeldung wurde von <@${blockAction.user.id}> ${actionSpecificText}.`
      });

      switch (actionID) {
        case constants.competitionRegistrationAdminActions.confirm:
          actionSpecificText = `:heavy_check_mark: *angenommen*`;
          break;
        case constants.competitionRegistrationAdminActions.deny:
          actionSpecificText = `:x: *Abgelehnt*`;
          break;
      }

      // Update the admin message
      const blocks = blockAction.message.blocks.slice(0, -2); // Remove the last block (actions)
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${actionSpecificText} von <@${blockAction.user.id}>`
          }
        ]
      });

      await client.chat.update({
        channel: blockAction.channel.id,
        ts: blockAction.message.ts,
        blocks,
        text: `Die Wettkampfmeldung von <@${competitionRegistrationData.slackID}> wurde durch <@${blockAction.user.id}> ${actionSpecificText}.`
      });

      let competitionRegistrationState;
      switch (actionID) {
        case constants.competitionRegistrationAdminActions.confirm:
          competitionRegistrationState =
            constants.competitionRegistrationState.okay;
          break;
        case constants.competitionRegistrationAdminActions.deny:
          competitionRegistrationState =
            constants.competitionRegistrationState.problem;
          break;
      }

      // update the row in the competition sheet with the new state
      await meldungenSheets.updateCompetitionRegistrationState(
        competitionRegistrationData,
        competitionRegistrationState
      );
    }
  );
}

/**
 *
 * @param {import("@slack/bolt").webApi.WebClient} client
 * @param {string} triggerId
 * @param {string} channelID
 * @param {masterdataTypes.user} user
 * @returns {Promise<void>}
 */
async function meldungCommand(client, triggerId, channelID, user) {
  // check if user is registered
  if (!user) {
    // send the register view to the user
    await client.views.open(await asController.getRegisterView(triggerId));
    return;
  }

  try {
    await client.views.open(
      await controller.getCompetitionRegistrationView(triggerId, user)
    );
  } catch (NoCompetitionsFoundError) {
    // Happens when the user selects the placeholder option.
    // The placeholder option only appears when there are no competitions available
    await client.chat.postMessage({
      channel: channelID,
      text: 'Es gibt aktuell keine Wettkämpfe, für die du dich anmelden kannst, oder es liegt ein technischer Fehler vor. Bitte versuche es später noch einmal.'
    });
  }
}
