// imports
import * as util from './util';
import { apps } from './apps';

//* ******************* Views ********************//
/** @type {import("@slack/web-api").ViewsPublishArguments} */
const homeView = {
  // Use the user ID associated with the event
  user_id: '',
  view: {
    type: 'home',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Hallo 👋 Ich bin der Schwerathletik Mannheim Service-Bot.\nIch habe viele nützliche Funktionen:'
        }
      }
    ]
  }
};

//* ******************* Functions ********************//
/**
 *
 * @param {import("@slack/bolt").AppHomeOpenedEvent} event
 * @returns {import("@slack/web-api").ViewsPublishArguments}
 */
export function getHomeView({ user }) {
  const view = util.deepCopy(homeView);

  view.user_id = user;

  // add homeviews of apps
  apps.views.forEach((element) => {
    view.view.blocks.push({
      type: 'divider'
    });

    view.view.blocks = view.view.blocks.concat(element.getHomeView());
  });

  return view;
}
