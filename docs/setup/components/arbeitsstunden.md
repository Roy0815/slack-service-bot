# Arbeitsstunden

## Umgebungsvariablen

Für diese Komponente müssen die Umgebungsvariablen `SPREADSHEET_ID_MASTERDATA`, `GOOGLE_SERVICE_ACC_EMAIL` und `GOOGLE_SERVICE_ACC_PRIVATE_KEY` ausgefüllt werden.

`GOOGLE_SERVICE_ACC_EMAIL` und `GOOGLE_SERVICE_ACC_PRIVATE_KEY` sollten bereits im Kapitel [Setup - AWS Lambda aufsetzen](../../getting-started/aws-lambda.md) ausgefüllt worden sein.

Die `SPREADSHEET_ID_MASTERDATA` findet man in der URL der Tabelle mit den Mitgliederstammdaten. Sie steht zwischen `docs.google.com/spreadsheets/d/` und dem nächsten `/`.

::: details Beispiel in [`.env.example`](https://github.com/Roy0815/slack-service-bot/blob/main/example.env)
<<< ../../../.env.example{20-28}
:::

## Google Sheet Struktur

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
| Art d. Mitgl. | (aktiv|passiv|ermäßigt) |
| Geburtstag | DD.MM.YYYY |
| Alter | - |
| Geschlecht | (m|w) |
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
