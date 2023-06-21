const asApp = require('../arbeitsstunden/app');
const asView = require('../arbeitsstunden/views');

const staetteApp = require('../staette/app');
const staetteView = require('../staette/views');

const pollzApp = require('../pollz/app');
const pollzView = require('../pollz/views');

module.exports = {
  // all of the apps have to contain a function "setupApp" that takes in the bolt app
  apps: [asApp, staetteApp, pollzApp],
  // all of the views have to contain a function "getHomeView" that returns the blocks of their respective home view
  views: [asView, staetteView, pollzView]
};
