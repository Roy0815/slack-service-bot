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
          text: `Hallo 👋\nIch bin der Schwerathletik Mannheim Service-Bot.\n${
            process.env.APP_ADMIN
              ? `Wenn du Fragen hast oder einen Fehler entdeckt hast wende dich gerne an <@${process.env.APP_ADMIN}>\n`
              : ''
          }Solltest du Fehler selber beheben wollen, oder mit an neuen Funktionen arbeiten, schau doch mal mein <https://github.com/Roy0815/slack-service-bot|:github: GitHub Repository> an \n\nIch habe viele nützliche Funktionen:`
        }
      }
    ]
  }
};

/** @type {import("@slack/web-api").ChatPostMessageArguments} */
export const basicConfirmDialogView = {
  channel: '',
  text: '', // Text in the notification, set in the method
  unfurl_links: false,
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '' // set in method
      }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Genehmigen',
            emoji: true
          },
          style: 'primary',
          value: '', // set in method
          action_id: '' // set in method
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Ablehnen',
            emoji: true
          },
          style: 'danger',
          value: '', // set in method
          action_id: '' // set in method
        }
      ]
    }
  ]
};

//* ******************* Functions ********************//
/**
 *
 * @param {import("@slack/types").AppHomeOpenedEvent} event
 * @returns {import("@slack/web-api").ViewsPublishArguments}
 */
export function getHomeView({ user }) {
  const view = util.deepCopy(homeView);

  view.user_id = user;

  // add homeviews of apps
  apps.forEach((element) => {
    if (!element.getHomeView) return;

    view.view.blocks.push({
      type: 'divider'
    });

    view.view.blocks = view.view.blocks.concat(element.getHomeView());
  });

  return view;
}
