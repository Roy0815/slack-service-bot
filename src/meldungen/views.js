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
      block_id: constants.competitionRegistrationView.blockCompetitionSelect,
      element: {
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: 'Wähle einen Wettkampf',
          emoji: true
        },

        options: [],
        action_id: constants.competitionRegistrationView.actionCompetitionSelect
      },
      label: {
        type: 'plain_text',
        text: 'Wettkampf',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: constants.competitionRegistrationView.blockWeightClassSelect,
      element: {
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: 'Wähle eine Gewichtsklasse',
          emoji: true
        },
        // Will be overwritten dynamically
        options: [],
        action_id: constants.competitionRegistrationView.actionWeightClassSelect
      },
      label: {
        type: 'plain_text',
        text: 'Gewichtsklasse',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: constants.competitionRegistrationView.blockHandlerNeededSelect,
      element: {
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: 'Ja/Nein',
          emoji: true
        },
        options: [],
        action_id:
          constants.competitionRegistrationView.actionHandlerNeededSelect
      },
      label: {
        type: 'plain_text',
        text: 'Betreuung Benötigt',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: constants.competitionRegistrationView.blockPaymentRecordUpload,
      element: {
        type: 'file_input',
        action_id:
          constants.competitionRegistrationView.actionPaymentRecordUpload,
        filetypes: ['jpg', 'png', 'pdf'],
        max_files: 1
      },
      label: {
        type: 'plain_text',
        text: 'Zahlungsnachweis'
      }
    }
  ]
};
