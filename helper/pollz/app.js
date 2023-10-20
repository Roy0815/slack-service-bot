// local imports
import * as views from './views';

/**
 *
 * @param {import("@slack/bolt").App} app
 */
export function setupApp(app) {
  //* ******************* Commands ********************//
  app.command('/umfrage', async ({ command, ack, client }) => {
    await ack();

    // open modal
    await client.views.open(views.getPollsView(command));
  });

  //* ******************* Actions ********************//
  app.action(views.homeViewCommand, async ({ ack, client, body }) => {
    await ack();

    // open modal
    await client.views.open(
      views.getPollsView(
        /** @type {import('@slack/bolt').BlockAction} */ (body)
      )
    );
  });

  app.action(
    views.creationModalActions.addAnswer,
    async ({ ack, client, body }) => {
      await ack();

      const action =
        /** @type {import('@slack/bolt').BlockButtonAction} */
        (body);

      if (
        action.view.state.values[views.creationModalBlocks.newAnswer][
          views.creationModalActions.newAnswerInput
        ].value == null
      ) {
        return;
      }

      await client.views.update(views.addAnswer(action.view));
    }
  );

  app.action(
    new RegExp(
      `^(${views.creationModalActions.deleteSingleAnswer})*(${views.creationModalActions.deleteAllAnswers})*$`
    ),
    async ({ ack, action, body, client }) => {
      await ack();

      await client.views.update(
        views.deleteAnswer(
          /** @type {import('@slack/bolt').BlockButtonAction} */ (body).view,
          /** @type {import('@slack/bolt').ButtonAction } */ (action)
        )
      );
    }
  );

  app.action(
    views.pollMessageActions.voteButton,
    async ({ ack, action, body, respond }) => {
      await ack();

      await respond(
        views.vote(
          /** @type {import('@slack/bolt').BlockButtonAction} */ (body),
          /** @type {import('@slack/bolt').ButtonAction } */ (action)
        )
      );
    }
  );

  app.action(
    views.pollMessageActions.deleteAnswer,
    async ({ ack, body, respond }) => {
      await ack();

      await respond(
        views.vote(
          /** @type {import('@slack/bolt').BlockButtonAction} */ (body)
        )
      );
    }
  );

  app.action(
    views.pollMessageActions.overflow,
    async ({ ack, body, respond, action, client }) => {
      await ack();

      const overflowAction =
        /** @type {import('@slack/bolt').OverflowAction } */ (action);

      if (
        !overflowAction.selected_option ||
        overflowAction.selected_option.value.split('-')[0] !==
          views.pollMessageActions.overflowDelete ||
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

  app.action(
    views.pollMessageActions.addAnswer,
    async ({ ack, client, body }) => {
      await ack();

      client.views.open(
        views.getAddAnswerView(
          /** @type {import('@slack/bolt').BlockButtonAction} */ (body)
        )
      );
    }
  );

  //* ******************* View Submissions ********************//
  app.view(views.viewNames.creationModal, async ({ body, ack, client }) => {
    if (!views.answerOptionsValid(body)) {
      await ack({
        response_action: 'errors',
        errors: {
          [views.creationModalBlocks.newAnswer]:
            'Bitte Antwortmöglichkeiten eingeben oder hinzufügen erlauben'
        }
      });
      return;
    }

    await ack();

    // send poll
    await client.chat.postMessage(views.getPollMessage(body));
  });

  app.view(views.viewNames.addAnswerModal, async ({ view, ack, client }) => {
    await ack();

    // get source message
    const result = await client.conversations.history({
      token: process.env.SLACK_BOT_TOKEN,
      channel: view.private_metadata.split('-')[0],
      latest: view.private_metadata.split('-')[1],
      inclusive: true,
      limit: 1
    });

    await client.chat.update(views.addAnswerMessage(view, result.messages[0]));
  });
}
