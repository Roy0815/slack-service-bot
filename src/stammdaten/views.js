import * as constants from './constants.js';

/** @type {import("@slack/types").KnownBlock[]} */
export const homeView = [
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
    block_id: constants.homeViewInputBlockId,
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '/stammdaten',
          emoji: true
        },
        action_id: constants.homeViewCommand
      }
    ]
  }
];

/** @type {import('@slack/types').View} */
export const changeMasterdataView = {
  type: 'modal',
  callback_id: constants.changeMasterdataViewName,
  title: {
    type: 'plain_text',
    text: 'Stammdaten ändern',
    emoji: true
  },
  submit: {
    type: 'plain_text',
    text: 'Speichern',
    emoji: true
  },
  close: {
    type: 'plain_text',
    text: 'Abbrechen',
    emoji: true
  },
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Bitte nur die Felder ausfüllen, die geändert werden sollen :slightly_smiling_face:'
      }
    },
    {
      type: 'input',
      block_id: constants.changeMasterdataViewBlocks.firstname,
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: constants.changeMasterdataViewActions.firstname,
        placeholder: {
          type: 'plain_text',
          text: ''
        }
      },
      label: {
        type: 'plain_text',
        text: 'Vorname',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: constants.changeMasterdataViewBlocks.lastname,
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: constants.changeMasterdataViewActions.lastname,
        placeholder: {
          type: 'plain_text',
          text: ''
        }
      },
      label: {
        type: 'plain_text',
        text: 'Nachname',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: constants.changeMasterdataViewBlocks.email,
      optional: true,
      element: {
        type: 'email_text_input',
        action_id: constants.changeMasterdataViewActions.email,
        placeholder: {
          type: 'plain_text',
          text: ''
        }
      },
      label: {
        type: 'plain_text',
        text: 'Email',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: constants.changeMasterdataViewBlocks.phone,
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: constants.changeMasterdataViewActions.phone,
        placeholder: {
          type: 'plain_text',
          text: ''
        }
      },
      hint: {
        type: 'plain_text',
        text: 'Format: +49162123456',
        emoji: true
      },
      label: {
        type: 'plain_text',
        text: 'Telefonnummer',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: constants.changeMasterdataViewBlocks.street,
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: constants.changeMasterdataViewActions.street,
        placeholder: {
          type: 'plain_text',
          text: ''
        }
      },
      label: {
        type: 'plain_text',
        text: 'Straße',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: constants.changeMasterdataViewBlocks.houseNumber,
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: constants.changeMasterdataViewActions.houseNumber,
        placeholder: {
          type: 'plain_text',
          text: ''
        }
      },
      label: {
        type: 'plain_text',
        text: 'Hausnummer',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: constants.changeMasterdataViewBlocks.city,
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: constants.changeMasterdataViewActions.city,
        placeholder: {
          type: 'plain_text',
          text: ''
        }
      },
      label: {
        type: 'plain_text',
        text: 'Ort',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: constants.changeMasterdataViewBlocks.zip,
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: constants.changeMasterdataViewActions.zip,
        placeholder: {
          type: 'plain_text',
          text: ''
        }
      },
      label: {
        type: 'plain_text',
        text: 'Postleitzahl',
        emoji: true
      }
    }
  ]
};
