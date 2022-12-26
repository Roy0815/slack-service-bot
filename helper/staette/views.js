//constants
const whoIsThereInputBlockName = "whoIsThereBlock";
const whoIsThereTimePickerName = "whoIsThereTimePicker";

//******************** Views ********************//
const whoIsThereMessage = {
  channel: process.env.STAETTE_CHANNEL,
  text: "", // Text in the notification, set in the method
  emoji: true,
  unfurl_links: false,
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "", //set in method
      },
    },
    {
      type: "section",
      block_id: whoIsThereInputBlockName,
      text: {
        type: "mrkdwn",
        text: "Wann bist du heute da?",
      },
      accessory: {
        type: "timepicker",
        initial_time: "17:00",
        placeholder: {
          type: "plain_text",
          text: "Zeit wählen",
          emoji: true,
        },
        action_id: whoIsThereTimePickerName,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          style: "primary",
          text: {
            type: "plain_text",
            text: "Abschicken",
            emoji: true,
          },
          value: "update",
          action_id: "action-whoisthere-update",
        },
        {
          type: "button",
          style: "danger",
          text: {
            type: "plain_text",
            text: "Meine Löschen",
            emoji: true,
          },
          value: "delete",
          action_id: "action-whoisthere-delete",
        },
      ],
    },
  ],
};

//******************** Functions ********************//
function getWhoIsThereMessage({ user_id }) {
  let view = JSON.parse(JSON.stringify(whoIsThereMessage));
  view.text =
    view.blocks[0].text.text = `<@${user_id}> will wissen wer heute in der Stätte ist`;
  return view;
}

function updateWhoIsThereMessage({ user, time, xdelete }, { text, blocks }) {
  let view = JSON.parse(JSON.stringify(whoIsThereMessage));
  let users = [];

  view.blocks = blocks;
  view.text = text;

  if (view.blocks[4]) {
    //get user list
    view.blocks[4].text.text.split("\n").forEach((element) => {
      let userArr = element.split("\t");
      users.push({
        time: userArr[0],
        user: userArr[1],
      });
    });

    //get index of user
    let index = users.findIndex((element) => element.user == `<@${user}>`);

    //remove old element of user
    if (index != -1) users.splice(index, 1);

    //reset text
    view.blocks[4].text.text = "";
  }

  //no time = delete: return view now
  if (xdelete) {
    users.forEach((element, index) => {
      view.blocks[4].text.text = `${view.blocks[4].text.text}${
        index > 0 ? "\n" : ""
      }${element.time}\t${element.user}`;
    });

    //if empty, delete section
    if (users.length == 0 && view.blocks[4]) view.blocks.pop();

    return view;
  }

  //add user
  users.push({ user: `<@${user}>`, time: time });

  //sort times
  users.sort((a, b) => {
    if (a.time > b.time) return 1;
    if (a.time < b.time) return -1;
    return 0;
  });

  //build view
  if (!view.blocks[3])
    view.blocks.push({
      type: "divider",
    });

  if (!view.blocks[4])
    view.blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "",
      },
    });

  users.forEach((element, index) => {
    view.blocks[4].text.text = `${view.blocks[4].text.text}${
      index > 0 ? "\n" : ""
    }${element.time}\t${element.user}`;
  });

  return view;
}

//exports
module.exports = {
  getWhoIsThereMessage,
  updateWhoIsThereMessage,

  whoIsThereInputBlockName,
  whoIsThereTimePickerName,
};