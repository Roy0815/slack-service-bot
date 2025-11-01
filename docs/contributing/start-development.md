# Entwicklung starten

## Slack Workspace

Zum Testen kann ein neuer Slack Workspace erstellt werden:
[Guide](https://slack.com/intl/de-de/help/articles/206845317-Einen-Slack-Workspace-erstellen)

## Generelles Setup

Folgende Schritte aus dem Hosting und Slack Setup durchführen:

1. _(optional)_ [Google APIs einrichten](../hosting-and-slack/googleapis.md)
2. [Zugangsdaten holen](../hosting-and-slack/get-secrets.md) (mindestens Slack, Google optional)
3. [Entwicklungsumgebung einrichten](../hosting-and-slack/dev-environment-setup.md)
4. [AWS Lambda aufsetzen](../hosting-and-slack/aws-lambda.md): Umgebungsvariablen definieren, aus "AWS Lambda Setup für Slack" nur serverless installieren
5. [Slack App Konfiguration](../hosting-and-slack/slack-app-config.md): In der `manifest.json` können bei Problemen nicht benötigte Kommandos gelöscht werden. Die Request URL erhalten wir in den nächsten Schritten.

## `serverless.yml` adaptieren

Beim Anlegen des serverless Accounts muss eine Organisation angelegt werden. Diese muss in der `serverless.yml` gepflegt werden.

::: warning
Diese Änderung nicht committen!
:::

## Starten des lokalen Servers

Serverless kann mit `serverless offline` lokal gestartet werden, sodass es auf localhost erreichbar ist. Damit man nun mit Slack interagieren kann, wird per ngrok der Traffic ans Internet durchgereicht.

1. serverless lokal starten

```bash
serverless offline --noPrependStageInUrl
```

2. in einem neuen Terminal ngrok starten

```bash
ngrok http 3000
```

Ngrok gibt eine URL zurück, auf der der Bot jetzt zu erreichen ist. Diese URL muss im Slack Bot manifest bei den "Request URLs" eingetragen werden.
