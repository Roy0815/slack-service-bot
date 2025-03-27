// eslint-disable-next-line camelcase
import { drive_v3, google } from 'googleapis';
import fetch from 'node-fetch';
import stream from 'node:stream';

import * as types from './types.js';
// import { read } from 'node:fs';

//* ******************* Private functions ********************//
/**
 * Authenticates with the Google Sheets API
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
 * get download URL from Slack file and download it
 * @param {import("@slack/bolt").webApi.WebClient} client
 * @param {types.fileInformation} file
 * @returns {Promise<any>}
 */
export async function getFileInfoFromSlack(client, file) {
  // get file URL from slack
  const fileInfo = await client.files.info({
    file: file.fileID
  });

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

  // download slack file and pipe into stream
  (
    await fetch(file.fileURL, {
      method: 'get',
      headers: {
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
      }
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
