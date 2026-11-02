import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupGoogleSheetsMock, createMockBoltApp } from '../helpers/mocks.js';
import * as constants from '../../src/meldungen/constants.js';

const sheetsMock = setupGoogleSheetsMock();

await import('../../src/general/apps.js');
const controller = await import('../../src/meldungen/controller.js');
const { masterdataService } =
  await import('../../src/general/masterdata/service.js');
const { meldungenApp } = await import('../../src/meldungen/app.js');

const sampleUser = {
  id: 1,
  slackId: 'U_ATHLETE',
  firstname: 'Max',
  lastname: 'Kraft',
  birthday: '15.05.1998',
  sex: 'm'
};

describe('meldungen/app', () => {
  const app = createMockBoltApp();
  meldungenApp.setupApp(/** @type {any} */ (app));

  beforeEach(() => {
    process.env.SPREADSHEET_ID_MELDUNGEN = 'meldungen-id';
    process.env.MELDUNGEN_ADMIN_CHANNEL = 'C_MELD_ADMIN';
    app.resetClient();
    sheetsMock.resetAll();
  });

  it('/meldung and homeView action handle unregistered user, empty competitions, and valid registration view', async (t) => {
    t.mock.method(masterdataService, 'getAllActiveUsers', async () => []);
    const getUserMock = t.mock.method(
      masterdataService,
      'getUserFromId',
      async () => undefined
    );

    // Unregistered user -> opens registerView & throws UserNotRegisteredError
    await assert.rejects(
      async () => {
        await app.getCommand('/meldung')({
          ack: mock.fn(async () => {}),
          command: {
            user_id: 'U_UNREG',
            trigger_id: 'T1',
            channel_id: 'C1'
          },
          client: app.client
        });
      },
      (err) => err instanceof controller.UserNotRegisteredError
    );

    // Registered user, no competitions -> posts fallback message
    getUserMock.mock.mockImplementation(async () => sampleUser);
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: { values: [['ID', 'Name', 'Datum', 'Ort']] }
    }));

    await app.getAction(constants.homeView.actionMeldungInput)({
      ack: mock.fn(async () => {}),
      body: { user: { id: 'U_ATHLETE' }, trigger_id: 'T2' },
      client: app.client
    });
    assert.ok(
      app.client.chat.postMessage.mock.calls[0].arguments[0].text.includes(
        'keine Wettkämpfe'
      )
    );

    // Registered user, competitions available -> opens registration modal
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: {
        values: [
          ['ID', 'Name', 'Datum', 'Ort'],
          ['101', 'LM KDK', '01.10.2026', 'Mannheim']
        ]
      }
    }));
    await app.getCommand('/meldung')({
      ack: mock.fn(async () => {}),
      command: { user_id: 'U_ATHLETE', trigger_id: 'T3', channel_id: 'C1' },
      client: app.client
    });
    assert.equal(app.client.views.open.mock.callCount(), 2);
  });

  it('/wettkampf-erstellen enforces MELDUNGEN_ADMIN_CHANNEL', async () => {
    const cmd = app.getCommand('/wettkampf-erstellen');

    // Wrong channel -> notifies user
    await cmd({
      ack: mock.fn(async () => {}),
      command: {
        user_id: 'U_ADMIN',
        channel_id: 'C_OTHER',
        trigger_id: 'T1'
      },
      client: app.client
    });
    assert.equal(app.client.chat.postMessage.mock.callCount(), 1);
    assert.equal(app.client.views.open.mock.callCount(), 0);

    // Admin channel -> opens modal
    await cmd({
      ack: mock.fn(async () => {}),
      command: {
        user_id: 'U_ADMIN',
        channel_id: 'C_MELD_ADMIN',
        trigger_id: 'T2'
      },
      client: app.client
    });
    assert.equal(app.client.views.open.mock.callCount(), 1);
  });

  it('competitionRegistrationView submission saves registration or handles duplicates', async (t) => {
    t.mock.method(masterdataService, 'getUserFromId', async () => sampleUser);
    sheetsMock.spreadsheetsGet.mock.mockImplementation(async () => ({
      data: { sheets: [{ properties: { sheetId: 101, title: 'LM KDK' } }] }
    }));

    const selectedValues = {
      [constants.competitionRegistrationView.blockCompetitionSelect]: {
        [constants.competitionRegistrationView.actionCompetitionSelect]: {
          selected_option: { value: '101' }
        }
      },
      [constants.competitionRegistrationView.blockWeightClassSelect]: {
        [constants.competitionRegistrationView.actionWeightClassSelect]: {
          selected_option: { value: '-83kg' }
        }
      },
      [constants.competitionRegistrationView.blockHandlerNeededSelect]: {
        [constants.competitionRegistrationView.actionHandlerNeededSelect]: {
          selected_option: { value: 'Ja' }
        }
      },
      [constants.competitionRegistrationView.blockPaymentRecordUpload]: {
        [constants.competitionRegistrationView.actionPaymentRecordUpload]: {
          files: [{ permalink: 'https://slack.com/receipt.pdf' }]
        }
      },
      [constants.competitionRegistrationView.blockRemarksInput]: {
        [constants.competitionRegistrationView.actionRemarksInput]: {
          value: 'Keine'
        }
      }
    };

    const viewFn = app.getView(constants.competitionRegistrationView.viewName);

    // New registration
    sheetsMock.valuesGet.mock.mockImplementation(async ({ range }) => {
      if (range === constants.nameOfCompetitionSheet) {
        return {
          data: {
            values: [
              ['ID', 'Name', 'Datum', 'Ort'],
              ['101', 'LM KDK', '01.10.2026', 'Mannheim']
            ]
          }
        };
      }
      return { data: { values: [['Nachname', 'Vorname']] } };
    });

    await viewFn({
      ack: mock.fn(async () => {}),
      client: app.client,
      body: {
        user: { id: 'U_ATHLETE' },
        view: { state: { values: selectedValues } }
      }
    });
    assert.equal(sheetsMock.valuesAppend.mock.callCount(), 1);
    assert.equal(app.client.chat.postMessage.mock.callCount(), 2);

    // Duplicate registration
    app.client.chat.postMessage.mock.resetCalls();
    sheetsMock.valuesGet.mock.mockImplementation(async ({ range }) => {
      if (range === constants.nameOfCompetitionSheet) {
        return {
          data: {
            values: [
              ['ID', 'Name', 'Datum', 'Ort'],
              ['101', 'LM KDK', '01.10.2026', 'Mannheim']
            ]
          }
        };
      }
      return {
        data: {
          values: [
            ['Nachname', 'Vorname'],
            ['Kraft', 'Max']
          ]
        }
      };
    });

    await viewFn({
      ack: mock.fn(async () => {}),
      client: app.client,
      body: {
        user: { id: 'U_ATHLETE' },
        view: { state: { values: selectedValues } }
      }
    });
    assert.ok(
      app.client.chat.postMessage.mock.calls[0].arguments[0].text.includes(
        'bereits für diesen Wettkampf angemeldet'
      )
    );
  });

  it('competitionCreationView submission creates competition or reports duplicate', async () => {
    const viewFn = app.getView(constants.competitionCreationView.viewName);
    const values = {
      [constants.competitionCreationView.blockCompetitionName]: {
        [constants.competitionCreationView.actionCompetitionName]: {
          value: 'DM Classic'
        }
      },
      [constants.competitionCreationView.blockCompetitionDate]: {
        [constants.competitionCreationView.actionCompetitionDate]: {
          selected_date: '2026-11-15'
        }
      },
      [constants.competitionCreationView.blockCompetitionLocation]: {
        [constants.competitionCreationView.actionCompetitionLocation]: {
          value: 'Mannheim'
        }
      }
    };

    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: { values: [['ID', 'Name', 'Datum', 'Ort']] }
    }));
    sheetsMock.sheetsCopyTo.mock.mockImplementation(async () => ({
      data: { title: 'Copied Sheet' }
    }));
    sheetsMock.spreadsheetsGet.mock.mockImplementation(async () => ({
      data: {
        sheets: [
          { properties: { title: 'Vorlage Wettkampf', sheetId: 1 } },
          { properties: { title: 'Copied Sheet', sheetId: 777 } },
          {
            properties: {
              title: 'DM Classic (15.11.2026) Mannheim',
              sheetId: 777
            }
          }
        ]
      }
    }));

    await viewFn({
      ack: mock.fn(async () => {}),
      client: app.client,
      body: { user: { id: 'U_ADMIN' }, view: { state: { values } } }
    });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(app.client.chat.postMessage.mock.callCount(), 1);

    // Duplicate competition
    app.client.chat.postMessage.mock.resetCalls();
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: {
        values: [
          ['ID', 'Name', 'Datum', 'Ort'],
          ['777', 'DM Classic', '15.11.2026', 'Mannheim']
        ]
      }
    }));
    await viewFn({
      ack: mock.fn(async () => {}),
      client: app.client,
      body: { user: { id: 'U_ADMIN' }, view: { state: { values } } }
    });
    assert.ok(
      app.client.chat.postMessage.mock.calls[0].arguments[0].text.includes(
        'existiert bereits'
      )
    );
  });

  it('confirm and deny admin actions notify user, update message, and update sheet status', async () => {
    sheetsMock.spreadsheetsGet.mock.mockImplementation(async () => ({
      data: { sheets: [{ properties: { sheetId: 101, title: 'LM KDK' } }] }
    }));
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: {
        values: [
          ['Nachname', 'Vorname'],
          ['Kraft', 'Max']
        ]
      }
    }));

    const regPayload = JSON.stringify({
      slackID: 'U_ATHLETE',
      first_name: 'Max',
      last_name: 'Kraft',
      competition: { ID: '101', name: 'LM KDK' }
    });

    for (const actionId of [
      constants.competitionRegistrationAdminActions.confirm,
      constants.competitionRegistrationAdminActions.deny
    ]) {
      await app.getAction(actionId)({
        ack: mock.fn(async () => {}),
        client: app.client,
        action: { action_id: actionId, value: regPayload },
        body: {
          user: { id: 'U_ADMIN' },
          channel: { id: 'C_MELD_ADMIN' },
          message: {
            ts: '111.222',
            blocks: [
              { type: 'section' },
              { type: 'section' },
              { type: 'actions' }
            ]
          }
        }
      });
    }

    assert.equal(app.client.chat.update.mock.callCount(), 2);
    assert.equal(sheetsMock.valuesUpdate.mock.callCount(), 2);
  });
});
