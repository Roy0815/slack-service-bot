import * as constants from './constants.js';

/**
 * @type {import("@slack/types").KnownBlock[]}
 * @todo Fill with information regarding this app's functions
 */
export const homeView = [
  {
    type: 'header',
    text: {
      type: 'plain_text',
      text: 'Meldungen-Bot',
      emoji: true
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Home View'
    }
  }
];

/** @type {import('@slack/types').View} */
export const competitionRegistrationView = {
  type: 'modal',
  callback_id: constants.competitionRegistrationView.viewName,
  title: {
    type: 'plain_text',
    text: 'Wettkampfmeldung',
    emoji: true
  },
  submit: {
    type: 'plain_text',
    text: 'Einreichen',
    emoji: true
  },
  close: {
    type: 'plain_text',
    text: 'Abbrechen',
    emoji: true
  },
  blocks: [
    {
      type: 'input',
      block_id: constants.competitionRegistrationView.blockCompetition,
      element: {
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: 'Wähle einen Wettkampf',
          emoji: true
        },
        // Will be overwritten dynamically
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'Testwettkampf',
              emoji: true
            },
            value: 'value-0'
          }
        ]
      },
      label: {
        type: 'plain_text',
        text: 'Wettkampf',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: constants.competitionRegistrationView.blockWeightClass,
      element: {
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: 'Wähle eine Gewichtsklasse',
          emoji: true
        },
        // Will be overwritten dynamically
        options: [
          {
            text: {
              type: 'plain_text',
              text: '-105kg',
              emoji: true
            },
            value: 'value-0'
          }
        ]
      },
      label: {
        type: 'plain_text',
        text: 'Gewichtsklasse',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: constants.competitionRegistrationView.blockHandlerNeeded,
      element: {
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: 'Ja/Nein',
          emoji: true
        },
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'ja',
              emoji: true
            },
            value: 'true'
          },
          {
            text: {
              type: 'plain_text',
              text: 'nein',
              emoji: true
            },
            value: 'false'
          }
        ]
      },
      label: {
        type: 'plain_text',
        text: 'Betreuung Benötigt',
        emoji: true
      }
    }
  ]
};
