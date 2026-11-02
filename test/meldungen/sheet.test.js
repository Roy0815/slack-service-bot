import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as constants from '../../src/meldungen/constants.js';
import { setupGoogleSheetsMock } from '../helpers/mocks.js';

const sheetsMock = setupGoogleSheetsMock();

const meldungenSheet = await import('../../src/meldungen/sheet.js');
const {
  CompetitionAlreadyExistsError,
  CompetitionRegistrationAlreadyExistsError
} = await import('../../src/meldungen/controller.js');

describe('meldungen/sheet', () => {
  beforeEach(() => {
    process.env.SPREADSHEET_ID_MELDUNGEN = 'meldungen-id';
    sheetsMock.resetAll();
  });

  it('getLiveCompetitions and getCompetitionDataFromID parse competition rows', async () => {
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: {
        values: [
          ['ID', 'Name', 'Datum', 'Ort', 'Link'],
          ['101', 'Bembel', '2025-12-10', 'Frankfurt', 'link']
        ]
      }
    }));

    const comps = await meldungenSheet.getLiveCompetitions();
    assert.deepEqual(comps, [
      {
        ID: '101',
        name: 'Bembel',
        date: '2025-12-10',
        location: 'Frankfurt'
      }
    ]);

    const found = await meldungenSheet.getCompetitionDataFromID('101');
    assert.equal(found?.name, 'Bembel');
  });

  it('createNewCompetition throws if duplicate and creates sheet otherwise', async () => {
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: {
        values: [
          ['ID', 'Name', 'Datum', 'Ort'],
          ['101', 'Bembel', '2025-12-10', 'Frankfurt']
        ]
      }
    }));

    await assert.rejects(
      async () => {
        await meldungenSheet.createNewCompetition({
          ID: '',
          name: 'Bembel',
          date: '2025-12-10',
          location: 'Frankfurt'
        });
      },
      (err) => err instanceof CompetitionAlreadyExistsError
    );

    const newComp = {
      ID: '',
      name: 'DM Classic',
      date: '2025-11-01',
      location: 'Mannheim'
    };

    sheetsMock.sheetsCopyTo.mock.mockImplementation(async () => ({
      data: { title: 'Copy of Vorlage' }
    }));
    sheetsMock.spreadsheetsGet.mock.mockImplementation(async () => ({
      data: {
        sheets: [
          { properties: { title: 'Vorlage Wettkampf', sheetId: 1 } },
          { properties: { title: 'Copy of Vorlage', sheetId: 555 } },
          {
            properties: {
              title: 'DM Classic (2025-11-01) Mannheim',
              sheetId: 555
            }
          }
        ]
      }
    }));

    await meldungenSheet.createNewCompetition(newComp);
    // appendCompetitionDataToMainSheet runs unawaited after auth() microtask
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(newComp.ID, '555');
    assert.equal(sheetsMock.sheetsCopyTo.mock.callCount(), 1);
    assert.equal(sheetsMock.batchUpdate.mock.callCount(), 1);
    assert.equal(sheetsMock.valuesAppend.mock.callCount(), 1);
  });

  it('saveInitialCompetitionRegistration appends athlete or throws if already registered', async () => {
    sheetsMock.spreadsheetsGet.mock.mockImplementation(async () => ({
      data: {
        sheets: [{ properties: { sheetId: 101, title: 'Bembel Sheet' } }]
      }
    }));

    const regData = {
      slackID: 'U1',
      first_name: 'Max',
      last_name: 'Kraft',
      birthyear: 1998,
      competition: {
        ID: '101',
        name: 'Bembel',
        date: '2025-12-10',
        location: 'Frankfurt'
      },
      weight_class: '-83kg',
      handler_needed: 'Ja',
      payment_record_file_permalink: 'http://link',
      user_remarks: ''
    };

    // Not yet registered
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: {
        values: [
          ['Nachname', 'Vorname', 'Jahrgang', 'Klasse', 'Status', 'Handler']
        ]
      }
    }));

    await meldungenSheet.saveInitialCompetitionRegistration(
      /** @type {any} */ (regData)
    );
    assert.equal(sheetsMock.valuesAppend.mock.callCount(), 1);

    // Already registered
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: {
        values: [
          ['Nachname', 'Vorname'],
          ['Kraft', 'Max']
        ]
      }
    }));

    await assert.rejects(
      async () => {
        await meldungenSheet.saveInitialCompetitionRegistration(
          /** @type {any} */ (regData)
        );
      },
      (err) => err instanceof CompetitionRegistrationAlreadyExistsError
    );
  });

  it('updateCompetitionRegistrationState updates status cell in sheet', async () => {
    sheetsMock.spreadsheetsGet.mock.mockImplementation(async () => ({
      data: {
        sheets: [{ properties: { sheetId: 101, title: 'Bembel Sheet' } }]
      }
    }));
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: {
        values: [
          ['Nachname', 'Vorname'],
          ['Kraft', 'Max']
        ]
      }
    }));

    await meldungenSheet.updateCompetitionRegistrationState(
      /** @type {any} */ ({
        first_name: 'Max',
        last_name: 'Kraft',
        competition: { ID: '101' }
      }),
      constants.competitionRegistrationState.okay
    );

    assert.equal(sheetsMock.valuesUpdate.mock.callCount(), 1);
    assert.equal(
      sheetsMock.valuesUpdate.mock.calls[0].arguments[0].range,
      'Bembel Sheet!E2'
    );
    assert.deepEqual(
      sheetsMock.valuesUpdate.mock.calls[0].arguments[0].resource.values,
      [[constants.competitionRegistrationState.okay]]
    );
  });
});
