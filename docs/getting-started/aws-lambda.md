# AWS Lambda aufsetzen

## Umgebungsvariablen definieren

Bevor mit dem AWS Lambda Setup gestartet wird, muss eine lokale .env Datei angelegt werden. Hier werden alle Variablen definiert, die die Umgebung benötigt. Zusätzlich werden auch die Daten des Bot Benutzers für Google Sheets als Environment Variablen gespeichert.

Beispiel in [`.env.example`](https://github.com/Roy0815/slack-service-bot/blob/main/example.env)

<<< ../../.env.example{1-3,22-28}

## AWS Lambda Setup für Slack

**Zu Testzwecken wird AWS Lambda durch serverless-offline emuliert. Zu diesem Zweck kann das erste Kapitel des Guides [Set up AWS Lambda](https://tools.slack.dev/bolt-js/deployments/aws-lambda/#set-up-aws-lambda) übersprungen werden. Die Alternative wird im späteren Kapitel [Run the app locally](https://tools.slack.dev/bolt-js/deployments/aws-lambda/#run-the-app-locally) erklärt.**

Dem [Guide](https://tools.slack.dev/bolt-js/deployments/aws-lambda/) bei Slack für AWS Lambda folgen.

- AWS Account anlegen
- Person anlegen mit Zugriffsschlüssel
- AWS CLI in der Entwicklungsumgebung installieren
- AWS konfigurieren

```
aws configure
AWS Access Key ID [None]: #
AWS Secret Access Key [None]: #
Default region name [None]: eu-central-1
Default output format [None]: json
```

- [serverless](https://www.serverless.com/framework/docs/getting-started) installieren und einloggen mit Free-Plan Konto bei Serverless (Keine Lizenz benötigt!)
- `app.js` adaptieren und `serverless.yml` anlegen
- `serverless-offline` installieren zum lokalen testen
- AWS Lambda Funktion deployen

```
serverless deploy
```

- bereitgestellte URL, die auf `/slack/events` endet in den Slack Bot eintragen als Endpunkt (nächstes Kapitel)
