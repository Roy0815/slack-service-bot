import * as functions from './functions.js';
import * as types from './types.js';

/** @type {import('../general/types').appComponent} */
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

        // download file from slack
        await functions.getFileInfoFromSlack(client, file);

        // upload to drive
        await functions.uploadFileToDriveFolder(file);
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
