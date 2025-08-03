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
    // set workflow step to complete
    await complete();

    // post 200 already to not wait for drive upload
    await awsRtAPI.sendResponse();

    const leaveDateFormatted = /** @type {string} */ (inputs.leaveDate)
      .split('-')
      .reverse()
      .join('.');

    await masterdataService.saveLeaveDate(
      { slackId: /** @type {string} */ (inputs.leaveUser) },
      leaveDateFormatted
    );
  });

  app.function('saveNewMember', async ({ inputs, complete }) => {
    // set workflow step to complete
    await complete();

    // post 200 already to not wait for drive upload
    await awsRtAPI.sendResponse();

    console.log('Saving new member information:', inputs);

    /** @type {import('../../general/masterdata/types.js').userJoiningDetails} */
    const newMemberInfo = {};

    // extract values from inputs
    Object.keys(inputs).forEach((key) => {
      newMemberInfo[key] = inputs[key];
    });

    // save to sheet
    await masterdataService.saveNewMember(newMemberInfo);
  });
}
