# Workflow Schritte

## Konfiguration

### Google Drive

::: details Workflow Steps {open}

- uploadFileToGoogleDrive
  :::

Die `.env` Umgebungsvariablen für den [Google Drive und Slack](../hosting-and-slack/aws-lambda#umgebungsvariablen-definieren) Zugriff müssen gesetzt sein.

### Stammdaten

::: details Workflow Steps {open}

- setLeaveDate
- saveNewMember
  :::

Die `.env` Variable für das Stammdaten Sheet, sowie den Google Service Account müssen gesetzt sein. Details im Setup für [Arbeitsstunden](./components.md#arbeitsstunden).

Für `saveNewMember` muss es außerdem ein Sheet "SEPA Daten" geben.

::: details Sheet `SEPA Daten`
| Spalte | Besonderheiten |
| ---- | ---- |
| Mitgliedsnummer | integer, fortlaufende Mitgliedsnummer |
| Vorname | - |
| Nachname | - |
| IBAN | - |
| BIC | optional |
| Betrag | automatisch berechnet per Formel |
| Verwendungszweck | "Mitgliedsbeitrag Schwerathletik Mannheim" |
| Mandatsreferenz | "schweramaXXXXXXXXX" - fortlaufend nummeriert |
| Mandatsdatum | DD.MM.YYYY |
| abw. Kontoinhaber | optional |
| Erstmaliger Einzug inkl. Aufnahmegebühr | automatisch berechnet per Formel |
:::

### Utility

::: details Workflow Steps {open}

- formatDate
- encodeURL
  :::

Keine besondere Konfiguration nötig.
