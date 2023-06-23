// imports
const util = require('../general/util');

// constants
const whoIsThereInputBlockName = 'staette-whoIsThereBlock';
const whoIsThereTimePickerName = 'staette-whoIsThereTimePicker';

const messageOverflowAction = 'staette-overflow-action';
const messageOverflowDelete = 'delete';

const sectionUsers = 5;

const homeViewCommand = 'staette-home-command';
const homeViewInputBlockId = 'staette-home-input-block';
const homeViewDatePickerAction = 'staette-home-datepicker-action';

//* ******************* Views ********************//
const whoIsThereMessage = {
  channel: process.env.STAETTE_CHANNEL,
  text: '', // Text in the notification, set in the method
  emoji: true,
  unfurl_links: false,
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '' // set in method
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '' // set in method
      }
    },
    {
      type: 'section',
      block_id: whoIsThereInputBlockName,
      text: {
        type: 'mrkdwn',
        text: '' // set in method
      },
      accessory: {
        type: 'timepicker',
        initial_time: '17:00',
        placeholder: {
          type: 'plain_text',
          text: 'Zeit wählen',
          emoji: true
        },
        action_id: whoIsThereTimePickerName
      }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          style: 'primary',
          text: {
            type: 'plain_text',
            text: 'Abschicken',
            emoji: true
          },
          value: 'update',
          action_id: 'staette-whoisthere-update'
        },
        {
          type: 'button',
          style: 'danger',
          text: {
            type: 'plain_text',
            text: 'Meine Löschen',
            emoji: true
          },
          value: 'delete',
          action_id: 'staette-whoisthere-delete'
        },
        {
          type: 'overflow',
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'Ersteller: Abfrage löschen',
                emoji: true
              },
              value: messageOverflowDelete // delete-{ admin } (added in method)
            }
          ],
          action_id: messageOverflowAction
        }
      ]
    }
  ]
};

const homeView = [
  {
    type: 'header',
    text: {
      type: 'plain_text',
      text: 'Anwesenheitsabfrage Trainingsstätte',
      emoji: true
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*`/weristda [DD.MM.YYYY]` Kommando:*\nMit diesem Kommando kannst du eine Abfrage starten wer heute in der Trainingsstätte ist. Die anderen Mitglieder können dann ihre Zeiten einpflegen.\nDu kannst optional ein Datum mitgeben, um einen anderen Termin abzufragen. Beispiel: `/weristda 01.01.2000`'
    }
  },
  {
    type: 'actions',
    block_id: homeViewInputBlockId,
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '/weristda',
          emoji: true
        },
        action_id: homeViewCommand
      },
      {
        type: 'datepicker',
        placeholder: {
          type: 'plain_text',
          text: 'Datum (optional)',
          emoji: true
        },
        action_id: homeViewDatePickerAction
      }
    ]
  }
];

//* ******************* Functions ********************//
// eslint-disable-next-line camelcase
function getWhoIsThereMessage ({ user_id, text }) {
  const view = JSON.parse(JSON.stringify(whoIsThereMessage));

  // set admin in overflow button
  // eslint-disable-next-line camelcase
  view.blocks[3].elements[2].options[0].value += `-${user_id}`;

  // get day description
  const day = text === `${util.formatDate(new Date())}` ? 'heute' : `am ${text}`;

  // set date
  view.blocks[0].text.text = `\`${text}\``;

  // set questions
  view.text =
  // eslint-disable-next-line camelcase
    view.blocks[1].text.text = `<@${user_id}> will wissen wer ${day} in der Stätte ist`;

  view.blocks[2].text.text = `Wann bist du ${day} da?`;

  return view;
}

function updateWhoIsThereMessage ({ user, time, xdelete }, { text, blocks }) {
  const view = JSON.parse(JSON.stringify(whoIsThereMessage));
  const users = [];

  view.blocks = blocks;
  view.text = text;

  if (view.blocks[sectionUsers]) {
    // get user list
    view.blocks[sectionUsers].text.text.split('\n').forEach((element) => {
      const userArr = element.split('\t');
      users.push({
        time: userArr[0],
        user: userArr[1]
      });
    });

    // get index of user
    const index = users.findIndex((element) => element.user === `<@${user}>`);

    // remove old element of user
    if (index !== -1) users.splice(index, 1);

    // reset text
    view.blocks[sectionUsers].text.text = '';
  }

  // no time = delete: return view now
  if (xdelete) {
    users.forEach((element, index) => {
      view.blocks[sectionUsers].text.text = `${
        view.blocks[sectionUsers].text.text
      }${index > 0 ? '\n' : ''}${element.time}\t${element.user}`;
    });

    // if empty, delete section(s)
    if (users.length === 0 && view.blocks[sectionUsers]) { view.blocks.splice(sectionUsers - 1, 3); }

    return view;
  }

  // add user
  users.push({ user: `<@${user}>`, time });

  // sort times
  users.sort((a, b) => {
    if (a.time > b.time) return 1;
    if (a.time < b.time) return -1;
    return 0;
  });

  // build view (replace old blocks)
  view.blocks.splice(
    // start
    sectionUsers - 1,
    // delete
    3,
    // adding objects
    {
      type: 'divider'
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ''
      }
    },
    {
      type: 'divider'
    }
  );

  users.forEach((element, index) => {
    view.blocks[sectionUsers].text.text = `${
      view.blocks[sectionUsers].text.text
    }${index > 0 ? '\n' : ''}${element.time}\t${element.user}`;
  });

  return view;
}

function getHomeView () {
  return JSON.parse(JSON.stringify(homeView));
}

// exports
module.exports = {
  getHomeView,
  homeViewCommand,
  homeViewInputBlockId,
  homeViewDatePickerAction,

  getWhoIsThereMessage,
  updateWhoIsThereMessage,

  whoIsThereInputBlockName,
  whoIsThereTimePickerName,
  messageOverflowAction,
  messageOverflowDelete
};
