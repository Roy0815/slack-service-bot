import { googledriveWorkflowsApp } from './googledrive/app.js';
import { masterdataWorkflowsApp } from './masterdata/app.js';

/** @type {import('../general/types.js').appComponent} */
export const workflowsApp = { setupApp, getHomeView: null };

/**
 * @param {import("@slack/bolt").App} app
 */
function setupApp(app) {
  googledriveWorkflowsApp.setupApp(app);
  masterdataWorkflowsApp.setupApp(app);
}
