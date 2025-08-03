import * as controller from './controller.js';
import * as types from './types.js';

import * as awsRtAPI from '../../general/aws-runtime-api.js';
import * as constants from './constants.js';

/** @type {import('../../general/types.js').appComponent} */
export const googledriveWorkflowsApp = { setupApp, getHomeView: null };

/**
 * @param {import("@slack/bolt").App} app
 */
function setupApp(app) {
  //* ******************* Workflow Steps ********************//
  app.function(
    'uploadFileToGoogleDrive',
    async ({ client, inputs, fail, complete }) => {
      /** @type {types.fileInformation} */
      let file = { fileID: '', fileName: '', driveFolderID: '' };

      try {
        // get step parameters
        file = {
          fileName: `${inputs.fileDate ? /** @type {string} */ (inputs.fileDate).replace(/-*/g, '') + ' ' : ''}${inputs.fileName}`,
          driveFolderID: /** @type {string} */ (inputs.driveFolderID),
          fileID: inputs.fileID?.[0].elements[0].elements[0].text,
          publicFileURL: /** @type {string} */ (inputs?.fileURL)
        };

        // set workflow step to complete
        await complete();

        // post 200 already to not wait for drive upload
        await awsRtAPI.sendResponse();

        // get file info
        await controller.getFileInfo(client, file);

        // upload to drive
        await controller.uploadFileToDriveFolder(file);
      } catch (error) {
        // on error notify approvers
        await app.client.chat.postMessage(
          controller.getUploadFailureMessage(
            file,
            /** @type {string} */ (inputs.approverChannel)
          )
        );

        // notify admin as well
        // no admin maintained: no message
        if (!process.env.APP_ADMIN_CHANNEL) return;

        await app.client.filesUploadV2({
          channel_id: process.env.APP_ADMIN_CHANNEL,
          filename: 'error.js',
          initial_comment: `An error occured when uploading document ${'`' + file.fileName + '`'} to Google Drive. Please look into the issue.`,
          title: 'Body',
          content: JSON.stringify(error, null, '\t')
        });
      }
    }
  );

  //* ******************* Actions ********************//
  app.action(
    constants.uploadFailureMessage.retryActionId,
    async ({ ack, body, client, action, respond }) => {
      await ack();

      // post 200 already
      await awsRtAPI.sendResponse();

      // get file information from action
      /** @type {types.fileInformation} */
      const file = JSON.parse(
        /** @type {import("@slack/bolt").ButtonAction} */ (action).value
      );

      // upload file to drive folder
      try {
        // get file info
        await controller.getFileInfo(client, file);

        // upload to drive
        await controller.uploadFileToDriveFolder(file);

        // update message
        await respond({
          text: `Die Datei \`${file.fileName}\` wurde nachträglich erfolgreich von <@${body.user.id}> hochgeladen.`,
          replace_original: true
        });
      } catch (error) {
        client.chat.postEphemeral({
          user: body.user.id,
          channel: body.channel.id,
          text: `Beim Hochladen der Datei \`${file.fileName}\` ist ein Fehler aufgetreten. Bitte versuche es erneut.`
        });
      }
    }
  );
}
