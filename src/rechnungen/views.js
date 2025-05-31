import * as constants from './constants.js';

/** @type {import("@slack/web-api").ChatPostMessageArguments} */
export const uploadFailureMessage = {
  channel: '', // set in method
  text: '', // Text in the notification, set in the method
  unfurl_links: false,
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '' // set in method
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Erneut versuchen',
          emoji: true
        },
        style: 'primary',
        value: '', // set in method
        action_id: constants.uploadFailureMessage.retryActionId
      }
    }
  ]
};
