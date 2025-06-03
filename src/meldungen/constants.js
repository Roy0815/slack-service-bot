import * as types from './types.js';

/**
 * @readonly
 * @enum {string}
 */
export const homeView = {
  blockMeldungInput: 'meldung_input_block',
  actionMeldungInput: 'meldung_input'
};

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
  actionPaymentRecordUpload: 'payment_record_upload',
  blockRemarksInput: 'remarks_input_block',
  actionRemarksInput: 'remarks_input'
};

/**
 * @readonly
 * @enum {string}
 */
export const competitionRegistrationAdminActions = {
  confirm: 'competition_confirm',
  deny: 'competition_deny'
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

/**
 * @readonly
 * @enum {string}
 */
export const competitionCreationView = {
  viewName: 'competitioncreationview',
  blockCompetitionName: 'competition_name_block',
  actionCompetitionName: 'competition_name_input',
  blockCompetitionDate: 'competition_date_block',
  actionCompetitionDate: 'competition_date_input',
  blockCompetitionLocation: 'competition_location_block',
  actionCompetitionLocation: 'competition_location_input'
};

/**
 * @readonly
 */
export const nameOfCompetitionSheet = 'Wettk\u00e4mpfe';

/**
 * @readonly
 */
export const competitionDropdownPlaceholderOption = {
  value: 'waiting_for_competitions',
  text: 'Keine Wettkämpfe gefunden'
};

/**
 * @readonly
 * @enum {string}
 */
export const competitionMainSheetColumns = {
  competitionID: '0',
  competitionName: '1',
  competitionDate: '2',
  competitionLocation: '3',
  googleSheetsLink: '4'
};

/**
 * @readonly
 * @enum {string}
 */
export const competitionSheetColumns = {
  lastName: '0',
  firstName: '1',
  birhtyear: '2',
  weightClass: '3',
  status: '4',
  handlerNeeded: '5'
};

/**
 * @readonly
 * @enum {string}
 */
export const competitionRegistrationState = {
  inProgress: 'In Bearbeitung',
  okay: 'In Ordnung',
  problem: 'Problem',
  registered: 'Gemeldet'
};
