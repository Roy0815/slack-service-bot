import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as constants from '../../src/arbeitsstunden/constants.js';
import { SlackViewSubmissionError } from '../../src/general/types.js';
import { setupGoogleSheetsMock } from '../helpers/mocks.js';

const sheetsMock = setupGoogleSheetsMock();

const { masterdataService } = await import(
  '../../src/general/masterdata/service.js'
);
const controller = await import('../../src/arbeitsstunden/controller.js');

describe('arbeitsstunden/controller', () => {
  beforeEach(() => {
    sheetsMock.resetAll();
    const adminRow = Array(15).fill('');
    adminRow[14] = 'C_ADMIN';
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: { values: [adminRow] }
    }));
  });

  it('getHoursDisplayResponse formats summary and detail blocks', () => {
    const response = controller.getHoursDisplayResponse(
      {
        workedHours: 5,
        targetHours: 3,
        details: [
          { date: '01.05.2025', hours: 2.5, description: 'Aufbau' },
          { date: '02.05.2025', hours: 2.5, description: 'Abbau' }
        ]
      },
      '2025'
    );

    assert.ok(
      response.text.includes(
        'Du hast 2025 bereits 5 Arbeitsstunden geleistet. Du musst noch 3 Stunden leisten.'
      )
    );
    assert.equal(response.blocks.length, 5);
  });

  it('getHomeView and getMaintainHoursView populate defaults', () => {
    const view = controller.getHomeView();
    const actionBlock = /** @type {any} */ (view[2]);
    const options = actionBlock.elements[1].options;
    const currentYear = new Date().getFullYear();

    assert.equal(options[0].value, `${currentYear}`);
    assert.equal(options[options.length - 1].value, '2022');

    const maintModal = controller.getMaintainHoursView('trig-maint');
    assert.equal(maintModal.trigger_id, 'trig-maint');
  });

  it('getRegisterView populates active users in dropdown', async (t) => {
    t.mock.method(masterdataService, 'getAllActiveUsers', async () => [
      { id: 1, firstname: 'Max', lastname: 'Mustermann' }
    ]);

    const res = await controller.getRegisterView('trig-123');
    assert.equal(res.trigger_id, 'trig-123');
    const select = /** @type {any} */ (res.view.blocks[0]).element;
    assert.equal(select.options.length, 1);
    assert.equal(select.options[0].text.text, 'Max Mustermann');
    assert.equal(select.options[0].value, '1');
  });

  it('getAutoRegisterMessage and getRegisterConfirmDialog build admin messages', async () => {
    const autoMsg = await controller.getAutoRegisterMessage('U_NEW');
    assert.equal(autoMsg.channel, 'C_ADMIN');
    assert.ok(autoMsg.text.includes('<@U_NEW>'));

    const confirmMsg = await controller.getRegisterConfirmDialog({
      id: 1,
      slackId: 'U_NEW',
      name: 'Max Mustermann'
    });
    assert.equal(confirmMsg.channel, 'C_ADMIN');
    assert.ok(
      confirmMsg.text.includes(
        '<@U_NEW> möchte sich als Max Mustermann registrieren'
      )
    );
  });

  it('getUserRegisterStartMessage and getUserRegisterEndMessage return user notifications', () => {
    const startMsg = controller.getUserRegisterStartMessage({
      id: 1,
      slackId: 'U1',
      name: 'Max'
    });
    assert.equal(startMsg.channel, 'U1');
    assert.ok(startMsg.text.includes('Deine Registrierung als Max'));

    const approvedMsg = controller.getUserRegisterEndMessage({
      id: 1,
      slackId: 'U1',
      name: 'Max',
      approved: true
    });
    assert.ok(approvedMsg.text.includes('genehmigt'));

    const rejectedMsg = controller.getUserRegisterEndMessage({
      id: 1,
      slackId: 'U1',
      name: 'Max',
      approved: false
    });
    assert.ok(rejectedMsg.text.includes('abgelehnt'));
  });

  it('getMaintainConfirmDialog, getUserMaintainStartMessage, and getUserMaintainEndMessage format messages', async () => {
    const maintObj = {
      slackId: 'U1',
      description: 'Wettkampf Tisch',
      hours: 4,
      date: '2025-04-10'
    };

    const confirmDialog = await controller.getMaintainConfirmDialog(maintObj);
    assert.equal(confirmDialog.channel, 'C_ADMIN');
    assert.ok(confirmDialog.text.includes('4 Stunden am 10.04.2025'));

    const startMsg = controller.getUserMaintainStartMessage(maintObj);
    assert.equal(startMsg.channel, 'U1');
    assert.ok(startMsg.text.includes('10.04.2025'));

    const endMsg = controller.getUserMaintainEndMessage({
      ...maintObj,
      approved: true
    });
    assert.ok(endMsg.text.includes('`genehmigt`'));
  });

  describe('getDataFromHoursMaintView', () => {
    const currentYear = new Date().getFullYear();

    const makeBody = (date, hours, description = 'Test') => ({
      user: { id: 'U123' },
      view: {
        state: {
          values: {
            [constants.maintainHoursView.blockDescription]: {
              [constants.maintainHoursView.actionDescription]: {
                value: description
              }
            },
            [constants.maintainHoursView.blockHours]: {
              [constants.maintainHoursView.actionHours]: {
                value: hours
              }
            },
            [constants.maintainHoursView.blockDate]: {
              [constants.maintainHoursView.actionDate]: {
                selected_date: date
              }
            }
          }
        }
      }
    });

    it('parses valid input with comma decimal separator', () => {
      const body = makeBody(`${currentYear}-05-15`, '2,5', 'Putzen');
      const data = controller.getDataFromHoursMaintView(
        /** @type {any} */ (body)
      );
      assert.deepEqual(data, {
        slackId: 'U123',
        description: 'Putzen',
        hours: 2.5,
        date: `${currentYear}-05-15`
      });
    });

    it('throws SlackViewSubmissionError when year is out of range', () => {
      const body = makeBody(`${currentYear - 2}-05-15`, '2');
      assert.throws(
        () => controller.getDataFromHoursMaintView(/** @type {any} */ (body)),
        (err) => err instanceof SlackViewSubmissionError
      );
    });

    it('throws SlackViewSubmissionError when hours is not a positive number', () => {
      const bodyNaN = makeBody(`${currentYear}-05-15`, 'abc');
      assert.throws(
        () =>
          controller.getDataFromHoursMaintView(/** @type {any} */ (bodyNaN)),
        (err) => err instanceof SlackViewSubmissionError
      );

      const bodyZero = makeBody(`${currentYear}-05-15`, '0');
      assert.throws(
        () =>
          controller.getDataFromHoursMaintView(/** @type {any} */ (bodyZero)),
        (err) => err instanceof SlackViewSubmissionError
      );
    });
  });
});
