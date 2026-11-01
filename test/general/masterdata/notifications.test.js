import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate } from '../../../src/general/util.js';
import { mockModule, setupGoogleSheetsMock } from '../../helpers/mocks.js';

const postMessageMock = mock.fn(async () => ({}));
const sheetsMock = setupGoogleSheetsMock();

class MockApp {
  constructor() {
    this.client = {
      chat: {
        postMessage: postMessageMock
      }
    };
  }
}

mockModule('@slack/bolt', {
  defaultExport: {
    App: MockApp
  }
});

const { masterdataService } = await import(
  '../../../src/general/masterdata/service.js'
);
const { run } = await import(
  '../../../src/general/masterdata/notifications.js'
);

describe('general/masterdata/notifications', () => {
  beforeEach(() => {
    postMessageMock.mock.resetCalls();
    sheetsMock.resetAll();
    const adminRow = Array(15).fill('');
    adminRow[14] = 'C_ADMIN';
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: { values: [adminRow] }
    }));
  });

  it('sends birthday, anniversary (5-year multiple), and leaving notifications for today', async (t) => {
    const todayStr = formatDate(new Date()); // DD.MM.YYYY
    const dayMonth = todayStr.substring(0, 6); // DD.MM.
    const currentYear = parseInt(todayStr.substring(6, 10), 10);

    t.mock.method(masterdataService, 'getAllActiveUsers', async () => [
      {
        id: 1,
        firstname: 'Bday',
        lastname: 'User',
        slackId: 'U_BDAY',
        birthday: `${dayMonth}1995`,
        joinedDate: '01.01.2023',
        leaveDate: ''
      },
      {
        id: 2,
        firstname: 'Jubi',
        lastname: 'User',
        slackId: 'U_JUBI',
        birthday: '01.01.1990',
        joinedDate: `${dayMonth}${currentYear - 5}`,
        leaveDate: ''
      },
      {
        id: 3,
        firstname: 'Leave',
        lastname: 'User',
        slackId: 'U_LEAVE',
        birthday: '01.01.1990',
        joinedDate: '01.01.2022',
        leaveDate: todayStr
      }
    ]);

    await run(/** @type {any} */ ({}), {});

    assert.equal(postMessageMock.mock.callCount(), 3);
    const messages = postMessageMock.mock.calls.map((c) => c.arguments[0]);

    assert.ok(messages[0].text.includes('Geburtstage: Bday User'));
    assert.ok(messages[1].text.includes('Jubiläum: Jubi User'));
    assert.ok(messages[2].text.includes('Austritte: Leave User'));
  });

  it('does not post messages if no user matches today', async (t) => {
    t.mock.method(masterdataService, 'getAllActiveUsers', async () => []);
    await run(/** @type {any} */ ({}), {});
    assert.equal(postMessageMock.mock.callCount(), 0);
  });
});
