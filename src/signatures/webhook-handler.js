import * as controller from './controller.js';

// Handle webhook events from docuseal
/** @type {import('aws-lambda').LambdaFunctionURLHandler } */
export async function handler(event) {
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
        controller.handleFormCompleted(event);
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
