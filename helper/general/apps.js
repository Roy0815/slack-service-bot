import { asApp } from '../arbeitsstunden/app.js';
import { staetteApp } from '../staette/app.js';
import { pollzApp } from '../pollz/app.js';

/** @type {import('./types').appComponent[]} */
export const apps = [asApp, staetteApp, pollzApp];
