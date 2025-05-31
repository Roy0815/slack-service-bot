import { homeView, competitionRegistrationView } from './views.js';
import * as util from '../general/util.js';
import * as constants from './constants.js';

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
   * proccess
   */
  // iterate over blocks to make changes e.g. add options to dropdowns
  view.blocks.forEach((block) => {
    switch (block.block_id) {
      case constants.competitionRegistrationView.blockCompetition:
        fillCompetitionDropdown(block);
        break;
      /** @todo case weightClass -> Fill dropdown with weight classes for athletes sex */
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

  // Dropping example values from view
  dropdown.options = [];
  const competitions = getLiveCompetitions();
  competitions.forEach((competition) => {
    /** @type {import('@slack/types').PlainTextOption} */
    const newDropdownOption = {
      text: { type: 'plain_text', text: competition.name, emoji: true },
      value: competition.id
    };
    dropdown.options.push(newDropdownOption);
  });
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
