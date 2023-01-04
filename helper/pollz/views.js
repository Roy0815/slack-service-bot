// local references
const util = require("../general/util");

// constants
const pollViewName = "pollView";

const questionBlockName = "questionBlock";
const questionInputAction = "question_input-action";

const typeSelectBlockName = "typeSelectBlock";
const typeSelectAction = "type_select-action";

const conversationSelectBlockName = "conversationSelectBlock";
const conversationSelectAction = "conversations_select-action";

const optionsBlockName = "optionsBlock";
const optionsAction = "options-action";

const newAnswerBlockName = "newAnswerBlock";
const newAnswerInputAction = "newAnswerInput-action";

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
      {
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
      },
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
                text: "Mehrere Antworten auswählbar",
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
              value: "addoptions",
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
            action_id: "pollz-add-answer",
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
            action_id: "pollz-delete-all-answer",
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
    action_id: "pollz-delete-single-answer",
  },
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
        block.accessory.action_id != "pollz-delete-single-answer"
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
        block.accessory.action_id == "pollz-delete-single-answer"
      ) {
        block.accessory.value = `${index + 1}`;
      }
    });
  }

  return view;
}

function getPollMessage({ user, view }) {
  let text =
    `<@${user.id}> hat eine Umfrage erstellt: *${view.state.values[questionBlockName][questionInputAction].value}*` +
    `\nSenden an Channel: <#${view.state.values[conversationSelectBlockName][conversationSelectAction].selected_conversation}>` +
    `\nOptionen:`;

  view.state.values[optionsBlockName][optionsAction].selected_options.forEach(
    (option) => {
      text += `\n- ${option.text.text}`;
    }
  );

  if (
    view.state.values[optionsBlockName][optionsAction].selected_options
      .length === 0
  )
    text += "\nkeine";

  text += "\nAntworten:";

  view.blocks
    .filter(
      (block) =>
        block.accessory &&
        block.accessory.action_id == "pollz-delete-single-answer"
    )
    .forEach((element) => {
      text += `\n- ${element.text.text}`;
    });

  return {
    channel: "GPPHHTLSU",
    text: text,
  };
}

//exports
module.exports = {
  getPollsView,
  addAnswer,
  deleteAnswer,
  getPollMessage,

  newAnswerBlockName,
  newAnswerInputAction,
  pollViewName,
};
