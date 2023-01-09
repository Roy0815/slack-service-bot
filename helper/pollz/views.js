// local references
const util = require("../general/util");

//******************** Constants ********************//
const pollViewName = "pollz-pollView";

// Creation Modal
const questionBlockName = "pollz-questionBlock";
const questionInputAction = "pollz-question_input-action";

const typeSelectBlockName = "pollz-typeSelectBlock";
const typeSelectAction = "pollz-type_select-action";

const conversationSelectBlockName = "pollz-conversationSelectBlock";
const conversationSelectAction = "pollz-conversations_select-action";

const optionsBlockName = "pollz-optionsBlock";
const optionsAction = "pollz-options-action";
const optionAddAllowed = "addoptions";
const optionMultipleSelect = "multiplechoice";
const optionAnonym = "anon";

const newAnswerBlockName = "pollz-newAnswerBlock";
const newAnswerInputAction = "pollz-newAnswerInput-action";

const addAnswerAction = "pollz-add-answer";
const deleteSingleAnswerAction = "pollz-delete-single-answer";
const deleteAllAnswerAction = "pollz-delete-all-answers";

// Poll Message
const messageAddAnswerAction = "pollz-message-add-answer";
const messageDeleteAnswersAction = "pollz-message-delete-answers";
const messageOverflowAction = "pollz-message-overflow";
const messageOverflowShow = "show";
const messageOverflowDelete = "delete";

const addAnswerViewName = "pollz-addAnswerView";
const addAnswerViewTextInput = "pollz-addAnswerViewTextInput";

const voteButtonAction = "pollz-vote";

//******************** Views ********************//
const pollView = {
  //trigger_id: "",
  view: {
    type: "modal",
    callback_id: pollViewName,
    title: {
      type: "plain_text",
      text: "Neue Umfrage erstellen",
      emoji: true,
    },
    submit: {
      type: "plain_text",
      text: "Abschicken",
      emoji: true,
    },
    type: "modal",
    close: {
      type: "plain_text",
      text: "Abbrechen",
      emoji: true,
    },
    blocks: [
      {
        type: "input",
        block_id: questionBlockName,
        element: {
          type: "plain_text_input",
          action_id: questionInputAction,
        },
        label: {
          type: "plain_text",
          text: "Frage",
          emoji: true,
        },
      },
      {
        type: "divider",
      },
      /* {
        type: "input",
        block_id: typeSelectBlockName,
        element: {
          type: "static_select",
          initial_option: {
            text: {
              type: "plain_text",
              text: "Text",
              emoji: true,
            },
            value: "text",
          },
          options: [
            {
              text: {
                type: "plain_text",
                text: "Text",
                emoji: true,
              },
              value: "text",
            },
            {
              text: {
                type: "plain_text",
                text: "Datum",
                emoji: true,
              },
              value: "date",
            },
            {
              text: {
                type: "plain_text",
                text: "Datum + Uhrzeit",
                emoji: true,
              },
              value: "datetime",
            },
          ],
          action_id: typeSelectAction,
        },
        label: {
          type: "plain_text",
          text: "Typ",
          emoji: true,
        },
      }, */
      {
        type: "input",
        block_id: conversationSelectBlockName,
        element: {
          type: "conversations_select",
          action_id: conversationSelectAction,
          default_to_current_conversation: true,
        },
        label: {
          type: "plain_text",
          text: "Wo soll die Umfrage gesendet werden?",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: optionsBlockName,
        element: {
          type: "checkboxes",
          options: [
            {
              text: {
                type: "plain_text",
                text: "mehrere Antworten auswählbar",
                emoji: true,
              },
              value: optionMultipleSelect,
            },
            {
              text: {
                type: "plain_text",
                text: "Teilnehmer können Optionen hinzufügen",
                emoji: true,
              },
              value: optionAddAllowed,
            },
            {
              text: {
                type: "plain_text",
                text: "Anonym",
                emoji: true,
              },
              value: optionAnonym,
            },
          ],
          action_id: optionsAction,
        },
        optional: true,
        label: {
          type: "plain_text",
          text: "Optionen",
          emoji: true,
        },
      },
      {
        type: "divider",
      },
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Antworten",
          emoji: true,
        },
      },
      {
        type: "input",
        element: {
          type: "plain_text_input",
          action_id: newAnswerInputAction,
        },
        block_id: newAnswerBlockName,
        optional: true,
        label: {
          type: "plain_text",
          text: "Neue Antwort",
          emoji: true,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Hinzufügen",
              emoji: true,
            },
            value: "add",
            action_id: addAnswerAction,
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Alle löschen",
              emoji: true,
            },
            style: "danger",
            value: "all",
            action_id: deleteAllAnswerAction,
          },
        ],
      },
      {
        type: "divider",
      },
    ],
  },
};

const answerView = {
  type: "section",
  text: {
    type: "mrkdwn",
    text: "", //set in method
  },
  accessory: {
    type: "button",
    text: {
      type: "plain_text",
      text: "Löschen",
      emoji: true,
    },
    style: "danger",
    value: "", //set in method
    action_id: deleteSingleAnswerAction,
  },
};

const pollMessage = {
  channel: "",
  text: "", // Text in the notification, set in the method
  emoji: true,
  unfurl_links: false,
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "", //set in the method
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "", //set in the method
        },
      ],
    },
    {
      type: "divider",
    },
    {
      type: "divider",
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Antwort hinzufügen",
          },
          //value: "click_me_123",
          action_id: messageAddAnswerAction,
        },
        {
          type: "button",
          style: "danger",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Meine Antwort/en löschen",
          },
          value: "", //store info about options in method here
          action_id: messageDeleteAnswersAction,
        },
        {
          type: "overflow",
          options: [
            {
              text: {
                type: "plain_text",
                text: "Admin: Umfrage löschen",
                emoji: true,
              },
              value: messageOverflowDelete, // delete + admin (added in method)
            },
            /* {
              text: {
                type: "plain_text",
                text: "Alle Stimmen zeigen",
                emoji: true,
              },
              value: messageOverflowShow,
            }, */
          ],
          action_id: messageOverflowAction,
        },
      ],
    },
  ],
};

const answerBlockMessage = {
  type: "section",
  text: {
    type: "mrkdwn",
    text: "", //set in method, contains answer option
  },
  accessory: {
    type: "button",
    text: {
      type: "plain_text",
      emoji: true,
      text: "Abstimmen",
    },
    value: "", //set in method, contains answer number and peoples ids (split by -)
    action_id: voteButtonAction,
  },
};

const addAnswerView = {
  trigger_id: "", //set in method
  view: {
    type: "modal",
    private_metadata: "", //set in method, contains message info
    callback_id: addAnswerViewName,
    title: {
      type: "plain_text",
      text: "Neue Antwort hinzufügen",
    },
    submit: {
      type: "plain_text",
      text: "Hinzufügen",
    },
    type: "modal",
    close: {
      type: "plain_text",
      text: "Abbrechen",
    },
    blocks: [
      {
        type: "input",
        block_id: newAnswerBlockName,
        element: {
          type: "plain_text_input",
          placeholder: {
            type: "plain_text",
            text: "Antwort",
          },
          action_id: addAnswerViewTextInput,
        },
        label: {
          type: "plain_text",
          text: " ",
        },
      },
    ],
  },
};

const resultBlockMessage = {
  type: "context",
  elements: [
    {
      type: "mrkdwn",
      text: "Keine Stimmen", //set in method, contains result (count/people)
    },
  ],
};

//******************** Functions ********************//
function getPollsView({ trigger_id, text }) {
  let view = JSON.parse(JSON.stringify(pollView));
  view.trigger_id = trigger_id;

  if (text != "") view.view.blocks[0].element.initial_value = text;

  return view;
}

function addAnswer({ id, hash, blocks, state }) {
  let view = JSON.parse(JSON.stringify(pollView));

  view.view_id = id;
  view.hash = hash;

  view.view.blocks = blocks;

  let newAnswerView = JSON.parse(JSON.stringify(answerView));

  newAnswerView.text.text =
    state.values[newAnswerBlockName][newAnswerInputAction].value;

  newAnswerView.accessory.value = `${view.view.blocks.length + 1}`;

  view.view.blocks.push(newAnswerView);

  return view;
}

function deleteAnswer({ id, hash, blocks }, { value }) {
  let view = JSON.parse(JSON.stringify(pollView));

  view.view_id = id;
  view.hash = hash;

  if (value == "all") {
    //delete all
    view.view.blocks = blocks.filter(
      (block) =>
        !block.accessory ||
        block.accessory.action_id != deleteSingleAnswerAction
    );
  } else {
    //delete selected
    view.view.blocks = blocks.filter(
      (block) => !block.accessory || block.accessory.value != value
    );

    //adapt values
    view.view.blocks.forEach((block, index) => {
      if (
        block.accessory &&
        block.accessory.action_id == deleteSingleAnswerAction
      ) {
        block.accessory.value = `${index + 1}`;
      }
    });
  }

  return view;
}

function getPollMessage({ user, view }) {
  let retView = JSON.parse(JSON.stringify(pollMessage));

  //set question
  retView.text =
    view.state.values[questionBlockName][questionInputAction].value;

  //set text in Message
  retView.blocks[0].text.text = `Neue Umfrage von <@${user.id}>\n*${view.state.values[questionBlockName][questionInputAction].value}*`;

  //set channel
  retView.channel =
    view.state.values[conversationSelectBlockName][
      conversationSelectAction
    ].selected_conversation;

  //store admin in overflow button
  retView.blocks[4].elements[2].options[0].value += `-${user.id}`;

  //-- set options --//
  // anonymous
  let option = view.state.values[optionsBlockName][
    optionsAction
  ].selected_options.find((option) => option.value == optionAnonym);

  if (option) {
    //set text
    retView.blocks[1].elements[0].text = "Anonym";
    //set value to store
    retView.blocks[4].elements[1].value = optionAnonym;
  } else retView.blocks[1].elements[0].text = "nicht Anonym";

  // multiple select
  option = view.state.values[optionsBlockName][
    optionsAction
  ].selected_options.find((option) => option.value == optionMultipleSelect);

  if (option) {
    //set text
    retView.blocks[1].elements[0].text += `, mehrere Antworten auswählbar`;
    //set value to store
    retView.blocks[4].elements[1].value += optionMultipleSelect;
  } else retView.blocks[1].elements[0].text += `, eine Antwort auswählbar`;

  //make sure value is not initial
  if (retView.blocks[4].elements[1].value == "")
    retView.blocks[4].elements[1].value = "_";

  // add answers
  option = view.state.values[optionsBlockName][
    optionsAction
  ].selected_options.find((option) => option.value == optionAddAllowed);

  if (!option) retView.blocks[4].elements.shift(); // remove button if not selected

  //set answers
  view.blocks
    .filter(
      (block) =>
        block.accessory && block.accessory.action_id == deleteSingleAnswerAction
    )
    .forEach((element, index) => {
      let answerView = JSON.parse(JSON.stringify(answerBlockMessage));
      answerView.accessory.value = `${index}`;
      answerView.text.text = `*${element.text.text}*`;

      let resultView = JSON.parse(JSON.stringify(resultBlockMessage));

      retView.blocks.splice(3 + index * 2, 0, answerView, resultView);
    });

  return retView;
}

function answerOptionsValid({ view }) {
  let answers = view.blocks.filter(
    (block) =>
      block.accessory && block.accessory.action_id == deleteSingleAnswerAction
  );

  if (answers.length === 0) {
    //check options
    let addAnswers = view.state.values[optionsBlockName][
      optionsAction
    ].selected_options.filter((option) => option.value == optionAddAllowed);

    //add Options not selected: error
    if (addAnswers.length === 0) {
      return false;
    }
  }

  return true;
}

function vote({ message, user }, { value }) {
  let view = JSON.parse(JSON.stringify(pollMessage));

  //take over all information
  view.text = message.text;
  view.blocks = message.blocks;

  //get options from "delete my answers" button
  let options =
    view.blocks[view.blocks.length - 1].elements[
      view.blocks[view.blocks.length - 1].elements.length - 2
    ].value;

  //find block to be modified
  let index = view.blocks.findIndex(
    (block) => block.accessory && block.accessory.value == value
  );

  if (index === -1) {
    return view;
  }

  //get users that already voted + remove answer number
  let users = value.split("-");
  users.shift();

  //see if user already voted
  let indexUser = users.indexOf(user.id);

  if (indexUser == -1) {
    //add user
    users.push(user.id);
  } else {
    //remove user
    users.splice(indexUser, 1);
  }

  view.blocks[index].accessory.value = value.split("-")[0];
  view.blocks[index + 1].elements[0].text = "";

  users.forEach((user, idx) => {
    //fill value
    view.blocks[index].accessory.value += `-${user}`;

    //fill text only if not anonymous
    if (options.includes(optionAnonym)) return; //goes into next iteration

    view.blocks[index + 1].elements[0].text += `${
      idx != 0 ? ", " : ""
    }<@${user}>`;
  });

  //add total number of votes
  if (users.length == 0)
    view.blocks[index + 1].elements[0].text += "Keine Stimmen";
  else
    view.blocks[index + 1].elements[0].text += `\n${users.length} ${
      users.length == 1 ? "Stimme" : "Stimmen"
    }`;

  return view;
}

function deleteMyVotes({ message, user }) {
  let view = JSON.parse(JSON.stringify(pollMessage));

  //take over all information
  view.text = message.text;
  view.blocks = message.blocks;

  //get options from "delete my answers" button
  let options =
    view.blocks[view.blocks.length - 1].elements[
      view.blocks[view.blocks.length - 1].elements.length - 2
    ].value;

  //get index of all answer blocks
  let answerIdxs = [];

  view.blocks.forEach((block, index) => {
    if (block.accessory && /^\d*/.test(block.accessory.value))
      answerIdxs.push(index);
  });

  //modify each block if user voted there
  answerIdxs.forEach((element) => {
    //get users that already voted + remove answer number
    let users = view.blocks[element].accessory.value.split("-");
    users.shift();

    //see if user already voted
    let indexUser = users.indexOf(user.id);

    if (indexUser == -1) return;

    //remove user
    users.splice(indexUser, 1);

    view.blocks[element].accessory.value =
      view.blocks[element].accessory.value.split("-")[0];
    view.blocks[element + 1].elements[0].text = "";

    users.forEach((user, idx) => {
      //fill value
      view.blocks[element].accessory.value += `-${user}`;

      //fill text only if not anonymous
      if (options.includes(optionAnonym)) return; //goes into next iteration

      view.blocks[element + 1].elements[0].text += `${
        idx != 0 ? ", " : ""
      }<@${user}>`;
    });

    //add total number of votes
    if (users.length == 0)
      view.blocks[element + 1].elements[0].text += "Keine Stimmen";
    else
      view.blocks[element + 1].elements[0].text += `\n${users.length} ${
        users.length == 1 ? "Stimme" : "Stimmen"
      }`;
  });

  return view;
}

function getAddAnswerView({ trigger_id, message, channel }) {
  let view = JSON.parse(JSON.stringify(addAnswerView));

  view.trigger_id = trigger_id;

  view.view.private_metadata = `${channel.id}-${message.ts}`;

  return view;
}

function addAnswerMessage({ private_metadata, state: { values } }, { blocks }) {
  let updateMessage = {
    token: process.env.SLACK_BOT_TOKEN,
    channel: private_metadata.split("-")[0],
    ts: private_metadata.split("-")[1],
    blocks: blocks,
  };

  //count current answers to get index
  let idx = 0;
  blocks.forEach((block) => {
    if (block.accessory && /^\d*/.test(block.accessory.value)) idx += 1;
  });

  let answerView = JSON.parse(JSON.stringify(answerBlockMessage));
  answerView.accessory.value = `${idx}`;
  answerView.text.text = `*${values[newAnswerBlockName][addAnswerViewTextInput].value}*`;

  let resultView = JSON.parse(JSON.stringify(resultBlockMessage));

  updateMessage.blocks.splice(blocks.length - 2, 0, answerView, resultView);

  return updateMessage;
}

//exports
module.exports = {
  getPollsView,
  addAnswer,
  deleteAnswer,
  getPollMessage,
  answerOptionsValid,
  vote,
  deleteMyVotes,
  getAddAnswerView,
  addAnswerMessage,

  newAnswerBlockName,
  newAnswerInputAction,
  pollViewName,
  addAnswerAction,
  deleteSingleAnswerAction,
  deleteAllAnswerAction,
  voteButtonAction,
  messageAddAnswerAction,
  messageDeleteAnswersAction,
  messageOverflowAction,
  messageOverflowDelete,
  addAnswerViewName,
};
