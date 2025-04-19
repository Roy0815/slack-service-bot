// local imports
import * as controller from './controller.js';
import * as constants from './constants.js';
import * as types from './types.js';

import * as awsRtAPI from '../general/aws-runtime-api.js';

/** @type {import('../general/types.js').appComponent} */
export const meldungenApp = { setupApp, getHomeView: controller.getHomeView };

/**
 * @param {import("@slack/bolt").App} app
 */
function setupApp(app) {
  // Allow a user to register for a competition
  app.command('/wettkampf-meldung', async ({ ack, command, client }) => {
    await ack();
    // already send HTTP 200 so slack does not time out
    await awsRtAPI.sendResponse();

    /**
     * @todo Check if user is registered. Error or forward to registration if
     * not
     */

    await client.views.open(
      controller.getCompetitionRegistrationView(command.trigger_id)
    );
  });

  app.view(
    constants.competitionRegistrationView.viewName,
    async ({ body, ack, client }) => {
      await ack();
      // already send HTTP 200 that slack does not time out
      await awsRtAPI.sendResponse();

      const selectedValues = body.view.state.values;


      /** @type {types.competitionRegistrationData} */
      const competitionRegistrationData = {
        first_name: 'test',
        last_name: 'test',
        birthyear: 1000,

        competition: selectedValues[constants.competitionRegistrationView.blockCompetitionSelect]
        [constants.competitionRegistrationView.actionCompetitionSelect].selected_option.value,

        weight_class: selectedValues[constants.competitionRegistrationView.blockWeightClassSelect]
        [constants.competitionRegistrationView.actionWeightClassSelect].selected_option.value,

        handler_needed: selectedValues[constants.competitionRegistrationView.blockHandlerNeededSelect]
        [constants.competitionRegistrationView.actionHandlerNeededSelect].selected_option.value
      };

      console.log(competitionRegistrationData);
    }
  );
}
