import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  mockModule,
  setupGoogleSheetsMock,
  createMockBoltApp
} from './helpers/mocks.js';

setupGoogleSheetsMock();

const mockApp = createMockBoltApp();
const receiverHandlerMock = mock.fn(async () => ({ statusCode: 200 }));

class MockAwsLambdaReceiver {
  async start() {
    return receiverHandlerMock;
  }
}

class MockBoltApp {
  constructor() {
    return mockApp;
  }
}

mockModule('@slack/bolt', {
  defaultExport: {
    App: MockBoltApp,
    AwsLambdaReceiver: MockAwsLambdaReceiver
  }
});

const { globalData } = await import('../src/general/aws-runtime-api.js');
const { handler } = await import('../src/app.js');

describe('root src/app', () => {
  beforeEach(() => {
    process.env.APP_ADMIN = 'U_APP_ADMIN';
    process.env.APP_ADMIN_CHANNEL = 'C_APP_ADMIN';
    mockApp.resetClient();
    receiverHandlerMock.mock.resetCalls();
  });

  it('app_home_opened publishes the combined home view', async () => {
    const homeEventFn = mockApp.getEvent('app_home_opened');
    await homeEventFn({
      event: { user: 'U123' },
      client: mockApp.client
    });

    assert.equal(mockApp.client.views.publish.mock.callCount(), 1);
    assert.equal(
      mockApp.client.views.publish.mock.calls[0].arguments[0].user_id,
      'U123'
    );
  });

  it('fallback action handler acks unknown actions and swallows multiple-ack errors', async () => {
    const fallbackAction = mockApp.getAction('some-unregistered-action-id');
    const ack = mock.fn(async () => {});
    await fallbackAction({ ack });
    assert.equal(ack.mock.callCount(), 1);

    const throwingAck = mock.fn(async () => {
      throw new Error('ReceiverMultipleAckError');
    });
    await assert.doesNotReject(async () => {
      await fallbackAction({ ack: throwingAck });
    });
  });

  it('/test command and extractInvoice shortcut restrict execution to APP_ADMIN', async () => {
    const testCmd = mockApp.getCommand('/test');
    const respond = mock.fn(async () => {});

    await testCmd({
      ack: mock.fn(async () => {}),
      respond,
      command: { user_id: 'U_NON_ADMIN' },
      client: mockApp.client
    });
    assert.ok(respond.mock.calls[0].arguments[0].includes('nur der Admin'));

    respond.mock.resetCalls();
    await testCmd({
      ack: mock.fn(async () => {}),
      respond,
      command: { user_id: 'U_APP_ADMIN' },
      client: mockApp.client
    });
    assert.equal(respond.mock.calls[0].arguments[0], 'Test erfolgreich!');

    // extractInvoice shortcut
    const shortcutFn = mockApp.getShortcut('extractInvoice');
    respond.mock.resetCalls();
    await shortcutFn({
      ack: mock.fn(async () => {}),
      respond,
      shortcut: { user: { id: 'U_NON_ADMIN' } },
      client: mockApp.client
    });
    assert.equal(mockApp.client.filesUploadV2.mock.callCount(), 0);

    await shortcutFn({
      ack: mock.fn(async () => {}),
      respond,
      shortcut: { user: { id: 'U_APP_ADMIN' } },
      client: mockApp.client
    });
    assert.equal(mockApp.client.filesUploadV2.mock.callCount(), 1);
  });

  it('app.error notifies user on expired_trigger_id and uploads error diagnostics to admin channel', async (t) => {
    const logMock = t.mock.method(console, 'log', () => {});
    const errorFn = mockApp.getErrorHandler();

    await errorFn({
      error: { data: { error: 'expired_trigger_id' } },
      context: { teamId: 'T1' },
      body: { command: '/umfrage', user_id: 'U1' }
    });

    assert.equal(mockApp.client.chat.postMessage.mock.callCount(), 1);
    assert.ok(
      mockApp.client.chat.postMessage.mock.calls[0].arguments[0].text.includes(
        '/umfrage'
      )
    );
    assert.equal(mockApp.client.filesUploadV2.mock.callCount(), 2);
    assert.equal(logMock.mock.callCount(), 1);

    // When APP_ADMIN is unset, skips admin file uploads
    delete process.env.APP_ADMIN;
    mockApp.client.filesUploadV2.mock.resetCalls();
    await errorFn({
      error: { data: { error: 'other_error' } },
      context: {},
      body: {}
    });
    assert.equal(mockApp.client.filesUploadV2.mock.callCount(), 0);
  });

  it('Lambda handler buffers awsRequestId and delegates to receiver handler', async () => {
    const res = await handler(
      /** @type {any} */ ({ body: '{}' }),
      { awsRequestId: 'lambda-req-99' },
      () => {}
    );

    assert.equal(globalData.awsRequestId, 'lambda-req-99');
    assert.equal(receiverHandlerMock.mock.callCount(), 1);
    assert.deepEqual(res, { statusCode: 200 });
  });
});
