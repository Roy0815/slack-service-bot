import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createMockBoltApp } from '../helpers/mocks.js';
import { staetteApp } from '../../src/staette/app.js';
import * as views from '../../src/staette/views.js';

describe('staette/app', () => {
  const app = createMockBoltApp();
  staetteApp.setupApp(/** @type {any} */ (app));

  beforeEach(() => {
    app.resetClient();
  });

  describe('/weristda command', () => {
    const cmd = app.getCommand('/weristda');

    it('rejects invalid date formats and past dates', async () => {
      const respond = mock.fn(async () => {});

      await cmd({
        ack: mock.fn(async () => {}),
        command: { user_id: 'U1', text: 'not-a-date' },
        client: app.client,
        respond
      });
      assert.ok(respond.mock.calls[0].arguments[0].includes('gültiges Datum'));

      respond.mock.resetCalls();
      await cmd({
        ack: mock.fn(async () => {}),
        command: { user_id: 'U1', text: '01.01.2020' },
        client: app.client,
        respond
      });
      assert.ok(respond.mock.calls[0].arguments[0].includes('>= heute'));
    });

    it('rejects duplicate dates and posts/sorts unique dates (including empty = today)', async () => {
      const respond = mock.fn(async () => {});
      app.client.conversations.history.mock.mockImplementation(async () => ({
        messages: [
          {
            bot_id: 'B_BOT',
            blocks: [{ text: { text: '`31.12.2099`' } }]
          }
        ]
      }));

      await cmd({
        ack: mock.fn(async () => {}),
        command: { user_id: 'U1', text: '31.12.2099' },
        client: app.client,
        respond
      });
      assert.ok(
        respond.mock.calls[0].arguments[0].includes('existiert bereits')
      );

      // Empty text defaults to today and posts
      app.client.conversations.history.mock.mockImplementation(async () => ({
        messages: []
      }));
      await cmd({
        ack: mock.fn(async () => {}),
        command: { user_id: 'U1', text: '' },
        client: app.client,
        respond
      });
      assert.equal(app.client.chat.postMessage.mock.callCount(), 1);
    });
  });

  describe('actions', () => {
    it('homeViewCommand validates past/duplicate dates and posts valid inquiry', async () => {
      const actionFn = app.getAction(views.homeViewCommand);

      // Past date
      await actionFn({
        ack: mock.fn(async () => {}),
        client: app.client,
        body: {
          user: { id: 'U1' },
          view: {
            state: {
              values: {
                [views.homeViewInputBlockId]: {
                  [views.homeViewDatePickerAction]: {
                    selected_date: '2020-01-01'
                  }
                }
              }
            }
          }
        }
      });
      assert.ok(
        app.client.chat.postMessage.mock.calls[0].arguments[0].text.includes(
          'Vergangenheit'
        )
      );

      // Duplicate date
      app.client.chat.postMessage.mock.resetCalls();
      app.client.conversations.history.mock.mockImplementation(async () => ({
        messages: [
          {
            bot_id: 'B_BOT',
            blocks: [{ text: { text: '`31.12.2099`' } }]
          }
        ]
      }));
      await actionFn({
        ack: mock.fn(async () => {}),
        client: app.client,
        body: {
          user: { id: 'U1' },
          view: {
            state: {
              values: {
                [views.homeViewInputBlockId]: {
                  [views.homeViewDatePickerAction]: {
                    selected_date: '2099-12-31'
                  }
                }
              }
            }
          }
        }
      });
      assert.ok(
        app.client.chat.postMessage.mock.calls[0].arguments[0].text.includes(
          'existiert bereits'
        )
      );

      // Null date -> today -> posts inquiry
      app.client.chat.postMessage.mock.resetCalls();
      app.client.conversations.history.mock.mockImplementation(async () => ({
        messages: []
      }));
      await actionFn({
        ack: mock.fn(async () => {}),
        client: app.client,
        body: {
          user: { id: 'U1' },
          view: {
            state: {
              values: {
                [views.homeViewInputBlockId]: {
                  [views.homeViewDatePickerAction]: {
                    selected_date: null
                  }
                }
              }
            }
          }
        }
      });
      assert.equal(app.client.chat.postMessage.mock.callCount(), 1);
    });

    it('staette-whoisthere-update responds with updated attendance blocks', async () => {
      const actionFn = app.getAction('staette-whoisthere-update');
      const respond = mock.fn(async () => {});
      const baseMsg = views.getWhoIsThereMessage({
        user_id: 'U_ASK',
        text: '31.12.2099'
      });

      await actionFn({
        ack: mock.fn(async () => {}),
        action: { value: 'update' },
        respond,
        body: {
          user: { id: 'U2' },
          state: {
            values: {
              [views.whoIsThereInputBlockName]: {
                [views.whoIsThereTimePickerName]: {
                  selected_time: '17:30'
                }
              }
            }
          },
          message: baseMsg
        }
      });

      assert.equal(respond.mock.callCount(), 1);
      assert.ok(
        respond.mock.calls[0].arguments[0].blocks[5].text.text.includes(
          '17:30\t<@U2>'
        )
      );
    });

    it('messageOverflowAction enforces creator-only deletion', async () => {
      const overflowFn = app.getAction(views.messageOverflowAction);
      const respond = mock.fn(async () => {});

      // Non-creator
      await overflowFn({
        ack: mock.fn(async () => {}),
        client: app.client,
        respond,
        body: { user: { id: 'U_OTHER' }, channel: { id: 'C_STAETTE' } },
        action: {
          selected_option: { value: `${views.messageOverflowDelete}-U_CREATOR` }
        }
      });
      assert.equal(app.client.chat.postEphemeral.mock.callCount(), 1);
      assert.equal(respond.mock.callCount(), 0);

      // Creator
      await overflowFn({
        ack: mock.fn(async () => {}),
        client: app.client,
        respond,
        body: { user: { id: 'U_CREATOR' }, channel: { id: 'C_STAETTE' } },
        action: {
          selected_option: { value: `${views.messageOverflowDelete}-U_CREATOR` }
        }
      });
      assert.deepEqual(respond.mock.calls[0].arguments[0], {
        delete_original: true
      });
    });
  });
});
