import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupGoogleSheetsMock } from '../helpers/mocks.js';

const sheetsMock = setupGoogleSheetsMock();

const { masterdataService } =
  await import('../../src/general/masterdata/service.js');
const asSheet = await import('../../src/arbeitsstunden/sheet.js');

describe('arbeitsstunden/sheet', () => {
  beforeEach(() => {
    process.env.SPREADSHEET_ID_MASTERDATA = 'masterdata-id';
    sheetsMock.resetAll();
  });

  it('getHoursFromSlackId returns workedHours, targetHours, and optional details', async (t) => {
    t.mock.method(masterdataService, 'getUserFromId', async () => ({
      id: 1,
      firstname: 'Max',
      lastname: 'Mustermann'
    }));

    sheetsMock.valuesGet.mock.mockImplementation(async ({ range }) => {
      if (range.startsWith('Summe Stunden')) {
        return {
          data: {
            values: [['Header'], ['1', 'Max Mustermann', '6', '4']]
          }
        };
      }
      if (range.startsWith('Arbeitseinsätze')) {
        return {
          data: {
            values: [
              ['Datum', 'Name', 'Tätigkeit', 'Stunden'],
              ['2025-05-01', 'Max Mustermann', 'Aufbau', '6'],
              ['2025-05-02', 'Other User', 'Abbau', '3']
            ]
          }
        };
      }
      return { data: { values: [] } };
    });

    const result = await asSheet.getHoursFromSlackId({
      id: 'U_MAX',
      year: 2025,
      details: true
    });

    assert.deepEqual(result, {
      workedHours: '6',
      targetHours: '4',
      details: [
        {
          date: '2025-05-01',
          description: 'Aufbau',
          hours: '6'
        }
      ]
    });
  });

  it('getHoursFromSlackId converts negative targetHours to 0', async (t) => {
    t.mock.method(masterdataService, 'getUserFromId', async () => ({
      id: 1,
      firstname: 'Max',
      lastname: 'Mustermann'
    }));
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: {
        values: [['Header'], ['1', 'Max Mustermann', '12', '-2']]
      }
    }));

    const result = await asSheet.getHoursFromSlackId({
      id: 'U_MAX',
      year: 2025,
      details: false
    });

    assert.equal(result?.targetHours, 0);
  });

  it('checkYearSheetsExists copies previous year sheets when requested year does not exist', async (t) => {
    t.mock.method(masterdataService, 'getUserFromId', async () => ({
      id: 1,
      firstname: 'Max',
      lastname: 'Mustermann'
    }));

    sheetsMock.spreadsheetsGet.mock.mockImplementation(async () => ({
      data: {
        sheets: [
          { properties: { title: 'Arbeitseinsätze 2025', sheetId: 10 } },
          { properties: { title: 'Summe Stunden 2025', sheetId: 11 } },
          { properties: { title: 'Copied Sheet', sheetId: 12 } }
        ]
      }
    }));
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: {
        values: [['Header'], ['1', 'Max Mustermann', '0', '8']]
      }
    }));

    await asSheet.getHoursFromSlackId({
      id: 'U_MAX',
      year: 2026,
      details: false
    });

    assert.equal(sheetsMock.sheetsCopyTo.mock.callCount(), 2);
    assert.equal(sheetsMock.batchUpdate.mock.callCount(), 2);
    assert.equal(sheetsMock.valuesClear.mock.callCount(), 1);
    assert.equal(sheetsMock.valuesUpdate.mock.callCount(), 1);
  });

  it('getAdminChannel reads admin channel from row 0 col 15', async () => {
    const row0 = Array(15).fill('');
    row0[14] = 'C_AS_ADMIN';
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: { values: [row0] }
    }));

    const channel = await asSheet.getAdminChannel();
    assert.equal(channel, 'C_AS_ADMIN');
  });

  it('saveHours appends row to year sheet and helpers work', async (t) => {
    t.mock.method(masterdataService, 'getUserFromId', async () => ({
      id: 1,
      firstname: 'Max',
      lastname: 'Mustermann'
    }));
    const saveSlackMock = t.mock.method(
      masterdataService,
      'saveSlackId',
      async () => {}
    );
    t.mock.method(masterdataService, 'getAllActiveUsers', async () => []);

    await asSheet.saveHours({
      slackId: 'U_MAX',
      description: 'Turnier Hilfe',
      hours: 3.5,
      date: '2025-06-10'
    });

    assert.equal(sheetsMock.valuesAppend.mock.callCount(), 1);
    assert.deepEqual(
      sheetsMock.valuesAppend.mock.calls[0].arguments[0].resource.values,
      [['2025-06-10'], ['Max Mustermann'], ['Turnier Hilfe'], [3.5]]
    );

    assert.equal(
      await asSheet.getNameFromSlackId({ slackId: 'U_MAX' }),
      'Max Mustermann'
    );
    await asSheet.saveSlackId({ id: 1, slackId: 'U_MAX', name: 'Max' });
    assert.equal(saveSlackMock.mock.callCount(), 1);
    assert.deepEqual(await asSheet.getAllUsers(), []);
  });

  it('getContactCardFromId builds vCardContent string', async (t) => {
    t.mock.method(masterdataService, 'getUserContactCardFromId', async () => ({
      id: 1,
      firstname: 'Max',
      lastname: 'Mustermann',
      email: 'max@example.com',
      phone: '+4912345'
    }));

    const card = await asSheet.getContactCardFromId(1);
    assert.ok(card?.vCardContent?.includes('N:Mustermann;Max'));
    assert.ok(card?.vCardContent?.includes('EMAIL:max@example.com'));
    assert.ok(card?.vCardContent?.includes('TEL;TYPE=voice:+4912345'));
  });
});
