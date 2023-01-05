// local references
const util = require("../general/util");

// constants
const pollViewName = "pollz-pollView";

const questionBlockName = "pollz-questionBlock";
const questionInputAction = "pollz-question_input-action";

const typeSelectBlockName = "pollz-typeSelectBlock";
const typeSelectAction = "pollz-type_select-action";

const conversationSelectBlockName = "pollz-conversationSelectBlock";
const conversationSelectAction = "pollz-conversations_select-action";

const optionsBlockName = "pollz-optionsBlock";
const optionsAction = "pollz-options-action";
const optionAddAllowed = "addoptions";

const newAnswerBlockName = "pollz-newAnswerBlock";
const newAnswerInputAction = "pollz-newAnswerInput-action";

const addAnswerAction = "pollz-add-answer";
const deleteSingleAnswerAction = "pollz-delete-single-answer";
const deleteAllAnswerAction = "pollz-delete-all-answers";

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
              value: "multiplechoice",
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
              value: "anon",
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
          value: "click_me_123",
        },
        {
          type: "button",
          style: "danger",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Meine Antwort/en löschen",
          },
          value: "click_me_123",
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
    value: "", //set in method, contains answer number
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

  //set options
  let displayedOptions = view.state.values[optionsBlockName][
    optionsAction
  ].selected_options.filter((option) => option.value != optionAddAllowed);

  if (displayedOptions.length === 0) {
    retView.blocks.splice(1, 1);
  } else {
    displayedOptions.forEach((option, index) => {
      retView.blocks[1].elements[0].text += `${index == 0 ? "" : ", "}${
        option.text.text
      }`;
    });
  }

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

//exports
module.exports = {
  getPollsView,
  addAnswer,
  deleteAnswer,
  getPollMessage,
  answerOptionsValid,

  newAnswerBlockName,
  newAnswerInputAction,
  pollViewName,
  addAnswerAction,
  deleteSingleAnswerAction,
  deleteAllAnswerAction,
};
