// eslint-disable-next-line camelcase
import { drive_v3, google } from 'googleapis';
import fetch from 'node-fetch';
import stream from 'node:stream';

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
  file.fileName += `.${/[^.]*$/.exec(fileInfo.file.name)[0]}`;

  // set mimetype
  file.mimetype = fileInfo.file.mimetype;

  // get URL
  file.fileURL = fileInfo.file.url_private_download;
}

/**
 * Upload file to specified folder
 * @param {types.fileInformation} file
 */
export async function uploadFileToDriveFolder(file) {
  const drive = await auth();

  // create streamable instance for upload
  const readStream = new stream.PassThrough();

  // download file from slack or public and pipe into stream
  (
    await fetch(file.publicFileURL || file.fileURL, {
      method: 'get',
      headers: file.publicFileURL
        ? {}
        : { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
    })
  ).body.pipe(readStream);

  // upload file to drive folder
  await drive.files.create({
    requestBody: {
      name: file.fileName,
      parents: [file.driveFolderID]
    },
    media: {
      mimeType: file.mimetype,
      body: readStream
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
  view.text = `Beim Hochladen der Datei \`${file.fileName}\` ist ein Fehler aufgetreten. Bitte versuche es erneut.`;

  // required for correct typing
  if ('blocks' in view) {
    // save file info in button
    /** @type {import('@slack/types').Button } */ (
      /** @type {import('@slack/types').SectionBlock } */ (view.blocks[0])
        .accessory
    ).value = JSON.stringify(file);

    // set text in block
    /** @type {import('@slack/types').SectionBlock } */ (
      view.blocks[0]
    ).text.text = view.text;
  }

  return view;
}
