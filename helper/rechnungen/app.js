/** @type {import('../general/types').appComponent} */
export const pollzApp = { setupApp, getHomeView: null };

/**
 * @param {import("@slack/bolt").App} app
 */
function setupApp(app) {
  //* ******************* Workflow Steps ********************//
  app.function('invoice_upload_to_drive', async ({ client, inputs, fail }) => {
    const { invoiceFile, invoiceDate, invoiceDescription } = inputs;

    console.log(invoiceFile, invoiceDate, invoiceDescription);
  });
}
