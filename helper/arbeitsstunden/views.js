// local references
const sheet = require('./sheet');
const util = require('../general/util');

// constants
const registerViewName = 'registerview';
const registerBlockNameSelect = 'name_select_block';
const registerActionNameSelect = 'name_select';

const maintainHoursViewName = 'maintainhours';
const maintainHoursBlockDescription = 'description_block';
const autoregisterInputBlock = 'autoregisterinput_block';
const maintainHoursActionDescription = 'description';
const maintainHoursBlockDate = 'date_block';
const maintainHoursActionDate = 'date';
const maintainHoursBlockHours = 'hours_block';
const maintainHoursActionHours = 'hours';

const homeViewInputBlockId = 'as-home-view-input-block';
const homeViewYearSelect = 'as-home-year-select-action';
const homeViewDetailsSelect = 'as-home-details-select-action';
const homeViewDisplayHours = 'as-home-display-hours-action';
const homeViewMaintainHours = 'as-home-maintain-hours-action';

//* ******************* Views ********************//
const registerView = {
  trigger_id: '',
  view: {
    type: 'modal',
    callback_id: registerViewName,
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
        block_id: registerBlockNameSelect,
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
          action_id: registerActionNameSelect
        }
      }
    ]
  }
};

const maintainHoursView = {
  trigger_id: '',
  view: {
    type: 'modal',
    callback_id: maintainHoursViewName,
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
        block_id: maintainHoursBlockDescription,
        element: {
          type: 'plain_text_input',
          action_id: maintainHoursActionDescription
        },
        label: {
          type: 'plain_text',
          text: 'Kurzbeschreibung',
          emoji: true
        }
      },
      {
        type: 'input',
        block_id: maintainHoursBlockDate,
        element: {
          type: 'datepicker',
          placeholder: {
            type: 'plain_text',
            text: 'Datum auswählen',
            emoji: true
          },
          action_id: maintainHoursActionDate
        },
        label: {
          type: 'plain_text',
          text: 'Datum des Arbeitseinsatzes',
          emoji: true
        }
      },
      {
        type: 'input',
        block_id: maintainHoursBlockHours,
        element: {
          type: 'plain_text_input',
          action_id: maintainHoursActionHours,
          initial_value: '0,5'
        },
        label: {
          type: 'plain_text',
          text: 'Stunden',
          emoji: true
        }
      }
    ]
  }
};

const basicConfirmDialogView = {
  channel: '',
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
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Genehmigen',
            emoji: true
          },
          style: 'primary',
          value: '', // set in method
          action_id: '' // set in method
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Ablehnen',
            emoji: true
          },
          style: 'danger',
          value: '', // set in method
          action_id: '' // set in method
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
    block_id: homeViewInputBlockId,
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
        action_id: homeViewDetailsSelect
      },
      {
        type: 'static_select',
        initial_option: '', // object like in options. Filled in method
        options: [], // filled in method
        action_id: homeViewYearSelect
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '/arbeitsstunden_anzeigen',
          emoji: true
        },
        action_id: homeViewDisplayHours
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
        action_id: homeViewMaintainHours
      }
    ]
  }
];

//* ******************* Functions ********************//
async function getRegisterView (triggerId) {
  const view = JSON.parse(JSON.stringify(registerView));
  view.trigger_id = triggerId;

  // set users
  const users = await sheet.getAllUsers();

  for (const user of users) {
    view.view.blocks[0].element.options.push({
      text: {
        type: 'plain_text',
        text: user.name,
        emoji: true
      },
      value: user.id
    });
  }

  return view;
}

async function getAutoRegisterMessage (slackId) {
  const view = JSON.parse(JSON.stringify(basicConfirmDialogView));
  view.channel = await sheet.getAdminChannel();

  view.text =
    view.blocks[0].text.text = `<@${slackId}> ist beigetreten und noch nicht registriert. Bitte wähle den Namen aus:`;

  view.blocks[1].elements[0].value = slackId;
  view.blocks[1].elements[0].text.text = 'Submit';
  view.blocks[1].elements[0].action_id = 'auto-register-submit-button';
  view.blocks[1].block_id = autoregisterInputBlock;

  // add user select
  view.blocks[1].elements.unshift({
    type: 'external_select',
    placeholder: {
      type: 'plain_text',
      text: 'Name'
    },
    min_query_length: 0,
    action_id: registerActionNameSelect
  });

  // remove decline button
  view.blocks[1].elements.pop();

  return view;
}

async function getRegisterConfirmDialog (registerObj) {
  // { id, slackId, name, approved }
  const view = JSON.parse(JSON.stringify(basicConfirmDialogView));
  view.channel = await sheet.getAdminChannel();

  view.text =
    view.blocks[0].text.text = `<@${registerObj.slackId}> möchte sich als ${registerObj.name} registrieren`;

  view.blocks[1].elements[0].value = JSON.stringify(registerObj);
  view.blocks[1].elements[0].action_id = 'register-approve-button';
  view.blocks[1].elements[1].value = JSON.stringify(registerObj);
  view.blocks[1].elements[1].action_id = 'register-reject-button';

  return view;
}

function getUserRegisterStartMessage ({ slackId, name }) {
  return {
    channel: slackId,
    text: `Deine Registrierung als ${name} wurde zur Freigabe weitergeleitet.\nDu wirst informiert, sobald die Verlinkung freigegeben wurde.`
  };
}

function getUserRegisterEndMessage ({ slackId, name, approved }) {
  return {
    channel: slackId,
    text: `Deine Registrierung als ${name} wurde ${
      approved
        ? 'genehmigt. Du kannst jetzt deine Arbeitsstunden erfassen und abrufen.'
        : 'abgelehnt.'
    }`
  };
}

function getMaintainHoursView (triggerId) {
  const view = JSON.parse(JSON.stringify(maintainHoursView));
  view.trigger_id = triggerId;

  return view;
}

async function getMaintainConfirmDialog (entity) {
  // { slackId, title, hours, date }
  const view = JSON.parse(JSON.stringify(basicConfirmDialogView));
  const dateObj = new Date(
    entity.date.split('-')[0],
    entity.date.split('-')[1] - 1,
    entity.date.split('-')[2]
  );

  view.channel = await sheet.getAdminChannel();
  view.text = view.blocks[0].text.text = `<@${
    entity.slackId
  }> möchte folgenden Arbeitseinsatz erfassen:\n${entity.title}: ${
    entity.hours
  } Stunde${entity.hours === 1 ? '' : 'n'} am ${util.formatDate(dateObj)}`;

  view.blocks[1].elements[0].value = JSON.stringify(entity);
  view.blocks[1].elements[0].action_id = 'maintain-approve-button';
  view.blocks[1].elements[1].value = JSON.stringify(entity);
  view.blocks[1].elements[1].action_id = 'maintain-reject-button';

  return view;
}

function getUserMaintainStartMessage ({ slackId, title, hours, date }) {
  const dateObj = new Date(
    date.split('-')[0],
    date.split('-')[1] - 1,
    date.split('-')[2]
  );

  return {
    channel: slackId,
    text: `Deine Erfassung von ${hours} Stunden am ${util.formatDate(
      dateObj
    )} für "${title}" wurde zur Freigabe weitergeleitet.\nDu wirst informiert, sobald die Stunden genehmigt wurden.`
  };
}

function getUserMaintainEndMessage ({ slackId, title, hours, date, approved }) {
  const dateObj = new Date(
    date.split('-')[0],
    date.split('-')[1] - 1,
    date.split('-')[2]
  );

  return {
    channel: slackId,
    text: `Deine Erfassung von ${hours} Stunden am ${util.formatDate(
      dateObj
    )} für "${title}" wurde ${approved ? 'genehmigt' : 'abgelehnt'}.`
  };
}

function getHomeView () {
  const view = JSON.parse(JSON.stringify(homeView));

  // add year options
  let year = new Date().getFullYear();

  while (year >= 2022) {
    view[2].elements[1].options.push({
      text: {
        type: 'plain_text',
        text: `${year}`,
        emoji: true
      },
      value: `${year}`
    });
    year--;
  }

  view[2].elements[1].initial_option = view[2].elements[1].options[0];

  return view;
}

// exports
module.exports = {
  getHomeView,
  homeViewInputBlockId,
  homeViewYearSelect,
  homeViewDetailsSelect,
  homeViewDisplayHours,
  homeViewMaintainHours,

  getRegisterView,
  getRegisterConfirmDialog,
  getUserRegisterStartMessage,
  getUserRegisterEndMessage,
  getAutoRegisterMessage,
  registerViewName,
  registerBlockNameSelect,
  registerActionNameSelect,
  autoregisterInputBlock,

  getMaintainHoursView,
  getMaintainConfirmDialog,
  getUserMaintainStartMessage,
  getUserMaintainEndMessage,
  maintainHoursViewName,
  maintainHoursBlockDescription,
  maintainHoursActionDescription,
  maintainHoursBlockDate,
  maintainHoursActionDate,
  maintainHoursBlockHours,
  maintainHoursActionHours
};
