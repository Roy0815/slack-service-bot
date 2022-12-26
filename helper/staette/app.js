const views = require("./views");

function setupApp(app) {
  //******************** Commands ********************//
  app.command(`/weristda`, async ({ command, ack, client }) => {
    await ack();
    await client.chat.postMessage(views.getWhoIsThereMessage(command));
  });

  //******************** Actions ********************//
  app.action(
    new RegExp(`action-whoisthere-(update)*(delete)*`),
    async ({ ack, action, respond, body }) => {
      await ack();
      await respond(
        views.updateWhoIsThereMessage(
          {
            user: body.user.id,
            time: body.state.values[views.whoIsThereInputBlockName][
              views.whoIsThereTimePickerName
            ].selected_time,
            xdelete: action.value == "delete" ? true : false,
          },
          body.message
        )
      );
    }
  );
}

//******************** Exports ********************//
module.exports = {
  setupApp,
};