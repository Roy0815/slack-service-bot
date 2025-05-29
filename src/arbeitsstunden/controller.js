import * as types from './types.js';
import * as sheet from './sheet.js';
import * as constants from './constants.js';
import { homeView, maintainHoursView, registerView } from './views.js';

import * as util from '../general/util.js';
import { basicConfirmDialogView } from '../general/views.js';
import { SlackViewSubmissionError } from '../general/types.js';

export * from './sheet.js';

/**
 * Get message for admin channel user registration
 * @param {types.workedHours} hoursObj
 * @param {string} [yearText]
 * @returns {import("@slack/bolt").RespondArguments}
 */
export function getHoursDisplayResponse(hoursObj, yearText) {
  const year =
    !yearText || yearText === '' ? new Date().getFullYear() : yearText;

  // build text
  const text = `Du hast ${year} bereits ${
    hoursObj.workedHours
  } Arbeitsstunden geleistet. Du musst noch ${
    hoursObj.targetHours
  } Stunden leisten.`;

  /** @type {import("@slack/bolt").RespondArguments} */
  const response = {
    text,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text
        }
      }
    ]
  };

  // build message blocks
  if (hoursObj.details.length > 0) {
    response.blocks.push(
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Datum\t\t\tStunden\tTätigkeit'
        }
      },
      {
        type: 'divider'
      }
    );

    hoursObj.details.forEach((element) => {
      response.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${element.date}*\t${element.hours}\t\t\t\t_${element.description}_`
        }
      });
    });
  }

  return response;
}

/**
 * Get part of the home view
 * @returns {import("@slack/types").KnownBlock[]}
 */
export function getHomeView() {
  const view = util.deepCopy(homeView);

  // add year options
  let year = new Date().getFullYear();

  const actionBlock = /** @type {import('@slack/types').ActionsBlock} */ (
    view[2]
  );

  while (year >= 2022) {
    /** @type {import('@slack/types').StaticSelect} */ (
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

  /** @type {import('@slack/types').StaticSelect} */ (
    actionBlock.elements[1]
  ).initial_option = /** @type {import('@slack/types').StaticSelect} */ (
    actionBlock.elements[1]
  ).options[0];

  return view;
}

/**
 * Get popup for own user registration
 * @param {string} triggerId
 * @returns {Promise<import("@slack/web-api").ViewsOpenArguments>}
 */
export async function getRegisterView(triggerId) {
  const view = util.deepCopy(registerView);

  const element = /** @type {import("@slack/types").InputBlock} */ (
    view.blocks[0]
  ).element;

  for (const user of await sheet.getAllUsers()) {
    /** @type {import("@slack/types").StaticSelect} */ (element).options.push({
      text: {
        type: 'plain_text',
        text: `${user.firstname} ${user.lastname}`,
        emoji: true
      },
      value: user.id.toString()
    });
  }

  return { trigger_id: triggerId, view };
}

/**
 * Get message for admin channel user registration
 * @param {string} slackId
 * @returns {Promise<import("@slack/web-api").ChatPostMessageArguments>}
 */
export async function getAutoRegisterMessage(slackId) {
  const view = util.deepCopy(basicConfirmDialogView);
  view.channel = await sheet.getAdminChannel();

  // required for typing
  if (!('blocks' in view)) {
    return;
  }

  view.text = /** @type {import('@slack/types').SectionBlock} */ (
    view.blocks[0]
  ).text.text =
    `<@${slackId}> ist beigetreten und noch nicht registriert. Bitte wähle den Namen aus:`;

  const actionBlock = /** @type {import('@slack/types').ActionsBlock} */ (
    view.blocks[1]
  );

  /** @type {import('@slack/types').Button} */
  (actionBlock.elements[0]).value = slackId;

  /** @type {import('@slack/types').Button} */
  (actionBlock.elements[0]).text.text = 'Submit';

  /** @type {import('@slack/types').Button} */
  (actionBlock.elements[0]).action_id = constants.autoRegisterApproval.submit;
  actionBlock.block_id = constants.autoRegisterView.inputBlock;

  // add user select
  actionBlock.elements.unshift({
    type: 'external_select',
    placeholder: {
      type: 'plain_text',
      text: 'Name'
    },
    min_query_length: 0,
    action_id: constants.autoRegisterView.actionNameSelect
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
export async function getRegisterConfirmDialog(registerObj) {
  const view = util.deepCopy(basicConfirmDialogView);
  view.channel = await sheet.getAdminChannel();

  // required for correct typing
  if (!('blocks' in view)) {
    return;
  }

  view.text = /** @type {import('@slack/types').SectionBlock} */ (
    view.blocks[0]
  ).text.text =
    `<@${registerObj.slackId}> möchte sich als ${registerObj.name} registrieren`;

  const actionBlock = /** @type {import('@slack/types').ActionsBlock} */ (
    view.blocks[1]
  );

  const btn1 = /** @type {import('@slack/types').Button} */ (
    actionBlock.elements[0]
  );

  const btn2 = /** @type {import('@slack/types').Button} */ (
    actionBlock.elements[1]
  );

  btn1.value = JSON.stringify(registerObj);
  btn1.action_id = constants.registerApproval.approveButton;
  btn2.value = JSON.stringify(registerObj);
  btn2.action_id = constants.registerApproval.rejectButton;

  return view;
}

/**
 * Message to notify user that registration has been requested
 * @param {types.registerObj} registerObj
 * @returns {import("@slack/web-api").ChatPostMessageArguments}
 */
export function getUserRegisterStartMessage({ slackId, name }) {
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
export function getUserRegisterEndMessage({ slackId, name, approved }) {
  return {
    channel: slackId,
    text: `Deine Registrierung als ${name} wurde ${
      approved
        ? 'genehmigt. Du kannst jetzt deine Arbeitsstunden und Stammdaten erfassen und abrufen.'
        : 'abgelehnt.'
    }`
  };
}

/**
 * Get popup for hours maintenance
 * @param {string} triggerId
 * @returns {import("@slack/web-api").ViewsOpenArguments}
 */
export function getMaintainHoursView(triggerId) {
  const view = util.deepCopy(maintainHoursView);

  return { trigger_id: triggerId, view };
}

/**
 * Get confirm dialog for hours maintenance in admin channel
 * @param {types.hoursObjMaint} hoursObjMaint
 * @returns {Promise<import("@slack/web-api").ChatPostMessageArguments>}
 */
export async function getMaintainConfirmDialog(hoursObjMaint) {
  const view = util.deepCopy(basicConfirmDialogView);

  // required for correct typing
  if (!('blocks' in view)) {
    return;
  }

  const [year, month, day] = hoursObjMaint.date.split('-');
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));

  view.channel = await sheet.getAdminChannel();

  view.text = /** @type {import('@slack/types').SectionBlock} */ (
    view.blocks[0]
  ).text.text = `<@${
    hoursObjMaint.slackId
  }> möchte folgenden Arbeitseinsatz erfassen:\n${hoursObjMaint.description}: ${
    hoursObjMaint.hours
  } Stunde${hoursObjMaint.hours === 1 ? '' : 'n'} am ${util.formatDate(
    dateObj
  )}`;

  const actionBlock = /** @type {import('@slack/types').ActionsBlock} */ (
    view.blocks[1]
  );

  const btn1 = /** @type {import('@slack/types').Button} */ (
    actionBlock.elements[0]
  );

  const btn2 = /** @type {import('@slack/types').Button} */ (
    actionBlock.elements[1]
  );

  btn1.value = JSON.stringify(hoursObjMaint);
  btn1.action_id = constants.maintenanceApproval.approveButton;
  btn2.value = JSON.stringify(hoursObjMaint);
  btn2.action_id = constants.maintenanceApproval.rejectButton;

  return view;
}

/**
 * Get message to notify user that hours maintenance has been requested
 * @param {types.hoursObjMaint} hoursObjMaint
 * @returns {import("@slack/web-api").ChatPostMessageArguments}
 */
export function getUserMaintainStartMessage({
  slackId,
  description,
  hours,
  date
}) {
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
export function getUserMaintainEndMessage(hoursMaintFinalizer) {
  const [year, month, day] = hoursMaintFinalizer.date.split('-');
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));

  return {
    channel: hoursMaintFinalizer.slackId,
    text: `Deine Erfassung von ${
      hoursMaintFinalizer.hours
    } Stunden am ${util.formatDate(dateObj)} für "${
      hoursMaintFinalizer.description
    }" wurde \`${hoursMaintFinalizer.approved ? 'genehmigt' : 'abgelehnt'}\`.`
  };
}

/**
 * retrieve data from view submission body
 * @param {import("@slack/bolt").SlackViewAction} body
 * @returns {types.hoursObjMaint}
 */
export function getDataFromHoursMaintView(body) {
  // get data
  const hoursMaintObj = {
    slackId: body.user.id,
    description:
      body.view.state.values[constants.maintainHoursView.blockDescription][
        constants.maintainHoursView.actionDescription
      ].value,
    hours: Number(
      body.view.state.values[constants.maintainHoursView.blockHours][
        constants.maintainHoursView.actionHours
      ].value.replace(',', '.')
    ),
    date: body.view.state.values[constants.maintainHoursView.blockDate][
      constants.maintainHoursView.actionDate
    ].selected_date
  };

  // validate year
  const year = Number(hoursMaintObj.date.split('-')[0]);

  const currYear = new Date().getFullYear();

  if (year < currYear - 1 || year > currYear + 1) {
    throw new SlackViewSubmissionError(
      constants.maintainHoursView.blockDate,
      `Du kannst nur Daten zwischen ${currYear - 1} und ${currYear + 1} pflegen`
    );
  }

  // check hours
  if (Number.isNaN(hoursMaintObj.hours) || hoursMaintObj.hours <= 0) {
    throw new SlackViewSubmissionError(
      constants.maintainHoursView.blockHours,
      `Deine eingegeben Stunden sind keine Zahl. Bitte nur Zahlen und "," verwenden.`
    );
  }

  return hoursMaintObj;
}
