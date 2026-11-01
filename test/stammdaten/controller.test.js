import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as constants from '../../src/stammdaten/constants.js';
import { setupGoogleSheetsMock } from '../helpers/mocks.js';

const sheetsMock = setupGoogleSheetsMock();

const { masterdataService } = await import(
  '../../src/general/masterdata/service.js'
);
const controller = await import('../../src/stammdaten/controller.js');

const sampleContactCard = {
  firstname: 'Max',
  lastname: 'Mustermann',
  email: 'max@example.com',
  phone: '+49123456',
  street: 'Alte Str.',
  houseNumber: '1',
  city: 'Mannheim',
  zip: '68159'
};

describe('stammdaten/controller', () => {
  beforeEach(() => {
    sheetsMock.resetAll();
    const adminRow = Array(15).fill('');
    adminRow[14] = 'C_STAMMDATEN_ADMIN';
    sheetsMock.valuesGet.mock.mockImplementation(async () => ({
      data: { values: [adminRow] }
    }));
  });

  it('getHomeView returns stammdaten home view blocks', () => {
    const view = controller.getHomeView();
    assert.ok(Array.isArray(view));
    assert.equal(view.length, 3);
  });

  it('getChangeMasterdataView populates placeholders from user contact card', async (t) => {
    t.mock.method(
      masterdataService,
      'getUserContactCardFromId',
      async () => sampleContactCard
    );

    const view = await controller.getChangeMasterdataView('U_MAX');
    const firstInput = /** @type {any} */ (view.blocks[1]);
    assert.equal(firstInput.element.placeholder.text, 'Max');
  });

  it('buildMaintainObject extracts values and throws when all fields are empty', () => {
    const makeStateValues = (overrides = {}) => {
      const values = {};
      Object.keys(constants.changeMasterdataViewBlocks).forEach((key) => {
        values[constants.changeMasterdataViewBlocks[key]] = {
          [constants.changeMasterdataViewActions[key]]: {
            value: overrides[key] ?? ''
          }
        };
      });
      return values;
    };

    assert.throws(
      () =>
        controller.buildMaintainObject(
          /** @type {any} */ ({
            user: { id: 'U_MAX' },
            view: { state: { values: makeStateValues() } }
          })
        ),
      /Bitte mindestens einen Wert füllen vorm Speichern/
    );

    const maintObj = controller.buildMaintainObject(
      /** @type {any} */ ({
        user: { id: 'U_MAX' },
        view: {
          state: { values: makeStateValues({ street: 'Neue Str.' }) }
        }
      })
    );
    assert.equal(maintObj.slackId, 'U_MAX');
    assert.equal(maintObj.street, 'Neue Str.');
  });

  it('getChangesMessage and getMaintainConfirmDialog format diff and admin dialog', async (t) => {
    t.mock.method(
      masterdataService,
      'getUserContactCardFromId',
      async () => sampleContactCard
    );

    const maintObj = {
      slackId: 'U_MAX',
      street: 'Neue Str.',
      city: 'Mannheim' // unchanged -> should not appear in diff
    };

    const changesMsg = await controller.getChangesMessage(maintObj);
    assert.ok(
      changesMsg.includes('`Straße`: Alte Str. :arrow_right: Neue Str.')
    );
    assert.ok(!changesMsg.includes('Stadt'));

    const dialog = await controller.getMaintainConfirmDialog(
      maintObj,
      changesMsg
    );
    assert.equal(dialog.channel, 'C_STAMMDATEN_ADMIN');
    assert.ok(dialog.text.includes('<@U_MAX>'));
    assert.ok(dialog.text.includes('Neue Str.'));
  });
});
