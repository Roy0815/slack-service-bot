// imports
// import * as util from '../general/util.js';
import * as views from './views.js';

/** @type {import('../general/types').appComponent} */
export const stammdatenApp = { setupApp, getHomeView: views.getHomeView };

/**
 * @param {import("@slack/bolt").App} app
 */
export function setupApp(app) {
  //* ******************* Commands ********************//
  app.command('/stammdaten', async ({ command, ack, client, respond }) => {
    await ack();
  });
}
