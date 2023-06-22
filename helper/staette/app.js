// imports
const util = require('../general/util');
const views = require('./views');
const functions = require('./functions');

function setupApp (app) {
  //* ******************* Commands ********************//
  app.command('/weristda', async ({ command, ack, client, respond }) => {
    await ack();

    // Datum validieren falls eingegeben
    if (command.text === '') command.text = util.formatDate(new Date());
    else {
      const dateArr = command.text.split('.');

      const date = new Date(dateArr[2], dateArr[1] - 1, dateArr[0]);

      if (
        dateArr.length !== 3 ||
        isNaN(date.getFullYear()) ||
        !/^[0-3]\d\.[0-1]\d\.20[2-9]\d$/.test(command.text)
      ) {
        respond('Bitte ein gültiges Datum im Format DD.MM.YYYY eingeben');
        return;
      }

      if (date < new Date()) {
        respond('Bitte ein Datum >= heute angeben');
        return;
      }
    }

    if (!(await functions.dateIsUnique({ client, date: command.text }))) {
      respond(`Für das Datum ${command.text} existiert bereits eine Abfrage`);
      return;
    }

    await client.chat.postMessage(views.getWhoIsThereMessage(command));

    await functions.sortMessages({ client, date: command.text });
  });

  //* ******************* Actions ********************//
  app.action(views.homeViewCommand, async ({ ack, body, client }) => {
    await ack();

    let date =
      body.view.state.values[views.homeViewInputBlockId][
        views.homeViewDatePickerAction
      ].selected_date;

    if (date != null) {
      date = new Date(
        date.split('-')[0],
        date.split('-')[1] - 1,
        date.split('-')[2]
      );

      if (date < new Date()) {
        client.chat.postMessage({
          channel: body.user.id,
          text: `*Stätte Abfrage*\nDatum ${util.formatDate(
            date
          )} liegt in der Vergangenheit. Bitte ein Datum >= heute angeben`
        });
        return;
      }

      date = util.formatDate(date);
    } else date = util.formatDate(new Date());

    if (!(await functions.dateIsUnique({ client, date }))) {
      client.chat.postMessage({
        channel: body.user.id,
        text: `*Stätte Abfrage*\nFür das Datum ${date} existiert bereits eine Abfrage`
      });
      return;
    }

    await client.chat.postMessage(
      views.getWhoIsThereMessage({ user_id: body.user.id, text: date })
    );

    await functions.sortMessages({ client, date });
  });

  app.action(
    // eslint-disable-next-line prefer-regex-literals
    new RegExp('staette-whoisthere-(update)*(delete)*'),
    async ({ ack, action, respond, body }) => {
      await ack();
      await respond(
        views.updateWhoIsThereMessage(
          {
            user: body.user.id,
            time: body.state.values[views.whoIsThereInputBlockName][
              views.whoIsThereTimePickerName
            ].selected_time,
            xdelete: action.value === 'delete'
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
        action.selected_option.value.split('-')[0] !==
          views.messageOverflowDelete ||
        action.selected_option.value.split('-')[1] !== body.user.id
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
}

//* ******************* Exports ********************//
module.exports = {
  setupApp
};
