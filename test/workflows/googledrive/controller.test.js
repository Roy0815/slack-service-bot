import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockModule } from '../../helpers/mocks.js';

const driveCreateMock = mock.fn(async () => ({}));
const fetchMock = mock.fn();

mockModule('googleapis', {
  namedExports: {
    google: {
      auth: {
        getClient: mock.fn(async () => 'mock-auth')
      },
      drive: mock.fn(() => ({
        files: {
          create: driveCreateMock
        }
      }))
    },
    drive_v3: {}
  }
});

mockModule('node-fetch', {
  defaultExport: fetchMock
});

const controller = await import(
  '../../../src/workflows/googledrive/controller.js'
);

describe('workflows/googledrive/controller', () => {
  beforeEach(() => {
    driveCreateMock.mock.resetCalls();
    fetchMock.mock.resetCalls();
  });

  it('getFileInfo sets mimetype from fileName extension when publicFileURL is present', async () => {
    const file = {
      fileID: '',
      fileName: 'contract.pdf',
      driveFolderID: 'folder-1',
      publicFileURL: 'https://example.com/contract.pdf'
    };

    await controller.getFileInfo(/** @type {any} */ ({}), file);
    assert.equal(file.mimetype, 'application/pdf');
  });

  it('getFileInfo fetches Slack file metadata when publicFileURL is not set', async () => {
    const mockClient = {
      files: {
        info: async ({ file }) => ({
          file: {
            id: file,
            name: 'invoice.png',
            mimetype: 'image/png',
            url_private_download: 'https://slack.com/private/invoice.png'
          }
        })
      }
    };

    const file = {
      fileID: 'F123',
      fileName: '20250101 Rechnung',
      driveFolderID: 'folder-1'
    };

    await controller.getFileInfo(/** @type {any} */ (mockClient), file);
    assert.equal(file.fileName, '20250101 Rechnung.png');
    assert.equal(file.mimetype, 'image/png');
    assert.equal(file.fileURL, 'https://slack.com/private/invoice.png');
  });

  it('uploadFileToDriveFolder downloads file and uploads stream to Google Drive', async () => {
    const webStream = new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode('hello'));
        c.close();
      }
    });

    fetchMock.mock.mockImplementation(async () => ({
      body: webStream
    }));

    await controller.uploadFileToDriveFolder({
      fileID: 'F1',
      fileName: 'doc.pdf',
      driveFolderID: 'folder-99',
      mimetype: 'application/pdf',
      publicFileURL: 'https://example.com/doc.pdf'
    });

    assert.equal(fetchMock.mock.callCount(), 1);
    assert.equal(driveCreateMock.mock.callCount(), 1);
    const createArgs = driveCreateMock.mock.calls[0].arguments[0];
    assert.deepEqual(createArgs.requestBody, {
      name: 'doc.pdf',
      parents: ['folder-99']
    });
    assert.equal(createArgs.media.mimeType, 'application/pdf');
  });

  it('getUploadFailureMessage builds retry message for approver channel', () => {
    const file = {
      fileID: 'F1',
      fileName: 'doc.pdf',
      driveFolderID: 'folder-99'
    };

    const msg = controller.getUploadFailureMessage(file, 'C_APPROVER');
    assert.equal(msg.channel, 'C_APPROVER');
    assert.ok(msg.text.includes('`doc.pdf`'));
    const block0 = /** @type {any} */ (msg.blocks[0]);
    assert.deepEqual(JSON.parse(block0.accessory.value), file);
  });
});
