# AWS Lambda aufsetzen

## Umgebungsvariablen definieren

Bevor mit dem AWS Lambda Setup gestartet wird, muss eine lokale `.env` Datei im Root Ordner des Projekts angelegt werden. Hier werden alle Variablen definiert, die die Umgebung benötigt. Zusätzlich werden auch die Daten des Bot Benutzers für Google Sheets als Environment Variablen gespeichert.

Beispiel in [`.env.example`](https://github.com/Roy0815/slack-service-bot/blob/main/.env.example)

<<< ../../.env.example{1-3,5-12}

## AWS Lambda Setup für Slack

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

- [serverless](https://www.serverless.com/framework/docs/getting-started) installieren und einloggen mit Free-Plan Konto bei Serverless
  ::: warning WARNUNG
  Keine Lizenz benötigt!
  :::
- `serverless.yml` region, org und service anpassen
- AWS Lambda Funktion deployen

```
serverless deploy
```

- bereitgestellte URL, die auf `/slack/events` endet in den Slack Bot eintragen als Endpunkt (nächstes Kapitel)
