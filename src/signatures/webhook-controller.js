import { userJoiningFields } from '../general/masterdata/types.js';

import fetch from 'node-fetch';

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
