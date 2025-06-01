import { asApp } from '../arbeitsstunden/app.js';
import { staetteApp } from '../staette/app.js';
import { pollzApp } from '../pollz/app.js';
import { stammdatenApp } from '../stammdaten/app.js';
import { rechnungenApp } from '../rechnungen/app.js';
import { meldungenApp } from '../meldungen/app.js';

/** @type {import('./types.js').appComponent[]} */
export const apps = [
  asApp,
  staetteApp,
  pollzApp,
  stammdatenApp,
  rechnungenApp,
  meldungenApp
];
