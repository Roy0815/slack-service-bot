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
          text: "Hallo 👋 Ich bin der Arbeitsstunden-Bot. Mit meiner Hilfe kannst du einfach Arbeitsstunden erfassen und abrufen:",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*1️⃣ `/arbeitsstunden_anzeigen` Kommando*:\nHiermit kannst du deine geleisteten Stunden einsehen. Das Kommando ist in allen öffentlichen Channels verfügbar, oder auch in privaten, wenn du den Arbeitsstunden-Bot hinzufügst.",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*2️⃣ `/arbeitsstunden_erfassen` Kommando:*\nMit diesem Kommando kannst du geleistete Stunden erfassen. Es wird ein Dialog geöffnet, in dem du die Details mitgeben kannst. Im Anschluss wird die Anfrage zur Genehmigung an den Vorstand weitergeleitet. Sobald dieser genehmigt hat, wirst du benachrichtigt.",
        },
      },
    ],
  },
};

//******************** Functions ********************//
function getHomeView({user}) {
  let view = JSON.parse(JSON.stringify(homeView));
  view.user_id = user;
  return view;
}

//******************** Export ********************//
module.exports = {
  getHomeView,
};