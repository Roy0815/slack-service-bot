import * as asApp from '../arbeitsstunden/app';
import * as asView from '../arbeitsstunden/views';

import * as staetteApp from '../staette/app';
import * as staetteView from '../staette/views';

import * as pollzApp from '../pollz/app';
import * as pollzView from '../pollz/views';

export const apps = {
  // all of the apps have to contain a function "setupApp" that takes in the bolt app
  apps: [asApp, staetteApp, pollzApp],
  // all of the views have to contain a function "getHomeView" that returns the blocks of their respective home view
  views: [asView, staetteView, pollzView]
};
