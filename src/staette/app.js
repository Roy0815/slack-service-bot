// imports
import * as util from '../../general/util.js';
import * as views from './views.js';
import * as functions from './functions.js';

/** @type {import('../../general/types.js').appComponent} */
export const staetteApp = { setupApp, getHomeView: views.getHomeView };

/**
 * @param {import("@slack/bolt").App} app
 */
export function setupApp(app) {
  //* ******************* Commands ********************//
  app.command('/weristda', async ({ command, ack, client, respond }) => {
    await ack();

    // Datum validieren falls eingegeben
    if (command.text === '') command.text = util.formatDate(new Date());
    else {
      const dateArr = command.text.split('.');
      const date = new Date(
        Number(dateArr[2]),
        Number(dateArr[1]) - 1,
        Number(dateArr[0])
      );

      if (
        dateArr.length !== 3 ||
        isNaN(date.getFullYear()) ||
        !/^[0-3]\d\.[0-1]\d\.20[2-9]\d$/.test(command.text)
      ) {
        await respond('Bitte ein gültiges Datum im Format DD.MM.YYYY eingeben');
        return;
      }

      // @ts-ignore
      if (date < new Date().setHours(0, 0, 0, 0)) {
        await respond('Bitte ein Datum >= heute angeben');
        return;
      }
    }

    if (!(await functions.dateIsUnique({ client, date: command.text }))) {
      await respond(
        `Für das Datum ${command.text} existiert bereits eine Abfrage`
      );
      return;
    }

    await client.chat.postMessage(views.getWhoIsThereMessage(command));

    await functions.sortMessages({ client, date: command.text });
  });

  //* ******************* Actions ********************//
  app.action(views.homeViewCommand, async ({ ack, body, client }) => {
    await ack();

    let date = /** @type {import('@slack/bolt').BlockAction} */ (body).view
      .state.values[views.homeViewInputBlockId][views.homeViewDatePickerAction]
      .selected_date;

    if (date != null) {
      // datum darf nicht in der Vergangenheit liegen
      const [year, month, day] = date.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1, Number(day));

      date = util.formatDate(dateObj);

      // @ts-ignore
      if (dateObj < new Date().setHours(0, 0, 0, 0)) {
        await client.chat.postMessage({
          channel: body.user.id,
          text: `*Stätte Abfrage*\nDatum ${date} liegt in der Vergangenheit. Bitte ein Datum >= heute angeben`
        });
        return;
      }
    } else date = util.formatDate(new Date());

    if (!(await functions.dateIsUnique({ client, date }))) {
      await client.chat.postMessage({
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

      const blockAction = /** @type {import('@slack/bolt').BlockAction} */ (
        body
      );

      await respond(
        views.updateWhoIsThereMessage(
          {
            user: blockAction.user.id,
            time: blockAction.state.values[views.whoIsThereInputBlockName][
              views.whoIsThereTimePickerName
            ].selected_time,
            xdelete:
              /** @type {import('@slack/bolt').ButtonAction} */ (action)
                .value === 'delete'
          },
          blockAction.message
        )
      );
    }
  );

  app.action(
    views.messageOverflowAction,
    async ({ ack, body, respond, action, client }) => {
      await ack();

      const blockAction = /** @type {import('@slack/bolt').OverflowAction} */ (
        action
      );

      if (
        !blockAction.selected_option ||
        blockAction.selected_option.value.split('-')[0] !==
          views.messageOverflowDelete ||
        blockAction.selected_option.value.split('-')[1] !== body.user.id
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
