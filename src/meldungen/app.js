// local imports
import * as controller from './controller.js';

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
    // already send HTTP 200 that slack does not time out
    await awsRtAPI.sendResponse();

    /**
     * @todo Check if user is registered. Error or forward to registration if
     * not
     */

    await client.views.open(
      controller.getCompetitionRegistrationView(command.trigger_id)
    );
  });
}
