// imports
const apps = require('./apps');

//* ******************* Views ********************//
const homeView = {
  // Use the user ID associated with the event
  user_id: '',
  view: {
    type: 'home',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Hallo 👋 Ich bin der Schwerathletik Mannheim Service-Bot.\nIch habe viele nützliche Funktionen:'
        }
      }
    ]
  }
};

const basicMessage = {
  channel: '',
  text: ''
};

//* ******************* Functions ********************//
function getHomeView ({ user }) {
  const view = JSON.parse(JSON.stringify(homeView));
  view.user_id = user;

  // add homeviews of apps
  apps.views.forEach((element) => {
    view.view.blocks.push({
      type: 'divider'
    });

    view.view.blocks = view.view.blocks.concat(element.getHomeView());
  });

  return view;
}

//* ******************* Export ********************//
module.exports = {
  getHomeView,

  basicMessage
};
