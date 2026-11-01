import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockModule } from '../helpers/mocks.js';

const fetchMock = mock.fn(async () => ({ ok: true }));

mockModule('node-fetch', {
  defaultExport: fetchMock
});

const { globalData, sendResponse } = await import(
  '../../src/general/aws-runtime-api.js'
);

describe('general/aws-runtime-api', () => {
  beforeEach(() => {
    fetchMock.mock.resetCalls();
    globalData.awsRequestId = '';
    delete process.env.AWS_LAMBDA_RUNTIME_API;
  });

  it('does not call fetch if awsRequestId is empty', async () => {
    process.env.AWS_LAMBDA_RUNTIME_API = '127.0.0.1:9001';
    await sendResponse();
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  it('does not call fetch if AWS_LAMBDA_RUNTIME_API is not set', async () => {
    globalData.awsRequestId = 'req-123';
    await sendResponse();
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  it('posts 200 status to AWS Lambda runtime API when configured', async () => {
    globalData.awsRequestId = 'req-456';
    process.env.AWS_LAMBDA_RUNTIME_API = '127.0.0.1:9001';

    await sendResponse();

    assert.equal(fetchMock.mock.callCount(), 1);
    const [url, options] = fetchMock.mock.calls[0].arguments;
    assert.equal(
      url,
      'http://127.0.0.1:9001/2018-06-01/runtime/invocation/req-456/response'
    );
    assert.equal(options.method, 'post');
    assert.deepEqual(JSON.parse(options.body), { statusCode: 200 });
  });
});
