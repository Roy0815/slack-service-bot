import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupGoogleSheetsMock, createMockBoltApp } from '../helpers/mocks.js';
import * as constants from '../../src/stammdaten/constants.js';

const sheetsMock = setupGoogleSheetsMock();

await import('../../src/general/apps.js');
const { masterdataService } =
  await import('../../src/general/masterdata/service.js');
const { stammdatenApp } = await import('../../src/stammdaten/app.js');

const sampleContactCard = {
  firstname: 'Max',
  lastname: 'Mustermann',
  email: 'max@example.com',
  phone: '+49123456',
  street: 'Alte Str.',
  houseNumber: '1',
  city: 'Mannheim',
  zip: '68159'
};

const makeViewValues = (overrides = {}) => {
  const values = {};
  Object.keys(constants.changeMasterdataViewBlocks).forEach((key) => {
    values[constants.changeMasterdataViewBlocks[key]] = {
      [constants.changeMasterdataViewActions[key]]: {
        value: overrides[key] ?? ''
      }
    };
  });
  return values;
};

describe('stammdaten/app', () => {
  const app = createMockBoltApp();
  stammdatenApp.setupApp(/** @type {any} */ (app));

  beforeEach(() => {
    app.resetClient();
    sheetsMock.resetAll();
    const adminRow = Array(15).fill('');
    adminRow[14] = 'C_STAMMDATEN_ADMIN';
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: { values: [adminRow] }
    }));
  });

  it('/stammdaten command and homeViewCommand open register view when unregistered or masterdata view when registered', async (t) => {
    t.mock.method(masterdataService, 'getAllActiveUsers', async () => []);
    const getCardMock = t.mock.method(
      masterdataService,
      'getUserContactCardFromId',
      async () => undefined
    );

    // Unregistered -> register modal
    await app.getCommand('/stammdaten')({
      ack: mock.fn(async () => {}),
      command: { user_id: 'U_NEW', trigger_id: 'T1' },
      client: app.client
    });
    assert.equal(
      app.client.views.open.mock.calls[0].arguments[0].view.callback_id,
      'registerview'
    );

    await app.getAction(constants.homeViewCommand)({
      ack: mock.fn(async () => {}),
      body: { user: { id: 'U_NEW' }, trigger_id: 'T2' },
      client: app.client
    });
    assert.equal(app.client.views.open.mock.callCount(), 2);

    // Registered -> changeMasterdataView
    getCardMock.mock.mockImplementation(async () => sampleContactCard);
    await app.getCommand('/stammdaten')({
      ack: mock.fn(async () => {}),
      command: { user_id: 'U_MAX', trigger_id: 'T3' },
      client: app.client
    });
    assert.equal(
      app.client.views.open.mock.calls[2].arguments[0].view.callback_id,
      constants.changeMasterdataViewName
    );

    await app.getAction(constants.homeViewCommand)({
      ack: mock.fn(async () => {}),
      body: { user: { id: 'U_MAX' }, trigger_id: 'T4' },
      client: app.client
    });
    assert.equal(app.client.views.open.mock.callCount(), 4);
  });

  it('changeMasterdataViewName submission validates phone/empty inputs and notifies admin + user on success', async (t) => {
    t.mock.method(
      masterdataService,
      'getUserContactCardFromId',
      async () => sampleContactCard
    );
    const viewFn = app.getView(constants.changeMasterdataViewName);

    // Invalid phone number
    const ackBadPhone = mock.fn(async () => {});
    await viewFn({
      ack: ackBadPhone,
      client: app.client,
      body: {
        user: { id: 'U_MAX' },
        view: { state: { values: makeViewValues({ phone: '12345' }) } }
      }
    });
    assert.equal(
      ackBadPhone.mock.calls[0].arguments[0].response_action,
      'errors'
    );

    // All empty fields
    const ackEmpty = mock.fn(async () => {});
    await viewFn({
      ack: ackEmpty,
      client: app.client,
      body: {
        user: { id: 'U_MAX' },
        view: { state: { values: makeViewValues() } }
      }
    });
    assert.equal(ackEmpty.mock.calls[0].arguments[0].response_action, 'errors');

    // Valid submission
    const ackOk = mock.fn(async () => {});
    await viewFn({
      ack: ackOk,
      client: app.client,
      body: {
        user: { id: 'U_MAX' },
        view: {
          state: {
            values: makeViewValues({
              phone: '+4917012345',
              street: 'Neue Str.'
            })
          }
        }
      }
    });
    assert.equal(app.client.chat.postMessage.mock.callCount(), 2);
  });

  it('approvalActions approve saves changes and reject skips saving', async (t) => {
    t.mock.method(
      masterdataService,
      'getUserContactCardFromId',
      async () => sampleContactCard
    );
    const saveChangesMock = t.mock.method(
      masterdataService,
      'saveMasterdataChanges',
      async () => {}
    );

    const payload = JSON.stringify({
      slackId: 'U_MAX',
      street: 'Neue Str.'
    });

    // Reject
    const respondReject = mock.fn(async () => {});
    await app.getAction(constants.approvalActions.reject)({
      ack: mock.fn(async () => {}),
      action: {
        action_id: constants.approvalActions.reject,
        value: payload
      },
      client: app.client,
      respond: respondReject,
      body: { user: { id: 'U_ADMIN' } }
    });
    assert.equal(saveChangesMock.mock.callCount(), 0);
    assert.ok(respondReject.mock.calls[0].arguments[0].includes('`abgelehnt`'));

    // Approve
    const respondApprove = mock.fn(async () => {});
    await app.getAction(constants.approvalActions.approve)({
      ack: mock.fn(async () => {}),
      action: {
        action_id: constants.approvalActions.approve,
        value: payload
      },
      client: app.client,
      respond: respondApprove,
      body: { user: { id: 'U_ADMIN' } }
    });
    assert.equal(saveChangesMock.mock.callCount(), 1);
    assert.ok(
      respondApprove.mock.calls[0].arguments[0].includes('`freigegeben`')
    );
  });
});
