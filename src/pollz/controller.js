// local imports
import * as views from './views.js';
import * as constants from './constants.js';
import * as util from '../general/util.js';
import { SlackViewSubmissionError } from '../general/types.js';

/**
 * Get channel from submitted view
 * @param {import('@slack/bolt').SlackViewAction} viewAction
 * @returns {string}
 */
export function getChannelFromView({ view }) {
  return view.state.values[constants.creationModalBlocks.conversationSelect][
    constants.creationModalActions.conversationSelect
  ].selected_conversation;
}

/**
 * get Popup for creation
 * @param {object} command
 * @param {string} command.trigger_id
 * @param {string} [command.text]
 * @returns {import('@slack/web-api').ViewsOpenArguments}
 */
// eslint-disable-next-line camelcase
export function getPollsView({ trigger_id, text }) {
  const view = util.deepCopy(views.pollView);

  // pre-fill question text from prompt
  if (!text || text !== '') {
    /** @type {import('@slack/types').PlainTextInput } */
    (
      /** @type {import('@slack/types').InputBlock} */ (view.blocks[0]).element
    ).initial_value = text;
  }

  // eslint-disable-next-line camelcase
  return { trigger_id, view };
}

/**
 * Add answer to creation modal
 * @param {import('@slack/bolt').ViewOutput} view
 * @returns {import('@slack/web-api').ViewsUpdateArguments}
 */
export function addAnswer({ id, hash, blocks, state }) {
  const view = util.deepCopy(views.pollView);

  // take over existing blocks
  view.blocks = blocks;

  // create new block for the answer
  const newAnswerView = util.deepCopy(views.answerView);

  newAnswerView.text.text =
    state.values[constants.creationModalBlocks.newAnswer][
      constants.creationModalActions.newAnswerInput
    ].value;

  /** @type {import('@slack/types').Button } */
  (newAnswerView.accessory).value = `${view.blocks.length + 1}`;

  view.blocks.push(newAnswerView);

  return { view_id: id, hash, view };
}

/**
 * delete one or all answers from creation modal
 * @param {import('@slack/bolt').ViewOutput} view
 * @param {import('@slack/bolt').ButtonAction  } action
 * @returns {import('@slack/web-api').ViewsUpdateArguments}
 */
export function deleteAnswer({ id, hash, blocks }, { value }) {
  const view = util.deepCopy(views.pollView);

  if (value === 'all') {
    // delete all
    view.blocks = blocks.filter((block) => {
      const sectionBlock =
        /** @type {import('@slack/types').SectionBlock} */
        (block);

      return (
        !sectionBlock.accessory ||
        /** @type {import('@slack/types').Button } */
        (sectionBlock.accessory).action_id !==
          constants.creationModalActions.deleteSingleAnswer
      );
    });
  } else {
    // delete selected
    view.blocks = blocks.filter((block) => {
      const sectionBlock =
        /** @type {import('@slack/types').SectionBlock} */
        (block);

      return (
        !sectionBlock.accessory ||
        /** @type {import('@slack/types').Button } */
        (sectionBlock.accessory).value !== value
      );
    });

    // adapt values
    view.blocks.forEach((block, index) => {
      const sectionBlock =
        /** @type {import('@slack/types').SectionBlock} */
        (block);

      if (
        sectionBlock.accessory &&
        /** @type {import('@slack/types').Button } */
        (sectionBlock.accessory).action_id ===
          constants.creationModalActions.deleteSingleAnswer
      ) {
        /** @type {import('@slack/types').Button } */
        (sectionBlock.accessory).value = `${index + 1}`;
      }
    });
  }

  return { view_id: id, hash, view };
}

/**
 * Get initial poll message after sending poll
 * @param {import('@slack/bolt').SlackViewAction} viewAction
 * @returns {import('@slack/web-api').ChatPostMessageArguments}
 */
export function getPollMessage({ user, view }) {
  const retViewBlocks = util.deepCopy(views.pollMessageBlocks);

  // block castings
  const actionsBlock =
    /** @type {import('@slack/types').ActionsBlock} */
    (retViewBlocks[4]);

  const contextBlock =
    /** @type {import('@slack/types').ContextBlock} */
    (retViewBlocks[1]);

  // elements of block castings
  const contextElement =
    /** @type {import('@slack/types').MrkdwnElement } */
    (contextBlock.elements[0]);

  const actionsElementIdx1 =
    /** @type {import('@slack/types').Button } */
    (actionsBlock.elements[1]);

  // set text in Message
  /** @type {import('@slack/types').SectionBlock} */
  (retViewBlocks[0]).text.text = `Neue Umfrage von <@${user.id}>\n*${
    view.state.values[constants.creationModalBlocks.question][
      constants.creationModalActions.questionInput
    ].value
  }*`;

  // store admin in overflow button
  /** @type {import('@slack/types').Overflow } */
  (actionsBlock.elements[2]).options[0].value += `-${user.id}`;

  // -- set options --//
  // anonymous
  let option = view.state.values[constants.creationModalBlocks.options][
    constants.creationModalActions.options
  ].selected_options.find(
    (option) => option.value === constants.optionCheckboxes.anonym
  );

  // set text
  contextElement.text = option ? 'Anonym' : 'nicht Anonym';
  if (option) {
    // set value to store
    actionsElementIdx1.value = constants.optionCheckboxes.anonym;
  }

  // multiple select
  option = view.state.values[constants.creationModalBlocks.options][
    constants.creationModalActions.options
  ].selected_options.find(
    (option) => option.value === constants.optionCheckboxes.multipleSelect
  );

  if (option) {
    // set text
    contextElement.text += ', mehrere Antworten auswählbar';
    // set value to store
    actionsElementIdx1.value += constants.optionCheckboxes.multipleSelect;
  } else contextElement.text += ', eine Antwort auswählbar';

  // make sure value is not initial
  if (actionsElementIdx1.value === '') actionsElementIdx1.value = '_';

  // add answers
  option = view.state.values[constants.creationModalBlocks.options][
    constants.creationModalActions.options
  ].selected_options.find(
    (option) => option.value === constants.optionCheckboxes.addAllowed
  );

  if (!option) actionsBlock.elements.shift(); // remove button if not selected

  // set answers
  view.blocks
    .filter((block) => {
      const sectionBlock =
        /** @type {import('@slack/types').SectionBlock} */
        (block);

      return (
        sectionBlock.accessory &&
        /** @type {import('@slack/types').Button} */
        (sectionBlock.accessory).action_id ===
          constants.creationModalActions.deleteSingleAnswer
      );
    })
    .forEach((block, index) => {
      const answerView = util.deepCopy(views.answerBlockMessage);

      /** @type {import('@slack/types').Button} */
      (answerView.accessory).value = `${index}`;

      answerView.text.text = `*${
        /** @type {import('@slack/types').SectionBlock} */
        (block).text.text
      }*`;

      const resultView = util.deepCopy(views.resultBlockMessage);

      retViewBlocks.splice(3 + index * 2, 0, answerView, resultView);
    });

  // set channel and text in notification here
  return {
    channel:
      view.state.values[constants.creationModalBlocks.conversationSelect][
        constants.creationModalActions.conversationSelect
      ].selected_conversation,
    text: view.state.values[constants.creationModalBlocks.question][
      constants.creationModalActions.questionInput
    ].value,
    blocks: retViewBlocks
  };
}

/**
 * check if the creator provided answer options or enabled adding of answers
 * @param {import('@slack/bolt').SlackViewAction} viewAction
 * @returns {boolean} answer is valid
 */
export function answerOptionsValid({ view }) {
  const answers = view.blocks.filter((block) => {
    const sectionBlock =
      /** @type {import('@slack/types').SectionBlock} */
      (block);

    return (
      sectionBlock.accessory &&
      /** @type {import('@slack/types').Button} */
      (sectionBlock.accessory).action_id ===
        constants.creationModalActions.deleteSingleAnswer
    );
  });

  if (answers.length === 0) {
    // check options
    const addAnswers = view.state.values[constants.creationModalBlocks.options][
      constants.creationModalActions.options
    ].selected_options.filter(
      (option) => option.value === constants.optionCheckboxes.addAllowed
    );

    // add Options not selected: error
    if (addAnswers.length === 0) {
      return false;
    }
  }

  return true;
}

/**
 * vote, remove vote and remove all votes of user
 * @param {import("@slack/bolt").BlockAction} body
 * @param {import("@slack/bolt").ButtonAction} [action] undefined means delete all answers of user
 * @returns {import("@slack/bolt").RespondArguments}
 */
export function vote({ message, user }, action) {
  // take over blocks from original message
  /** @type {import("@slack/types").AnyBlock[]} */
  const blocks = message.blocks;

  // get options from "delete my answers" button
  const options =
    /** @type {import('@slack/types').Button} */
    (
      /** @type {import('@slack/types').ActionsBlock} */
      (blocks[blocks.length - 1]).elements[
        /** @type {import('@slack/types').ActionsBlock} */
        (blocks[blocks.length - 1]).elements.length - 2
      ]
    ).value;

  blocks.forEach((block, index) => {
    const sectionBlock =
      /** @type {import('@slack/types').SectionBlock} */
      (block);

    if (
      !sectionBlock.accessory ||
      !/^\d*/.test(
        /** @type {import('@slack/types').Button} */ (sectionBlock.accessory)
          .value
      )
    )
      return;

    const accessory = /** @type {import('@slack/types').Button} */ (
      sectionBlock.accessory
    );

    // get users that already voted + remove answer number
    const users = accessory.value.split('-');

    users.shift();

    // see if user already voted
    const indexUser = users.indexOf(user.id);

    // get context block after answer block
    const contextBlock =
      /** @type {import('@slack/types').ContextBlock} */
      (blocks[index + 1]);

    // get element of context block after answer block
    const contextTextElement =
      /** @type {import('@slack/types').MrkdwnElement} */ (
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
        options.includes(constants.optionCheckboxes.multipleSelect)
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
      if (options.includes(constants.optionCheckboxes.anonym)) return; // goes into next iteration

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

  // take over text from original message
  return { text: message.text, blocks };
}

/**
 * Popup to add answer to existing poll
 * @param {import('@slack/bolt').BlockAction} body
 * @returns {import('@slack/web-api').ViewsOpenArguments}
 */
// eslint-disable-next-line camelcase
export function getAddAnswerView({ trigger_id, message, channel }) {
  const view = util.deepCopy(views.addAnswerView);

  view.private_metadata = `${channel.id}-${message.ts}`;

  // eslint-disable-next-line camelcase
  return { trigger_id, view };
}

/**
 * Add answer to already posted poll
 * @param {import('@slack/bolt').ViewOutput} view
 * @param {import('@slack/web-api/dist/types/response/ConversationsHistoryResponse').MessageElement} message
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

  const answerView = util.deepCopy(views.answerBlockMessage);

  /** @type {import('@slack/types').Button} */
  (answerView.accessory).value = `${idx}`;

  answerView.text.text = `*${
    values[constants.creationModalBlocks.newAnswer][
      constants.pollMessageActions.addAnswerViewTextInput
    ].value
  }*`;

  // required for typing
  if ('blocks' in updateMessage)
    updateMessage.blocks.splice(
      blocks.length - 2,
      0,
      answerView,
      util.deepCopy(views.resultBlockMessage)
    );

  return updateMessage;
}

/**
 *
 * @returns {import("@slack/types").KnownBlock[]}
 */
export function getHomeView() {
  return util.deepCopy(views.homeView);
}

/**
 * validate inputs from poll creation modal
 * @param {import('@slack/bolt').SlackViewAction} body
 * @param {import('@slack/web-api').WebClient} client
 */
export async function validateInputs(body, client) {
  // no answer options provided and no adding of answers allowed
  if (!answerOptionsValid(body)) {
    throw new SlackViewSubmissionError(
      constants.creationModalBlocks.newAnswer,
      'Bitte Antwortmöglichkeiten eingeben oder hinzufügen erlauben'
    );
  }

  const channel = await util.getChannelInfo(getChannelFromView(body), client);

  // check bot is in channel
  if (channel && channel.is_member === true) return;

  let joinSuccess = false;

  // try to join channel if public
  if (channel && channel.is_channel) {
    joinSuccess = await util.joinChannel(getChannelFromView(body), client);
  }

  if (joinSuccess) return;

  // no success, issue message to user
  throw new SlackViewSubmissionError(
    constants.creationModalBlocks.conversationSelect,
    'Bitte den Bot in diesen Channel hinzufügen'
  );
}
