import * as types from './types.js';
import * as util from '../general/util.js';
import * as general_sheets from '../general/sheet.js';
import * as constants from './constants.js';

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
        const id = cells[i][constants.competitionSheetColumns.competitionID];
        const name = cells[i][constants.competitionSheetColumns.competitionName];
        if (id && name) {
            competitions.push({ id, name });
        }
    }

    return competitions;
}