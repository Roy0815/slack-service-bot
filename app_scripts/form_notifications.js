// @ts-nocheck
/* eslint-disable */

// IDs deiner Formulare
var formIdEinzeltrainingExtern = '';
var formIdEinzeltrainingIntern = '';
var formIdProbetrainingExtern = '';

function createTriggers() {
  var formIds = [
    formIdEinzeltrainingIntern,
    formIdEinzeltrainingExtern,
    formIdProbetrainingExtern
  ];

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
  // Nicht alle Daten an den Nicht-Vorstand weiterleiten, nur bestimmte Felder
  var filteredQuestions = [
    'Frage',
    'Datum des Trainings',
    'Vollständiger Name',
    'Email',
    'Ansprechpartner aus dem Verein'
  ];
  // Formular-Infos holen
  var formTitle = `Neue Übermittlung des Formulars: ${'`' + event.source.getTitle() + '`'}`;
  var itemResponses = event.response.getItemResponses();
  var formId = event.source.getId();

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
                text: Array.isArray(answer) ? answer.join('\n') : answer
              }
            ]
          }
        ]
      }
    ]);
  }

  // Request an Slack senden
  sendToSlack(`Neue Übermittlung des Formulars: *${formTitle}*`, blocks);

  if (
    formId === formIdEinzeltrainingIntern ||
    formId === formIdEinzeltrainingExtern
  ) {
    // Antworten filtern um nicht wild alle Daten durch die Gegend zu ballern
    var clonedBlocks = JSON.parse(JSON.stringify(blocks));
    clonedBlocks[1].rows = clonedBlocks[1].rows.filter((row) => {
      if (row.length !== 2) return false; // scheint keine Frage-Antwort-Zeile zu sein?
      var frage = row[0]?.elements?.[0];
      if (!frage.elements || frage.elements.length !== 1) return false; // scheint keine Frage-Antwort-Zeile zu sein?

      return filteredQuestions.indexOf(frage.elements[0].text) !== -1;
    });

    sendToSlack(
      `Neue Übermittlung des Formulars: *${formTitle}*`,
      clonedBlocks,
      'ERWEITERTER_VORSTAND'
    );
  } else if (formId === formIdProbetrainingExtern) {
    sendToSlack(
      `Neue Übermittlung des Formulars: *${formTitle}*`,
      blocks,
      'PROBETRAININGS'
    );
  }
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

function sendToSlack(message, blocks, channel = 'NOTIFICATION_CHANNEL') {
  // payload bauen
  var payload = {
    channel: PropertiesService.getScriptProperties().getProperty(channel),
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
