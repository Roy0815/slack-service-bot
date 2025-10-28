# Slack App Konfiguration

Wenn du in deinem Slack Workspace angemeldet bist kannst du [hier](https://api.slack.com/apps) deine Slack Apps sehen. Hast du deine App ausgewählt kannst du die Details bearbeiten.

Die Slack App wird bequem mit dem [`manifest.json`](https://github.com/Roy0815/slack-service-bot/blob/main/slack-config-files/manifest.json) konfiguriert.

Das kann in der Slack App unter _App Manifest_ modifiziert werden. Die einzige Anpassung, die bei der Pflege erfolgen muss ist, dass alle Platzhalter `"PUT REQUEST URL HERE"` mit der URL ersetzt werden, unter der die [Lambda Funktion](aws-lambda.md#aws-lambda-setup-für-slack) erreichbar ist.

Um als Admin Logs und Fehler zu erhalten musst du nachfolgenden beiden Variablen in den `.env` Umgebungsvariablen füllen. Bitte beachte für den Admin Channel, dass der Bot in diesen Channel aufgenommen werden muss.
::: details Beispiel in [`.env.example`](https://github.com/Roy0815/slack-service-bot/blob/main/.env.example) {open}
<<< ../../.env.example{15,17}
:::
