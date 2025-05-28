import * as types from './types.js';
import * as util from '../general/util.js';
import * as general_sheets from '../general/sheet.js';
import * as constants from './constants.js';
import { sheets } from 'googleapis/build/src/apis/sheets/index.js';
import { sheets_v4 } from 'googleapis/build/src/apis/sheets/index.js';

/**
 * Creates a new competition in the spreadsheet
 * @param {types.competitionData} competitionData
 */
export async function createNewCompetition(competitionData){
    const newSheetName = await createNewCompetitionSheet(competitionData);
    appendCompetitionDataToMainSheet(competitionData, newSheetName);
}

/**
 * Creates a new competition sheet based on the template
 * @param {types.competitionData} competitionData
 * @returns {Promise<string>} Name of the newly created sheet
 */
async function createNewCompetitionSheet(competitionData) {
    const newSheetName = getSheetNameFromCompetitionData(competitionData);
    const copyName = await general_sheets.copySheet(
        process.env.SPREADSHEET_ID_MELDUNGEN,
        'Vorlage Wettkampf'
    );
    await general_sheets.renameSheet(
        process.env.SPREADSHEET_ID_MELDUNGEN,
        copyName,
        newSheetName
    );

    const newSheetID = await general_sheets.getSheetID(
        process.env.SPREADSHEET_ID_MELDUNGEN,
        newSheetName
    );

    competitionData.competition_id = newSheetID.toString();;

    // return a tuple of the new sheet name and the link to the new sheet
    return newSheetName;
}

/**
 * Appends competition data to the main sheet
 * @param {types.competitionData} competitionData
 * @param {string} sheetName
 */
async function appendCompetitionDataToMainSheet(competitionData, sheetName) {
    const googleSheetsLink = `=HYPERLINK("https://docs.google.com/spreadsheets/d/${process.env.SPREADSHEET_ID_MELDUNGEN}/edit#gid=${competitionData.competition_id}"; "${sheetName}")`;
    general_sheets.appendRow(process.env.SPREADSHEET_ID_MELDUNGEN, {
        range: constants.nameOfCompetitionSheet + '!A:E',
        values: [
            [competitionData.competition_id],
            [competitionData.competition_name],
            [competitionData.competition_date],
            [competitionData.competition_location],
            [googleSheetsLink],
        ]
    });
}

/**
 * Generates a sheet name from the competition data
 * @param {types.competitionData} competitionData
 * @returns {string}
 */
function getSheetNameFromCompetitionData(competitionData) {
    return `${competitionData.competition_name} (${competitionData.competition_date}) ${competitionData.competition_location}`;
}

/**
 * Retrieves competition information from Google Sheet
 * @returns {Promise<{id: string, name: string}[]>} Array of Competitions
 */
export async function getLiveCompetitions() {
    /** @type {any[][]} */
    const cells = await general_sheets.getCells(process.env.SPREADSHEET_ID_MELDUNGEN, constants.nameOfCompetitionSheet);

    // get IDs and names of competitions
    const competitions = [];
    for (let i = 1; i < cells.length; i++) {
        const id = cells[i][constants.competitionMainSheetColumns.competitionID];
        const name = cells[i][constants.competitionMainSheetColumns.competitionName];
        if (id && name) {
            competitions.push({ id, name });
        }
    }

    return competitions;
}

/**
 * Saves a competition registration to the correct sheet for the competition
 * with the initial state
 * @param {types.competitionRegistrationData} competitionRegistrationData
 */
export async function saveInitialCompetitionRegistration(competitionRegistrationData){
    // get name of the competition sheet
    /** @type  {sheets_v4.Schema$Sheet[]} */
    const allSheets = await general_sheets.getSheets(process.env.SPREADSHEET_ID_MELDUNGEN);

    // find 'title' where 'sheetId' matches competitionRegistrationData.competition_id
    const competitionSheet = allSheets.find(sheet => sheet.properties.sheetId.toString() === competitionRegistrationData.competition_id);

    if (!competitionSheet) {
        throw new Error(`Competition sheet with ID ${competitionRegistrationData.competition_id} not found.`);
    }

    const competitionSheetName = competitionSheet.properties.title;

    await general_sheets.appendRow(process.env.SPREADSHEET_ID_MELDUNGEN, {
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

}

/**
 *
 * @param {types.competitionRegistrationData} competitionRegistrationData
 * @param {string} competitionRegistrationState
 */
export async function updateCompetitionRegistrationState(competitionRegistrationData, competitionRegistrationState){
    // get name of the competition sheet
    /** @type  {sheets_v4.Schema$Sheet[]} */
    const allSheets = await general_sheets.getSheets(process.env.SPREADSHEET_ID_MELDUNGEN);

    // find 'title' where 'sheetId' matches competitionRegistrationData.competition_id
    const competitionSheet = allSheets.find(sheet => sheet.properties.sheetId.toString() === competitionRegistrationData.competition_id);

    if (!competitionSheet) {
        throw new Error(`Competition sheet with ID ${competitionRegistrationData.competition_id} not found.`);
    }

    const competitionSheetName = competitionSheet.properties.title;

    // find row from last_name and first_name
    const cells = await general_sheets.getCells(process.env.SPREADSHEET_ID_MELDUNGEN, competitionSheetName);

    const row = cells.findIndex(row =>
        row[constants.competitionSheetColumns.lastName] === competitionRegistrationData.last_name &&
        row[constants.competitionSheetColumns.firstName] === competitionRegistrationData.first_name
    );

    // update the status in the sheet
    await general_sheets.updateCell(process.env.SPREADSHEET_ID_MELDUNGEN, {
        range: competitionSheetName + '!E' + (row + 1),
        values: [[competitionRegistrationState]]
    });
}