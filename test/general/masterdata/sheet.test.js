import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupGoogleSheetsMock } from '../../helpers/mocks.js';

const sheetsMock = setupGoogleSheetsMock();

const { googleSheetMasterdataService, allgDatenSheetName, bankDatenSheetName } =
  await import('../../../src/general/masterdata/sheet.js');

const sampleHeader = [
  'ID',
  'Vorname',
  'Nachname',
  'Eintrittsdatum',
  'Austrittsdatum',
  'Typ',
  'Geburtstag',
  'Alter',
  'Geschlecht',
  'Email',
  'Straße',
  'Hausnummer',
  'PLZ',
  'Ort',
  'Telefon',
  'SlackID'
];

const sampleUserRow1 = [
  '1',
  'Max',
  'Mustermann',
  '01.01.2020',
  '',
  'aktiv',
  '15.05.1995',
  '29',
  'm',
  'max@example.com',
  'Hauptstr.',
  '10',
  '68159',
  'Mannheim',
  '+49123456',
  'U_MAX'
];

const sampleUserRow2 = [
  '2',
  'Erika',
  'Musterfrau',
  '01.06.2021',
  '2020.01.01',
  'aktiv',
  '20.10.1992',
  '32',
  'w',
  'erika@example.com',
  'Nebenstr.',
  '5',
  '68161',
  'Mannheim',
  '+49654321',
  'U_ERIKA'
];

describe('general/masterdata/sheet', () => {
  beforeEach(() => {
    process.env.SPREADSHEET_ID_MASTERDATA = 'masterdata-sheet-id';
    sheetsMock.resetAll();
  });

  describe('getUserFromId', () => {
    it('returns undefined when neither id nor slackId is provided', async () => {
      const res = await googleSheetMasterdataService.getUserFromId({});
      assert.equal(res, undefined);
    });

    it('finds user by numeric id or slackId', async () => {
      sheetsMock.valuesGet.mock.mockImplementation(async () => ({
        data: { values: [sampleHeader, sampleUserRow1, sampleUserRow2] }
      }));

      const byId = await googleSheetMasterdataService.getUserFromId({ id: 1 });
      assert.equal(byId?.firstname, 'Max');
      assert.equal(byId?.slackId, 'U_MAX');

      const bySlack = await googleSheetMasterdataService.getUserFromId({
        slackId: 'U_ERIKA'
      });
      assert.equal(bySlack?.firstname, 'Erika');
      assert.equal(bySlack?.id, 2);
    });
  });

  describe('getUserFromEmail', () => {
    it('finds user by email or returns undefined', async () => {
      sheetsMock.valuesGet.mock.mockImplementation(async () => ({
        data: { values: [sampleHeader, sampleUserRow1] }
      }));

      const found =
        await googleSheetMasterdataService.getUserFromEmail('max@example.com');
      assert.equal(found?.lastname, 'Mustermann');

      const notFound = await googleSheetMasterdataService.getUserFromEmail(
        'unknown@example.com'
      );
      assert.equal(notFound, undefined);

      const empty = await googleSheetMasterdataService.getUserFromEmail('');
      assert.equal(empty, undefined);
    });
  });

  describe('getUserContactCardFromId', () => {
    it('returns contact card object for matching user', async () => {
      sheetsMock.valuesGet.mock.mockImplementation(async () => ({
        data: { values: [sampleHeader, sampleUserRow1] }
      }));

      const card = await googleSheetMasterdataService.getUserContactCardFromId({
        slackId: 'U_MAX'
      });
      assert.equal(card?.firstname, 'Max');
      assert.equal(card?.email, 'max@example.com');
    });
  });

  describe('isUserRegistered', () => {
    it('returns true if user exists and false otherwise', async () => {
      sheetsMock.valuesGet.mock.mockImplementation(async () => ({
        data: { values: [sampleHeader, sampleUserRow1] }
      }));

      assert.equal(
        await googleSheetMasterdataService.isUserRegistered({
          slackId: 'U_MAX'
        }),
        true
      );
      assert.equal(
        await googleSheetMasterdataService.isUserRegistered({
          slackId: 'U_NONE'
        }),
        false
      );
    });
  });

  describe('getAllActiveUsers', () => {
    it('filters out empty rows and users with past leaveDate', async () => {
      const emptyRow = Array(16).fill('');
      const futureUserRow = [...sampleUserRow1];
      futureUserRow[0] = '3';
      futureUserRow[1] = 'Future';
      futureUserRow[4] = '2099.12.31';

      sheetsMock.valuesGet.mock.mockImplementation(async () => ({
        data: {
          values: [
            sampleHeader,
            sampleUserRow1,
            sampleUserRow2,
            emptyRow,
            futureUserRow
          ]
        }
      }));

      const active = await googleSheetMasterdataService.getAllActiveUsers();
      assert.equal(active.length, 2);
      assert.equal(active[0].firstname, 'Max');
      assert.equal(active[1].firstname, 'Future');
    });
  });

  describe('saveMasterdataChanges', () => {
    it('prefixes phone starting with + and updates changed cells', async () => {
      sheetsMock.valuesGet.mock.mockImplementation(async () => ({
        data: { values: [sampleHeader, sampleUserRow1] }
      }));

      await googleSheetMasterdataService.saveMasterdataChanges({
        slackId: 'U_MAX',
        phone: '+49111222',
        city: 'Heidelberg'
      });

      assert.ok(sheetsMock.valuesUpdate.mock.callCount() >= 2);
      const calls = sheetsMock.valuesUpdate.mock.calls.map(
        (c) => c.arguments[0]
      );
      const phoneUpdate = calls.find(
        (c) => c.range === `'${allgDatenSheetName}'!O2`
      );
      assert.deepEqual(phoneUpdate?.resource.values, [["'+49111222"]]);
    });
  });

  describe('saveSlackId & saveLeaveDate', () => {
    it('updates slackId and leaveDate in the sheet', async () => {
      sheetsMock.valuesGet.mock.mockImplementation(async () => ({
        data: { values: [sampleHeader, sampleUserRow1] }
      }));

      await googleSheetMasterdataService.saveSlackId(1, 'U_NEW');
      assert.equal(sheetsMock.valuesUpdate.mock.callCount(), 1);
      assert.equal(
        sheetsMock.valuesUpdate.mock.calls[0].arguments[0].range,
        `'${allgDatenSheetName}'!P2`
      );
      assert.deepEqual(
        sheetsMock.valuesUpdate.mock.calls[0].arguments[0].resource.values,
        [['U_NEW']]
      );

      sheetsMock.valuesUpdate.mock.resetCalls();
      await googleSheetMasterdataService.saveLeaveDate(
        { slackId: 'U_MAX' },
        '31.12.2026'
      );
      assert.equal(sheetsMock.valuesUpdate.mock.callCount(), 1);
      assert.equal(
        sheetsMock.valuesUpdate.mock.calls[0].arguments[0].range,
        `'${allgDatenSheetName}'!E2`
      );
      assert.deepEqual(
        sheetsMock.valuesUpdate.mock.calls[0].arguments[0].resource.values,
        [['31.12.2026']]
      );
    });
  });

  describe('saveNewMember', () => {
    it('writes member fields to general and SEPA sheets and returns mandate info', async () => {
      sheetsMock.valuesGet.mock.mockImplementation(async ({ range }) => {
        if (range.startsWith(`${allgDatenSheetName}!`)) {
          return { data: { values: [['ID'], ['1'], ['2']] } };
        }
        if (range.startsWith(`${bankDatenSheetName}!`)) {
          return {
            data: {
              values: [
                [
                  '3',
                  'Anna',
                  'Test',
                  'DE123',
                  'BIC1',
                  '30,00 €',
                  '',
                  'SAM-3',
                  '01.01.2026',
                  '',
                  '45,00 €'
                ]
              ]
            }
          };
        }
        return { data: { values: [] } };
      });

      const result = await googleSheetMasterdataService.saveNewMember({
        firstname: 'Anna',
        lastname: 'Test',
        phone: '+49 170 12345',
        accountOwner: 'Anna Test',
        IBAN: 'DE123'
      });

      assert.deepEqual(result, {
        mandateReference: 'SAM-3',
        recurringAmount: '30,00 €',
        initialAmount: '45,00 €'
      });
      assert.ok(sheetsMock.valuesUpdate.mock.callCount() > 0);
    });
  });
});
