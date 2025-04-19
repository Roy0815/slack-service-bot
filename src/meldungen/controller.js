import { homeView, competitionRegistrationView } from './views.js';
import * as util from '../general/util.js';
import * as constants from './constants.js';
import * as types from './types.js';

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
 * @returns {import("@slack/web-api").ViewsOpenArguments}
 */
export function getCompetitionRegistrationView(triggerId) {
  const view = util.deepCopy(competitionRegistrationView);
  /**
   * @todo get athlete information: Full name, Birthday, Sex.
   * Maybe do that in app.js, since it will be required again later in the
   * process
   */
  // iterate over blocks to make changes e.g. add options to dropdowns
  view.blocks.forEach((block) => {
    switch (block.block_id) {
      case constants.competitionRegistrationView.blockCompetition:
        fillCompetitionDropdown(block);
        break;
      /** @todo case weightClass -> Fill dropdown with weight classes for athletes sex */
      case constants.competitionRegistrationView.blockWeightClass:
        fillWeightClassDropdown(block);
        break;
      default:
        break;
    }
  });
  return { trigger_id: triggerId, view };
}

/**
 * Fills the competition dropdown with competitions
 * @param {import('@slack/types').AnyBlock} block
 */
function fillCompetitionDropdown(block) {
  const inputBlock =
    /** @type {import('@slack/types').InputBlock} */
    (block);
  const dropdown =
    /** @type {import('@slack/types').StaticSelect} */
    (inputBlock.element);

  const competitions = getLiveCompetitions();

  // Map 'competitions' to the format expected by fillDropdownOptions()
  /** @type {types.dropdownOption[]} */
  const optionContents = competitions.map((competition) => ({
    text: competition.name,
    value: competition.id
  }));

  fillDropdownOptions(dropdown, optionContents);
}

/**
 * Retrieves competition information from Google Sheet
 * @returns {{id: string, name: string}[]} Array of Competitions
 */
function getLiveCompetitions() {
  /** @todo Actually get from google sheet */
  return [
    { id: 'compID1', name: 'Test-Comp-1' },
    { id: 'compID2', name: 'Test-Comp-2' }
  ];
}

/**
 * Fills the weight class dropdown with the weight classes for the athletes sex
 * @param {import('@slack/types').AnyBlock} block
 */
function fillWeightClassDropdown(block) {
  /** @todo get athlete sex */

  /** @todo get weight class array depending on sex */

  const weightClasses = constants.weightClassesMale;
  /** @todo fill dropdown with values from weight class dropdown */
  const inputBlock =
    /** @type {import('@slack/types').InputBlock} */
    (block);
  const dropdown =
    /** @type {import('@slack/types').StaticSelect} */
    (inputBlock.element);

  // Map 'weightClases' to the format expected by fillDropdownOptions()
  /** @type {types.dropdownOption[]} */
  const optionContents = weightClasses.map((weightClass) => ({
    text: weightClass,
    value: weightClass
  }));

  fillDropdownOptions(dropdown, optionContents);
}

/**
 *
 * @param {import('@slack/types').StaticSelect} dropdown
 * @param {types.dropdownOption[]} optionContents
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
