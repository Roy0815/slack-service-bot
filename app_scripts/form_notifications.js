// @ts-nocheck
/* eslint-disable */
function createTriggers() {
  // IDs deiner Formulare
  var formIds = [];

  formIds.forEach(function (id) {
    var form = FormApp.openById(id);

    // Prüfen, ob schon ein Trigger existiert
    var existing = ScriptApp.getProjectTriggers().filter(
      (t) =>
        t.getHandlerFunction() === 'handleSubmit' &&
        t.getTriggerSourceId() === id
    );

    if (existing.length === 0) {
      ScriptApp.newTrigger('handleSubmit')
        .forForm(form)
        .onFormSubmit()
        .create();
      Logger.log('Trigger für Formular erstellt: ' + form.getTitle());
    } else {
      Logger.log('Trigger existiert bereits für: ' + form.getTitle());
    }
  });
}

function handleSubmit(event) {
  // Formular-Infos holen
  var formTitle = `Neue Übermittlung des Formulars: ${'`' + event.source.getTitle() + '`'}`;
  var itemResponses = event.response.getItemResponses();

  // Antworten formatieren in Slack Block
  var blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: formTitle
      }
    },
    {
      type: 'table',
      rows: [
        [
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Frage',
                    style: {
                      bold: true
                    }
                  }
                ]
              }
            ]
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Antwort',
                    style: {
                      bold: true
                    }
                  }
                ]
              }
            ]
          }
        ]
      ]
    }
  ];

  for (var i = 0; i < itemResponses.length; i++) {
    var question = itemResponses[i].getItem().getTitle();
    var answer = formatDate(itemResponses[i].getResponse());
    blocks[1].rows.push([
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: question
              }
            ]
          }
        ]
      },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: answer
              }
            ]
          }
        ]
      }
    ]);
  }

  // Request an Slack senden
  sendToSlack(`Neue Übermittlung des Formulars: *${formTitle}*`, blocks);
}

function formatDate(date) {
  if (!date.match) return date;

  // Regex: YYYY-MM-DD
  var m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    return m[3] + '.' + m[2] + '.' + m[1]; // DD.MM.YYYY
  }
  return date;
}

function sendToSlack(message, blocks) {
  // payload bauen
  var payload = {
    channel: PropertiesService.getScriptProperties().getProperty(
      'NOTIFICATION_CHANNEL'
    ),
    text: message,
    blocks: blocks
  };

  // Request an Slack senden
  var options = {
    method: 'post',
    contentType: 'application/json; charset=utf-8',
    headers: {
      Authorization:
        'Bearer ' +
        PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN')
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(
    'https://slack.com/api/chat.postMessage',
    options
  );
}
