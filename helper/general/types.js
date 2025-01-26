/**
 * @callback fnSetup
 * @param {import('@slack/bolt').App} app
 */

/**
 * @callback fnHomeView
 * @returns {import("@slack/bolt").KnownBlock[]}
 */

/**
 * @typedef {object} appComponent
 * @property {fnSetup} setupApp
 * @property {fnHomeView|null} getHomeView
 */

export {};
