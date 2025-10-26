# Komponenten

[[toc]]

## Arbeitsstunden

### Umgebungsvariablen

Für diese Komponente müssen die Umgebungsvariablen `SPREADSHEET_ID_MASTERDATA`, `GOOGLE_SERVICE_ACC_EMAIL` und `GOOGLE_SERVICE_ACC_PRIVATE_KEY` ausgefüllt werden.

`GOOGLE_SERVICE_ACC_EMAIL` und `GOOGLE_SERVICE_ACC_PRIVATE_KEY` sollten bereits im Kapitel [Setup - AWS Lambda aufsetzen](../hosting-and-slack/aws-lambda#umgebungsvariablen-definieren) ausgefüllt worden sein.

Die `SPREADSHEET_ID_MASTERDATA` findet man in der URL der Tabelle mit den Mitgliederstammdaten. Sie steht zwischen `docs.google.com/spreadsheets/d/` und dem nächsten `/`.

::: details Beispiel in [`.env.example`](https://github.com/Roy0815/slack-service-bot/blob/main/.env.example)
<<< ../../.env.example{20-28}
:::

### Google Sheet Struktur

Das Google Sheet erwartet eine spezielle Struktur. Bei den Sheets wird nach Namen selektiert, bei den Spalten die Reihenfolge, nicht die Titel.

Ein `x` im Sheet Namen steht für das jeweilige Jahr.

Das erste valide Jahr ist 2022. Sollte ein User eine Abfrage für ein Jahr starten, für das es noch kein Sheet gibt, so kopiert die App die beiden Sheets des letzten Jahres und leert alle Arbeitseinsätze. Die Soll-Stunden, sowie der Admin Channel können im "Summe Stunden x" Sheet angepasst werden.

::: warning WARNUNG
Sollte die Struktur verändert werden müssen, muss auch der Code angepasst werden.
:::

::: details Sheet `Allg Daten`
| Spalte | Besonderheiten |
| ---- | ---- |
| Nummer | integer, fortlaufende Mitgliedsnummer |
| Vorname | - |
| Nachname | - |
| Beitrittsdatum | DD.MM.YYYY |
| Austrittsdatum | DD.MM.YYYY |
| Art d. Mitgl. | (aktiv\|passiv\|ermäßigt) |
| Geburtstag | DD.MM.YYYY |
| Alter | - |
| Geschlecht | (m\|w) |
| Email | - |
| Hausnummer | - |
| PLZ | - |
| Wohnort | - |
| Telefonnummer | `'+${Ländervorwahl}${Nummer}` |
| Slack ID | - |
:::

::: details Sheet `Arbeitseinsätze x`
| Spalte | Besonderheiten |
| ---- | ---- |
| Datum | DD.MM.YYYY |
| Mitglied | `${Vorname} ${Nachname}` |
| Arbeitseinsatz | Freitext |
| geleistete Stunden | Dezimalzahl |
:::

::: details Sheet `Summe Stunden x`
| Spalte | Besonderheiten |
| ---- | ---- |
| Name | `${Vorname} ${Nachname}` |
| Zu leisten (h) | mit Sheets Formel berechnet |
| Geleistet | mit Sheets Formel berechnet |
| Differenz | mit Sheets Formel berechnet |
| Abrechnung | mit Sheets Formel berechnet |
| `leer` | `leer` |
| `leer` | `leer` |
| Jahr | `leer` |
| `Jahr` | `leer` |
| `leer` | `leer` |
| Stunden (soll) | `leer` |
| `Stunden (soll)` | `leer` |
| `leer` | `leer` |
| Admin Channel | `leer` |
| `Admin Channel` | - |

![Struktur Sheet Summe Stunden x](/images/arbeitsstunden-sheet-summe-stunden-x.png)

:::

## Meldungen

Under construction 👷🚧🏗️

## Pollz

Kein Setup notwendig

## Signaturen

Die integrierte Signaturlösung ist im Moment [Docuseal](https://www.docuseal.com/).

Die Implementierung umfasst einen Webhook, welcher von Docuseal ausgelöst wird, wenn Dokumente unterschrieben wurden. Dieser löst dann wiederum per Webhook einen Workflow in Slack aus.

### Docuseal Konto erstellen

1. Konto erstellen ([docuseal.eu](https://docuseal.eu/sign_up))
2. Pro Lizenz kaufen: 20$ pro User pro Monat (50% Discount für Non-Profits) + 0,20$ pro API Call
   - (optional) Non-Profit Discount sichern: Email an support@docuseal.com, ich habe nur unsere Website mitgeschickt

### Webhook einrichten

1. Einloggen und bei [Webhook URL](https://console.docuseal.eu/webhooks) die URL von [AWS](../hosting-and-slack/aws-lambda#aws-lambda-setup-fur-slack) eintragen, die auf `/docuseal/webhook` endet
2. `form.completed` Checkbox ankreuzen
3. `Geheimnis hinzufügen` klicken
   - Geheimnis generieren (bspw. [hier](https://jwtsecrets.com/#generator))
   - Werte für Key (bpsw. `X-Sam-Signature`) und Value (Geheimnis) in Docuseal eintragen
   - Werte in `.env` Umgebungsvariablen pflegen

::: details Beispiel in [`.env.example`](https://github.com/Roy0815/slack-service-bot/blob/main/.env.example)
<<< ../../.env.example{14-16}
:::

### Template anlegen

1. Template bei Docuseal für den Aufnahmeantrag erstellen
2. Template ID aus Docuseal ermitteln `https://docuseal.eu/templates/{TEMPLATE_ID}`
3. In `.env` Umgebungsvariablen pflegen

::: details Beispiel in [`.env.example`](https://github.com/Roy0815/slack-service-bot/blob/main/.env.example)
<<< ../../.env.example{17}
:::

## Stätte

In den `.env` Umgebungsvariablen muss der Channel gepflegt werden, in dem die Abfragen landen.
Außerdem kann der App Admin optional benachrichtigt werden, wenn alte Nachrichten nachts gelöscht werden.

::: details Beispiel in [`.env.example`](https://github.com/Roy0815/slack-service-bot/blob/main/.env.example) {open}
<<< ../../.env.example{10-12}
:::

## Stammdaten

Die Stammdaten Funktion baut auf der Komponente [Arbeitsstunden](#arbeitsstunden) auf. Das Setup ist daher auch diesem Kapitel zu entnehmen.

Es werden mindestens die Sheets `Allg Daten` und `Summe Stunden x` benötigt.
