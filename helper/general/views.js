// imports
import * as util from './util.js';
import { apps } from './apps.js';

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
          text: `Hallo 👋 Ich bin der Schwerathletik Mannheim Service-Bot.\n${
            process.env.APP_ADMIN
              ? `Wenn du Fragen hast oder einen Fehler entdeckt hast wende dich gerne an <@${process.env.APP_ADMIN}>\n`
              : ''
          }Ich habe viele nützliche Funktionen:`
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
  apps.forEach((element) => {
    view.view.blocks.push({
      type: 'divider'
    });

    view.view.blocks = view.view.blocks.concat(element.getHomeView());
  });

  return view;
}
