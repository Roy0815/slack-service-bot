import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime,
  formatDate,
  convertNumberToColumn,
  deepCopy,
  getChannelInfo,
  joinChannel,
  convertStringToDate
} from '../../src/general/util.js';

describe('general/util', () => {
  describe('formatTime', () => {
    it('formats UTC time to Europe/Berlin 24h HH:mm format', () => {
      // 2024-06-15T12:30:00Z is 14:30 in CEST (UTC+2)
      const summerDate = new Date('2024-06-15T12:30:00Z');
      assert.equal(formatTime(summerDate), '14:30');

      // 2024-01-15T08:05:00Z is 09:05 in CET (UTC+1)
      const winterDate = new Date('2024-01-15T08:05:00Z');
      assert.equal(formatTime(winterDate), '09:05');
    });
  });

  describe('formatDate', () => {
    it('formats date to DD.MM.YYYY with leading zeros', () => {
      const singleDigitDate = new Date('2024-01-05T12:00:00Z');
      assert.equal(formatDate(singleDigitDate), '05.01.2024');

      const doubleDigitDate = new Date('2024-11-23T12:00:00Z');
      assert.equal(formatDate(doubleDigitDate), '23.11.2024');
    });
  });

  describe('convertNumberToColumn', () => {
    it('converts 1-based column numbers to spreadsheet column letters', () => {
      assert.equal(convertNumberToColumn(1), 'A');
      assert.equal(convertNumberToColumn(2), 'B');
      assert.equal(convertNumberToColumn(16), 'P');
      assert.equal(convertNumberToColumn(25), 'Y');
    });
  });

  describe('deepCopy', () => {
    it('creates a deep clone of an object without shared references', () => {
      const original = { a: 1, nested: { b: [2, 3] } };
      const copy = deepCopy(original);

      assert.deepEqual(copy, original);
      assert.notEqual(copy, original);
      assert.notEqual(copy.nested, original.nested);

      copy.nested.b.push(4);
      assert.equal(original.nested.b.length, 2);
    });
  });

  describe('getChannelInfo', () => {
    it('returns the matching channel object when found', async () => {
      const mockClient = {
        conversations: {
          list: async () => ({
            channels: [
              { id: 'C111', name: 'general' },
              { id: 'C222', name: 'random' }
            ]
          })
        }
      };

      const channel = await getChannelInfo(
        'C222',
        /** @type {any} */ (mockClient)
      );
      assert.deepEqual(channel, { id: 'C222', name: 'random' });
    });

    it('returns null when channel is not found', async () => {
      const mockClient = {
        conversations: {
          list: async () => ({
            channels: [{ id: 'C111', name: 'general' }]
          })
        }
      };

      const channel = await getChannelInfo(
        'C999',
        /** @type {any} */ (mockClient)
      );
      assert.equal(channel, null);
    });
  });

  describe('joinChannel', () => {
    it('calls conversations.join and returns ok status', async () => {
      let joinedChannel = '';
      const mockClient = {
        conversations: {
          join: async ({ channel }) => {
            joinedChannel = channel;
            return { ok: true };
          }
        }
      };

      const result = await joinChannel('C123', /** @type {any} */ (mockClient));
      assert.equal(result, true);
      assert.equal(joinedChannel, 'C123');
    });
  });

  describe('convertStringToDate', () => {
    it('converts YYYY.MM.DD string to Date object', () => {
      const date = convertStringToDate('2025.03.15');
      assert.equal(date.getFullYear(), 2025);
      assert.equal(date.getMonth(), 2); // 0-indexed March
      assert.equal(date.getDate(), 15);
    });
  });
});
