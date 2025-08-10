import { masterdataService } from '../../general/masterdata/service.js';
import * as awsRtAPI from '../../general/aws-runtime-api.js';

/** @type {import('../../general/types.js').appComponent} */
export const masterdataWorkflowsApp = { setupApp, getHomeView: null };

/**
 * @param {import("@slack/bolt").App} app
 */
function setupApp(app) {
  //* ******************* Workflow Steps ********************//
  app.function('setLeaveDate', async ({ client, inputs, fail, complete }) => {
    // post 200 to acknowledge receipt of workflow step
    await awsRtAPI.sendResponse();

    const leaveDateFormatted = /** @type {string} */ (inputs.leaveDate)
      .split('-')
      .reverse()
      .join('.');

    try {
      await masterdataService.saveLeaveDate(
        { slackId: /** @type {string} */ (inputs.leaveUser) },
        leaveDateFormatted
      );

      // set workflow step to complete
      await complete();
    } catch (error) {
      await fail({
        error: `An error occurred while saving the leave date: ${error.message}`
      });
    }
  });

  app.function('saveNewMember', async ({ inputs, fail, complete }) => {
    // post 200 to acknowledge receipt of workflow step
    await awsRtAPI.sendResponse();

    /** @type {import('../../general/masterdata/types.js').userJoiningDetails} */
    const newMemberInfo = {};

    // extract values from inputs
    Object.keys(inputs).forEach((key) => {
      newMemberInfo[key] = inputs[key];
    });

    try {
      // save to sheet
      await masterdataService.saveNewMember(newMemberInfo);

      // set workflow step to complete
      await complete();
    } catch (error) {
      await fail({
        error: `An error occurred while saving the new member information: ${error.message}`
      });
    }
  });
}
