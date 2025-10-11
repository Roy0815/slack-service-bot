import * as awsRtAPI from '../../general/aws-runtime-api.js';

/** @type {import('../../general/types.js').appComponent} */
export const utilityWorkflowsApp = { setupApp, getHomeView: null };

/**
 * @param {import("@slack/bolt").App} app
 */
function setupApp(app) {
  //* ******************* Workflow Steps ********************//
  app.function('formatDate', async ({ client, inputs, fail, complete }) => {
    // post 200 to acknowledge receipt of workflow step
    await awsRtAPI.sendResponse();

    let sourceDate = /** @type {string} */ (inputs.date);
    let outputFormat = /** @type {string} */ (inputs.format);

    const [year, month, day] = sourceDate.split('-');

    await complete({
      outputs: {
        formattedDate: 
          outputFormat.replace(/YYYY/g, year)
          .replace(/MM/g, month)
          .replace(/DD/g, day)
      }
    });
  });
}
