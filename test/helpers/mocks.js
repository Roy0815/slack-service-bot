import { mock } from 'node:test';

const nodeMajor = Number(process.versions.node.split('.')[0]);

/**
 * Wrapper around mock.module that uses unified `exports` on Node 24+
 * while remaining compatible with older Node 22.x releases.
 * @param {string} specifier
 * @param {{ defaultExport?: any, namedExports?: Record<string, any> }} options
 * @returns {any}
 */
export function mockModule(specifier, { defaultExport, namedExports = {} }) {
  if (nodeMajor >= 24) {
    const exportsObj = { ...namedExports };
    if (defaultExport !== undefined) {
      exportsObj.default = defaultExport;
    }
    return mock.module(specifier, { exports: exportsObj });
  }

  /** @type {any} */
  const legacyOptions = { namedExports };
  if (defaultExport !== undefined) {
    legacyOptions.defaultExport = defaultExport;
  }
  return mock.module(specifier, legacyOptions);
}

/**
 * Sets up a mock for the external `googleapis` client (Sheets v4 & Drive v3)
 * so internal `src/` modules execute directly with full coverage.
 * @returns {object} Mock functions and reset helper
 */
export function setupGoogleSheetsMock() {
  const defaultSheets = () => ({
    data: {
      sheets: [
        { properties: { title: 'Arbeitseinsätze 2025', sheetId: 1 } },
        { properties: { title: 'Summe Stunden 2025', sheetId: 2 } },
        {
          properties: {
            title: `Arbeitseinsätze ${new Date().getFullYear()}`,
            sheetId: 3
          }
        },
        {
          properties: {
            title: `Summe Stunden ${new Date().getFullYear()}`,
            sheetId: 4
          }
        },
        { properties: { title: 'Copied Sheet', sheetId: 99 } }
      ]
    }
  });

  const valuesGet = mock.fn(async () => ({ data: { values: [] } }));
  const valuesUpdate = mock.fn(async () => ({}));
  const valuesClear = mock.fn(async () => ({}));
  const valuesAppend = mock.fn(async () => ({}));
  const spreadsheetsGet = mock.fn(async () => defaultSheets());
  const sheetsCopyTo = mock.fn(async () => ({
    data: { title: 'Copied Sheet' }
  }));
  const batchUpdate = mock.fn(async () => ({}));
  const driveCreate = mock.fn(async () => ({}));

  mockModule('googleapis', {
    namedExports: {
      google: {
        auth: {
          getClient: mock.fn(async () => 'mock-auth-client')
        },
        sheets: mock.fn(() => ({
          spreadsheets: {
            values: {
              get: valuesGet,
              update: valuesUpdate,
              clear: valuesClear,
              append: valuesAppend
            },
            get: spreadsheetsGet,
            sheets: {
              copyTo: sheetsCopyTo
            },
            batchUpdate
          }
        })),
        drive: mock.fn(() => ({
          files: {
            create: driveCreate
          }
        }))
      },
      sheets_v4: {},
      drive_v3: {}
    }
  });

  const resetAll = () => {
    valuesGet.mock.resetCalls();
    valuesGet.mock.mockImplementation(async () => ({ data: { values: [] } }));
    valuesUpdate.mock.resetCalls();
    valuesUpdate.mock.mockImplementation(async () => ({}));
    valuesClear.mock.resetCalls();
    valuesClear.mock.mockImplementation(async () => ({}));
    valuesAppend.mock.resetCalls();
    valuesAppend.mock.mockImplementation(async () => ({}));
    spreadsheetsGet.mock.resetCalls();
    spreadsheetsGet.mock.mockImplementation(async () => defaultSheets());
    sheetsCopyTo.mock.resetCalls();
    sheetsCopyTo.mock.mockImplementation(async () => ({
      data: { title: 'Copied Sheet' }
    }));
    batchUpdate.mock.resetCalls();
    batchUpdate.mock.mockImplementation(async () => ({}));
    driveCreate.mock.resetCalls();
    driveCreate.mock.mockImplementation(async () => ({}));
  };

  return {
    valuesGet,
    valuesUpdate,
    valuesClear,
    valuesAppend,
    spreadsheetsGet,
    sheetsCopyTo,
    batchUpdate,
    driveCreate,
    resetAll
  };
}

/**
 * Creates a lightweight mock Slack Bolt App instance that records registered
 * commands, actions, views, options, events, functions, shortcuts, and errors.
 * @returns {object} Mock Bolt app and lookup/reset helpers
 */
export function createMockBoltApp() {
  const commands = [];
  const actions = [];
  const views = [];
  const options = [];
  const events = [];
  const functions = [];
  const shortcuts = [];
  let errorHandler = null;

  const client = {
    views: {
      open: mock.fn(async () => ({})),
      update: mock.fn(async () => ({})),
      publish: mock.fn(async () => ({}))
    },
    chat: {
      postMessage: mock.fn(async () => ({})),
      postEphemeral: mock.fn(async () => ({})),
      update: mock.fn(async () => ({})),
      delete: mock.fn(async () => ({}))
    },
    conversations: {
      history: mock.fn(async () => ({ messages: [] })),
      list: mock.fn(async () => ({ channels: [] })),
      join: mock.fn(async () => ({ ok: true }))
    },
    auth: {
      test: mock.fn(async () => ({ bot_id: 'B_BOT' }))
    },
    filesUploadV2: mock.fn(async () => ({
      files: [{ files: [{ id: 'F_UPLOAD' }] }]
    })),
    files: {
      info: mock.fn(async () => ({
        file: {
          id: 'F_UPLOAD',
          name: 'doc.pdf',
          mimetype: 'application/pdf',
          url_private_download: 'https://slack.com/doc.pdf',
          shares: { private: { C_ADMIN: [{ ts: '1700000.123' }] } }
        }
      }))
    },
    users: {
      info: mock.fn(async () => ({
        user: { id: 'U1', profile: { email: 'max@example.com' } }
      }))
    },
    team: {
      info: mock.fn(async () => ({
        team: { url: 'https://sam.slack.com/' }
      }))
    }
  };

  const resetClient = () => {
    client.views.open.mock.resetCalls();
    client.views.update.mock.resetCalls();
    client.views.publish.mock.resetCalls();
    client.chat.postMessage.mock.resetCalls();
    client.chat.postEphemeral.mock.resetCalls();
    client.chat.update.mock.resetCalls();
    client.chat.delete.mock.resetCalls();
    client.conversations.history.mock.resetCalls();
    client.conversations.history.mock.mockImplementation(async () => ({
      messages: []
    }));
    client.conversations.list.mock.resetCalls();
    client.conversations.list.mock.mockImplementation(async () => ({
      channels: []
    }));
    client.conversations.join.mock.resetCalls();
    client.conversations.join.mock.mockImplementation(async () => ({
      ok: true
    }));
    client.auth.test.mock.resetCalls();
    client.filesUploadV2.mock.resetCalls();
    client.files.info.mock.resetCalls();
    client.users.info.mock.resetCalls();
    client.team.info.mock.resetCalls();
  };

  const matchKey = (list, id) => {
    const entry = list.find(({ matcher }) =>
      typeof matcher === 'string'
        ? matcher === id
        : matcher instanceof RegExp && matcher.test(id)
    );
    if (!entry) {
      throw new Error(`No handler registered for "${id}"`);
    }
    return entry.fn;
  };

  return {
    client,
    command: (matcher, fn) => commands.push({ matcher, fn }),
    action: (matcher, fn) => actions.push({ matcher, fn }),
    view: (matcher, fn) => views.push({ matcher, fn }),
    options: (matcher, fn) => options.push({ matcher, fn }),
    event: (matcher, fn) => events.push({ matcher, fn }),
    function: (matcher, fn) => functions.push({ matcher, fn }),
    shortcut: (matcher, fn) => shortcuts.push({ matcher, fn }),
    error: (fn) => {
      errorHandler = fn;
    },
    getCommand: (name) => matchKey(commands, name),
    getAction: (actionId) => matchKey(actions, actionId),
    getView: (callbackId) => matchKey(views, callbackId),
    getOptions: (actionId) => matchKey(options, actionId),
    getEvent: (eventName) => matchKey(events, eventName),
    getFunction: (callbackId) => matchKey(functions, callbackId),
    getShortcut: (callbackId) => matchKey(shortcuts, callbackId),
    getErrorHandler: () => errorHandler,
    resetClient
  };
}
