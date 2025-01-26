// local imports
import * as views from './views.js';

/**
 * Get channel from submitted view
 * @param {import('@slack/bolt').SlackViewAction} viewAction
 * @returns {string}
 */
export function getChannelFromView({ view }) {
  return view.state.values[views.creationModalBlocks.conversationSelect][
    views.creationModalActions.conversationSelect
  ].selected_conversation;
}
