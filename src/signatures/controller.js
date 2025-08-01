/**
 * @param {import('aws-lambda').APIGatewayProxyEventV2} event
 */
export function handleFormCompleted(event) {
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

  /*   // Extract values from the submission
  submission.data.values.forEach((value) => {
    if (!applicationInfo[value.field]) return;
    applicationInfo[value.field] = value.value;
  }); */

  console.log('Handling submission completed:', submission.data.values);
}
