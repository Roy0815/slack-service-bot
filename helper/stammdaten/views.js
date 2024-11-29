// imports
import * as util from '../general/util.js';

// constants
export const homeViewCommand = 'stammdaten-home-command';
export const homeViewInputBlockId = 'stammdaten-home-input-block';

//* ******************* Views ********************//
/** @type {import("@slack/bolt").KnownBlock[]} */
const homeView = [
  {
    type: 'header',
    text: {
      type: 'plain_text',
      text: 'Stammdaten anzeigen und pflegen',
      emoji: true
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*`/stammdaten` Kommando:*\nMit diesem Kommando kannst du deine hinterlegten Stammdaten anzeigen und bei Bedarf ändern.\nDazu zählen: Email, Telefonnummer und deine Adresse.\n\nEs wird ein Dialog gestartet, in dem du die Daten ändern kannst. Beim Speichern werden die Daten zur Bestätigung an einen Admin geschickt und du wirst benachrichtigt, sobald die Änderung bestätigt wurde.'
    }
  },
  {
    type: 'actions',
    block_id: homeViewInputBlockId,
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '/stammdaten',
          emoji: true
        },
        action_id: homeViewCommand
      }
    ]
  }
];

//* ******************* Functions ********************//
/**
 *
 * @returns {import("@slack/bolt").KnownBlock[]}
 */
export function getHomeView() {
  return util.deepCopy(homeView);
}
