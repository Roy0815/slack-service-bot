//imports
const util = require("../general/util");
const views = require("./views");

function setupApp(app) {
  //******************** Commands ********************//
  app.command(`/weristda`, async ({ command, ack, client, respond }) => {
    await ack();

    //Datum validieren falls eingegeben
    if (command.text != "") {
      let dateArr = command.text.split(".");
      dateArr[0] = parseInt(dateArr[0]);
      dateArr[1] = parseInt(dateArr[1]) - 1;
      dateArr[2] = parseInt(dateArr[2]);

      let date = new Date(dateArr[2], dateArr[1], dateArr[0]);

      if (dateArr.length != 3 || date.getFullYear() == NaN) {
        respond("Bitte ein gültiges Datum eingeben");
        return;
      }
    } else command.text = util.formatDate(new Date());

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
