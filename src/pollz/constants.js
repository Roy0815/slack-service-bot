/**
 * @readonly
 * @enum {string}
 */
export const viewNames = {
  creationModal: 'pollz-pollView',
  addAnswerModal: 'pollz-addAnswerView'
};

// Creation Modal
/**
 * @readonly
 * @enum {string}
 */
export const creationModalBlocks = {
  question: 'pollz-questionBlock',
  conversationSelect: 'pollz-conversationSelectBlock',
  options: 'pollz-optionsBlock',
  newAnswer: 'pollz-newAnswerBlock'
};

/**
 * @readonly
 * @enum {string}
 */
export const creationModalActions = {
  questionInput: 'pollz-question_input-action',
  conversationSelect: 'pollz-conversations_select-action',
  options: 'pollz-options-action',
  newAnswerInput: 'pollz-newAnswerInput-action',
  addAnswer: 'pollz-add-answer',
  deleteSingleAnswer: 'pollz-delete-single-answer',
  deleteAllAnswers: 'pollz-delete-all-answers'
};

/**
 * @readonly
 * @enum {string}
 */
export const optionCheckboxes = {
  addAllowed: 'addoptions',
  multipleSelect: 'multiplechoice',
  anonym: 'anon'
};

// Poll Message
/**
 * @readonly
 * @enum {string}
 */
export const pollMessageActions = {
  addAnswer: 'pollz-message-add-answer',
  deleteAnswer: 'pollz-message-delete-answer',
  overflow: 'pollz-message-overflow',
  overflowDelete: 'delete',
  voteButton: 'pollz-vote',
  addAnswerViewTextInput: 'pollz-addAnswerViewTextInput'
};

// home view
export const homeViewCommand = 'pollz-home-command';
