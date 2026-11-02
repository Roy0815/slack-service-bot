import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as functions from '../../src/staette/functions.js';
import * as views from '../../src/staette/views.js';
import { formatDate } from '../../src/general/util.js';

describe('staette/functions & staette/views', () => {
  describe('views', () => {
    it('getWhoIsThereMessage builds initial message for today or future date', () => {
      const todayStr = formatDate(new Date());
      const msgToday = views.getWhoIsThereMessage({
        user_id: 'U_ASK',
        text: todayStr
      });
      assert.ok(msgToday.text.includes('wer heute in der Stätte ist'));

      const msgFuture = views.getWhoIsThereMessage({
        user_id: 'U_ASK',
        text: '25.12.2029'
      });
      assert.ok(msgFuture.text.includes('wer am 25.12.2029 in der Stätte ist'));
    });

    it('updateWhoIsThereMessage adds, sorts, updates, and deletes user attendance times', () => {
      const baseMsg = views.getWhoIsThereMessage({
        user_id: 'U_ASK',
        text: '25.12.2029'
      });

      // Add U1 at 18:00
      const step1 = views.updateWhoIsThereMessage(
        { user: 'U1', time: '18:00', xdelete: false },
        { text: baseMsg.text, blocks: /** @type {any} */ (baseMsg.blocks) }
      );
      assert.equal(
        /** @type {any} */ (step1.blocks[5]).text.text,
        '18:00\t<@U1>'
      );

      // Add U2 at 16:30 -> sorted before U1
      const step2 = views.updateWhoIsThereMessage(
        { user: 'U2', time: '16:30', xdelete: false },
        { text: step1.text, blocks: /** @type {any} */ (step1.blocks) }
      );
      assert.equal(
        /** @type {any} */ (step2.blocks[5]).text.text,
        '16:30\t<@U2>\n18:00\t<@U1>'
      );

      // Delete U2
      const step3 = views.updateWhoIsThereMessage(
        { user: 'U2', time: '16:30', xdelete: true },
        { text: step2.text, blocks: /** @type {any} */ (step2.blocks) }
      );
      assert.equal(
        /** @type {any} */ (step3.blocks[5]).text.text,
        '18:00\t<@U1>'
      );

      // Delete U1 -> user blocks removed
      const step4 = views.updateWhoIsThereMessage(
        { user: 'U1', time: '18:00', xdelete: true },
        { text: step3.text, blocks: /** @type {any} */ (step3.blocks) }
      );
      assert.equal(step4.blocks.length, 4);
    });
  });

  describe('functions', () => {
    it('dateIsUnique checks if a message for the given date already exists', async () => {
      const mockClient = {
        auth: {
          test: async () => ({ bot_id: 'B123' })
        },
        conversations: {
          history: async () => ({
            messages: [
              {
                bot_id: 'B123',
                blocks: [{ text: { text: '`10.10.2028`' } }]
              }
            ]
          })
        }
      };

      const isUniqueExisting = await functions.dateIsUnique({
        client: /** @type {any} */ (mockClient),
        date: '10.10.2028'
      });
      assert.equal(isUniqueExisting, false);

      const isUniqueNew = await functions.dateIsUnique({
        client: /** @type {any} */ (mockClient),
        date: '11.10.2028'
      });
      assert.equal(isUniqueNew, true);
    });

    it('cleanup deletes messages older than yesterday', async () => {
      const deleteMock = mock.fn(async () => ({}));
      const mockClient = {
        auth: {
          test: async () => ({ bot_id: 'B123' })
        },
        conversations: {
          history: async () => ({
            messages: [
              {
                bot_id: 'B123',
                ts: '100.1',
                blocks: [{ text: { text: '`01.01.2022`' } }]
              },
              {
                bot_id: 'B123',
                ts: '200.2',
                blocks: [{ text: { text: '`31.12.2099`' } }]
              }
            ]
          })
        },
        chat: {
          delete: deleteMock
        }
      };

      const deleted = await functions.cleanup(
        /** @type {any} */ ({ client: mockClient })
      );
      assert.equal(deleted.length, 1);
      assert.equal(deleted[0].ts, '100.1');
      assert.equal(deleteMock.mock.callCount(), 1);
    });

    it('sortMessages deletes and reposts messages with dates after the current date', async () => {
      const deleteMock = mock.fn(async () => ({}));
      const postMessageMock = mock.fn(async () => ({}));
      const mockClient = {
        auth: {
          test: async () => ({ bot_id: 'B123' })
        },
        conversations: {
          history: async () => ({
            messages: [
              {
                bot_id: 'B123',
                ts: '300.3',
                blocks: [
                  { text: { text: '`20.10.2028`' } },
                  { text: { text: 'Question text' } }
                ]
              },
              {
                bot_id: 'B123',
                ts: '100.1',
                blocks: [
                  { text: { text: '`05.10.2028`' } },
                  { text: { text: 'Earlier text' } }
                ]
              }
            ]
          })
        },
        chat: {
          delete: deleteMock,
          postMessage: postMessageMock
        }
      };

      await functions.sortMessages({
        client: /** @type {any} */ (mockClient),
        date: '10.10.2028'
      });

      assert.equal(deleteMock.mock.callCount(), 1);
      assert.equal(postMessageMock.mock.callCount(), 1);
    });
  });
});
