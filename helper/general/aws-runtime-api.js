import fetch from 'node-fetch';

export const globalData = {
  awsRequestId: ''
};

/**
 * AWSs default runtime will run through all code before sending the response.
 * Meaning when we do further calls to Slack or Google the runtime can exceed the 3s
 * Response time limit that slack has.
 *
 * With this function we can interact with the runtime to send the response already while we still
 * process further calls without shutting down the lambda function
 */
export async function sendResponse() {
  if (globalData.awsRequestId === '' && process.env.AWS_LAMBDA_RUNTIME_API)
    return;

  await fetch(
    `http://${process.env.AWS_LAMBDA_RUNTIME_API}/2018-06-01/runtime/invocation/${globalData.awsRequestId}/response`,
    {
      method: 'post',
      body: JSON.stringify({
        statusCode: 200
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}
