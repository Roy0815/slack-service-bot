import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockModule } from '../helpers/mocks.js';

const fetchMock = mock.fn(async () => ({ ok: true }));

mockModule('node-fetch', {
  defaultExport: fetchMock
});

const { handler, handleFormCompleted } =
  await import('../../src/signatures/webhooks.js');

describe('signatures/webhooks', () => {
  beforeEach(() => {
    process.env.AWS_LAMBDA_RUNTIME_API = '127.0.0.1:9001';
    process.env.SIGNATURE_HEADER_NAME = 'x-docuseal-signature';
    process.env.SIGNATURE_SIGNING_SECRET = 'secret-123';
    process.env.APPLICATION_FORM_TEMPLATE_ID = '999';
    process.env.SIGNATURE_WORKFLOW_SLACK_WEBHOOK =
      'https://hooks.slack.com/triggers/T1/B1/123';
    fetchMock.mock.resetCalls();
  });

  it('returns 401 when signature header is missing or invalid', async () => {
    const res = await handler(
      /** @type {any} */ ({ headers: {} }),
      /** @type {any} */ ({ awsRequestId: 'req-1' }),
      () => {}
    );
    assert.equal(/** @type {any} */ (res).statusCode, 401);
  });

  it('returns 400 on invalid JSON payload', async () => {
    const res = await handler(
      /** @type {any} */ ({
        headers: { 'x-docuseal-signature': 'secret-123' },
        body: '{invalid-json'
      }),
      /** @type {any} */ ({ awsRequestId: 'req-1' }),
      () => {}
    );
    assert.equal(/** @type {any} */ (res).statusCode, 400);
  });

  it('returns 400 on unsupported event_type', async () => {
    const res = await handler(
      /** @type {any} */ ({
        headers: { 'x-docuseal-signature': 'secret-123' },
        body: JSON.stringify({ event_type: 'form.viewed' })
      }),
      /** @type {any} */ ({ awsRequestId: 'req-1' }),
      () => {}
    );
    assert.equal(/** @type {any} */ (res).statusCode, 400);
  });

  it('processes form.completed event, sends early 200, converts dates, and triggers Slack webhook', async () => {
    const payload = {
      event_type: 'form.completed',
      data: {
        template: { id: 999 },
        documents: [{ url: 'https://docuseal.com/doc.pdf' }],
        values: [
          { field: 'firstname', value: 'Anna' },
          { field: 'lastname', value: 'Muster' },
          { field: 'birthday', value: '1999-04-25' },
          { field: 'joinedDate', value: '2026-01-01' },
          { field: 'unknownField', value: 'ignored' }
        ]
      }
    };

    const res = await handler(
      /** @type {any} */ ({
        headers: { 'x-docuseal-signature': 'secret-123' },
        body: JSON.stringify(payload)
      }),
      /** @type {any} */ ({ awsRequestId: 'req-1' }),
      () => {}
    );

    assert.equal(/** @type {any} */ (res).statusCode, 200);
    // 1st call: AWS Lambda Runtime API early 200 response; 2nd call: Slack workflow webhook
    assert.equal(fetchMock.mock.callCount(), 2);
    assert.ok(
      fetchMock.mock.calls[0].arguments[0].includes(
        '/2018-06-01/runtime/invocation/req-1/response'
      )
    );

    const [webhookUrl, options] = fetchMock.mock.calls[1].arguments;
    assert.equal(webhookUrl, 'https://hooks.slack.com/triggers/T1/B1/123');
    const bodySent = JSON.parse(options.body);
    assert.deepEqual(bodySent, {
      firstname: 'Anna',
      lastname: 'Muster',
      birthday: '25.04.1999',
      joinedDate: '01.01.2026',
      docusealFileURL: 'https://docuseal.com/doc.pdf'
    });
  });

  it('handleFormCompleted ignores submissions with non-matching template id or missing values', async (t) => {
    const logMock = t.mock.method(console, 'log', () => {});

    await handleFormCompleted(
      /** @type {any} */ ({
        body: JSON.stringify({
          data: {
            template: { id: 111 },
            values: [{ field: 'firstname', value: 'Anna' }]
          }
        })
      })
    );
    assert.equal(fetchMock.mock.callCount(), 0);
    assert.equal(logMock.mock.calls[0].arguments[0], 'Template not handled');

    await handleFormCompleted(
      /** @type {any} */ ({
        body: JSON.stringify({
          data: {
            template: { id: 999 }
          }
        })
      })
    );
    assert.equal(fetchMock.mock.callCount(), 0);
    assert.equal(logMock.mock.calls[1].arguments[0], 'No values in submission');
  });

  it('returns 500 when downstream processing throws an unexpected error', async (t) => {
    const errMock = t.mock.method(console, 'error', () => {});
    fetchMock.mock.mockImplementationOnce(async () => {
      throw new Error('Network failure');
    });

    const res = await handler(
      /** @type {any} */ ({
        headers: { 'x-docuseal-signature': 'secret-123' },
        body: JSON.stringify({ event_type: 'form.completed' })
      }),
      /** @type {any} */ ({ awsRequestId: 'req-1' }),
      () => {}
    );

    assert.equal(/** @type {any} */ (res).statusCode, 500);
    assert.equal(errMock.mock.callCount(), 1);
  });
});
