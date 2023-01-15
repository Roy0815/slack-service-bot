//imports
const views = require("./views");

function setupApp(app) {
  //******************** Commands ********************//
  app.command(`/test`, async ({ command, ack, client }) => {
    await ack();

    //open modal
    await client.views.open(views.getPollsView(command));
  });

  //******************** Actions ********************//
  app.action(views.homeViewCommand, async ({ ack, client, body }) => {
    await ack();

    //open modal
    await client.views.open(
      views.getPollsView({ trigger_id: body.trigger_id, text: "" })
    );
  });

  app.action(views.addAnswerAction, async ({ ack, client, body }) => {
    await ack();

    if (
      body.view.state.values[views.newAnswerBlockName][
        views.newAnswerInputAction
      ].value == null
    )
      return;

    await client.views.update(views.addAnswer(body.view));
  });

  app.action(
    new RegExp(
      `^(${views.deleteSingleAnswerAction})*(${views.deleteAllAnswerAction})*$`
    ),
    async ({ ack, action, body, client }) => {
      await ack();

      await client.views.update(views.deleteAnswer(body.view, action));
    }
  );

  app.action(views.voteButtonAction, async ({ ack, action, body, respond }) => {
    await ack();

    await respond(views.vote(body, action));
  });

  app.action(
    views.messageDeleteAnswersAction,
    async ({ ack, body, respond }) => {
      await ack();

      await respond(views.vote(body));
    }
  );

  app.action(
    views.messageOverflowAction,
    async ({ ack, body, respond, action, client }) => {
      await ack();

      if (
        !action.selected_option ||
        action.selected_option.value.split("-")[0] !=
          views.messageOverflowDelete ||
        action.selected_option.value.split("-")[1] != body.user.id
      ) {
        await client.chat.postEphemeral({
          token: process.env.SLACK_BOT_TOKEN,
          channel: body.channel.id,
          text: "Du bist nicht der Fragesteller",
          user: body.user.id,
        });
        return;
      }

      await respond({ delete_original: true });
    }
  );

  app.action(views.messageAddAnswerAction, async ({ ack, client, body }) => {
    await ack();

    client.views.open(views.getAddAnswerView(body));
  });

  //******************** View Submissions ********************//
  app.view(views.pollViewName, async ({ body, ack, client }) => {
    //check if answers exist if no adding is allowed
    if (!views.answerOptionsValid(body)) {
      await ack({
        response_action: "errors",
        errors: {
          [views.newAnswerBlockName]:
            "Bitte Antwortmöglichkeiten eingeben oder hinzufügen erlauben",
        },
      });
      return;
    }

    await ack();

    //send poll
    await client.chat.postMessage(views.getPollMessage(body));
  });

  app.view(views.addAnswerViewName, async ({ view, ack, client }) => {
    await ack();

    //get source message
    let result = await client.conversations.history({
      token: process.env.SLACK_BOT_TOKEN,
      channel: view.private_metadata.split("-")[0],
      latest: view.private_metadata.split("-")[1],
      inclusive: true,
      limit: 1,
    });

    await client.chat.update(views.addAnswerMessage(view, result.messages[0]));
  });
}

//******************** Exports ********************//
module.exports = {
  setupApp,
};
