// local imports
import * as controller from './controller.js';
import * as constants from './constants.js';
// import * as util from '../general/util.js';
import { SlackViewSubmissionError } from '../general/types.js';

import * as awsRtAPI from '../general/aws-runtime-api.js';

/** @type {import('../general/types.js').appComponent} */
export const pollzApp = { setupApp, getHomeView: controller.getHomeView };

/**
 * @param {import("@slack/bolt").App} app
 */
function setupApp(app) {
  //* ******************* Commands ********************//
  app.command('/umfrage', async ({ command, ack, client }) => {
    await ack();

    // open modal
    await client.views.open(controller.getPollsView(command));
  });

  //* ******************* Actions ********************//
  app.action(constants.homeViewCommand, async ({ ack, client, body }) => {
    await ack();

    // open modal
    await client.views.open(
      controller.getPollsView(
        /** @type {import('@slack/bolt').BlockAction} */ (body)
      )
    );
  });

  // add answer to question in creation modal
  app.action(
    constants.creationModalActions.addAnswer,
    async ({ ack, client, body }) => {
      await ack();

      const action =
        /** @type {import('@slack/bolt').BlockButtonAction} */
        (body);

      // do nothing if answer text is empty
      if (
        action.view.state.values[constants.creationModalBlocks.newAnswer][
          constants.creationModalActions.newAnswerInput
        ].value == null
      ) {
        return;
      }

      await client.views.update(controller.addAnswer(action.view));
    }
  );

  // delete single or all answers
  app.action(
    new RegExp(
      `^(${constants.creationModalActions.deleteSingleAnswer})*(${constants.creationModalActions.deleteAllAnswers})*$`
    ),
    async ({ ack, action, body, client }) => {
      await ack();

      await client.views.update(
        controller.deleteAnswer(
          /** @type {import('@slack/bolt').BlockButtonAction} */ (body).view,
          /** @type {import('@slack/bolt').ButtonAction } */ (action)
        )
      );
    }
  );

  // Vote / remove vote
  app.action(
    constants.pollMessageActions.voteButton,
    async ({ ack, action, body, respond }) => {
      await ack();

      await respond(
        controller.vote(
          /** @type {import('@slack/bolt').BlockButtonAction} */ (body),
          /** @type {import('@slack/bolt').ButtonAction } */ (action)
        )
      );
    }
  );

  // delete all votes of current user
  app.action(
    constants.pollMessageActions.deleteAnswer,
    async ({ ack, body, respond }) => {
      await ack();

      await respond(
        controller.vote(
          /** @type {import('@slack/bolt').BlockButtonAction} */ (body)
        )
      );
    }
  );

  // options from the overflow menu
  app.action(
    constants.pollMessageActions.overflow,
    async ({ ack, body, respond, action, client }) => {
      await ack();

      const overflowAction =
        /** @type {import('@slack/bolt').OverflowAction } */ (action);

      // if poll should be deleted, check if requestor has clicked the button
      if (
        !overflowAction.selected_option ||
        overflowAction.selected_option.value.split('-')[0] !==
          constants.pollMessageActions.overflowDelete ||
        overflowAction.selected_option.value.split('-')[1] !== body.user.id
      ) {
        await client.chat.postEphemeral({
          token: process.env.SLACK_BOT_TOKEN,
          channel: body.channel.id,
          text: 'Du bist nicht der Fragesteller',
          user: body.user.id
        });
        return;
      }

      await respond({ delete_original: true });
    }
  );

  // add an answer option to the poll after it was already posted
  app.action(
    constants.pollMessageActions.addAnswer,
    async ({ ack, client, body }) => {
      await ack();

      await client.views.open(
        controller.getAddAnswerView(
          /** @type {import('@slack/bolt').BlockButtonAction} */ (body)
        )
      );
    }
  );

  //* ******************* View Submissions ********************//
  app.view(constants.viewNames.creationModal, async ({ body, ack, client }) => {
    // validate user inputs
    try {
      await controller.validateInputs(body, client);
    } catch (error) {
      if (error instanceof SlackViewSubmissionError) {
        await ack(error.getAckObject());
        return;
      }
      throw error;
    }

    await ack();

    // already send HTTP 200 that slack does not time out
    await awsRtAPI.sendResponse();

    // send poll
    await client.chat.postMessage(controller.getPollMessage(body));
  });

  // add answer to already posted poll
  app.view(
    constants.viewNames.addAnswerModal,
    async ({ view, ack, client }) => {
      await ack();

      // get source message
      const result = await client.conversations.history({
        token: process.env.SLACK_BOT_TOKEN,
        channel: view.private_metadata.split('-')[0],
        latest: view.private_metadata.split('-')[1],
        inclusive: true,
        limit: 1
      });

      await client.chat.update(
        controller.addAnswerMessage(view, result.messages[0])
      );
    }
  );
}
