//imports
const util = require("../general/util");
const views = require("./views");

function setupApp(app) {
  //******************** Commands ********************//
  app.command(`/test`, async ({ command, ack, client, respond }) => {
    await ack();

    //open modal
    await client.views.open(views.getPollsView(command));
  });

  //******************** Actions ********************//
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
    async ({ ack, action, client, body }) => {
      await ack();

      await client.views.update(views.deleteAnswer(body.view, action));
    }
  );

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
}

//******************** Exports ********************//
module.exports = {
  setupApp,
};
