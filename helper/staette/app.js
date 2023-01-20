//imports
const util = require("../general/util");
const views = require("./views");
const functions = require("./functions");

function setupApp(app) {
  //******************** Commands ********************//
  app.command(`/weristda`, async ({ command, ack, client, respond }) => {
    await ack();

    //Datum validieren falls eingegeben
    if (command.text != "") {
      let dateArr = command.text.split(".");

      let date = new Date(dateArr[2], dateArr[1] - 1, dateArr[0]);

      if (
        dateArr.length != 3 ||
        date.getFullYear() == NaN ||
        date < new Date()
      ) {
        respond("Bitte ein gültiges Datum im Format DD.MM.YYYY eingeben");
        return;
      }
    } else command.text = util.formatDate(new Date());

    await client.chat.postMessage(views.getWhoIsThereMessage(command));

    //await functions.sortMessages(client);
  });

  //******************** Actions ********************//
  app.action(views.homeViewCommand, async ({ ack, body, client }) => {
    await ack();

    let date =
      body.view.state.values[views.homeViewInputBlockId][
        views.homeViewDatePickerAction
      ].selected_date;

    if (date != null) {
      date = new Date(
        date.split("-")[0],
        date.split("-")[1] - 1,
        date.split("-")[2]
      );

      if (date < new Date()) {
        client.chat.postMessage({
          channel: body.user.id,
          text: `*Stätte Abfrage*\nDatum ${util.formatDate(
            date
          )} liegt in der Vergangenheit. Bitte ein Datum größer heute eingeben.`,
        });
        return;
      }

      date = util.formatDate(date);
    } else date = util.formatDate(new Date());

    await client.chat.postMessage(
      views.getWhoIsThereMessage({ user_id: body.user.id, text: date })
    );

    //await functions.sortMessages(client);
  });

  app.action(
    new RegExp(`staette-whoisthere-(update)*(delete)*`),
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
}

//******************** Exports ********************//
module.exports = {
  setupApp,
};
