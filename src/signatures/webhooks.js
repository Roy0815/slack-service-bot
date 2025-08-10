import * as awsRtAPI from '../general/aws-runtime-api.js';
import { userJoiningFields } from '../general/masterdata/types.js';

import fetch from 'node-fetch';

// Handle webhook events from docuseal
/** @type {import('aws-lambda').LambdaFunctionURLHandler } */
export async function handler(event, context) {
  // Set global AWS request ID for further processing
  awsRtAPI.globalData.awsRequestId = context.awsRequestId;

  // Verify the webhook signature
  if (
    !event.headers ||
    event.headers[process.env.SIGNATURE_HEADER_NAME] !==
      process.env.SIGNATURE_SIGNING_SECRET
  ) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid signature' })
    };
  }

  try {
    // Parse the webhook payload
    const payload = JSON.parse(event.body);

    switch (payload.event_type) {
      case 'form.completed':
        // already send 200 response to Docuseal
        await awsRtAPI.sendResponse();

        // Handle form completed event
        await handleFormCompleted(event);
        break;

      default:
        // unsupported event type
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Event type not supported' })
        };
    }

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Handle JSON parsing errors
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON payload' })
      };
    }

    // Handle all other errors
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

/**
 * @param {import('aws-lambda').APIGatewayProxyEventV2} event
 */
export async function handleFormCompleted(event) {
  const submission = JSON.parse(event.body);

  // check correct template
  if (
    !submission.data ||
    !submission.data.template ||
    `${submission.data.template.id}` !==
      process.env.APPLICATION_FORM_TEMPLATE_ID
  ) {
    console.log('Template not handled', submission);
    return;
  }

  // check values exist
  if (!submission.data.values) {
    console.log('No values in submission', submission);
    return;
  }

  /** @type {import('../general/masterdata/types.js').userJoiningDetails} */
  const applicationInfo = {};

  // Extract values from the submission
  submission.data.values.forEach((value) => {
    if (!userJoiningFields.includes(value.field)) return;

    if (/(joinedDate|birthday|signingDate)/.test(value.field)) {
      // Convert date fields
      applicationInfo[value.field] = value.value.split('-').reverse().join('.');
      return;
    }

    applicationInfo[value.field] = value.value;
  });

  // set file url
  applicationInfo.docusealFileURL = submission.data.documents?.[0]?.url;

  // start slack workflow
  await fetch(process.env.SIGNATURE_WORKFLOW_SLACK_WEBHOOK, {
    method: 'post',
    body: JSON.stringify(applicationInfo)
  });
}
