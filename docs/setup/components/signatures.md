# Signaturen

Die integrierte Signaturlösung ist im Moment [Docuseal](https://www.docuseal.com/).

Die Implementierung umfasst einen Webhook, welcher von Docuseal ausgelöst wird, wenn Dokumente unterschrieben wurden. Dieser löst dann wiederum per Webhook einen Workflow in Slack aus.

## Docuseal Konto erstellen

1. Konto erstellen ([docuseal.eu](https://docuseal.eu/sign_up))
2. Pro Lizenz kaufen: 20$ pro User pro Monat (50% Discount für Non-Profits) + 0,20$ pro API Call
   - (optional) Non-Profit Discount sichern: Email an support@docuseal.com, ich habe nur unsere Website mitgeschickt

## Webhook einrichten

1. Einloggen und bei [Webhook URL](https://console.docuseal.eu/webhooks) die URL von [AWS](../../getting-started/aws-lambda.md#aws-lambda-setup-fur-slack) eintragen, die auf `/docuseal/webhook` endet
2. `form.completed` Checkbox ankreuzen
3. `Geheimnis hinzufügen` klicken
   - Geheimnis generieren (bspw. [hier](https://jwtsecrets.com/#generator))
   - Werte für Key (bpsw. `X-Sam-Signature`) und Value (Geheimnis) in Docuseal eintragen
   - Werte in `.env` Umgebungsvariablen pflegen

::: details Beispiel in [`.env.example`](https://github.com/Roy0815/slack-service-bot/blob/main/example.env)
<<< ../../../.env.example{14-16}
:::

## Template anlegen

1. Template bei Docuseal für den Aufnahmeantrag erstellen
2. Template ID aus Docuseal ermitteln `https://docuseal.eu/templates/{TEMPLATE_ID}`
3. In `.env` Umgebungsvariablen pflegen

::: details Beispiel in [`.env.example`](https://github.com/Roy0815/slack-service-bot/blob/main/example.env)
<<< ../../../.env.example{17}
:::
