import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  mockModule,
  setupGoogleSheetsMock,
  createMockBoltApp
} from '../helpers/mocks.js';
import * as gdConstants from '../../src/workflows/googledrive/constants.js';

const sheetsMock = setupGoogleSheetsMock();
const fetchMock = mock.fn();

mockModule('node-fetch', {
  defaultExport: fetchMock
});

const { masterdataService } =
  await import('../../src/general/masterdata/service.js');
const { workflowsApp } = await import('../../src/workflows/app.js');

describe('workflows/app (utility, masterdata, googledrive)', () => {
  const app = createMockBoltApp();
  workflowsApp.setupApp(/** @type {any} */ (app));

  beforeEach(() => {
    process.env.APP_ADMIN_CHANNEL = 'C_APP_ADMIN';
    app.resetClient();
    sheetsMock.resetAll();
    fetchMock.mock.resetCalls();
  });

  describe('utility workflows', () => {
    it('formatDate formats YYYY-MM-DD into requested output pattern', async () => {
      const complete = mock.fn(async () => {});
      const fn = app.getFunction('formatDate');

      await fn({
        client: app.client,
        inputs: { date: '2026-04-15', format: 'DD.MM.YYYY' },
        fail: mock.fn(),
        complete
      });

      assert.equal(complete.mock.callCount(), 1);
      assert.deepEqual(complete.mock.calls[0].arguments[0], {
        outputs: { formattedDate: '15.04.2026' }
      });
    });

    it('encodeURL encodes URI characters', async () => {
      const complete = mock.fn(async () => {});
      const fn = app.getFunction('encodeURL');

      await fn({
        client: app.client,
        inputs: { input: 'https://example.com/Max Mustermann' },
        fail: mock.fn(),
        complete
      });

      assert.deepEqual(complete.mock.calls[0].arguments[0], {
        outputs: { encodedString: 'https://example.com/Max%20Mustermann' }
      });
    });
  });

  describe('masterdata workflows', () => {
    it('setLeaveDate converts date and calls saveLeaveDate, or calls fail on error', async (t) => {
      const saveLeaveMock = t.mock.method(
        masterdataService,
        'saveLeaveDate',
        async () => {}
      );
      const complete = mock.fn(async () => {});
      const fail = mock.fn(async () => {});
      const fn = app.getFunction('setLeaveDate');

      await fn({
        client: app.client,
        inputs: { leaveDate: '2026-12-31', leaveUser: 'U_LEAVE' },
        fail,
        complete
      });

      assert.equal(saveLeaveMock.mock.callCount(), 1);
      assert.deepEqual(saveLeaveMock.mock.calls[0].arguments, [
        { slackId: 'U_LEAVE' },
        '31.12.2026'
      ]);
      assert.equal(complete.mock.callCount(), 1);

      // Error branch
      saveLeaveMock.mock.mockImplementationOnce(async () => {
        throw new Error('Sheet down');
      });
      await fn({
        client: app.client,
        inputs: { leaveDate: '2026-12-31', leaveUser: 'U_LEAVE' },
        fail,
        complete
      });
      assert.equal(fail.mock.callCount(), 1);
    });

    it('saveNewMember saves member, uploads vCard, and returns outputs or fails on missing mandate', async (t) => {
      const saveMemberMock = t.mock.method(
        masterdataService,
        'saveNewMember',
        async () => ({
          mandateReference: 'SAM-10',
          initialAmount: '45,00 €',
          recurringAmount: '30,00 €'
        })
      );
      const complete = mock.fn(async () => {});
      const fail = mock.fn(async () => {});
      const fn = app.getFunction('saveNewMember');

      const inputs = {
        firstname: 'Anna',
        lastname: 'Test',
        email: 'anna@example.com',
        phone: '+491701234',
        adminChannel: 'C_ADMIN'
      };

      await fn({
        client: app.client,
        inputs,
        fail,
        complete
      });

      assert.equal(complete.mock.callCount(), 1);
      assert.deepEqual(complete.mock.calls[0].arguments[0], {
        outputs: {
          mandateReference: 'SAM-10',
          initialAmount: '45,00 €',
          recurringAmount: '30,00 €',
          contactCardMessageLink:
            'https://sam.slack.com/archives/C_ADMIN/p1700000123'
        }
      });

      // Missing mandateReference branch
      saveMemberMock.mock.mockImplementationOnce(async () => ({
        mandateReference: '',
        initialAmount: '45,00 €',
        recurringAmount: '30,00 €'
      }));
      await fn({ client: app.client, inputs, fail, complete });
      assert.equal(fail.mock.callCount(), 1);

      // Thrown error branch
      saveMemberMock.mock.mockImplementationOnce(async () => {
        throw new Error('Write failed');
      });
      await fn({ client: app.client, inputs, fail, complete });
      assert.equal(fail.mock.callCount(), 2);
    });
  });

  describe('googledrive workflows', () => {
    const makeStream = () =>
      new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode('pdf-bytes'));
          c.close();
        }
      });

    it('uploadFileToGoogleDrive uploads file on success and notifies approvers/admin on failure', async () => {
      fetchMock.mock.mockImplementation(async () => ({ body: makeStream() }));
      const complete = mock.fn(async () => {});
      const fn = app.getFunction('uploadFileToGoogleDrive');

      await fn({
        client: app.client,
        inputs: {
          fileDate: '2026-05-01',
          fileName: 'Antrag.pdf',
          driveFolderID: 'DRIVE_1',
          fileURL: 'https://example.com/Antrag.pdf',
          approverChannel: 'C_APPROVER'
        },
        fail: mock.fn(),
        complete
      });

      assert.equal(complete.mock.callCount(), 1);
      assert.equal(sheetsMock.driveCreate.mock.callCount(), 1);
      assert.equal(
        sheetsMock.driveCreate.mock.calls[0].arguments[0].requestBody.name,
        '20260501 Antrag.pdf'
      );

      // Error branch (no response body)
      fetchMock.mock.mockImplementation(async () => ({ body: null }));
      await fn({
        client: app.client,
        inputs: {
          fileName: 'Broken.pdf',
          driveFolderID: 'DRIVE_1',
          fileURL: 'https://example.com/Broken.pdf',
          approverChannel: 'C_APPROVER'
        },
        fail: mock.fn(),
        complete
      });

      assert.equal(app.client.chat.postMessage.mock.callCount(), 1);
      assert.equal(app.client.filesUploadV2.mock.callCount(), 1);
    });

    it('retryActionId action retries upload and updates message or posts ephemeral error', async () => {
      const actionFn = app.getAction(
        gdConstants.uploadFailureMessage.retryActionId
      );
      const filePayload = JSON.stringify({
        fileID: 'F1',
        fileName: 'Retry.pdf',
        driveFolderID: 'DRIVE_1',
        publicFileURL: 'https://example.com/Retry.pdf'
      });

      fetchMock.mock.mockImplementation(async () => ({ body: makeStream() }));
      const respond = mock.fn(async () => {});

      await actionFn({
        ack: mock.fn(async () => {}),
        body: { user: { id: 'U_ADMIN' }, channel: { id: 'C_APPROVER' } },
        client: app.client,
        action: { value: filePayload },
        respond
      });

      assert.equal(respond.mock.callCount(), 1);
      assert.equal(respond.mock.calls[0].arguments[0].replace_original, true);

      // Retry failure branch
      fetchMock.mock.mockImplementation(async () => ({ body: null }));
      await actionFn({
        ack: mock.fn(async () => {}),
        body: { user: { id: 'U_ADMIN' }, channel: { id: 'C_APPROVER' } },
        client: app.client,
        action: { value: filePayload },
        respond
      });

      assert.equal(app.client.chat.postEphemeral.mock.callCount(), 1);
    });
  });
});
