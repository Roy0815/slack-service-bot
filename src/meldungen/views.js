/** @type {import("@slack/types").KnownBlock[]} */
export const homeView = [
  {
    type: 'header',
    text: {
      type: 'plain_text',
      text: 'Meldungen-Bot',
      emoji: true
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Home View'
    }
  }
];