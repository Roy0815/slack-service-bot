import * as types from './types.js';

/**
 * @readonly
 * @enum {string}
 */
export const competitionRegistrationView = {
  viewName: 'competitionregistrationview',
  blockCompetitionSelect: 'competition_select_block',
  actionCompetitionSelect: 'competition_select',
  blockWeightClassSelect: 'weight_class_select_block',
  actionWeightClassSelect: 'weight_class_select',
  blockHandlerNeededSelect: 'handler_needed_select_block',
  actionHandlerNeededSelect: 'handler_needed_select',
  blockPaymentRecordUpload: 'payment_record_upload_block',
  actionPaymentRecordUpload: 'payment_record_upload'
};

/**
 * @readonly
 * @enum {types.WeightClass}
 */
export const weightClassesMale = {
  minus53kg: '-53kg',
  minus59kg: '-59kg',
  minus66kg: '-66kg',
  minus74kg: '-74kg',
  minus83kg: '-83kg',
  minus93kg: '-93kg',
  minus105kg: '-105kg',
  minus120kg: '-120kg',
  plus120kg: '+120kg'
};

/**
 * @readonly
 * @enum {types.WeightClass}
 */
export const weightClassesFemale = {
  minus43kg: '-43kg',
  minus47kg: '-47kg',
  minus52kg: '-52kg',
  minus57kg: '-57kg',
  minus63kg: '-63kg',
  minus69kg: '-69kg',
  minus76kg: '-76kg',
  minus84kg: '-84kg',
  plus84kg: '+84kg'
};

/**
 * @readonly
 * @enum {types.HandlerNeeded}
 */
export const handlerNeeded = {
  yes: 'Ja',
  no: 'Nein'
};
