/**
 * @callback fnSetup
 * @param {import('@slack/bolt').App} app
 */

/**
 * @callback fnHomeView
 * @returns {import("@slack/types").KnownBlock[]}
 */

// #region appComponent
/**
 * @typedef {object} appComponent
 * @property {fnSetup} setupApp
 * @property {fnHomeView|null} getHomeView
 */
// #endregion appComponent

/** Error during view submissions */
class SlackViewSubmissionError extends Error {
  /**
   * create new error object
   * @param  {string} block Block of view that holds the error
   * @param {string} viewMessage error message
   */
  constructor(block, viewMessage) {
    super(viewMessage);

    /** @private */
    this.block = block;
    /** @private */
    this.viewMessage = viewMessage;
  }

  /**
   * get object for error ack response to slack
   * @returns {import('@slack/bolt').ViewResponseAction} object for ack response
   */
  getAckObject() {
    return {
      response_action: 'errors',
      errors: {
        [this.block]: this.viewMessage
      }
    };
  }
}

export { SlackViewSubmissionError };
