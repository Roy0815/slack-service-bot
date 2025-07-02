import * as slack from '@slack/bolt';
import * as util from '../util.js';
import { masterdataService } from './service.js';

import * as asSheet from '../../arbeitsstunden/sheet.js';

/**
 * Run Lambda function (built for scheduled job)
 * @param {import('@slack/bolt/dist/receivers/AwsLambdaReceiver.js').AwsEvent} event
 * @param {any} context
 */
export async function run(event, context) {
  // Create Bolt App
  // @ts-ignore
  const app = new slack.default.App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
  });

  // get user data
  const users = await masterdataService.getAllActiveUsers();

  // get admin channel
  const adminChannel = await asSheet.getAdminChannel();

  // get users with birthday today
  const birthdayUsers = users.filter(
    (user) =>
      user.birthday &&
      user.birthday.substring(0, 6) ===
        util.formatDate(new Date()).substring(0, 6)
  );

  // message birthday users
  if (birthdayUsers.length !== 0)
    await app.client.chat.postMessage({
      channel: adminChannel,
      text: `Geburtstage: ${birthdayUsers
        .map((user) => `${user.firstname} ${user.lastname}`)
        .join(', ')}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Heute haben folgende Mitglieder Geburtstag:\n${birthdayUsers
              .map(
                (user) =>
                  `<@${user.slackId}> - ${user.firstname} ${user.lastname}`
              )
              .join('\n')}`
          }
        }
      ]
    });

  // get users with anniversery today (5 years, 10 years, etc.)
  const anniverseryUsers = users.filter(
    (user) =>
      user.joinedDate &&
      user.joinedDate.substring(0, 6) ===
        util.formatDate(new Date()).substring(0, 6) &&
      (parseInt(util.formatDate(new Date()).substring(6, 8)) -
        parseInt(user.joinedDate.substring(6, 8))) %
        5 ===
        0
  );

  // message birthday users
  if (anniverseryUsers.length !== 0)
    await app.client.chat.postMessage({
      channel: adminChannel,
      text: `Jubiläum: ${anniverseryUsers
        .map((user) => `${user.firstname} ${user.lastname}`)
        .join(', ')}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Heute haben folgende Mitglieder Jubiläum:\n${anniverseryUsers
              .map(
                (user) =>
                  `${
                    parseInt(util.formatDate(new Date()).substring(6, 8)) -
                    parseInt(user.joinedDate.substring(6, 8))
                  } Jahre:\t<@${user.slackId}> - ${user.firstname} ${user.lastname}`
              )
              .join('\n')}`
          }
        }
      ]
    });

  // get users with leave date today
  const leavingUsers = users.filter(
    (user) =>
      user.leaveDate &&
      user.leaveDate.substring(0, 6) ===
        util.formatDate(new Date()).substring(0, 6)
  );

  // message leaving users
  if (leavingUsers.length !== 0)
    await app.client.chat.postMessage({
      channel: adminChannel,
      text: `Austritte: ${leavingUsers
        .map((user) => `${user.firstname} ${user.lastname}`)
        .join(', ')}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Heute treten folgende Mitglieder aus:\n${leavingUsers
              .map(
                (user) =>
                  `<@${user.slackId}> - ${user.firstname} ${user.lastname}`
              )
              .join('\n')}`
          }
        }
      ]
    });
}
