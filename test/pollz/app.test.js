import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createMockBoltApp } from '../helpers/mocks.js';
import { pollzApp } from '../../src/pollz/app.js';
import * as constants from '../../src/pollz/constants.js';
import * as controller from '../../src/pollz/controller.js';

describe('pollz/app', () => {
  const app = createMockBoltApp();
  pollzApp.setupApp(/** @type {any} */ (app));

  beforeEach(() => {
    app.resetClient();
  });

  it('/umfrage command and homeViewCommand open the poll creation modal', async () => {
    await app.getCommand('/umfrage')({
      ack: mock.fn(async () => {}),
      command: { trigger_id: 'T1', text: 'Frage?' },
      client: app.client
    });
    assert.equal(app.client.views.open.mock.callCount(), 1);

    await app.getAction(constants.homeViewCommand)({
      ack: mock.fn(async () => {}),
      body: { trigger_id: 'T2' },
      client: app.client
    });
    assert.equal(app.client.views.open.mock.callCount(), 2);
  });

  it('addAnswer and deleteAnswer actions update modal views', async () => {
    const addFn = app.getAction(constants.creationModalActions.addAnswer);
    const modal = controller.getPollsView({ trigger_id: 'T1', text: 'Q' }).view;

    // Empty input -> ignored
    await addFn({
      ack: mock.fn(async () => {}),
      client: app.client,
      body: {
        view: {
          ...modal,
          state: {
            values: {
              [constants.creationModalBlocks.newAnswer]: {
                [constants.creationModalActions.newAnswerInput]: { value: null }
              }
            }
          }
        }
      }
    });
    assert.equal(app.client.views.update.mock.callCount(), 0);

    // Non-empty input -> updates view
    await addFn({
      ack: mock.fn(async () => {}),
      client: app.client,
      body: {
        view: {
          ...modal,
          id: 'V1',
          hash: 'H1',
          state: {
            values: {
              [constants.creationModalBlocks.newAnswer]: {
                [constants.creationModalActions.newAnswerInput]: {
                  value: 'Ja'
                }
              }
            }
          }
        }
      }
    });
    assert.equal(app.client.views.update.mock.callCount(), 1);

    // Delete all answers
    const delFn = app.getAction(
      constants.creationModalActions.deleteAllAnswers
    );
    await delFn({
      ack: mock.fn(async () => {}),
      client: app.client,
      action: { value: 'all' },
      body: { view: { id: 'V1', hash: 'H2', blocks: modal.blocks } }
    });
    assert.equal(app.client.views.update.mock.callCount(), 2);
  });

  it('voteButton, deleteAnswer, addAnswer, and overflow actions work as expected', async () => {
    const baseModal = controller.addAnswer(
      /** @type {any} */ ({
        id: 'V1',
        hash: 'H1',
        blocks: controller.getPollsView({ trigger_id: 'T', text: 'Q' }).view
          .blocks,
        state: {
          values: {
            [constants.creationModalBlocks.newAnswer]: {
              [constants.creationModalActions.newAnswerInput]: { value: 'Ja' }
            }
          }
        }
      })
    ).view;
    baseModal.state = {
      values: {
        [constants.creationModalBlocks.question]: {
          [constants.creationModalActions.questionInput]: { value: 'Q?' }
        },
        [constants.creationModalBlocks.conversationSelect]: {
          [constants.creationModalActions.conversationSelect]: {
            selected_conversation: 'C1'
          }
        },
        [constants.creationModalBlocks.options]: {
          [constants.creationModalActions.options]: { selected_options: [] }
        }
      }
    };
    const pollMsg = controller.getPollMessage(
      /** @type {any} */ ({ user: { id: 'U_CREATOR' }, view: baseModal })
    );

    const respond = mock.fn(async () => {});
    await app.getAction(constants.pollMessageActions.voteButton)({
      ack: mock.fn(async () => {}),
      action: { value: '0' },
      body: {
        user: { id: 'U1' },
        message: { text: pollMsg.text, blocks: pollMsg.blocks }
      },
      respond
    });
    assert.equal(respond.mock.callCount(), 1);

    await app.getAction(constants.pollMessageActions.deleteAnswer)({
      ack: mock.fn(async () => {}),
      body: {
        user: { id: 'U1' },
        message: { text: pollMsg.text, blocks: pollMsg.blocks }
      },
      respond
    });
    assert.equal(respond.mock.callCount(), 2);

    // Open add-answer modal from message
    await app.getAction(constants.pollMessageActions.addAnswer)({
      ack: mock.fn(async () => {}),
      client: app.client,
      body: {
        trigger_id: 'T_ADD',
        channel: { id: 'C1' },
        message: { ts: '111.222' }
      }
    });
    assert.equal(app.client.views.open.mock.callCount(), 1);

    // Overflow non-creator vs creator
    const overflowFn = app.getAction(constants.pollMessageActions.overflow);
    await overflowFn({
      ack: mock.fn(async () => {}),
      client: app.client,
      respond,
      body: { user: { id: 'U_OTHER' }, channel: { id: 'C1' } },
      action: { selected_option: { value: 'delete-U_CREATOR' } }
    });
    assert.equal(app.client.chat.postEphemeral.mock.callCount(), 1);

    await overflowFn({
      ack: mock.fn(async () => {}),
      client: app.client,
      respond,
      body: { user: { id: 'U_CREATOR' }, channel: { id: 'C1' } },
      action: { selected_option: { value: 'delete-U_CREATOR' } }
    });
    assert.equal(respond.mock.callCount(), 3);
  });

  it('creationModal and addAnswerModal view submissions validate and post/update', async () => {
    const creationFn = app.getView(constants.viewNames.creationModal);

    // Invalid (no answers and addAllowed unchecked) -> ack with error object
    const emptyModal = controller.getPollsView({
      trigger_id: 'T',
      text: 'Q'
    }).view;
    emptyModal.state = {
      values: {
        [constants.creationModalBlocks.options]: {
          [constants.creationModalActions.options]: { selected_options: [] }
        }
      }
    };
    const ackErr = mock.fn(async () => {});
    await creationFn({
      ack: ackErr,
      client: app.client,
      body: { user: { id: 'U1' }, view: emptyModal }
    });
    assert.equal(ackErr.mock.calls[0].arguments[0].response_action, 'errors');

    // Valid -> posts poll message
    emptyModal.state.values[constants.creationModalBlocks.options][
      constants.creationModalActions.options
    ].selected_options = [{ value: constants.optionCheckboxes.addAllowed }];
    emptyModal.state.values[constants.creationModalBlocks.question] = {
      [constants.creationModalActions.questionInput]: { value: 'Q?' }
    };
    emptyModal.state.values[constants.creationModalBlocks.conversationSelect] =
      {
        [constants.creationModalActions.conversationSelect]: {
          selected_conversation: 'C1'
        }
      };
    app.client.conversations.list.mock.mockImplementation(async () => ({
      channels: [{ id: 'C1', is_member: true }]
    }));

    const ackOk = mock.fn(async () => {});
    await creationFn({
      ack: ackOk,
      client: app.client,
      body: { user: { id: 'U1' }, view: emptyModal }
    });
    assert.equal(app.client.chat.postMessage.mock.callCount(), 1);

    // addAnswerModal submission -> fetches message & calls chat.update
    app.client.conversations.history.mock.mockImplementation(async () => ({
      messages: [{ blocks: [{ type: 'divider' }, { type: 'actions' }] }]
    }));
    await app.getView(constants.viewNames.addAnswerModal)({
      ack: mock.fn(async () => {}),
      client: app.client,
      view: {
        private_metadata: 'C1-123.456',
        state: {
          values: {
            [constants.creationModalBlocks.newAnswer]: {
              [constants.pollMessageActions.addAnswerViewTextInput]: {
                value: 'Option X'
              }
            }
          }
        }
      }
    });
    assert.equal(app.client.chat.update.mock.callCount(), 1);
  });
});
