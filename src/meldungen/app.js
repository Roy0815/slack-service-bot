// local imports
import * as controller from './controller.js';
import * as constants from './constants.js';
import * as types from './types.js';
import * as util from '../general/util.js';
import * as asController from '../arbeitsstunden/controller.js';
import * as meldungen_sheets from './sheet.js';
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
  app.command('/wettkampf-meldung', async ({ ack, command, client }) => {
    await ack();
    // already send HTTP 200 so slack does not time out
    await awsRtAPI.sendResponse();

    /** @type {masterdataTypes.userContactCard} */
    const user = await masterdataService.getUserContactCardFromId({
      slackId: command.user_id
    })

    // check if user is registered
    if (!(user)) {
      // send the register view to the user
      await client.views.open(
        await asController.getRegisterView(command.trigger_id)
      );
      return;
    }

    await client.views.open(
      await controller.getCompetitionRegistrationView(command.trigger_id, user)
    );
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
        text: 'Dieser Befehl kann nur im <#' + process.env.MELDUNGEN_ADMIN_CHANNEL + '> Kanal verwendet werden.'
      });
      return;
    }

    await client.views.open(
      controller.getCompetitionCreationView(command.trigger_id)
    );

  });

  //* ****************** Views ******************//
  app.view(
    constants.competitionRegistrationView.viewName,
    async ({ body, ack, client }) => {
      await ack();
      // already send HTTP 200 that slack does not time out
      await awsRtAPI.sendResponse();

      const selectedValues = body.view.state.values;

      /** @type {masterdataTypes.user} */
      const user_data_from_sheet = await masterdataService.getUserFromId({slackId: body.user.id});

      /** @type {types.competitionRegistrationData} */
      const competitionRegistrationData = {

        slackID: body.user.id,
        first_name: user_data_from_sheet.firstname,
        last_name: user_data_from_sheet.lastname,
        birthyear: Number(user_data_from_sheet.birthday.slice(-4)),

        competition:
          selectedValues[
            constants.competitionRegistrationView.blockCompetitionSelect
          ][constants.competitionRegistrationView.actionCompetitionSelect]
            .selected_option.value,

        weight_class:
          selectedValues[
            constants.competitionRegistrationView.blockWeightClassSelect
          ][constants.competitionRegistrationView.actionWeightClassSelect]
            .selected_option.value,

        handler_needed:
          selectedValues[
            constants.competitionRegistrationView.blockHandlerNeededSelect
          ][constants.competitionRegistrationView.actionHandlerNeededSelect]
            .selected_option.value,

        payment_record_file_permalink:
          selectedValues[
            constants.competitionRegistrationView.blockPaymentRecordUpload
          ][constants.competitionRegistrationView.actionPaymentRecordUpload]
            .files[0].permalink
      };

      if(competitionRegistrationData.competition === 'waiting_for_competitions'){
        await client.chat.postMessage({
          channel: body.user.id,
          text: 'Es gibt aktuell keine Wettkämpfe, für die du dich anmelden kannst, oder es liegt ein technischer Fehler vor. Bitte versuche es später noch einmal.'});
        return;
      }

      /** @todo */
      /*
      await client.chat.postMessage(
        await controller.getAdminConfirmationDialog(competitionRegistrationData)
      );
      */

      await client.chat.postMessage(
        await controller.getUserConfirmMessageCompetitionCreation(competitionRegistrationData)
      );

    }
  );

  app.view(
    constants.competitionCreationView.viewName,
    async ({ body, ack, client }) => {
      await ack();
      // already send HTTP 200 that slack does not time out
      await awsRtAPI.sendResponse();

      const selectedValues = body.view.state.values;


      // convert selected date to our format
      const dateInput = selectedValues[constants.competitionCreationView.blockCompetitionDate]
      [constants.competitionCreationView.actionCompetitionDate].selected_date;

      const convertedCompetitionDate = util.formatDate(
        /** @type {Date} */
        new Date(dateInput)
      );

      /** @type {types.competitionData} */
      const competitionData = {
        competition_name:
          selectedValues[constants.competitionCreationView.blockCompetitionName]
            [constants.competitionCreationView.actionCompetitionName].value,
        competition_date: convertedCompetitionDate,
        competition_location:
          selectedValues[
            constants.competitionCreationView.blockCompetitionLocation
          ][constants.competitionCreationView.actionCompetitionLocation].value,
        competition_id: '', // will be set later
      };

      /** @todo */
      await meldungen_sheets.createNewCompetition(competitionData);

      // Notify admin channel about new competition and who created it
      await client.chat.postMessage(
        await controller.getAdminConfirmMessageCompetitionCreation(
          competitionData,
          body.user.id
        )
      );

    }
  );

}
