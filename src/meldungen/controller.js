import { homeView } from './views.js';
import * as util from '../general/util.js';

/**
 * Get part of the home view
 * @returns {import("@slack/types").KnownBlock[]}
 */
export function getHomeView() {
    const view = util.deepCopy(homeView);
    return view;
}
