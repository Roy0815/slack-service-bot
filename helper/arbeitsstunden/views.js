// local references
const sheet = require('./sheet');
const util = require('../general/util');
const types = require('./types');

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
/** @type {import("@slack/web-api").ViewsOpenArguments} */
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

/** @type {import("@slack/web-api").ChatPostMessageArguments} */
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

/** @type {import("@slack/bolt").KnownBlock[]} */
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
        initial_option: { text: { type: 'plain_text', text: '' } }, // object like in options. Filled in method
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
/**
 * Get popup for own user registration
 * @param {string} triggerId
 * @returns {Promise<import("@slack/web-api").ViewsOpenArguments>}
 */
async function getRegisterView(triggerId) {
  /** @type {import("@slack/web-api").ViewsOpenArguments} */
  const view = util.deepCopy(registerView);
  view.trigger_id = triggerId;

  const element = /** @type {import("@slack/bolt").InputBlock} */ (
    view.view.blocks[0]
  ).element;

  for (const user of await sheet.getAllUsers()) {
    /** @type {import("@slack/bolt").StaticSelect} */ (element).options.push({
      text: {
        type: 'plain_text',
        text: `${user.firstname} ${user.lastname}`,
        emoji: true
      },
      value: user.id.toString()
    });
  }

  return view;
}

/**
 * Get message for admin channel user registration
 * @param {string} slackId
 * @returns {Promise<import("@slack/web-api").ChatPostMessageArguments>}
 */
async function getAutoRegisterMessage(slackId) {
  /** @type {import("@slack/web-api").ChatPostMessageArguments} */
  const view = util.deepCopy(basicConfirmDialogView);
  view.channel = await sheet.getAdminChannel();

  view.text = /** @type {import('@slack/bolt').SectionBlock} */ (
    view.blocks[0]
  ).text.text = `<@${slackId}> ist beigetreten und noch nicht registriert. Bitte wähle den Namen aus:`;

  const actionBlock = /** @type {import('@slack/bolt').ActionsBlock} */ (
    view.blocks[1]
  );

  /** @type {import('@slack/bolt').Button} */
  (actionBlock.elements[0]).value = slackId;

  /** @type {import('@slack/bolt').Button} */
  (actionBlock.elements[0]).text.text = 'Submit';

  actionBlock.elements[0].action_id = 'auto-register-submit-button';
  actionBlock.block_id = autoregisterInputBlock;

  // add user select
  actionBlock.elements.unshift({
    type: 'external_select',
    placeholder: {
      type: 'plain_text',
      text: 'Name'
    },
    min_query_length: 0,
    action_id: registerActionNameSelect
  });

  // remove decline button
  actionBlock.elements.pop();

  return view;
}

/**
 * Admin channel confirm dialog for register
 * @param {types.registerObj} registerObj
 * @returns {Promise<import("@slack/web-api").ChatPostMessageArguments>}
 */
async function getRegisterConfirmDialog(registerObj) {
  /** @type {import("@slack/web-api").ChatPostMessageArguments} */
  const view = util.deepCopy(basicConfirmDialogView);
  view.channel = await sheet.getAdminChannel();

  view.text = /** @type {import('@slack/bolt').SectionBlock} */ (
    view.blocks[0]
  ).text.text = `<@${registerObj.slackId}> möchte sich als ${registerObj.name} registrieren`;

  const actionBlock = /** @type {import('@slack/bolt').ActionsBlock} */ (
    view.blocks[1]
  );

  const btn1 = /** @type {import('@slack/bolt').Button} */ (
    actionBlock.elements[0]
  );

  const btn2 = /** @type {import('@slack/bolt').Button} */ (
    actionBlock.elements[1]
  );

  btn1.value = JSON.stringify(registerObj);
  btn1.action_id = 'register-approve-button';
  btn2.value = JSON.stringify(registerObj);
  btn2.action_id = 'register-reject-button';

  return view;
}

/**
 * Message to notify user that registration has been requested
 * @param {types.registerObj} registerObj
 * @returns {import("@slack/web-api").ChatPostMessageArguments}
 */
function getUserRegisterStartMessage({ slackId, name }) {
  return {
    channel: slackId,
    text: `Deine Registrierung als ${name} wurde zur Freigabe weitergeleitet.\nDu wirst informiert, sobald die Verlinkung freigegeben wurde.`
  };
}

/**
 * Message to notify user that registration has been finalized
 * @param {types.registerObjectFinalizer} registerObjectFinalizer
 * @returns {import("@slack/web-api").ChatPostMessageArguments}
 */
function getUserRegisterEndMessage({ slackId, name, approved }) {
  return {
    channel: slackId,
    text: `Deine Registrierung als ${name} wurde ${
      approved
        ? 'genehmigt. Du kannst jetzt deine Arbeitsstunden erfassen und abrufen.'
        : 'abgelehnt.'
    }`
  };
}

/**
 * Get popup for hours maintenance
 * @param {string} triggerId
 * @returns {import("@slack/web-api").ViewsOpenArguments}
 */
function getMaintainHoursView(triggerId) {
  /** @type {import("@slack/web-api").ViewsOpenArguments} */
  const view = util.deepCopy(maintainHoursView);
  view.trigger_id = triggerId;

  return view;
}

/**
 * Get confirm dialog for hours maintenance in admin channel
 * @param {types.hoursObjMaint} hoursObjMaint
 * @returns {Promise<import("@slack/web-api").ChatPostMessageArguments>}
 */
async function getMaintainConfirmDialog(hoursObjMaint) {
  /** @type {import("@slack/web-api").ChatPostMessageArguments} */
  const view = util.deepCopy(basicConfirmDialogView);

  const [year, month, day] = hoursObjMaint.date.split('-');
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));

  view.channel = await sheet.getAdminChannel();

  view.text = /** @type {import('@slack/bolt').SectionBlock} */ (
    view.blocks[0]
  ).text.text = `<@${
    hoursObjMaint.slackId
  }> möchte folgenden Arbeitseinsatz erfassen:\n${hoursObjMaint.description}: ${
    hoursObjMaint.hours
  } Stunde${hoursObjMaint.hours === 1 ? '' : 'n'} am ${util.formatDate(
    dateObj
  )}`;

  const actionBlock = /** @type {import('@slack/bolt').ActionsBlock} */ (
    view.blocks[1]
  );

  const btn1 = /** @type {import('@slack/bolt').Button} */ (
    actionBlock.elements[0]
  );

  const btn2 = /** @type {import('@slack/bolt').Button} */ (
    actionBlock.elements[1]
  );

  btn1.value = JSON.stringify(hoursObjMaint);
  btn1.action_id = 'maintain-approve-button';
  btn2.value = JSON.stringify(hoursObjMaint);
  btn2.action_id = 'register-reject-button';

  return view;
}

/**
 * Get message to notify user that hours maintenance has been requested
 * @param {types.hoursObjMaint} hoursObjMaint
 * @returns {import("@slack/web-api").ChatPostMessageArguments}
 */
function getUserMaintainStartMessage({ slackId, description, hours, date }) {
  const [year, month, day] = date.split('-');
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));

  return {
    channel: slackId,
    text: `Deine Erfassung von ${hours} Stunden am ${util.formatDate(
      dateObj
    )} für "${description}" wurde zur Freigabe weitergeleitet.\nDu wirst informiert, sobald die Stunden genehmigt wurden.`
  };
}

/**
 * Get message to notify user that hours maintenance has been finalized
 * @param {types.hoursMaintFinalizer} hoursMaintFinalizer
 * @returns {import("@slack/web-api").ChatPostMessageArguments}
 */
function getUserMaintainEndMessage(hoursMaintFinalizer) {
  const [year, month, day] = hoursMaintFinalizer.date.split('-');
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));

  return {
    channel: hoursMaintFinalizer.slackId,
    text: `Deine Erfassung von ${
      hoursMaintFinalizer.hours
    } Stunden am ${util.formatDate(dateObj)} für "${
      hoursMaintFinalizer.description
    }" wurde ${hoursMaintFinalizer.approved ? 'genehmigt' : 'abgelehnt'}.`
  };
}

/**
 * Get part of the home view
 * @returns {import("@slack/bolt").KnownBlock[]}
 */
function getHomeView() {
  /** @type {import("@slack/bolt").KnownBlock[]} */
  const view = util.deepCopy(homeView);

  // add year options
  let year = new Date().getFullYear();

  const actionBlock = /** @type {import('@slack/bolt').ActionsBlock} */ (
    view[2]
  );

  while (year >= 2022) {
    /** @type {import('@slack/bolt').StaticSelect} */ (
      actionBlock.elements[1]
    ).options.push({
      text: {
        type: 'plain_text',
        text: `${year}`,
        emoji: true
      },
      value: `${year}`
    });
    year--;
  }

  /** @type {import('@slack/bolt').StaticSelect} */ (
    actionBlock.elements[1]
  ).initial_option = /** @type {import('@slack/bolt').StaticSelect} */ (
    actionBlock.elements[1]
  ).options[0];

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
