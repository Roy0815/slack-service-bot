//******************** Views ********************//
const homeView = {
  // Use the user ID associated with the event
  user_id: "",
  view: {
    type: "home",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Hallo 👋 Ich bin der Schwerathletik Mannheim Service-Bot.\nIch habe viele nützliche Funktionen:",
        },
      },
      {
        type: "divider",
      },
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Arbeitsstunden",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: '*1️⃣ `/arbeitsstunden_anzeigen` Kommando*:\nHiermit kannst du deine geleisteten Stunden einsehen. Das Kommando ist in allen öffentlichen Channels verfügbar, oder auch in privaten, wenn du den Arbeitsstunden-Bot hinzufügst.\nDu kannst auch andere Jahre einsehen mit `/arbeitsstunden_anzeigen 2022`\nUm alle deine Arbeitseinsätze anzuzeigen, füge "details" hinzu `/arbeitsstunden_anzeigen details`\nEs geht auch eine Kombination `/arbeitsstunden_anzeigen 2022 details`',
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*2️⃣ `/arbeitsstunden_erfassen` Kommando:*\nMit diesem Kommando kannst du geleistete Stunden erfassen. Es wird ein Dialog geöffnet, in dem du die Details mitgeben kannst. Im Anschluss wird die Anfrage zur Genehmigung an den Vorstand weitergeleitet. Sobald dieser genehmigt hat, wirst du benachrichtigt.",
        },
      },
      {
        type: "divider",
      },
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Anwesenheitsabfrage Trainingsstätte",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*`/weristda [DD.MM.YYYY]` Kommando:*\nMit diesem Kommando kannst du eine Abfrage starten wer heute in der Trainingsstätte ist. Die anderen Mitglieder können dann ihre Zeiten einpflegen.\nDu kannst optional ein Datum mitgeben, um einen anderen Termin abzufragen. Beispiel: `/weristda 01.01.2000`",
        },
      },
    ],
  },
};

const basicMessage = {
  channel: "",
  text: "",
};

//******************** Functions ********************//
function getHomeView({ user }) {
  let view = JSON.parse(JSON.stringify(homeView));
  view.user_id = user;
  return view;
}

//******************** Export ********************//
module.exports = {
  getHomeView,

  basicMessage,
};
