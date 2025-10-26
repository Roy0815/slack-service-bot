# Google APIs einrichten

**Zu Testzwecken wird keine Google Cloud Console und auch kein Dienstaccount benötigt. Ein normaler Google Account genügt, um der App Zugriff auf Drive/Sheets zu geben.**

Für die Integration mit Google Sheets und Google Drive werden die offiziellen Google APIs genutzt, die über eine sehr gute [Dokumentation](https://developers.google.com/) verfügt.

In der [Google Cloud Console](https://console.cloud.google.com/welcome) können die persönlichen Projekte eingesehen werden. Für unseren Verein hängt das Projekt in der Schwerathletik Mannheim Organisation und mehrere Nutzer von uns sind Inhaber.

Die benötigten APIs müssen im Projekt aktiviert werden:

- [Google Sheets API](https://console.cloud.google.com/apis/api/sheets.googleapis.com)
- [Google Drive API](https://console.cloud.google.com/apis/api/drive.googleapis.com)

Nun wird noch ein Dienstkonto benötigt. Das kann [hier](https://console.cloud.google.com/iam-admin/serviceaccounts?hl=de) errstellt werden.

Die Email des Dienstkontos muss als Bearbeiter bei den relevanten Google Ressourcen hinzugefügt werden (mehr dazu bei den jeweiligen Sektionen).
