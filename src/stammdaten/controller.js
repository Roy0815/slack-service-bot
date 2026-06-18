import * as views from './views.js';
import * as constants from './constants.js';

import * as util from '../general/util.js';
import * as mdTypes from '../general/masterdata/types.js';
import { basicConfirmDialogView } from '../general/views.js';
import { masterdataService } from '../general/masterdata/service.js';
import { getAdminChannel } from '../arbeitsstunden/sheet.js';

export * from './constants.js';

/**
 * Export stammdaten home view component
 * @returns {import("@slack/types").KnownBlock[]}
 */
export function getHomeView() {
  return util.deepCopy(views.homeView);
}

/**
 * build maintain view
 * @param {string} slackId
 * @returns {Promise<import('@slack/types').View>}
 */
export async function getChangeMasterdataView(slackId) {
  const view = util.deepCopy(views.changeMasterdataView);

  const userInfo = await masterdataService.getUserContactCardFromId({
    slackId
  });

  if (!userInfo) return view;

  // set placeholders
  Object.keys(constants.changeMasterdataViewBlocks).forEach((key, index) => {
    /** @type {any} */ (view.blocks[index + 1]).element.placeholder.text =
      /** @type {Record<string, any>} */ (userInfo)[key];
  });

  return view;
}

/**
 * get input parameters in structured format
 * @param {import('@slack/bolt').SlackViewAction} body
 * @returns {mdTypes.approvalObject}
 */
export function buildMaintainObject(body) {
  /** @type {mdTypes.approvalObject} */
  const maintObj = {};

  // extract data from view
  const viewBlocks = /** @type {Record<string, any>} */ (
    constants.changeMasterdataViewBlocks
  );
  const viewActions = /** @type {Record<string, any>} */ (
    constants.changeMasterdataViewActions
  );
  Object.keys(constants.changeMasterdataViewBlocks).forEach((key) => {
    /** @type {Record<string, any>} */ (maintObj)[key] =
      body.view.state.values[viewBlocks[key]][viewActions[key]].value;
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
 * @param {mdTypes.approvalObject} maintObj
 * @param {string} changesMessage
 * @returns {Promise<import("@slack/web-api").ChatPostMessageArguments>}
 */
export async function getMaintainConfirmDialog(maintObj, changesMessage) {
  const view = util.deepCopy(basicConfirmDialogView);

  view.channel = await getAdminChannel();

  if (!('blocks' in view)) {
    throw new Error('basicConfirmDialogView missing blocks');
  }

  // set text in blocks and message preview
  view.text = /** @type {any} */ (view.blocks[0]).text.text =
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
  btn1.action_id = constants.approvalActions.approve;
  btn2.value = JSON.stringify(maintObj);
  btn2.action_id = constants.approvalActions.reject;

  return view;
}

/**
 * get text for changes
 * @param {mdTypes.approvalObject} maintObj
 * @returns {Promise<string>}
 */
export async function getChangesMessage(maintObj) {
  const userInfo = await masterdataService.getUserContactCardFromId({
    slackId: maintObj.slackId
  });

  let text = ``;

  if (!userInfo) return text;

  const userInfoAny = /** @type {Record<string, any>} */ (userInfo);
  const maintObjAny = /** @type {Record<string, any>} */ (maintObj);
  const fieldNames = /** @type {Record<string, any>} */ (
    constants.masterDataFieldNames
  );

  Object.keys(maintObj).forEach((key) => {
    // check if field was filled and changed (except slackId)
    if (
      key === 'slackId' ||
      !maintObjAny[key] ||
      maintObjAny[key] === '' ||
      maintObjAny[key] === userInfoAny[key]
    )
      return;

    text += `\n\`${fieldNames[key]}\`: ${userInfoAny[key]} :arrow_right: ${maintObjAny[key]}`;
  });

  return text;
}
