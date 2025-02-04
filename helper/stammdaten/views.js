// imports
import * as util from '../general/util.js';
import * as views from '../general/views.js';
import * as asSheet from '../arbeitsstunden/sheet.js';
import * as masterdataSheet from '../general/google-amazon-utility/masterdata-sheet.js';
import * as types from '../general/google-amazon-utility/types.js';

//* ******************* Constants ********************//
export const homeViewCommand = 'stammdaten-home-command';
export const homeViewInputBlockId = 'stammdaten-home-input-block';

export const changeMasterdataViewName = 'changemasterdata';

/**
 * @readonly
 * @enum {string}
 */
export const approvalActions = {
  approve: 'stammdaten-approve',
  reject: 'stammdaten-reject'
};
/**
 * @readonly
 * @enum {string}
 */
export const changeMasterdataViewBlocks = {
  firstname: 'stammdaten-changeView-firstname',
  lastname: 'stammdaten-changeView-lastname',
  email: 'stammdaten-changeView-email',
  phone: 'stammdaten-changeView-phone',
  street: 'stammdaten-changeView-street',
  houseNumber: 'stammdaten-changeView-housenumber',
  city: 'stammdaten-changeView-city',
  zip: 'stammdaten-changeView-zip'
};
/**
 * @readonly
 * @enum {string}
 */
export const changeMasterdataViewActions = {
  firstname: 'stammdaten-changeView-firstname',
  lastname: 'stammdaten-changeView-lastname',
  email: 'stammdaten-changeView-email',
  phone: 'stammdaten-changeView-phone',
  street: 'stammdaten-changeView-street',
  houseNumber: 'stammdaten-changeView-housenumber',
  city: 'stammdaten-changeView-city',
  zip: 'stammdaten-changeView-zip'
};

/**
 * @readonly
 * @enum {string}
 */
const masterDataFieldNames = {
  firstname: 'Vorname',
  lastname: 'Nachname',
  email: 'Email',
  phone: 'Telefonnummer',
  street: 'Straße',
  houseNumber: 'Hausnummer',
  city: 'Stadt',
  zip: 'Postleitzahl'
};

//* ******************* Views ********************//
/** @type {import("@slack/types").KnownBlock[]} */
const homeView = [
  {
    type: 'header',
    text: {
      type: 'plain_text',
      text: 'Stammdaten anzeigen und pflegen',
      emoji: true
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*`/stammdaten` Kommando:*\nMit diesem Kommando kannst du deine hinterlegten Stammdaten anzeigen und bei Bedarf ändern.\nDazu zählen: Email, Telefonnummer und deine Adresse.\n\nEs wird ein Dialog gestartet, in dem du die Daten ändern kannst. Beim Speichern werden die Daten zur Bestätigung an einen Admin geschickt und du wirst benachrichtigt, sobald die Änderung bestätigt wurde.'
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
          text: '/stammdaten',
          emoji: true
        },
        action_id: homeViewCommand
      }
    ]
  }
];

/** @type {import('@slack/types').View} */
const changeMasterdataView = {
  type: 'modal',
  callback_id: changeMasterdataViewName,
  title: {
    type: 'plain_text',
    text: 'Stammdaten ändern',
    emoji: true
  },
  submit: {
    type: 'plain_text',
    text: 'Speichern',
    emoji: true
  },
  close: {
    type: 'plain_text',
    text: 'Abbrechen',
    emoji: true
  },
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Bitte nur die Felder ausfüllen, die geändert werden sollen :slightly_smiling_face:'
      }
    },
    {
      type: 'input',
      block_id: changeMasterdataViewBlocks.firstname,
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: changeMasterdataViewActions.firstname,
        placeholder: {
          type: 'plain_text',
          text: ''
        }
      },
      label: {
        type: 'plain_text',
        text: 'Vorname',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: changeMasterdataViewBlocks.lastname,
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: changeMasterdataViewActions.lastname,
        placeholder: {
          type: 'plain_text',
          text: ''
        }
      },
      label: {
        type: 'plain_text',
        text: 'Nachname',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: changeMasterdataViewBlocks.email,
      optional: true,
      element: {
        type: 'email_text_input',
        action_id: changeMasterdataViewActions.email,
        placeholder: {
          type: 'plain_text',
          text: ''
        }
      },
      label: {
        type: 'plain_text',
        text: 'Email',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: changeMasterdataViewBlocks.phone,
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: changeMasterdataViewActions.phone,
        placeholder: {
          type: 'plain_text',
          text: ''
        }
      },
      hint: {
        type: 'plain_text',
        text: 'Format: +49162123456',
        emoji: true
      },
      label: {
        type: 'plain_text',
        text: 'Telefonnummer',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: changeMasterdataViewBlocks.street,
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: changeMasterdataViewActions.street,
        placeholder: {
          type: 'plain_text',
          text: ''
        }
      },
      label: {
        type: 'plain_text',
        text: 'Straße',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: changeMasterdataViewBlocks.houseNumber,
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: changeMasterdataViewActions.houseNumber,
        placeholder: {
          type: 'plain_text',
          text: ''
        }
      },
      label: {
        type: 'plain_text',
        text: 'Hausnummer',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: changeMasterdataViewBlocks.city,
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: changeMasterdataViewActions.city,
        placeholder: {
          type: 'plain_text',
          text: ''
        }
      },
      label: {
        type: 'plain_text',
        text: 'Ort',
        emoji: true
      }
    },
    {
      type: 'input',
      block_id: changeMasterdataViewBlocks.zip,
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: changeMasterdataViewActions.zip,
        placeholder: {
          type: 'plain_text',
          text: ''
        }
      },
      label: {
        type: 'plain_text',
        text: 'Postleitzahl',
        emoji: true
      }
    }
  ]
};

//* ******************* Public Functions ********************//
/**
 * Export stammdaten home view component
 * @returns {import("@slack/types").KnownBlock[]}
 */
export function getHomeView() {
  return util.deepCopy(homeView);
}

/**
 * build maintain view
 * @param {string} slackId
 * @returns {Promise<import('@slack/types').View>}
 */
export async function getChangeMasterdataView(slackId) {
  const view = util.deepCopy(changeMasterdataView);

  const userInfo = await masterdataSheet.getUserContactCard({ slackId });

  // set placeholders
  Object.keys(changeMasterdataViewBlocks).forEach((key, index) => {
    if (key === 'vCardContent') return;

    /** @type {import('@slack/types').PlainTextInput} */ (
      /** @type {import('@slack/types').InputBlock} */ (view.blocks[index + 1])
        .element
    ).placeholder.text = userInfo[key];
  });

  return view;
}

/**
 * get input parameters in structured format
 * @param {import('@slack/bolt').SlackViewAction} body
 * @returns {types.approvalObject}
 */
export function buildMaintainObject(body) {
  /** @type {types.approvalObject} */
  const maintObj = {};

  // extract data from view
  Object.keys(changeMasterdataViewBlocks).forEach((key) => {
    maintObj[key] =
      body.view.state.values[changeMasterdataViewBlocks[key]][
        changeMasterdataViewActions[key]
      ].value;
  });

  // check if any value is filled
  if (Object.values(maintObj).every((value) => !value || value === ''))
    throw new Error('Bitte mindestens einen Wert füllen vorm Speichern');

  // fill slack ID
  maintObj.slackId = body.user.id;

  return maintObj;
}

/**
 * get input parameters in structured format
 * @param {types.approvalObject} maintObj
 * @param {string} changesMessage
 * @returns {Promise<import("@slack/web-api").ChatPostMessageArguments>}
 */
export async function getMaintainConfirmDialog(maintObj, changesMessage) {
  const view = util.deepCopy(views.basicConfirmDialogView);

  view.channel = await asSheet.getAdminChannel();

  // required for correct typing
  if (!('blocks' in view)) {
    return;
  }

  // set text in blocks and message preview
  view.text = /** @type {import('@slack/types').SectionBlock} */ (
    view.blocks[0]
  ).text.text =
    `<@${maintObj.slackId}> möchte folgende Änderungen den Stammdaten vornehmen:${changesMessage}`;

  const actionBlock = /** @type {import('@slack/types').ActionsBlock} */ (
    view.blocks[1]
  );

  const btn1 = /** @type {import('@slack/types').Button} */ (
    actionBlock.elements[0]
  );

  const btn2 = /** @type {import('@slack/types').Button} */ (
    actionBlock.elements[1]
  );

  btn1.value = JSON.stringify(maintObj);
  btn1.action_id = approvalActions.approve;
  btn2.value = JSON.stringify(maintObj);
  btn2.action_id = approvalActions.reject;

  return view;
}

/**
 * get text for changes
 * @param {types.approvalObject} maintObj
 * @returns {Promise<string>}
 */
export async function getChangesMessage(maintObj) {
  const userInfo = await masterdataSheet.getUserContactCard({
    slackId: maintObj.slackId
  });

  let text = ``;

  Object.keys(maintObj).forEach((key) => {
    // check if field was filled and changed (except slackId)
    if (
      key === 'slackId' ||
      !maintObj[key] ||
      maintObj[key] === '' ||
      maintObj[key] === userInfo[key]
    )
      return;

    text += `\n\`${masterDataFieldNames[key]}\`: ${userInfo[key]} :arrow_right: ${maintObj[key]}`;
  });

  return text;
}
