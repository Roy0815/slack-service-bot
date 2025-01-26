// local imports
import * as util from '../general/util.js';

//* ******************* Constants ********************//
/**
 * @readonly
 * @enum {string}
 */
export const viewNames = {
  creationModal: 'pollz-pollView',
  addAnswerModal: 'pollz-addAnswerView'
};

// Creation Modal
/**
 * @readonly
 * @enum {string}
 */
export const creationModalBlocks = {
  question: 'pollz-questionBlock',
  conversationSelect: 'pollz-conversationSelectBlock',
  options: 'pollz-optionsBlock',
  newAnswer: 'pollz-newAnswerBlock'
};

/**
 * @readonly
 * @enum {string}
 */
export const creationModalActions = {
  questionInput: 'pollz-question_input-action',
  conversationSelect: 'pollz-conversations_select-action',
  options: 'pollz-options-action',
  newAnswerInput: 'pollz-newAnswerInput-action',
  addAnswer: 'pollz-add-answer',
  deleteSingleAnswer: 'pollz-delete-single-answer',
  deleteAllAnswers: 'pollz-delete-all-answers'
};

/**
 * @readonly
 * @enum {string}
 */
const optionCheckboxes = {
  addAllowed: 'addoptions',
  multipleSelect: 'multiplechoice',
  anonym: 'anon'
};

// Poll Message
/**
 * @readonly
 * @enum {string}
 */
export const pollMessageActions = {
  addAnswer: 'pollz-message-add-answer',
  deleteAnswer: 'pollz-message-delete-answer',
  overflow: 'pollz-message-overflow',
  overflowDelete: 'delete',
  voteButton: 'pollz-vote',
  addAnswerViewTextInput: 'pollz-addAnswerViewTextInput'
};

// home view
export const homeViewCommand = 'pollz-home-command';

//* ******************* Views ********************//
/** @type {import("@slack/web-api").ViewsOpenArguments|import("@slack/web-api").ViewsUpdateArguments} */
const pollView = {
  // trigger_id: "",
  view: {
    type: 'modal',
    callback_id: viewNames.creationModal,
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
        block_id: creationModalBlocks.question,
        element: {
          type: 'plain_text_input',
          action_id: creationModalActions.questionInput
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
        block_id: creationModalBlocks.conversationSelect,
        element: {
          type: 'conversations_select',
          action_id: creationModalActions.conversationSelect,
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
        block_id: creationModalBlocks.options,
        element: {
          type: 'checkboxes',
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'mehrere Antworten auswählbar',
                emoji: true
              },
              value: optionCheckboxes.multipleSelect
            },
            {
              text: {
                type: 'plain_text',
                text: 'Teilnehmer können Optionen hinzufügen',
                emoji: true
              },
              value: optionCheckboxes.addAllowed
            },
            {
              text: {
                type: 'plain_text',
                text: 'Anonym',
                emoji: true
              },
              value: optionCheckboxes.anonym
            }
          ],
          action_id: creationModalActions.options
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
          action_id: creationModalActions.newAnswerInput
        },
        block_id: creationModalBlocks.newAnswer,
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
            action_id: creationModalActions.addAnswer
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
            action_id: creationModalActions.deleteAllAnswers
          }
        ]
      },
      {
        type: 'divider'
      }
    ]
  }
};

/** @type {import('@slack/bolt').SectionBlock} */
const answerView = {
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
    action_id: creationModalActions.deleteSingleAnswer
  }
};

/** @type {import("@slack/web-api").ChatPostMessageArguments} */
const pollMessage = {
  channel: '',
  text: '', // Text in the notification, set in the method
  emoji: true,
  unfurl_links: false,
  blocks: [
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
          action_id: pollMessageActions.addAnswer
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
          action_id: pollMessageActions.deleteAnswer
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
              value: pollMessageActions.overflowDelete // delete-{ admin } (added in method)
            }
          ],
          action_id: pollMessageActions.overflow
        }
      ]
    }
  ]
};

/** @type {import("@slack/bolt").SectionBlock} */
const answerBlockMessage = {
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
    action_id: pollMessageActions.voteButton
  }
};

/** @type {import("@slack/web-api").ViewsOpenArguments} */
const addAnswerView = {
  trigger_id: '', // set in method
  view: {
    type: 'modal',
    private_metadata: '', // set in method, contains message info
    callback_id: viewNames.addAnswerModal,
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
        block_id: creationModalBlocks.newAnswer,
        element: {
          type: 'plain_text_input',
          placeholder: {
            type: 'plain_text',
            text: 'Antwort'
          },
          action_id: pollMessageActions.addAnswerViewTextInput
        },
        label: {
          type: 'plain_text',
          text: ' '
        }
      }
    ]
  }
};

/** @type {import("@slack/bolt").ContextBlock} */
const resultBlockMessage = {
  type: 'context',
  elements: [
    {
      type: 'mrkdwn',
      text: 'Keine Stimmen' // set in method, contains result (count/people)
    }
  ]
};

/** @type {import("@slack/bolt").KnownBlock[]} */
const homeView = [
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
        action_id: homeViewCommand
      }
    ]
  }
];

//* ******************* Functions ********************//
/**
 * get Popup for creation
 * @param {object} command
 * @param {string} command.trigger_id
 * @param {string} [command.text]
 * @returns {import('@slack/web-api').ViewsOpenArguments}
 */
// eslint-disable-next-line camelcase
export function getPollsView({ trigger_id, text }) {
  const view = util.deepCopy(
    /** @type {import('@slack/web-api').ViewsOpenArguments} */ (pollView)
  );

  // eslint-disable-next-line camelcase
  view.trigger_id = trigger_id;

  if (!text || text !== '') {
    const element = /** @type {import('@slack/bolt').InputBlock} */ (
      view.view.blocks[0]
    ).element;

    /** @type {import('@slack/bolt').PlainTextInput } */
    (element).initial_value = text;
  }

  return view;
}

/**
 * Add answer to popup poll
 * @param {import('@slack/bolt').ViewOutput} view
 * @returns {import('@slack/web-api').ViewsUpdateArguments}
 */
export function addAnswer({ id, hash, blocks, state }) {
  const view = util.deepCopy(pollView);

  view.view_id = id;
  view.hash = hash;

  view.view.blocks = blocks;

  const newAnswerView = util.deepCopy(answerView);

  newAnswerView.text.text =
    state.values[creationModalBlocks.newAnswer][
      creationModalActions.newAnswerInput
    ].value;

  /** @type {import('@slack/bolt').Button } */
  (newAnswerView.accessory).value = `${view.view.blocks.length + 1}`;

  view.view.blocks.push(newAnswerView);

  return view;
}

/**
 * delete one or all answers from popup poll
 * @param {import('@slack/bolt').ViewOutput} view
 * @param {import('@slack/bolt').ButtonAction  } action
 * @returns {import('@slack/web-api').ViewsUpdateArguments}
 */
export function deleteAnswer({ id, hash, blocks }, { value }) {
  const view = util.deepCopy(pollView);

  view.view_id = id;
  view.hash = hash;

  if (value === 'all') {
    // delete all
    view.view.blocks = blocks.filter((block) => {
      const sectionBlock =
        /** @type {import('@slack/bolt').SectionBlock} */
        (block);

      return (
        !sectionBlock.accessory ||
        /** @type {import('@slack/bolt').Button } */
        (sectionBlock.accessory).action_id !==
          creationModalActions.deleteSingleAnswer
      );
    });
  } else {
    // delete selected
    view.view.blocks = blocks.filter((block) => {
      const sectionBlock =
        /** @type {import('@slack/bolt').SectionBlock} */
        (block);

      return (
        !sectionBlock.accessory ||
        /** @type {import('@slack/bolt').Button } */
        (sectionBlock.accessory).value !== value
      );
    });

    // adapt values
    view.view.blocks.forEach((block, index) => {
      const sectionBlock =
        /** @type {import('@slack/bolt').SectionBlock} */
        (block);

      if (
        sectionBlock.accessory &&
        /** @type {import('@slack/bolt').Button } */
        (sectionBlock.accessory).action_id ===
          creationModalActions.deleteSingleAnswer
      ) {
        /** @type {import('@slack/bolt').Button } */
        (sectionBlock.accessory).value = `${index + 1}`;
      }
    });
  }

  return view;
}

/**
 * Get initial poll message after sending poll
 * @param {import('@slack/bolt').SlackViewAction} viewAction
 * @returns {import('@slack/web-api').ChatPostMessageArguments}
 */
export function getPollMessage({ user, view }) {
  const retView = util.deepCopy(pollMessage);

  // block castings
  const actionsBlock =
    /** @type {import('@slack/bolt').ActionsBlock} */
    (retView.blocks[4]);

  const contextBlock =
    /** @type {import('@slack/bolt').ContextBlock} */
    (retView.blocks[1]);

  // elements of block castings
  const contextElement =
    /** @type {import('@slack/bolt').MrkdwnElement } */
    (contextBlock.elements[0]);

  const actionsElementIdx1 =
    /** @type {import('@slack/bolt').Button } */
    (actionsBlock.elements[1]);

  // set question
  retView.text =
    view.state.values[creationModalBlocks.question][
      creationModalActions.questionInput
    ].value;

  // set text in Message
  /** @type {import('@slack/bolt').SectionBlock} */
  (retView.blocks[0]).text.text = `Neue Umfrage von <@${user.id}>\n*${
    view.state.values[creationModalBlocks.question][
      creationModalActions.questionInput
    ].value
  }*`;

  // set channel
  retView.channel =
    view.state.values[creationModalBlocks.conversationSelect][
      creationModalActions.conversationSelect
    ].selected_conversation;

  // store admin in overflow button
  /** @type {import('@slack/bolt').Overflow } */
  (actionsBlock.elements[2]).options[0].value += `-${user.id}`;

  // -- set options --//
  // anonymous
  let option = view.state.values[creationModalBlocks.options][
    creationModalActions.options
  ].selected_options.find((option) => option.value === optionCheckboxes.anonym);

  // set text
  contextElement.text = option ? 'Anonym' : 'nicht Anonym';
  if (option) {
    // set value to store
    actionsElementIdx1.value = optionCheckboxes.anonym;
  }

  // multiple select
  option = view.state.values[creationModalBlocks.options][
    creationModalActions.options
  ].selected_options.find(
    (option) => option.value === optionCheckboxes.multipleSelect
  );

  if (option) {
    // set text
    contextElement.text += ', mehrere Antworten auswählbar';
    // set value to store
    actionsElementIdx1.value += optionCheckboxes.multipleSelect;
  } else contextElement.text += ', eine Antwort auswählbar';

  // make sure value is not initial
  if (actionsElementIdx1.value === '') actionsElementIdx1.value = '_';

  // add answers
  option = view.state.values[creationModalBlocks.options][
    creationModalActions.options
  ].selected_options.find(
    (option) => option.value === optionCheckboxes.addAllowed
  );

  if (!option) actionsBlock.elements.shift(); // remove button if not selected

  // set answers
  view.blocks
    .filter((block) => {
      const sectionBlock =
        /** @type {import('@slack/bolt').SectionBlock} */
        (block);

      return (
        sectionBlock.accessory &&
        /** @type {import('@slack/bolt').Button} */
        (sectionBlock.accessory).action_id ===
          creationModalActions.deleteSingleAnswer
      );
    })
    .forEach((block, index) => {
      const answerView = util.deepCopy(answerBlockMessage);

      /** @type {import('@slack/bolt').Button} */
      (answerView.accessory).value = `${index}`;

      answerView.text.text = `*${
        /** @type {import('@slack/bolt').SectionBlock} */
        (block).text.text
      }*`;

      const resultView = util.deepCopy(resultBlockMessage);

      retView.blocks.splice(3 + index * 2, 0, answerView, resultView);
    });

  return retView;
}

/**
 *
 * @param {import('@slack/bolt').SlackViewAction} viewAction
 * @returns {boolean} check if answers exist if no adding is allowed
 */
export function answerOptionsValid({ view }) {
  const answers = view.blocks.filter((block) => {
    const sectionBlock =
      /** @type {import('@slack/bolt').SectionBlock} */
      (block);

    return (
      sectionBlock.accessory &&
      /** @type {import('@slack/bolt').Button} */
      (sectionBlock.accessory).action_id ===
        creationModalActions.deleteSingleAnswer
    );
  });

  if (answers.length === 0) {
    // check options
    const addAnswers = view.state.values[creationModalBlocks.options][
      creationModalActions.options
    ].selected_options.filter(
      (option) => option.value === optionCheckboxes.addAllowed
    );

    // add Options not selected: error
    if (addAnswers.length === 0) {
      return false;
    }
  }

  return true;
}

// action = undefined means delete all answers of user
/**
 * vote, remove vote and remove all votes of user
 * @param {import("@slack/bolt").BlockAction} body
 * @param {import("@slack/bolt").ButtonAction} [action]
 * @returns {import("@slack/bolt").RespondArguments}
 */
export function vote({ message, user }, action) {
  /** @type {import("@slack/bolt").RespondArguments} */
  const view = util.deepCopy(pollMessage);

  // take over all information
  view.text = message.text;
  view.blocks = message.blocks;

  // get options from "delete my answers" button
  const options =
    /** @type {import('@slack/bolt').Button} */
    (
      /** @type {import('@slack/bolt').ActionsBlock} */
      (view.blocks[view.blocks.length - 1]).elements[
        /** @type {import('@slack/bolt').ActionsBlock} */
        (view.blocks[view.blocks.length - 1]).elements.length - 2
      ]
    ).value; // - much readable, very wow

  view.blocks.forEach((block, index) => {
    const sectionBlock =
      /** @type {import('@slack/bolt').SectionBlock} */
      (block);

    if (
      !sectionBlock.accessory ||
      !/^\d*/.test(
        /** @type {import('@slack/bolt').Button} */ (sectionBlock.accessory)
          .value
      )
    )
      return;

    const accessory = /** @type {import('@slack/bolt').Button} */ (
      sectionBlock.accessory
    );

    // get users that already voted + remove answer number
    const users = accessory.value.split('-');

    users.shift();

    // see if user already voted
    const indexUser = users.indexOf(user.id);

    // get context block after answer block
    const contextBlock =
      /** @type {import('@slack/bolt').ContextBlock} */
      (view.blocks[index + 1]);

    // get element of context block after answer block
    const contextTextElement =
      /** @type {import('@slack/bolt').MrkdwnElement} */ (
        contextBlock.elements[0]
      );

    // action is "delete all votes"
    if (!action) {
      // user didn't vote
      if (indexUser === -1) return;
      // user did vote: remove
      users.splice(indexUser, 1);
    }

    // action is "vote"
    if (action) {
      // check if the current block was voted on,
      // or if "single select" is enabled (all other blocks are cleared from user)
      if (
        accessory.value !== action.value &&
        options.includes(optionCheckboxes.multipleSelect)
      ) {
        return;
      }

      // user has already voted: remove user
      // no matter if voted block or not
      if (indexUser !== -1) users.splice(indexUser, 1);
      // user didn't vote yet and it's voted block: add
      else if (indexUser === -1 && accessory.value === action.value) {
        users.push(user.id);
      }
    }

    // reset block
    accessory.value = accessory.value.split('-')[0];
    contextTextElement.text = '';

    users.forEach((user, idx) => {
      // fill value
      accessory.value += `-${user}`;

      // fill text only if not anonymous
      if (options.includes(optionCheckboxes.anonym)) return; // goes into next iteration

      contextTextElement.text += `${idx !== 0 ? ', ' : ''}<@${user}>`;
    });

    // add total number of votes
    if (users.length === 0) {
      contextTextElement.text += 'Keine Stimmen';
    } else {
      contextTextElement.text += `\n${users.length} ${
        users.length === 1 ? 'Stimme' : 'Stimmen'
      }`;
    }
  });

  return view;
}

/**
 * Popup to add answer to existing poll
 * @param {import('@slack/bolt').BlockAction} body
 * @returns {import('@slack/web-api').ViewsOpenArguments}
 */
// eslint-disable-next-line camelcase
export function getAddAnswerView({ trigger_id, message, channel }) {
  const view = util.deepCopy(addAnswerView);

  // eslint-disable-next-line camelcase
  view.trigger_id = trigger_id;

  view.view.private_metadata = `${channel.id}-${message.ts}`;

  return view;
}

/**
 *
 * @param {import('@slack/bolt').ViewOutput} view
 * @param {import('@slack/web-api/dist/response/ConversationsHistoryResponse').MessageElement} message
 * @returns {import('@slack/web-api').ChatUpdateArguments}
 */
export function addAnswerMessage(
  // eslint-disable-next-line camelcase
  { private_metadata, state: { values } },
  { blocks }
) {
  /** @type {import('@slack/web-api').ChatUpdateArguments} */
  const updateMessage = {
    token: process.env.SLACK_BOT_TOKEN,
    // eslint-disable-next-line camelcase
    channel: private_metadata.split('-')[0],
    // eslint-disable-next-line camelcase
    ts: private_metadata.split('-')[1],
    // @ts-ignore - unsolvable type conflict
    blocks
  };

  // count current answers to get index
  let idx = 0;
  blocks.forEach((block) => {
    if (block.accessory && /^\d*/.test(block.accessory.value)) idx += 1;
  });

  const answerView = util.deepCopy(answerBlockMessage);

  /** @type {import('@slack/bolt').Button} */
  (answerView.accessory).value = `${idx}`;

  answerView.text.text = `*${
    values[creationModalBlocks.newAnswer][
      pollMessageActions.addAnswerViewTextInput
    ].value
  }*`;

  const resultView = util.deepCopy(resultBlockMessage);

  updateMessage.blocks.splice(blocks.length - 2, 0, answerView, resultView);

  return updateMessage;
}

/**
 *
 * @returns {import("@slack/bolt").KnownBlock[]}
 */
export function getHomeView() {
  return util.deepCopy(homeView);
}
