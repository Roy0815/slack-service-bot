# Workflows

Hier werden einige Workflows, die wir aktuell nutzen vorgestellt.
Die Liste wird nach Möglichkeit aktuell gehalten.

## ADMIN Neues Mitglied

Under construction 👷🚧🏗️

## Austritt einplanen

Trigger: Link in Slack

::: details 1. In ein Formular übertragen
**Austritt festhalten**

- Wer?

  Slack-Benutzer:in

- Wann?

  Datum
  :::

::: details 2. `formatDate` Format a date

- Datum

  `Antwort auf: Wann?`

- Format

  DD.MM.YYYY
  :::

::: details 3. Eine Nachricht an `vorstand-admin-aufgaben` schicken
`Person die den Workflow verwendet hat` hat einen Austritt gepflegt:

`Antwort auf: Wer?` am `Formatiertes Datum`
:::

::: details 4. Element zur Liste hinfügen
Vorstand interne Liste `To-Dos`
| Felder | Werte |
| ---- | ---- |
| Name | Lastschrift löschen: Austritt `Antwort auf: Wer?` zum `Formatiertes Datum` |
| Message | `{} Referenz auf die gesendete Nachricht` |
| Status | 1 - Neu |
| Priorität | 1 - Sehr hoch |
| Zuständigkeit | Kassenwart |
:::

::: details 5. `setLeaveDate` Setzt das Austrittsdatum eines Mitglieds

- Leaving User

  `Antwort auf: Wer?`

- Leave Date of User

  `Antwort auf: Wann?`

  :::

## Meldeaufforderung KDK Wettkampf

Under construction 👷🚧🏗️

## Rechnung einreichen

Trigger: Link in Slack

::: details 1. In ein Formular übertragen
**Rechnung einreichen**

- Datum der Ausgabe

  Datum

- Titel der Ausgabe

  Kurze Antwort

- Rechnung noch offen?

  Dropdown
  - Rechnung ist noch offen
  - Rechnung wurde privat bezahlt
  - Rechnung wurde vom Verein bezahlt

- Paypal Konto (Falls du Geld ausgelegt hast)

  Kurze Antwort

- Rechnungsbeleg

  Datei-Upload

  :::

::: details 2. „Nur für dich sichtbar“-Nachricht schicken

- Channel auswählen

  `Channel, in dem der Workflow verwendet wurde`

- Mitglied des Channels auswählen

  `Person, die diesen Workflow verwendet hat`

- Nachricht hinzufügen

  Deine Ausgabe wurde eingereicht. Du wirst benachrichtigt, wenn sie genehmigt wurde :slightly_smiling_face:
  :::

::: details 3. Eine Nachricht an `vorstand-admin-aufgaben` schicken
**`{}Person, die das Formular eingereicht` hat hat eine neue Rechnung eingereicht:**

**Datum der Ausgabe**

`Antwort auf: Datum der Ausgabe`

**Titel der Ausgabe**

`Antwort auf: Titel der Ausgabe`

**Noch offen?**

`Antwort auf: Rechnung noch offen?`

**Paypal Konto**

`Antwort auf: Paypal Konto (Falls du Geld ausgelegt hast)`

- Attachment:

  `Antwort auf: Rechnungsbeleg`

- Buttons:

  `Genehmigen`

  Einzelklick, Fortfahren

  :::

## Vereinscoaching anpassen

Komplettes Setup möglich per JSON upload.

::: details vereinscoaching-anpassen.json

<<< ../../slack-config-files/workflows/vereinscoaching-anpassen.json

:::

## Vereinscoaching kündigen

Komplettes Setup möglich per JSON upload.

::: details vereinscoaching-kuendigen.json

<<< ../../slack-config-files/workflows/vereinscoaching-kuendigen.json

:::
