import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockModule } from '../helpers/mocks.js';

const filesUploadMock = mock.fn(async () => ({}));
const deleteMock = mock.fn(async () => ({}));

class MockApp {
  constructor() {
    this.client = {
      auth: {
        test: async () => ({ bot_id: 'B_BOT' })
      },
      conversations: {
        history: async () => ({
          messages: [
            {
              bot_id: 'B_BOT',
              ts: '100.1',
              blocks: [{ text: { text: '`01.01.2022`' } }]
            }
          ]
        })
      },
      chat: {
        delete: deleteMock
      },
      filesUploadV2: filesUploadMock
    };
  }
}

mockModule('@slack/bolt', {
  defaultExport: {
    App: MockApp
  }
});

const { run } = await import('../../src/staette/cleanup.js');

describe('staette/cleanup', () => {
  beforeEach(() => {
    filesUploadMock.mock.resetCalls();
    deleteMock.mock.resetCalls();
    delete process.env.CRONJOB_LOG_TO_ADMIN;
    process.env.APP_ADMIN_CHANNEL = 'C_ADMIN';
  });

  it('cleans up old messages and optionally uploads log when CRONJOB_LOG_TO_ADMIN is set', async (t) => {
    const logMock = t.mock.method(console, 'log', () => {});

    await run(/** @type {any} */ ({}), {});
    assert.equal(deleteMock.mock.callCount(), 1);
    assert.equal(filesUploadMock.mock.callCount(), 0);
    assert.equal(logMock.mock.calls[0].arguments[0], 'deleted 1 Messages');

    process.env.CRONJOB_LOG_TO_ADMIN = 'true';
    await run(/** @type {any} */ ({}), {});
    assert.equal(filesUploadMock.mock.callCount(), 1);
  });
});
