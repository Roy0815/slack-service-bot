import * as controller from './controller.js';
import * as types from './types.js';

import * as awsRtAPI from '../general/aws-runtime-api.js';

/** @type {import('../general/types.js').appComponent} */
export const rechnungenApp = { setupApp, getHomeView: null };

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
          fileName: /** @type {string} */ (
            `${/** @type {string} */ (inputs.fileDate).replace(/-*/g, '')} ${inputs.fileName}`
          ),
          driveFolderID: /** @type {string} */ (inputs.driveFolderID),
          fileID: inputs.fileID[0].elements[0].elements[0].text
        };

        // set workflow step to complete
        await complete();

        // post 200 already to not wait for drive upload
        awsRtAPI.sendResponse();

        // download file from slack
        await controller.getFileInfoFromSlack(client, file);

        // upload to drive
        await controller.uploadFileToDriveFolder(file);
      } catch (error) {
        // on error notify admins
        await app.client.filesUploadV2({
          channel_id: /** @type {string} */ (inputs.approverChannel),
          filename: 'error.js',
          initial_comment: `An error occured when uploading document ${'`' + file.fileName + '`'} to Google Drive. Please upload it manually while the admin looks into the issue.`,
          title: 'Body',
          content: JSON.stringify(error, null, '\t')
        });
      }
    }
  );
}
