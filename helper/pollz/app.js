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
  app.action("pollz-add-answer", async ({ ack, client, body }) => {
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
    new RegExp(`^pollz-delete-(single)*(all)*-answer$`),
    async ({ ack, action, client, respond, body }) => {
      await ack();

      await client.views.update(views.deleteAnswer(body.view, action));
    }
  );

  //******************** View Submissions ********************//
  app.view(views.pollViewName, async ({ body, ack, client }) => {
    await ack();

    //send poll
    await client.chat.postMessage(views.getPollMessage(body));
  });
}

//******************** Exports ********************//
module.exports = {
  setupApp,
};
