// local imports
import * as constants from './constants.js';

//* ******************* Views ********************//
/** @type {import("@slack/types").View} */
export const pollView = {
  type: 'modal',
  callback_id: constants.viewNames.creationModal,
  title: {
    type: 'plain_text',
    text: 'Neue Umfrage erstellen',
    emoji: true
  },
  submit: {
    type: 'plain_text',
    text: 'Abschicken',
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
      block_id: constants.creationModalBlocks.question,
      element: {
        type: 'plain_text_input',
        action_id: constants.creationModalActions.questionInput
      },
      label: {
        type: 'plain_text',
        text: 'Frage',
        emoji: true
      }
    },
    {
      type: 'divider'
    },
    {
      type: 'input',
      block_id: constants.creationModalBlocks.conversationSelect,
      element: {
        type: 'conversations_select',
        action_id: constants.creationModalActions.conversationSelect,
        default_to_current_conversation: true
      },
      label: {
        type: 'plain_text',
        text: 'Wo soll die Umfrage gesendet werden?',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: constants.creationModalBlocks.options,
      element: {
        type: 'checkboxes',
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'mehrere Antworten auswählbar',
              emoji: true
            },
            value: constants.optionCheckboxes.multipleSelect
          },
          {
            text: {
              type: 'plain_text',
              text: 'Teilnehmer können Optionen hinzufügen',
              emoji: true
            },
            value: constants.optionCheckboxes.addAllowed
          },
          {
            text: {
              type: 'plain_text',
              text: 'Anonym',
              emoji: true
            },
            value: constants.optionCheckboxes.anonym
          }
        ],
        action_id: constants.creationModalActions.options
      },
      optional: true,
      label: {
        type: 'plain_text',
        text: 'Optionen',
        emoji: true
      }
    },
    {
      type: 'divider'
    },
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Antworten',
        emoji: true
      }
    },
    {
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: constants.creationModalActions.newAnswerInput
      },
      block_id: constants.creationModalBlocks.newAnswer,
      optional: true,
      label: {
        type: 'plain_text',
        text: 'Neue Antwort',
        emoji: true
      }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Hinzufügen',
            emoji: true
          },
          value: 'add',
          action_id: constants.creationModalActions.addAnswer
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Alle löschen',
            emoji: true
          },
          style: 'danger',
          value: 'all',
          action_id: constants.creationModalActions.deleteAllAnswers
        }
      ]
    },
    {
      type: 'divider'
    }
  ]
};

/** @type {import('@slack/types').SectionBlock} */
export const answerView = {
  type: 'section',
  text: {
    type: 'mrkdwn',
    text: '' // set in method
  },
  accessory: {
    type: 'button',
    text: {
      type: 'plain_text',
      text: 'Löschen',
      emoji: true
    },
    style: 'danger',
    value: '', // set in method
    action_id: constants.creationModalActions.deleteSingleAnswer
  }
};

/** @type {import("@slack/types").AnyBlock[]} */
export const pollMessageBlocks = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '' // set in the method
    }
  },
  {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: '' // set in the method
      }
    ]
  },
  {
    type: 'divider'
  },
  {
    type: 'divider'
  },
  {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          emoji: true,
          text: 'Antwort hinzufügen'
        },
        // value: "click_me_123",
        action_id: constants.pollMessageActions.addAnswer
      },
      {
        type: 'button',
        style: 'danger',
        text: {
          type: 'plain_text',
          emoji: true,
          text: 'Meine Antwort/en löschen'
        },
        value: '', // store info about options in method here
        action_id: constants.pollMessageActions.deleteAnswer
      },
      {
        type: 'overflow',
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'Ersteller: Umfrage löschen',
              emoji: true
            },
            value: constants.pollMessageActions.overflowDelete // delete-{ admin } (added in method)
          }
        ],
        action_id: constants.pollMessageActions.overflow
      }
    ]
  }
];
/** @type {import("@slack/types").SectionBlock} */
export const answerBlockMessage = {
  type: 'section',
  text: {
    type: 'mrkdwn',
    text: '' // set in method, contains answer option
  },
  accessory: {
    type: 'button',
    text: {
      type: 'plain_text',
      emoji: true,
      text: 'Abstimmen'
    },
    value: '', // set in method, contains answer number and peoples ids (split by -)
    action_id: constants.pollMessageActions.voteButton
  }
};

/** @type {import("@slack/types").View} */
export const addAnswerView = {
  type: 'modal',
  private_metadata: '', // set in method, contains message info
  callback_id: constants.viewNames.addAnswerModal,
  title: {
    type: 'plain_text',
    text: 'Neue Antwort hinzufügen'
  },
  submit: {
    type: 'plain_text',
    text: 'Hinzufügen'
  },
  close: {
    type: 'plain_text',
    text: 'Abbrechen'
  },
  blocks: [
    {
      type: 'input',
      block_id: constants.creationModalBlocks.newAnswer,
      element: {
        type: 'plain_text_input',
        placeholder: {
          type: 'plain_text',
          text: 'Antwort'
        },
        action_id: constants.pollMessageActions.addAnswerViewTextInput
      },
      label: {
        type: 'plain_text',
        text: ' '
      }
    }
  ]
};

/** @type {import("@slack/types").ContextBlock} */
export const resultBlockMessage = {
  type: 'context',
  elements: [
    {
      type: 'mrkdwn',
      text: 'Keine Stimmen' // set in method, contains result (count/people)
    }
  ]
};

/** @type {import("@slack/types").KnownBlock[]} */
export const homeView = [
  {
    type: 'header',
    text: {
      type: 'plain_text',
      text: 'Umfragen stellen',
      emoji: true
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*`/umfrage [Frage]` Kommando:*\nMit diesem Kommando kannst du eine Umfrage starten. Es öffnet sich ein Popup, in dem du die Optionen und Antworten einstellen kannst.\nAußerden kannst du optional direkt die Frage mitgeben.\nWillst du eine Umfrage zuerst testen, schicke sie an den Channel mit deinem Namen.\nBeispiel: `/umfrage Wer will mit Pizza bestellen?`'
    }
  },
  {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '/umfrage',
          emoji: true
        },
        action_id: constants.homeViewCommand
      }
    ]
  }
];
