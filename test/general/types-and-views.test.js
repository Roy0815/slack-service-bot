import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SlackViewSubmissionError } from '../../src/general/types.js';
import { getHomeView } from '../../src/general/views.js';

describe('general/types & general/views', () => {
  describe('SlackViewSubmissionError', () => {
    it('creates an Error instance and returns Slack ack error format', () => {
      const err = new SlackViewSubmissionError('block_1', 'Invalid input');
      assert.ok(err instanceof Error);
      assert.equal(err.message, 'Invalid input');
      assert.deepEqual(err.getAckObject(), {
        response_action: 'errors',
        errors: {
          block_1: 'Invalid input'
        }
      });
    });
  });

  describe('getHomeView', () => {
    it('builds combined home view for a user', () => {
      const result = getHomeView(/** @type {any} */ ({ user: 'U12345' }));
      assert.equal(result.user_id, 'U12345');
      assert.equal(result.view.type, 'home');
      assert.ok(Array.isArray(result.view.blocks));
      assert.ok(result.view.blocks.length > 1);
    });
  });
});
