import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as constants from '../../src/pollz/constants.js';
import { SlackViewSubmissionError } from '../../src/general/types.js';
import * as controller from '../../src/pollz/controller.js';

describe('pollz/controller', () => {
  it('getChannelFromView extracts selected conversation', () => {
    const viewAction = {
      view: {
        state: {
          values: {
            [constants.creationModalBlocks.conversationSelect]: {
              [constants.creationModalActions.conversationSelect]: {
                selected_conversation: 'C_POLL_CH'
              }
            }
          }
        }
      }
    };

    assert.equal(
      controller.getChannelFromView(/** @type {any} */ (viewAction)),
      'C_POLL_CH'
    );
  });

  it('getPollsView returns modal view with initial question text', () => {
    const result = controller.getPollsView({
      trigger_id: 'trig-1',
      text: 'Pizza heute?'
    });
    assert.equal(result.trigger_id, 'trig-1');
    const firstBlock = /** @type {any} */ (result.view.blocks[0]);
    assert.equal(firstBlock.element.initial_value, 'Pizza heute?');
  });

  it('addAnswer and deleteAnswer manage answer blocks in modal', () => {
    const initialModal = controller.getPollsView({
      trigger_id: 'trig-1',
      text: 'Frage'
    }).view;

    const added1 = controller.addAnswer(
      /** @type {any} */ ({
        id: 'V1',
        hash: 'H1',
        blocks: initialModal.blocks,
        state: {
          values: {
            [constants.creationModalBlocks.newAnswer]: {
              [constants.creationModalActions.newAnswerInput]: {
                value: 'Option A'
              }
            }
          }
        }
      })
    );

    const added2 = controller.addAnswer(
      /** @type {any} */ ({
        id: 'V1',
        hash: 'H2',
        blocks: added1.view.blocks,
        state: {
          values: {
            [constants.creationModalBlocks.newAnswer]: {
              [constants.creationModalActions.newAnswerInput]: {
                value: 'Option B'
              }
            }
          }
        }
      })
    );

    const answerBlocks = added2.view.blocks.filter(
      (b) =>
        /** @type {any} */ (b).accessory?.action_id ===
        constants.creationModalActions.deleteSingleAnswer
    );
    assert.equal(answerBlocks.length, 2);

    // Delete first answer
    const firstValue = /** @type {any} */ (answerBlocks[0]).accessory.value;
    const afterSingleDelete = controller.deleteAnswer(
      /** @type {any} */ ({
        id: 'V1',
        hash: 'H3',
        blocks: added2.view.blocks
      }),
      /** @type {any} */ ({ value: firstValue })
    );

    const remainingAfterSingle = afterSingleDelete.view.blocks.filter(
      (b) =>
        /** @type {any} */ (b).accessory?.action_id ===
        constants.creationModalActions.deleteSingleAnswer
    );
    assert.equal(remainingAfterSingle.length, 1);

    // Delete all answers
    const afterAllDelete = controller.deleteAnswer(
      /** @type {any} */ ({
        id: 'V1',
        hash: 'H4',
        blocks: afterSingleDelete.view.blocks
      }),
      /** @type {any} */ ({ value: 'all' })
    );
    const remainingAfterAll = afterAllDelete.view.blocks.filter(
      (b) =>
        /** @type {any} */ (b).accessory?.action_id ===
        constants.creationModalActions.deleteSingleAnswer
    );
    assert.equal(remainingAfterAll.length, 0);
  });

  it('answerOptionsValid checks if answers exist or adding answers is allowed', () => {
    const emptyModal = controller.getPollsView({
      trigger_id: 't',
      text: 'Q'
    }).view;
    emptyModal.state = {
      values: {
        [constants.creationModalBlocks.options]: {
          [constants.creationModalActions.options]: {
            selected_options: []
          }
        }
      }
    };

    assert.equal(
      controller.answerOptionsValid(/** @type {any} */ ({ view: emptyModal })),
      false
    );

    // Allow adding options
    emptyModal.state.values[constants.creationModalBlocks.options][
      constants.creationModalActions.options
    ].selected_options = [{ value: constants.optionCheckboxes.addAllowed }];

    assert.equal(
      controller.answerOptionsValid(/** @type {any} */ ({ view: emptyModal })),
      true
    );
  });

  it('getPollMessage builds poll message and vote updates votes correctly', () => {
    const baseModal = controller.getPollsView({
      trigger_id: 't',
      text: 'Wann Training?'
    }).view;

    const withAnswer1 = controller.addAnswer(
      /** @type {any} */ ({
        id: 'V1',
        hash: 'H1',
        blocks: baseModal.blocks,
        state: {
          values: {
            [constants.creationModalBlocks.newAnswer]: {
              [constants.creationModalActions.newAnswerInput]: {
                value: 'Montag'
              }
            }
          }
        }
      })
    ).view;

    const withAnswer2 = controller.addAnswer(
      /** @type {any} */ ({
        id: 'V1',
        hash: 'H2',
        blocks: withAnswer1.blocks,
        state: {
          values: {
            [constants.creationModalBlocks.newAnswer]: {
              [constants.creationModalActions.newAnswerInput]: {
                value: 'Mittwoch'
              }
            }
          }
        }
      })
    ).view;

    withAnswer2.state = {
      values: {
        [constants.creationModalBlocks.question]: {
          [constants.creationModalActions.questionInput]: {
            value: 'Wann Training?'
          }
        },
        [constants.creationModalBlocks.conversationSelect]: {
          [constants.creationModalActions.conversationSelect]: {
            selected_conversation: 'C_TRAIN'
          }
        },
        [constants.creationModalBlocks.options]: {
          [constants.creationModalActions.options]: {
            selected_options: [] // single choice, non-anon, no addAllowed
          }
        }
      }
    };

    const pollMsg = controller.getPollMessage(
      /** @type {any} */ ({
        user: { id: 'U_CREATOR' },
        view: withAnswer2
      })
    );

    assert.equal(pollMsg.channel, 'C_TRAIN');
    assert.equal(pollMsg.text, 'Wann Training?');

    // User U1 votes for option 0 (Montag)
    const afterVote1 = controller.vote(
      /** @type {any} */ ({
        message: { text: pollMsg.text, blocks: pollMsg.blocks },
        user: { id: 'U1' }
      }),
      /** @type {any} */ ({ value: '0' })
    );

    const opt0Context = /** @type {any} */ (afterVote1.blocks[4]);
    assert.ok(opt0Context.elements[0].text.includes('<@U1>'));
    assert.ok(opt0Context.elements[0].text.includes('1 Stimme'));

    // Single select: U1 votes for option 1 (Mittwoch) -> removed from option 0
    const afterVote2 = controller.vote(
      /** @type {any} */ ({
        message: { text: afterVote1.text, blocks: afterVote1.blocks },
        user: { id: 'U1' }
      }),
      /** @type {any} */ ({ value: '1' })
    );

    assert.equal(
      /** @type {any} */ (afterVote2.blocks[4]).elements[0].text,
      'Keine Stimmen'
    );
    assert.ok(
      /** @type {any} */ (afterVote2.blocks[6]).elements[0].text.includes(
        '<@U1>'
      )
    );

    // Delete all votes of U1 (action undefined)
    const afterClear = controller.vote(
      /** @type {any} */ ({
        message: { text: afterVote2.text, blocks: afterVote2.blocks },
        user: { id: 'U1' }
      }),
      undefined
    );
    assert.equal(
      /** @type {any} */ (afterClear.blocks[6]).elements[0].text,
      'Keine Stimmen'
    );
  });

  it('getAddAnswerView and addAnswerMessage append an answer to existing poll & getHomeView works', () => {
    assert.ok(Array.isArray(controller.getHomeView()));

    const openArgs = controller.getAddAnswerView(
      /** @type {any} */ ({
        trigger_id: 'trig-add',
        channel: { id: 'C123' },
        message: { ts: '170000.001' }
      })
    );
    assert.equal(openArgs.view.private_metadata, 'C123-170000.001');

    const baseBlocks = [
      { type: 'section', text: { type: 'mrkdwn', text: 'Header' } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: 'nicht Anonym' }] },
      { type: 'divider' },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*Opt 1*' },
        accessory: { type: 'button', value: '0' }
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: 'Keine Stimmen' }]
      },
      { type: 'divider' },
      { type: 'actions', elements: [] }
    ];

    const updated = controller.addAnswerMessage(
      /** @type {any} */ ({
        private_metadata: 'C123-170000.001',
        state: {
          values: {
            [constants.creationModalBlocks.newAnswer]: {
              [constants.pollMessageActions.addAnswerViewTextInput]: {
                value: 'Opt 2'
              }
            }
          }
        }
      }),
      /** @type {any} */ ({ blocks: baseBlocks })
    );

    assert.equal(updated.channel, 'C123');
    assert.equal(updated.ts, '170000.001');
    assert.equal(updated.blocks.length, 9);
  });

  it('validateInputs throws SlackViewSubmissionError when invalid or bot cannot join channel', async () => {
    const validViewBody = {
      view: {
        blocks: [
          {
            type: 'section',
            accessory: {
              action_id: constants.creationModalActions.deleteSingleAnswer
            }
          }
        ],
        state: {
          values: {
            [constants.creationModalBlocks.conversationSelect]: {
              [constants.creationModalActions.conversationSelect]: {
                selected_conversation: 'C_PRIV'
              }
            }
          }
        }
      }
    };

    const privateChannelClient = {
      conversations: {
        list: async () => ({
          channels: [{ id: 'C_PRIV', is_member: false, is_channel: false }]
        })
      }
    };

    await assert.rejects(
      async () => {
        await controller.validateInputs(
          /** @type {any} */ (validViewBody),
          /** @type {any} */ (privateChannelClient)
        );
      },
      (err) => err instanceof SlackViewSubmissionError
    );

    // Succeeds if bot joins public channel
    const publicJoinableClient = {
      conversations: {
        list: async () => ({
          channels: [{ id: 'C_PRIV', is_member: false, is_channel: true }]
        }),
        join: async () => ({ ok: true })
      }
    };

    await assert.doesNotReject(async () => {
      await controller.validateInputs(
        /** @type {any} */ (validViewBody),
        /** @type {any} */ (publicJoinableClient)
      );
    });
  });
});
