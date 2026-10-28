import * as awsRtAPI from '../general/aws-runtime-api.js';
import { userJoiningFields } from '../general/masterdata/types.js';

import fetch from 'node-fetch';

// Handle webhook events from docuseal
/**
 * @param {import('aws-lambda').APIGatewayProxyEventV2} event
 * @param {import('aws-lambda').Context} context
 */
export async function handler(event, context) {
  // Set global AWS request ID for further processing
  awsRtAPI.globalData.awsRequestId = context.awsRequestId;

  // Verify the webhook signature
  const SIGNATURE_HEADER_NAME = process.env.SIGNATURE_HEADER_NAME ?? '';
  if (
    !event.headers ||
    event.headers[SIGNATURE_HEADER_NAME] !==
      process.env.SIGNATURE_SIGNING_SECRET
  ) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid signature' })
    };
  }

  try {
    // Parse the webhook payload
    const payload = JSON.parse(event.body ?? '{}');

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
 * @param {any} event
 */
export async function handleFormCompleted(event) {
  const submission = JSON.parse(event.body);

  // branch by template
  const templateId = `${submission.data?.template?.id}`;
  switch (templateId) {
    case process.env.APPLICATION_FORM_TEMPLATE_ID:
      await handleApplicationCompleted(submission);
      return;

    case process.env.BANK_CHANGE_FORM_TEMPLATE_ID:
      await handleBankChangeCompleted(submission);
      return;

    default:
      console.log('Template not handled', submission);
  }
}

/**
 * @param {any} submission
 */
async function handleApplicationCompleted(submission) {
  // check values exist
  if (!submission.data.values) {
    console.log('No values in submission', submission);
    return;
  }

  /** @type {Record<string, any>} */
  const applicationInfo = {};

  // Extract values from the submission
  submission.data.values.forEach((/** @type {any} */ value) => {
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
  await fetch(
    /** @type {string} */ (process.env.SIGNATURE_WORKFLOW_SLACK_WEBHOOK),
    {
      method: 'post',
      body: JSON.stringify(applicationInfo)
    }
  );
}

// fields of the bank change form, dates stay in ISO format for the workflow
const bankChangeFields = ['accountOwner', 'IBAN', 'BIC', 'signingDate'];

/**
 * @param {any} submission
 */
async function handleBankChangeCompleted(submission) {
  // slack id is set by the bot via metadata, needed to identify the member
  const slackId = submission.data?.metadata?.slackId;
  if (!slackId) {
    console.log('No slackId in submission metadata', submission);
    return;
  }

  /** @type {Record<string, string>} */
  const bankChangeInfo = {
    slackId: `${slackId}`,
    changeDate: `${submission.data.metadata.changeDate ?? ''}`
  };

  // Extract values from the submission, empty fields as empty string
  bankChangeFields.forEach((field) => {
    const value = submission.data.values?.find(
      (/** @type {any} */ v) => v.field === field
    )?.value;
    bankChangeInfo[field] = `${value ?? ''}`;
  });

  bankChangeInfo.email = `${submission.data.email ?? ''}`;
  bankChangeInfo.docusealFileURL = `${submission.data.documents?.[0]?.url ?? ''}`;

  // start slack workflow
  const response = await fetch(
    /** @type {string} */ (process.env.BANK_CHANGE_WORKFLOW_SLACK_WEBHOOK),
    {
      method: 'post',
      body: JSON.stringify(bankChangeInfo)
    }
  );

  if (!response.ok) {
    console.error(
      'Bank change workflow webhook failed',
      response.status,
      await response.text()
    );
  }
}
