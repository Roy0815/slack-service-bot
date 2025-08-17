import { masterdataService } from '../../general/masterdata/service.js';
import * as mdTypes from '../../general/masterdata/types.js';
import * as awsRtAPI from '../../general/aws-runtime-api.js';

/** @type {import('../../general/types.js').appComponent} */
export const masterdataWorkflowsApp = { setupApp, getHomeView: null };

/**
 * @param {import("@slack/bolt").App} app
 */
function setupApp(app) {
  //* ******************* Workflow Steps ********************//
  app.function('setLeaveDate', async ({ client, inputs, fail, complete }) => {
    // post 200 to acknowledge receipt of workflow step
    await awsRtAPI.sendResponse();

    const leaveDateFormatted = /** @type {string} */ (inputs.leaveDate)
      .split('-')
      .reverse()
      .join('.');

    try {
      await masterdataService.saveLeaveDate(
        { slackId: /** @type {string} */ (inputs.leaveUser) },
        leaveDateFormatted
      );

      // set workflow step to complete
      await complete();
    } catch (error) {
      await fail({
        error: `An error occurred while saving the leave date: ${error.message}`
      });
    }
  });

  app.function('saveNewMember', async ({ inputs, fail, complete, client }) => {
    // post 200 to acknowledge receipt of workflow step
    await awsRtAPI.sendResponse();

    /** @type {import('../../general/masterdata/types.js').userJoiningDetails} */
    const newMemberInfo = {};

    // extract user values from inputs
    mdTypes.userJoiningFields.forEach((key) => {
      newMemberInfo[key] = inputs[key];
    });

    // get admin channel for contact card
    const channel = /** @type {string} */ (inputs.adminChannel);

    try {
      // do all processing in parallel
      const [bankDetails, fileUploadResult, teamInfo] = await Promise.all([
        // save to sheet
        masterdataService.saveNewMember(newMemberInfo),
        // post contact card to admin channel
        app.client.filesUploadV2({
          channel_id: channel,
          filename: `${newMemberInfo.firstname} ${newMemberInfo.lastname}.vcf`,
          title: `${newMemberInfo.firstname} ${newMemberInfo.lastname}`,
          initial_comment: `Slack und WhatsApp einladen: ${newMemberInfo.firstname} ${newMemberInfo.lastname}`,
          content: `BEGIN:VCARD
VERSION:3.0
N:${newMemberInfo.lastname};${newMemberInfo.firstname}
EMAIL:${newMemberInfo.email}
TEL;TYPE=voice:${newMemberInfo.phone}
END:VCARD`
        }),
        // get team info
        app.client.team.info()
      ]);

      // set workflow step to complete if data is complete
      if (
        bankDetails.mandateReference === '' ||
        bankDetails.initialAmount === '' ||
        bankDetails.recurringAmount === ''
      ) {
        await fail({
          error: `Mandate reference for ${newMemberInfo.firstname} ${newMemberInfo.lastname} could not be read. Please check.`
        });
        return;
      }

      // get file info
      const fileInfo = await client.files.info({
        file: fileUploadResult.files[0].files[0].id
      });
      const channelId = Object.keys(fileInfo.file.shares.private)[0];
      const ts = fileInfo.file.shares.private[channelId][0].ts;

      await complete({
        outputs: {
          mandateReference: bankDetails.mandateReference,
          initialAmount: bankDetails.initialAmount,
          recurringAmount: bankDetails.recurringAmount,
          contactCardMessageLink: `${teamInfo.team.url}archives/${channelId}/p${ts.replace('.', '')}`
        }
      });
    } catch (error) {
      await fail({
        error: `An error occurred while saving the new member information: ${error.message}`
      });
    }
  });
}
