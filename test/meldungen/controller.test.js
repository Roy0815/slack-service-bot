import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as constants from '../../src/meldungen/constants.js';
import { userSex } from '../../src/general/masterdata/types.js';
import { setupGoogleSheetsMock } from '../helpers/mocks.js';

const sheetsMock = setupGoogleSheetsMock();

const controller = await import('../../src/meldungen/controller.js');

describe('meldungen/controller', () => {
  beforeEach(() => {
    process.env.SPREADSHEET_ID_MELDUNGEN = 'meldungen-sheet-id';
    process.env.MELDUNGEN_ADMIN_CHANNEL = 'C_MELDUNGEN_ADMIN';
    sheetsMock.resetAll();
  });

  it('getCompetitionRegistrationView populates competitions and weight classes based on sex', async () => {
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: {
        values: [
          ['ID', 'Name', 'Datum', 'Ort'],
          ['101', 'LM KDK', '2025-10-01', 'Mannheim']
        ]
      }
    }));

    const femaleRes = await controller.getCompetitionRegistrationView(
      'trig-1',
      /** @type {any} */ ({ sex: userSex.female })
    );
    const weightBlockF = /** @type {any} */ (
      femaleRes.view.blocks.find(
        (b) =>
          b.block_id ===
          constants.competitionRegistrationView.blockWeightClassSelect
      )
    );
    assert.ok(
      weightBlockF.element.options.some((o) => o.value === '-63kg') &&
        !weightBlockF.element.options.some((o) => o.value === '-93kg')
    );

    const maleRes = await controller.getCompetitionRegistrationView(
      'trig-2',
      /** @type {any} */ ({ sex: userSex.male })
    );
    const weightBlockM = /** @type {any} */ (
      maleRes.view.blocks.find(
        (b) =>
          b.block_id ===
          constants.competitionRegistrationView.blockWeightClassSelect
      )
    );
    assert.ok(weightBlockM.element.options.some((o) => o.value === '-93kg'));
  });

  it('getCompetitionRegistrationView throws NoCompetitionsFoundError when no competitions exist', async () => {
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: { values: [['ID', 'Name', 'Datum', 'Ort']] }
    }));

    await assert.rejects(
      async () => {
        await controller.getCompetitionRegistrationView(
          'trig-1',
          /** @type {any} */ ({ sex: userSex.male })
        );
      },
      (err) => err instanceof controller.NoCompetitionsFoundError
    );
  });

  it('extractCompetitionRegistrationData extracts user and selected form values', async () => {
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: {
        values: [
          ['ID', 'Name', 'Datum', 'Ort'],
          ['101', 'LM KDK', '2025-10-01', 'Mannheim']
        ]
      }
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
          files: [{ permalink: 'https://slack.com/files/receipt.pdf' }]
        }
      },
      [constants.competitionRegistrationView.blockRemarksInput]: {
        [constants.competitionRegistrationView.actionRemarksInput]: {
          value: null
        }
      }
    };

    const data = await controller.extractCompetitionRegistrationData(
      selectedValues,
      /** @type {any} */ ({
        slackId: 'U_ATHLETE',
        firstname: 'Max',
        lastname: 'Kraft',
        birthday: '15.05.1998'
      })
    );

    assert.deepEqual(data, {
      slackID: 'U_ATHLETE',
      first_name: 'Max',
      last_name: 'Kraft',
      birthyear: 1998,
      competition: {
        ID: '101',
        name: 'LM KDK',
        date: '2025-10-01',
        location: 'Mannheim'
      },
      weight_class: '-83kg',
      handler_needed: 'Ja',
      payment_record_file_permalink: 'https://slack.com/files/receipt.pdf',
      user_remarks: ''
    });
  });

  it('builds confirmation messages, creation view, and custom errors', () => {
    assert.ok(Array.isArray(controller.getHomeView()));
    assert.equal(controller.getCompetitionCreationView('t1').trigger_id, 't1');
    assert.ok(new controller.WrongChannelError() instanceof Error);
    assert.ok(new controller.UserNotRegisteredError() instanceof Error);

    const comp = {
      ID: '101',
      name: 'LM KDK',
      date: '2025-10-01',
      location: 'Mannheim'
    };
    const regData = {
      slackID: 'U_ATHLETE',
      first_name: 'Max',
      last_name: 'Kraft',
      birthyear: 1998,
      competition: comp,
      weight_class: '-83kg',
      handler_needed: 'Ja',
      payment_record_file_permalink: 'https://slack.com/file',
      user_remarks: 'Erster WK'
    };

    const userConfirm =
      controller.getUserConfirmMessageCompetitionCreation(regData);
    assert.equal(userConfirm.channel, 'U_ATHLETE');
    assert.ok(userConfirm.text.includes('LM KDK'));

    const adminCompConfirm =
      controller.getAdminConfirmMessageCompetitionCreation(comp, 'U_ADMIN');
    assert.equal(adminCompConfirm.channel, 'C_MELDUNGEN_ADMIN');
    assert.ok(adminCompConfirm.text.includes('<@U_ADMIN>'));

    const adminRegConfirm =
      controller.getAdminConfirmMessageCompetitionRegistration(regData);
    assert.equal(adminRegConfirm.channel, 'C_MELDUNGEN_ADMIN');
    assert.equal(adminRegConfirm.blocks.length, 3);
  });
});
