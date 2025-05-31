import {
  homeView,
  competitionRegistrationView,
  competitionCreationView
} from './views.js';
import * as util from '../general/util.js';
import * as constants from './constants.js';
import * as types from './types.js';
import * as sheet from './sheet.js';
import { masterdataService } from '../general/masterdata/service.js';
import * as masterdataTypes from '../general/masterdata/types.js';

/**
 * Get part of the home view
 * @returns {import("@slack/types").KnownBlock[]}
 */
export function getHomeView() {
  const view = util.deepCopy(homeView);
  return view;
}

/**
 * Get initial pop up for competition registration
 * @param {string} triggerId
 * @param {masterdataTypes.userContactCard} user
 * @returns {Promise<import("@slack/web-api").ViewsOpenArguments>}
 */
export async function getCompetitionRegistrationView(triggerId, user) {
  const view = util.deepCopy(competitionRegistrationView);
  // iterate over blocks to make changes e.g. add options to dropdowns
  await Promise.all(
    view.blocks.map(async (block) => {
      switch (block.block_id) {
        case constants.competitionRegistrationView.blockCompetitionSelect:
          await fillCompetitionDropdown(block);
          break;
        case constants.competitionRegistrationView.blockWeightClassSelect:
          fillWeightClassDropdown(block);
          break;
        case constants.competitionRegistrationView.blockHandlerNeededSelect:
          fillHandlerNeededDropdown(block);
          break;
        default:
          break;
      }
    })
  );
  return { trigger_id: triggerId, view };
}

/**
 * Fills the competition dropdown with competitions
 * @param {import('@slack/types').AnyBlock} block
 */
async function fillCompetitionDropdown(block) {
  const inputBlock =
    /** @type {import('@slack/types').InputBlock} */
    (block);
  const dropdown =
    /** @type {import('@slack/types').StaticSelect} */
    (inputBlock.element);

  const competitions = await sheet.getLiveCompetitions();

  // Map 'competitions' to the format expected by fillDropdownOptions()
  /** @type {types.dropdownOptionPlainText[]} */
  const optionContents = competitions.map((competition) => ({
    text: competition.name,
    value: competition.id
  }));

  if (optionContents.length > 0) {
    await fillDropdownOptions(dropdown, optionContents);
  }
}

/**
 * Fills the weight class dropdown with the weight classes for the athletes sex
 * @param {import('@slack/types').AnyBlock} block
 */
async function fillWeightClassDropdown(block) {
  /** @todo get weight class array depending on sex */

  const weightClasses = Object.values(constants.weightClassesFemale);
  weightClasses.push(...Object.values(constants.weightClassesMale));
  const inputBlock =
    /** @type {import('@slack/types').InputBlock} */
    (block);
  const dropdown =
    /** @type {import('@slack/types').StaticSelect} */
    (inputBlock.element);

  // Map 'weightClases' to the format expected by fillDropdownOptions()
  /** @type {types.dropdownOptionPlainText[]} */
  const optionContents = weightClasses.map((weightClass) => ({
    text: weightClass,
    value: weightClass
  }));

  fillDropdownOptions(dropdown, optionContents);
}

/**
 * Fills the "handler needed" dropdown with the correct options
 * @param {import('@slack/types').AnyBlock} block
 */
function fillHandlerNeededDropdown(block) {
  const inputBlock =
    /** @type {import('@slack/types').InputBlock} */
    (block);
  const dropdown =
    /** @type {import('@slack/types').StaticSelect} */
    (inputBlock.element);

  const handlerNeededOptions = Object.values(constants.handlerNeeded);

  // Map 'handlerNeededOptions' to the format expected by fillDropdownOptions()
  /** @type {types.dropdownOptionPlainText[]} */
  const optionContents = handlerNeededOptions.map((handlerNeededOption) => ({
    text: handlerNeededOption,
    value: handlerNeededOption
  }));
  fillDropdownOptions(dropdown, optionContents);
}

/**
 *
 * @param {import('@slack/types').StaticSelect} dropdown
 * @param {types.dropdownOptionPlainText[]} optionContents
 */
function fillDropdownOptions(dropdown, optionContents) {
  // Dropping existing values from dropdown
  dropdown.options = [];

  optionContents.forEach((optionContent) => {
    /** @type {import('@slack/types').PlainTextOption} */
    const newDropdownOption = {
      text: { type: 'plain_text', text: optionContent.text, emoji: true },
      value: optionContent.value
    };
    dropdown.options.push(newDropdownOption);
  });
}

/**
 * Message to notify user that competition registration has been requested
 * @param {types.competitionRegistrationData} competitionRegistrationData
 * @returns {import("@slack/web-api").ChatPostMessageArguments}
 */
export function getUserConfirmMessageCompetitionCreation(
  competitionRegistrationData
) {
  return {
    channel: competitionRegistrationData.slackID,
    text:
      `Deine Meldeanfrage wurde mit folgenden Daten erfasst:
    \nWettkampf: ${competitionRegistrationData.competition_id}` +
      `\nGewichtsklasse: ${competitionRegistrationData.weight_class}` +
      `\nHandler benötigt: ${competitionRegistrationData.handler_needed}` +
      `\nZahlungsbeleg: <${competitionRegistrationData.payment_record_file_permalink}|Hier klicken>` +
      `\n\n` +
      `\nDie Anfrage wird an die Admins weitergeleitet und geprüft. ` +
      `\nBitte überprüfe den Status deiner Meldung unter ` +
      `https://docs.google.com/spreadsheets/d/${process.env.SPREADSHEET_ID_MELDUNGEN}` +
      `\nDirekter link zum sheet: https://docs.google.com/spreadsheets/d/${process.env.SPREADSHEET_ID_MELDUNGEN}/edit#gid=${competitionRegistrationData.competition_id}` +
      `\nFalls der Bot deine Meldung nicht umgehend im Spreadsheet einträgt, oder etwas schief gelaufen ist, melde dich unbedingt per mail an ` +
      `kdk@schwerathletik-mannheim.de`
  };
}

/**
 * Get pop up for competition creation
 * @param {string} triggerId
 * @returns {import("@slack/web-api").ViewsOpenArguments}
 */
export function getCompetitionCreationView(triggerId) {
  const view = util.deepCopy(competitionCreationView);

  return { trigger_id: triggerId, view };
}

/**
 * Message to notify admin that a new competition has been created
 * @param {types.competitionData} competitionData
 * @param {string} userId
 * @returns {import("@slack/web-api").ChatPostMessageArguments}
 */
export function getAdminConfirmMessageCompetitionCreation(
  competitionData,
  userId
) {
  return {
    channel: process.env.MELDUNGEN_ADMIN_CHANNEL,
    text:
      `Ein neuer Wettkampf wurde erstellt von <@${userId}>:` +
      `\nID: ${competitionData.competition_id}` +
      `\nName: ${competitionData.competition_name}` +
      `\nDatum: ${competitionData.competition_date}` +
      `\nOrt: ${competitionData.competition_location}`
  };
}

/**
 * Saves a competition registration to the correct sheet for the competition
 * with the initial state
 * @param {types.competitionRegistrationData} competitionRegistrationData
 */
export async function saveCompetitionRegistration(competitionRegistrationData) {
  sheet.saveInitialCompetitionRegistration(competitionRegistrationData);
}

/**
 * Message for admin channel to confirm or deny a competition registration
 * @param {types.competitionRegistrationData} competitionRegistrationData
 * @returns {import("@slack/web-api").ChatPostMessageArguments}
 */
export function getAdminConfirmMessageCompetitionRegistration(
  competitionRegistrationData
) {
  return {
    channel: process.env.MELDUNGEN_ADMIN_CHANNEL,
    text: `Eine neue Wettkampfmeldung wurde eingereicht von <@${competitionRegistrationData.slackID}>:`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `*Neue Wettkampfmeldung von <@${competitionRegistrationData.slackID}>*\n` +
            `*Wettkampf:* ${competitionRegistrationData.competition_id}\n` +
            `*Name:* ${competitionRegistrationData.first_name} ${competitionRegistrationData.last_name}\n` +
            `*Geburtsjahr:* ${competitionRegistrationData.birthyear}\n` +
            `*Gewichtsklasse:* ${competitionRegistrationData.weight_class}\n` +
            `*Handler benötigt:* ${competitionRegistrationData.handler_needed}\n` +
            `*Zahlungsbeleg:* <${competitionRegistrationData.payment_record_file_permalink}|Hier klicken>\n\n` +
            `Bitte bestätigt oder lehnt die Wettkampfmeldung ab.`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Bestätigen'
            },
            style: 'primary',
            value: JSON.stringify(competitionRegistrationData),
            action_id: constants.competitionRegistrationAdminActions.confirm
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Ablehnen'
            },
            style: 'danger',
            value: JSON.stringify(competitionRegistrationData),
            action_id: constants.competitionRegistrationAdminActions.deny
          }
        ]
      }
    ]
  };
}

/**
 * Extracts competition registration data from Slack view submission
 * @param {object} selectedValues
 * @param {masterdataTypes.user} user
 * @returns {types.competitionRegistrationData}
 */
export function extractCompetitionRegistrationData(selectedValues, user) {
  /** @type {types.competitionRegistrationData} */
  const competitionRegistrationData = {
    slackID: user.slackId,
    first_name: user.firstname,
    last_name: user.lastname,
    birthyear: Number(user.birthday.slice(-4)),

    competition_id:
      selectedValues[
        constants.competitionRegistrationView.blockCompetitionSelect
      ][constants.competitionRegistrationView.actionCompetitionSelect]
        .selected_option.value,

    weight_class:
      selectedValues[
        constants.competitionRegistrationView.blockWeightClassSelect
      ][constants.competitionRegistrationView.actionWeightClassSelect]
        .selected_option.value,

    handler_needed:
      selectedValues[
        constants.competitionRegistrationView.blockHandlerNeededSelect
      ][constants.competitionRegistrationView.actionHandlerNeededSelect]
        .selected_option.value,

    payment_record_file_permalink:
      selectedValues[
        constants.competitionRegistrationView.blockPaymentRecordUpload
      ][constants.competitionRegistrationView.actionPaymentRecordUpload]
        .files[0].permalink
  };

  return competitionRegistrationData;
}
