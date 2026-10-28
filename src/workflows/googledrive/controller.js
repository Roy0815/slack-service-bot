// eslint-disable-next-line camelcase
import { drive_v3, google } from 'googleapis';
import fetch from 'node-fetch';
import { Readable } from 'node:stream';

import * as types from './types.js';
import * as util from '../../general/util.js';
import * as views from './views.js';

//* ******************* Private functions ********************//
/**
 * Authenticates with the Google Drive API
 * @returns {Promise<drive_v3.Drive>}
 */
async function auth() {
  const auth = await google.auth.getClient({
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.appdata',
      'https://www.googleapis.com/auth/drive.file'
    ],
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACC_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACC_PRIVATE_KEY
    }
  });

  return google.drive({ version: 'v3', auth });
}

//* ******************* Public functions ********************//
/**
 * get download URL from Slack or public
 * @param {import("@slack/bolt").webApi.WebClient} client
 * @param {types.fileInformation} file
 * @returns {Promise<any>}
 */
export async function getFileInfo(client, file) {
  // for public files, no need to fetch from slack
  if (file.publicFileURL) {
    file.mimetype =
      // @ts-ignore
      types.mimeTypes[file.fileName.split('.').pop()] ||
      'application/octet-stream';
    return;
  }

  // get file URL from slack
  const fileInfo = await client.files.info({
    file: file.fileID
  });

  // add infos to file object
  // find extension in filename in slack and add to filename
  file.fileName += `.${/[^.]*$/.exec(fileInfo.file?.name ?? '')?.[0] ?? ''}`;

  // set mimetype
  file.mimetype = fileInfo.file?.mimetype;

  // get URL
  file.fileURL = fileInfo.file?.url_private_download;
}

/**
 * Upload file to specified folder
 * @param {types.fileInformation} file
 */
export async function uploadFileToDriveFolder(file) {
  const drive = await auth();

  // check if file is available
  const url = file.publicFileURL || file.fileURL;
  if (!url) {
    throw new Error('No file URL available');
  }

  // download file from slack or public URL
  const response = await fetch(url, {
    method: 'get',
    headers: file.publicFileURL
      ? {}
      : { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
  });

  // convert body if necessary
  const body =
    response.body instanceof Readable
      ? response.body
      : Readable.fromWeb(/** @type {any} */ (response.body));

  if (!response.body) throw new Error('No response body');

  // upload file to drive folder
  await drive.files.create({
    requestBody: { name: file.fileName, parents: [file.driveFolderID] },
    media: {
      mimeType: file.mimetype,
      body
    }
  });
}

/**
 * Upload file to specified folder
 * @param {types.fileInformation} file
 * @param {string} approverChannel
 * @returns {import("@slack/web-api").ChatPostMessageArguments}
 */
export function getUploadFailureMessage(file, approverChannel) {
  const view = util.deepCopy(views.uploadFailureMessage);

  // set channel for message
  view.channel = approverChannel;

  // set text in notification
  if ('text' in view) {
    // required for typing
    view.text = `Beim Hochladen der Datei \`${file.fileName}\` ist ein Fehler aufgetreten. Bitte versuche es erneut.`;
  }

  // required for correct typing
  if ('blocks' in view) {
    const block = /** @type {import('@slack/types').SectionBlock} */ (
      view.blocks[0]
    );

    if (block) {
      // save file info in button
      /** @type {import('@slack/types').Button} */ (block.accessory).value =
        JSON.stringify(file);

      // set text in block
      if ('text' in block && block.text) {
        block.text.text = view.text ?? '';
      }
    }
  }

  return view;
}
