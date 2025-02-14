// imports
import * as util from '../general/util.js';

// constants
export const whoIsThereInputBlockName = 'staette-whoIsThereBlock';
export const whoIsThereTimePickerName = 'staette-whoIsThereTimePicker';

export const messageOverflowAction = 'staette-overflow-action';
export const messageOverflowDelete = 'delete';

const sectionUsers = 5;

export const homeViewCommand = 'staette-home-command';
export const homeViewInputBlockId = 'staette-home-input-block';
export const homeViewDatePickerAction = 'staette-home-datepicker-action';

//* ******************* Views ********************//
/** @type {import('@slack/web-api').ChatPostMessageArguments} */
const whoIsThereMessage = {
  channel: process.env.STAETTE_CHANNEL,
  text: '', // Text in the notification, set in the method
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

/** @type {import("@slack/types").KnownBlock[]} */
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
/**
 * Get message for specific date
 * @param {object} command
 * @param {string} command.user_id
 * @param {string} command.text
 * @returns {import('@slack/web-api').ChatPostMessageArguments}
 */
// eslint-disable-next-line camelcase
export function getWhoIsThereMessage({ user_id, text }) {
  const view = util.deepCopy(whoIsThereMessage);

  // required for correct typing
  if (!('blocks' in view)) return view;

  // set admin in overflow button
  const actionsBlock =
    /** @type {import('@slack/types').ActionsBlock} */
    (view.blocks[3]);

  /** @type {import('@slack/types').Overflow} */
  // eslint-disable-next-line camelcase
  (actionsBlock.elements[2]).options[0].value += `-${user_id}`;

  // get day description
  const day =
    text === `${util.formatDate(new Date())}` ? 'heute' : `am ${text}`;

  // set date
  /** @type {import('@slack/types').SectionBlock} */
  (view.blocks[0]).text.text = `\`${text}\``;

  // set questions
  view.text =
    /** @type {import('@slack/types').SectionBlock} */
    (
      view.blocks[1]
      // eslint-disable-next-line camelcase
    ).text.text = `<@${user_id}> will wissen wer ${day} in der Stätte ist`;

  /** @type {import('@slack/types').SectionBlock} */
  (view.blocks[2]).text.text = `Wann bist du ${day} da?`;

  return view;
}

/**
 * Update requested message
 * @param {object} updateData
 * @param {string} updateData.user
 * @param {string} updateData.time
 * @param {boolean} updateData.xdelete
 * @param {object} message
 * @param {string} [message.text]
 * @param {import('@slack/types').KnownBlock[]} [message.blocks]
 * @returns {import('@slack/web-api').ChatPostMessageArguments}
 */
export function updateWhoIsThereMessage(
  { user, time, xdelete },
  { text, blocks }
) {
  const view = util.deepCopy(whoIsThereMessage);

  /** @type {{time: string, user: string}[]} */
  const users = [];

  // required for correct typing
  if (!('blocks' in view)) return view;

  view.blocks = blocks;
  view.text = text;

  /** @type {import('@slack/types').SectionBlock} */
  let userBlock;

  if (view.blocks[sectionUsers]) {
    userBlock = /** @type {import('@slack/types').SectionBlock} */ (
      view.blocks[sectionUsers]
    );

    // get user list
    userBlock.text.text.split('\n').forEach((element) => {
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
    userBlock.text.text = '';
  }

  // no time = delete: return view now
  if (xdelete) {
    users.forEach((element, index) => {
      userBlock.text.text = `${userBlock.text.text}${index > 0 ? '\n' : ''}${
        element.time
      }\t${element.user}`;
    });

    // if empty, delete section(s)
    if (users.length === 0 && view.blocks[sectionUsers]) {
      view.blocks.splice(sectionUsers - 1, 3);
    }

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

  userBlock = /** @type {import('@slack/types').SectionBlock} */ (
    view.blocks[sectionUsers]
  );

  users.forEach((element, index) => {
    userBlock.text.text = `${userBlock.text.text}${index > 0 ? '\n' : ''}${
      element.time
    }\t${element.user}`;
  });

  return view;
}

/**
 *
 * @returns {import("@slack/types").KnownBlock[]}
 */
export function getHomeView() {
  return util.deepCopy(homeView);
}
