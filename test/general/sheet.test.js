import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupGoogleSheetsMock } from '../helpers/mocks.js';

const sheetsMock = setupGoogleSheetsMock();

const sheet = await import('../../src/general/sheet.js');

describe('general/sheet', () => {
  beforeEach(() => {
    sheetsMock.resetAll();
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: { values: [['A1', 'B1']] }
    }));
    sheetsMock.spreadsheetsGet.mock.mockImplementation(async () => ({
      data: {
        sheets: [
          { properties: { title: 'Sheet1', sheetId: 101 } },
          { properties: { title: 'Sheet2', sheetId: 202 } }
        ]
      }
    }));
    sheetsMock.sheetsCopyTo.mock.mockImplementation(async () => ({
      data: { title: 'Copy of Sheet1' }
    }));
  });

  it('getCells fetches cell values for a given sheet', async () => {
    const values = await sheet.getCells('spread-1', 'Sheet1');
    assert.deepEqual(values, [['A1', 'B1']]);
    assert.equal(sheetsMock.valuesGet.mock.callCount(), 1);
    assert.deepEqual(sheetsMock.valuesGet.mock.calls[0].arguments[0], {
      spreadsheetId: 'spread-1',
      range: 'Sheet1'
    });
  });

  it('updateCell updates values with USER_ENTERED option', async () => {
    await sheet.updateCell('spread-1', {
      range: 'Sheet1!A1',
      values: [['val']]
    });
    assert.equal(sheetsMock.valuesUpdate.mock.callCount(), 1);
    assert.deepEqual(sheetsMock.valuesUpdate.mock.calls[0].arguments[0], {
      spreadsheetId: 'spread-1',
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      resource: { range: 'Sheet1!A1', values: [['val']] }
    });
  });

  it('clearCell clears a range', async () => {
    await sheet.clearCell('spread-1', { range: 'Sheet1!A2:D' });
    assert.equal(sheetsMock.valuesClear.mock.callCount(), 1);
    assert.deepEqual(sheetsMock.valuesClear.mock.calls[0].arguments[0], {
      spreadsheetId: 'spread-1',
      range: 'Sheet1!A2:D'
    });
  });

  it('appendRow appends values with COLUMNS majorDimension', async () => {
    await sheet.appendRow('spread-1', {
      range: 'Sheet1!A:B',
      values: [['col1'], ['col2']]
    });
    assert.equal(sheetsMock.valuesAppend.mock.callCount(), 1);
    assert.deepEqual(sheetsMock.valuesAppend.mock.calls[0].arguments[0], {
      spreadsheetId: 'spread-1',
      range: 'Sheet1!A:B',
      valueInputOption: 'USER_ENTERED',
      resource: {
        range: 'Sheet1!A:B',
        values: [['col1'], ['col2']],
        majorDimension: 'COLUMNS'
      }
    });
  });

  it('getSheets and getSheetID return sheet metadata and ID', async () => {
    const sheets = await sheet.getSheets('spread-1');
    assert.equal(sheets.length, 2);

    const id = await sheet.getSheetID('spread-1', 'Sheet2');
    assert.equal(id, 202);
  });

  it('copySheet copies sheet within spreadsheet and returns new title', async () => {
    const newTitle = await sheet.copySheet('spread-1', 'Sheet1');
    assert.equal(newTitle, 'Copy of Sheet1');
    assert.equal(sheetsMock.sheetsCopyTo.mock.callCount(), 1);
    assert.deepEqual(sheetsMock.sheetsCopyTo.mock.calls[0].arguments[0], {
      spreadsheetId: 'spread-1',
      sheetId: 101,
      resource: {
        destinationSpreadsheetId: 'spread-1'
      }
    });
  });

  it('renameSheet sends batchUpdate with new title', async () => {
    await sheet.renameSheet('spread-1', 'Sheet1', 'RenamedSheet');
    assert.equal(sheetsMock.batchUpdate.mock.callCount(), 1);
    assert.deepEqual(sheetsMock.batchUpdate.mock.calls[0].arguments[0], {
      spreadsheetId: 'spread-1',
      resource: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: 101,
                title: 'RenamedSheet'
              },
              fields: 'title'
            }
          }
        ]
      }
    });
  });
});
