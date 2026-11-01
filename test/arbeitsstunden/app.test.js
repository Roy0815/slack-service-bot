import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupGoogleSheetsMock, createMockBoltApp } from '../helpers/mocks.js';
import * as constants from '../../src/arbeitsstunden/constants.js';

const sheetsMock = setupGoogleSheetsMock();

await import('../../src/general/apps.js');
const { masterdataService } = await import(
  '../../src/general/masterdata/service.js'
);
const { asApp } = await import('../../src/arbeitsstunden/app.js');

describe('arbeitsstunden/app', () => {
  const app = createMockBoltApp();
  asApp.setupApp(/** @type {any} */ (app));

  beforeEach(() => {
    process.env.SPREADSHEET_ID_MASTERDATA = 'masterdata-id';
    app.resetClient();
    sheetsMock.resetAll();

    const adminRow = Array(15).fill('');
    adminRow[14] = 'C_AS_ADMIN';
    sheetsMock.valuesGet.mock.mockImplementation(async ({ range }) => {
      if (range.startsWith('Summe Stunden')) {
        return {
          data: {
            values: [adminRow, ['1', 'Max Mustermann', '5', '3']]
          }
        };
      }
      return { data: { values: [] } };
    });
  });

  it('/arbeitsstunden_anzeigen and displayHours action validate year and handle unregistered vs registered users', async (t) => {
    t.mock.method(masterdataService, 'getAllActiveUsers', async () => []);
    const getUserMock = t.mock.method(
      masterdataService,
      'getUserFromId',
      async () => undefined
    );

    const cmd = app.getCommand('/arbeitsstunden_anzeigen');
    const respond = mock.fn(async () => {});

    // Out-of-range year
    await cmd({
      ack: mock.fn(async () => {}),
      command: { user_id: 'U1', text: '2019', trigger_id: 'T1' },
      respond,
      client: app.client
    });
    assert.ok(respond.mock.calls[0].arguments[0].includes('zwischen 2022'));

    // Unregistered user -> opens register modal
    await cmd({
      ack: mock.fn(async () => {}),
      command: { user_id: 'U_UNREG', text: '', trigger_id: 'T2' },
      respond,
      client: app.client
    });
    assert.equal(app.client.views.open.mock.callCount(), 1);

    // Home view displayHours unregistered -> opens register modal
    const displayAction = app.getAction(constants.homeView.displayHours);
    const homeActionBody = {
      user: { id: 'U1' },
      trigger_id: 'T3',
      view: {
        state: {
          values: {
            [constants.homeView.inputBlockId]: {
              [constants.homeView.yearSelect]: {
                selected_option: { value: '2025' }
              },
              [constants.homeView.detailsSelect]: { selected_options: [] }
            }
          }
        }
      }
    };
    await displayAction({
      ack: mock.fn(async () => {}),
      client: app.client,
      body: homeActionBody
    });
    assert.equal(app.client.views.open.mock.callCount(), 2);

    // Registered user -> responds / posts hours
    getUserMock.mock.mockImplementation(async () => ({
      id: 1,
      firstname: 'Max',
      lastname: 'Mustermann'
    }));
    respond.mock.resetCalls();
    await cmd({
      ack: mock.fn(async () => {}),
      command: { user_id: 'U1', text: '2025 details', trigger_id: 'T4' },
      respond,
      client: app.client
    });
    assert.equal(respond.mock.callCount(), 1);

    await displayAction({
      ack: mock.fn(async () => {}),
      client: app.client,
      body: homeActionBody
    });
    assert.equal(app.client.chat.postMessage.mock.callCount(), 1);
  });

  it('/arbeitsstunden_erfassen and maintainHours action route unregistered vs registered users', async (t) => {
    t.mock.method(masterdataService, 'getAllActiveUsers', async () => []);
    const isRegMock = t.mock.method(
      masterdataService,
      'isUserRegistered',
      async () => false
    );

    await app.getCommand('/arbeitsstunden_erfassen')({
      ack: mock.fn(async () => {}),
      command: { user_id: 'U1', trigger_id: 'T1' },
      client: app.client
    });
    await app.getAction(constants.homeView.maintainHours)({
      ack: mock.fn(async () => {}),
      body: { user: { id: 'U1' }, trigger_id: 'T2' },
      client: app.client
    });
    assert.equal(
      app.client.views.open.mock.calls[0].arguments[0].view.callback_id,
      constants.registerView.viewName
    );

    isRegMock.mock.mockImplementation(async () => true);
    await app.getCommand('/arbeitsstunden_erfassen')({
      ack: mock.fn(async () => {}),
      command: { user_id: 'U1', trigger_id: 'T3' },
      client: app.client
    });
    await app.getAction(constants.homeView.maintainHours)({
      ack: mock.fn(async () => {}),
      body: { user: { id: 'U1' }, trigger_id: 'T4' },
      client: app.client
    });
    assert.equal(
      app.client.views.open.mock.calls[2].arguments[0].view.callback_id,
      constants.maintainHoursView.viewName
    );
  });

  it('registerApproval, autoRegisterApproval, maintenanceApproval, and options handlers work', async (t) => {
    const saveSlackMock = t.mock.method(
      masterdataService,
      'saveSlackId',
      async () => {}
    );
    t.mock.method(masterdataService, 'getUserFromId', async () => ({
      id: 1,
      firstname: 'Max',
      lastname: 'Mustermann'
    }));
    t.mock.method(masterdataService, 'getUserContactCardFromId', async () => ({
      id: 1,
      firstname: 'Max',
      lastname: 'Mustermann',
      email: 'max@example.com',
      phone: '+49123'
    }));
    t.mock.method(masterdataService, 'getAllActiveUsers', async () => [
      { id: 1, firstname: 'Max', lastname: 'Mustermann' },
      { id: 2, firstname: 'Erika', lastname: 'Musterfrau' }
    ]);

    // registerApproval reject & approve
    const regVal = JSON.stringify({ id: 1, slackId: 'U1', name: 'Max' });
    await app.getAction(constants.registerApproval.rejectButton)({
      ack: mock.fn(async () => {}),
      action: {
        action_id: constants.registerApproval.rejectButton,
        value: regVal
      },
      client: app.client,
      respond: mock.fn(async () => {}),
      body: { user: { id: 'U_ADMIN' } }
    });
    assert.equal(saveSlackMock.mock.callCount(), 0);

    await app.getAction(constants.registerApproval.approveButton)({
      ack: mock.fn(async () => {}),
      action: {
        action_id: constants.registerApproval.approveButton,
        value: regVal
      },
      client: app.client,
      respond: mock.fn(async () => {}),
      body: { user: { id: 'U_ADMIN' } }
    });
    assert.equal(saveSlackMock.mock.callCount(), 1);

    // autoRegisterApproval submit (null option then valid option)
    const autoFn = app.getAction(constants.autoRegisterApproval.submit);
    await autoFn({
      ack: mock.fn(async () => {}),
      respond: mock.fn(async () => {}),
      action: { value: 'U_JOIN' },
      body: {
        user: { id: 'U_ADMIN' },
        state: {
          values: {
            [constants.autoRegisterView.inputBlock]: {
              [constants.autoRegisterView.actionNameSelect]: {
                selected_option: null
              }
            }
          }
        }
      }
    });
    assert.equal(app.client.filesUploadV2.mock.callCount(), 0);

    await autoFn({
      ack: mock.fn(async () => {}),
      respond: mock.fn(async () => {}),
      action: { value: 'U_JOIN' },
      body: {
        user: { id: 'U_ADMIN' },
        state: {
          values: {
            [constants.autoRegisterView.inputBlock]: {
              [constants.autoRegisterView.actionNameSelect]: {
                selected_option: {
                  value: '1',
                  text: { text: 'Max Mustermann' }
                }
              }
            }
          }
        }
      }
    });
    assert.equal(app.client.filesUploadV2.mock.callCount(), 1);

    // maintenanceApproval reject & approve
    const maintVal = JSON.stringify({
      slackId: 'U1',
      description: 'Aufbau',
      hours: 2,
      date: '2025-05-01'
    });
    await app.getAction(constants.maintenanceApproval.rejectButton)({
      ack: mock.fn(async () => {}),
      action: {
        action_id: constants.maintenanceApproval.rejectButton,
        value: maintVal
      },
      client: app.client,
      respond: mock.fn(async () => {}),
      body: { user: { id: 'U_ADMIN' } }
    });
    assert.equal(sheetsMock.valuesAppend.mock.callCount(), 0);

    await app.getAction(constants.maintenanceApproval.approveButton)({
      ack: mock.fn(async () => {}),
      action: {
        action_id: constants.maintenanceApproval.approveButton,
        value: maintVal
      },
      client: app.client,
      respond: mock.fn(async () => {}),
      body: { user: { id: 'U_ADMIN' } }
    });
    assert.equal(sheetsMock.valuesAppend.mock.callCount(), 1);

    // options search filter
    const ackOpts = mock.fn(async () => {});
    await app.getOptions(constants.autoRegisterView.actionNameSelect)({
      ack: ackOpts,
      options: { value: 'erika' }
    });
    assert.equal(ackOpts.mock.calls[0].arguments[0].options.length, 1);
    assert.equal(ackOpts.mock.calls[0].arguments[0].options[0].value, '2');
  });

  it('registerView, maintainHoursView submissions, and team_join event work', async (t) => {
    const saveSlackMock = t.mock.method(
      masterdataService,
      'saveSlackId',
      async () => {}
    );
    const getEmailMock = t.mock.method(
      masterdataService,
      'getUserFromEmail',
      async () => ({ id: 1, firstname: 'Max', lastname: 'Mustermann' })
    );

    // registerView submission
    await app.getView(constants.registerView.viewName)({
      ack: mock.fn(async () => {}),
      client: app.client,
      body: {
        user: { id: 'U1' },
        view: {
          state: {
            values: {
              [constants.registerView.blockNameSelect]: {
                [constants.registerView.actionNameSelect]: {
                  selected_option: {
                    value: '1',
                    text: { text: 'Max Mustermann' }
                  }
                }
              }
            }
          }
        }
      }
    });
    assert.equal(app.client.chat.postMessage.mock.callCount(), 2);

    // maintainHoursView submission (invalid then valid)
    const currYear = new Date().getFullYear();
    const maintViewFn = app.getView(constants.maintainHoursView.viewName);
    const ackErr = mock.fn(async () => {});
    await maintViewFn({
      ack: ackErr,
      client: app.client,
      body: {
        user: { id: 'U1' },
        view: {
          state: {
            values: {
              [constants.maintainHoursView.blockDescription]: {
                [constants.maintainHoursView.actionDescription]: {
                  value: 'Test'
                }
              },
              [constants.maintainHoursView.blockHours]: {
                [constants.maintainHoursView.actionHours]: { value: 'invalid' }
              },
              [constants.maintainHoursView.blockDate]: {
                [constants.maintainHoursView.actionDate]: {
                  selected_date: `${currYear}-05-01`
                }
              }
            }
          }
        }
      }
    });
    assert.equal(ackErr.mock.calls[0].arguments[0].response_action, 'errors');

    app.client.chat.postMessage.mock.resetCalls();
    await maintViewFn({
      ack: mock.fn(async () => {}),
      client: app.client,
      body: {
        user: { id: 'U1' },
        view: {
          state: {
            values: {
              [constants.maintainHoursView.blockDescription]: {
                [constants.maintainHoursView.actionDescription]: {
                  value: 'Test'
                }
              },
              [constants.maintainHoursView.blockHours]: {
                [constants.maintainHoursView.actionHours]: { value: '2,5' }
              },
              [constants.maintainHoursView.blockDate]: {
                [constants.maintainHoursView.actionDate]: {
                  selected_date: `${currYear}-05-01`
                }
              }
            }
          }
        }
      }
    });
    assert.equal(app.client.chat.postMessage.mock.callCount(), 2);

    // team_join event: bot ignored, matched email auto-registered, unmatched email posts manual message
    const teamJoinFn = app.getEvent('team_join');
    app.client.chat.postMessage.mock.resetCalls();

    await teamJoinFn({
      event: { user: { id: 'U_BOT', is_bot: true } },
      client: app.client
    });
    assert.equal(app.client.chat.postMessage.mock.callCount(), 0);

    await teamJoinFn({
      event: { user: { id: 'U_MATCH', is_bot: false } },
      client: app.client
    });
    assert.equal(saveSlackMock.mock.callCount(), 1);
    assert.ok(
      app.client.chat.postMessage.mock.calls[0].arguments[0].text.includes(
        'automatisch registriert'
      )
    );

    getEmailMock.mock.mockImplementation(async () => undefined);
    await teamJoinFn({
      event: { user: { id: 'U_NOMATCH', is_bot: false } },
      client: app.client
    });
    assert.equal(app.client.chat.postMessage.mock.callCount(), 2);
  });
});
