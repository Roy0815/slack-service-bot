import * as types from './types.js';
import * as util from '../general/util.js';
import * as general_sheets from '../general/sheet.js';

/**
 * Creates a new competition in the spreadsheet
 * @param {types.competitionData} competitionData
 */
export async function createNewCompetition(competitionData){

    const newSheetData = await createNewCompetitionSheet(competitionData);
    appendCompetitionDataToMainSheet(competitionData, newSheetData.sheetName, newSheetData.link);
    /** @todo */

}

/**
 * Appends competition data to the main sheet
 * @param {types.competitionData} competitionData
 * @param {string} sheetLink Direct link to the new competition sheet
 */
async function appendCompetitionDataToMainSheet(competitionData, sheetName, sheetLink) {
    const googleSheetsLink = `=HYPERLINK("${sheetLink}"; "${sheetName}")`;
    general_sheets.appendRow(process.env.SPREADSHEET_ID_MELDUNGEN, {
        range: 'Wettkämpfe!A:D',
        values: [
            [competitionData.competition_name],
            [competitionData.competition_date],
            [competitionData.competition_location],
            [googleSheetsLink],
        ]
    });
}

/**
 * Creates a new competition sheet based on the template
 * @param {types.competitionData} competitionData
 * @returns {Promise<{sheetName, link}>} Direct link to the new sheet
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

    // return a tuple of the new sheet name and the link to the new sheet
    return {
        sheetName: newSheetName,
        link: `https://docs.google.com/spreadsheets/d/1UnsTPwzZmMXe_gFXESLX4w4ZrGNZDyn_50ERF4_vi_w/edit#gid=${newSheetID}`
    };
}

/**
 * Generates a sheet name from the competition data
 * @param {types.competitionData} competitionData
 * @returns {string}
 */
function getSheetNameFromCompetitionData(competitionData) {
    return `${competitionData.competition_name} (${competitionData.competition_date}) ${competitionData.competition_location}`;
}