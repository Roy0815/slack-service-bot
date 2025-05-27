import * as types from './types.js';
import * as util from '../general/util.js';
import * as general_sheets from '../general/sheet.js';

/**
 * Creates a new competition in the spreadsheet
 * @param {types.competitionData} competitionData
 */
export async function createNewCompetition(competitionData){
    appendCompetitionDataToMainSheet(competitionData);
    /** @todo */
    //createNewCompetitionSheet(competitionData);
}

/**
 * Appends competition data to the main sheet
 * @param {types.competitionData} competitionData
 */
async function appendCompetitionDataToMainSheet(competitionData) {
    general_sheets.appendRow(process.env.SPREADSHEET_ID_MELDUNGEN, {
        range: 'Wettkämpfe!A:C',
        values: [
            [competitionData.competition_name],
            [competitionData.competition_date],
            [competitionData.competition_location]
        ]
    });
}

/**
 * Creates a new competition sheet based on the template
 * @param {types.competitionData} competitionData
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
}

/**
 * Generates a sheet name from the competition data
 * @param {types.competitionData} competitionData
 * @returns {string}
 */
function getSheetNameFromCompetitionData(competitionData) {
    return `${competitionData.competition_name} (${competitionData.competition_date}) ${competitionData.competition_location}`;
}