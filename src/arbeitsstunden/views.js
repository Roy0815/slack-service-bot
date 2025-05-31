import * as constants from './constants.js';

/** @type {import("@slack/types").View} */
export const registerView = {
  type: 'modal',
  callback_id: constants.registerView.viewName,
  title: {
    type: 'plain_text',
    text: 'Registrieren',
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
      block_id: constants.registerView.blockNameSelect,
      label: {
        type: 'plain_text',
        text: 'Deine Slack ID ist noch nicht verknüpft, bitte wähle deinen Namen aus:'
      },
      element: {
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: 'Name',
          emoji: true
        },
        options: [], // users go here
        action_id: constants.registerView.actionNameSelect
      }
    }
  ]
};

/** @type {import('@slack/types').View} */
export const maintainHoursView = {
  type: 'modal',
  callback_id: constants.maintainHoursView.viewName,
  title: {
    type: 'plain_text',
    text: 'Arbeitsstunden erfassen',
    emoji: true
  },
  submit: {
    type: 'plain_text',
    text: 'Einreichen',
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
      block_id: constants.maintainHoursView.blockDescription,
      element: {
        type: 'plain_text_input',
        action_id: constants.maintainHoursView.actionDescription
      },
      label: {
        type: 'plain_text',
        text: 'Kurzbeschreibung',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: constants.maintainHoursView.blockDate,
      element: {
        type: 'datepicker',
        placeholder: {
          type: 'plain_text',
          text: 'Datum auswählen',
          emoji: true
        },
        action_id: constants.maintainHoursView.actionDate
      },
      label: {
        type: 'plain_text',
        text: 'Datum des Arbeitseinsatzes',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: constants.maintainHoursView.blockHours,
      element: {
        type: 'plain_text_input',
        action_id: constants.maintainHoursView.actionHours,
        initial_value: '0,5'
      },
      label: {
        type: 'plain_text',
        text: 'Stunden',
        emoji: true
      }
    }
  ]
};

/** @type {import("@slack/types").KnownBlock[]} */
export const homeView = [
  {
    type: 'header',
    text: {
      type: 'plain_text',
      text: 'Arbeitsstunden',
      emoji: true
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*1️⃣ `/arbeitsstunden_anzeigen` Kommando*:\nHiermit kannst du deine geleisteten Stunden einsehen. Das Kommando ist in allen öffentlichen Channels verfügbar, oder auch in privaten, wenn du den Arbeitsstunden-Bot hinzufügst.\nDu kannst auch andere Jahre einsehen mit `/arbeitsstunden_anzeigen 2022`\nUm alle deine Arbeitseinsätze anzuzeigen, füge "details" hinzu `/arbeitsstunden_anzeigen details`\nEs geht auch eine Kombination `/arbeitsstunden_anzeigen 2022 details`'
    }
  },
  {
    type: 'actions',
    block_id: constants.homeView.inputBlockId,
    elements: [
      {
        type: 'checkboxes',
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'Details',
              emoji: true
            },
            value: '1'
          }
        ],
        action_id: constants.homeView.detailsSelect
      },
      {
        type: 'static_select',
        initial_option: { text: { type: 'plain_text', text: '' } }, // object like in options. Filled in method
        options: [], // filled in method
        action_id: constants.homeView.yearSelect
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '/arbeitsstunden_anzeigen',
          emoji: true
        },
        action_id: constants.homeView.displayHours
      }
    ]
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*2️⃣ `/arbeitsstunden_erfassen` Kommando:*\nMit diesem Kommando kannst du geleistete Stunden erfassen. Es wird ein Dialog geöffnet, in dem du die Details mitgeben kannst. Im Anschluss wird die Anfrage zur Genehmigung an den Vorstand weitergeleitet. Sobald dieser genehmigt hat, wirst du benachrichtigt.'
    }
  },
  {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '/arbeitsstunden_erfassen',
          emoji: true
        },
        action_id: constants.homeView.maintainHours
      }
    ]
  }
];
