import * as types from './types.js';
import * as generalSheets from '../general/sheet.js';
import * as constants from './constants.js';
import { sheets_v4 as sheetsV4 } from 'googleapis/build/src/apis/sheets/index.js';

/**
 * Creates a new competition in the spreadsheet
 * @param {types.competitionData} competitionData
 * @returns {Promise<boolean>} return false if the competition already exists
 */
export async function createNewCompetition(competitionData) {
  // check if the competition already exists
  const competitions = await getLiveCompetitions();
  const existingCompetition = competitions.find(
    (competition) =>
      competition.name === competitionData.name &&
      competition.date === competitionData.date &&
      competition.location === competitionData.location
  );
  if (existingCompetition) {
    return false; // competition already exists
  }

  const newSheetName = await createNewCompetitionSheet(competitionData);
  appendCompetitionDataToMainSheet(competitionData, newSheetName);
  return true;
}

/**
 * Creates a new competition sheet based on the template
 * @param {types.competitionData} competitionData
 * @returns {Promise<string>} Name of the newly created sheet
 */
async function createNewCompetitionSheet(competitionData) {
  const newSheetName = getSheetNameFromCompetitionData(competitionData);
  const copyName = await generalSheets.copySheet(
    process.env.SPREADSHEET_ID_MELDUNGEN,
    'Vorlage Wettkampf'
  );
  await generalSheets.renameSheet(
    process.env.SPREADSHEET_ID_MELDUNGEN,
    copyName,
    newSheetName
  );

  const newSheetID = await generalSheets.getSheetID(
    process.env.SPREADSHEET_ID_MELDUNGEN,
    newSheetName
  );

  competitionData.ID = newSheetID.toString();

  // return a tuple of the new sheet name and the link to the new sheet
  return newSheetName;
}

/**
 * Appends competition data to the main sheet
 * @param {types.competitionData} competitionData
 * @param {string} sheetName
 */
async function appendCompetitionDataToMainSheet(competitionData, sheetName) {
  const googleSheetsLink = `=HYPERLINK("https://docs.google.com/spreadsheets/d/${process.env.SPREADSHEET_ID_MELDUNGEN}/edit#gid=${competitionData.ID}"; "${sheetName}")`;
  generalSheets.appendRow(process.env.SPREADSHEET_ID_MELDUNGEN, {
    range: constants.nameOfCompetitionSheet + '!A:E',
    values: [
      [competitionData.ID],
      [competitionData.name],
      [competitionData.date],
      [competitionData.location],
      [googleSheetsLink]
    ]
  });
}

/**
 * Generates a sheet name from the competition data
 * @param {types.competitionData} competitionData
 * @returns {string}
 */
function getSheetNameFromCompetitionData(competitionData) {
  return `${competitionData.name} (${competitionData.date}) ${competitionData.location}`;
}

/**
 * Retrieves competition information from Google Sheet
 * @returns {Promise<types.competitionData[]>} Array of Competitions
 */
export async function getLiveCompetitions() {
  /** @type {any[][]} */
  const cells = await generalSheets.getCells(
    process.env.SPREADSHEET_ID_MELDUNGEN,
    constants.nameOfCompetitionSheet
  );

  // get IDs and names of competitions
  /** @type {types.competitionData[]} */
  const competitions = [];

  for (let i = 1; i < cells.length; i++) {
    const row = cells[i];
    const competitionData = {
      ID: row[constants.competitionMainSheetColumns.competitionID],
      name: row[constants.competitionMainSheetColumns.competitionName],
      date: row[constants.competitionMainSheetColumns.competitionDate],
      location: row[constants.competitionMainSheetColumns.competitionLocation]
    };

    competitions.push(competitionData);
  }

  return competitions;
}

/**
 * Saves a competition registration to the correct sheet for the competition
 * with the initial state
 * @param {types.competitionRegistrationData} competitionRegistrationData
 * @returns {Promise<boolean>} return false if the registration already exists
 */
export async function saveInitialCompetitionRegistration(
  competitionRegistrationData
) {
  // get name of the competition sheet
  /** @type  {sheetsV4.Schema$Sheet[]} */
  const allSheets = await generalSheets.getSheets(
    process.env.SPREADSHEET_ID_MELDUNGEN
  );

  // find 'title' where 'sheetId' matches competitionRegistrationData.competition.ID
  const competitionSheet = allSheets.find(
    (sheet) =>
      sheet.properties.sheetId.toString() ===
      competitionRegistrationData.competition.ID
  );

  if (!competitionSheet) {
    throw new Error(
      `Competition sheet with ID ${competitionRegistrationData.competition.ID} not found.`
    );
  }

  // check if the registration already exists
  const cells = await generalSheets.getCells(
    process.env.SPREADSHEET_ID_MELDUNGEN,
    competitionSheet.properties.title
  );
  const existingRow = cells.findIndex(
    (row) =>
      row[constants.competitionSheetColumns.lastName] ===
        competitionRegistrationData.last_name &&
      row[constants.competitionSheetColumns.firstName] ===
        competitionRegistrationData.first_name
  );
  if (existingRow !== -1) {
    return false;
  }

  const competitionSheetName = competitionSheet.properties.title;

  await generalSheets.appendRow(process.env.SPREADSHEET_ID_MELDUNGEN, {
    range: competitionSheetName + '!A:F',
    values: [
      [competitionRegistrationData.last_name],
      [competitionRegistrationData.first_name],
      [competitionRegistrationData.birthyear],
      [competitionRegistrationData.weight_class],
      [constants.competitionRegistrationState.inProgress],
      [competitionRegistrationData.handler_needed]
    ]
  });
  return true;
}

/**
 *
 * @param {types.competitionRegistrationData} competitionRegistrationData
 * @param {string} competitionRegistrationState
 */
export async function updateCompetitionRegistrationState(
  competitionRegistrationData,
  competitionRegistrationState
) {
  // get name of the competition sheet
  /** @type  {sheetsV4.Schema$Sheet[]} */
  const allSheets = await generalSheets.getSheets(
    process.env.SPREADSHEET_ID_MELDUNGEN
  );

  // find 'title' where 'sheetId' matches competitionRegistrationData.competition.ID
  const competitionSheet = allSheets.find(
    (sheet) =>
      sheet.properties.sheetId.toString() ===
      competitionRegistrationData.competition.ID
  );

  if (!competitionSheet) {
    throw new Error(
      `Competition sheet with ID ${competitionRegistrationData.competition.ID} not found.`
    );
  }

  const competitionSheetName = competitionSheet.properties.title;

  // find row from last_name and first_name
  const cells = await generalSheets.getCells(
    process.env.SPREADSHEET_ID_MELDUNGEN,
    competitionSheetName
  );

  const row = cells.findIndex(
    (row) =>
      row[constants.competitionSheetColumns.lastName] ===
        competitionRegistrationData.last_name &&
      row[constants.competitionSheetColumns.firstName] ===
        competitionRegistrationData.first_name
  );

  // update the status in the sheet
  await generalSheets.updateCell(process.env.SPREADSHEET_ID_MELDUNGEN, {
    range: competitionSheetName + '!E' + (row + 1),
    values: [[competitionRegistrationState]]
  });
}

/**
 * Retrieves competition data from the main competition sheet
 * @param {string} competitionID
 * @returns {Promise<types.competitionData>}
 */
export async function getCompetitionDataFromID(competitionID) {
  /** @type {types.competitionData[]} */
  const competitions = await getLiveCompetitions();
  return competitions.find((competition) => competition.ID === competitionID);
}
