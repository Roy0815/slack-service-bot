/**
 * @readonly
 * @enum {string}
 */

export const mimeTypes = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  txt: 'text/plain',
  html: 'text/html',
  csv: 'text/csv',
  json: 'application/json',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

/**
 * @typedef {object} fileInformation
 * @property {string} fileName
 * @property {string} driveFolderID
 * @property {string} fileID
 * @property {string} [fileURL]
 * @property {string} [mimetype]
 * @property {string} [publicFileURL]
 */

export {};
