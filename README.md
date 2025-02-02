# Schwerathletik Mannheim Slack Service Bot

Slack Bot für administrative Aufgaben innerhalb Schwerathletik Mannheim 2018 e.V.

**Inhalt**

- [Setup](#setup)
- [Funktionen](#funktionen)
- [Upgrades & Contribution](#upgrades--contribution)

## Setup

Die aktuelle Version des Bots ist für die Ausführung als AWS Lambda Funktion ausgelegt. In der Vergangenheit gab es Versionen als Docker Image, welches auf einem privaten Server oder auf Docker Cloud Services (wie z.B. Google Cloud Run) laufen kann.

Ich habe in diesem Dokument versucht das Setup des Bots von Infrastrukutur, Slack und Endanwender Seite zu erläutern.

**Wo immer möglich habe ich Links zu Guides eingefügt. Trotzdem kann hier oder auch an anderen Stellen eine kurze Google Recherche notwendig sein.**

1. [Google APIs einrichten](#1-google-apis-einrichten)
1. [Google und Slack Zugangsdaten holen](#2-google-und-slack-zugangsdaten-holen)
1. [AWS Lambda aufsetzen](#3-aws-lambda-aufsetzen) **(die aktuelle Version des Bots ist für AWS Lambda ausgelegt, die Docker Version des Bots ist in [Release v2](https://github.com/Roy0815/slack-service-bot/releases/tag/v2.1.0) zu finden)**
1. [Slack App Konfiguration](#4-slack-app-konfiguration)

### **1. Google APIs einrichten**

Für die Integration mit Google Sheets und Google Drive werden die offiziellen Google APIs genutzt, die über eine sehr gute [Dokumentation](https://developers.google.com/) verfügt.
In der [Google Cloud Console](console.cloud.google.com/welcome) können die persönlichen Projekte eingesehen werden. Das Projekt hängt in der Schwerathletik Mannheim Organisation und mehrere Nutzer von uns sind Inhaber.

Die benötigten APIs müssen im Projekt aktiviert werden:
[Google Sheets API](https://console.cloud.google.com/apis/api/sheets.googleapis.com)
[Google Drive API](https://console.cloud.google.com/apis/api/drive.googleapis.com)

Nun wird noch ein Dienstkonto benötigt. Das kann [hier](https://console.cloud.google.com/iam-admin/serviceaccounts?hl=de) errstellt werden.

Die Email des Dienstkontos muss als Bearbeiter bei den relevanten Google Ressourcen hinzugefügt werden (Google Sheet für Arbeitsstunden und Rechnungsordner für Rechnungen).

### **2. Google und Slack Zugangsdaten holen**

Slack

Wenn du aktuell in deinem Workspace angemeldet bist kommst du [hier](https://api.slack.com/apps) zu deinen Slack Apps. Wenn du als Contributor zu eine App hinzugefügt wurdest oder die App selbst erstellt hast kannst du sie hier in der Liste sehen. Direkt auf der ersten Seite _"Basic Information"_ kannst du das Signing Secret der App sehen. Im Abschnitt _"OAuth & Permissions"_ kannst du das Bot Token finden, sobald die App auf dem Workspace installiert ist. Sollte das nicht reichen musst du auch direkt die Scopes für den Bot hinzufügen wie in [Sektion 4](#4-slack-app-konfiguration) beschrieben.

Google

Wenn du allen Schritten im Punkt [1. Google APIs einrichten](#1-google-apis-einrichten) gefolgt bist kannst du jetzt zum angelegten Dienstkonto navigieren. Hier kannst du in den Details einen Schlüssel erstellen, den du beim einrichten der [Arbeitsstunden](#3-arbeitsstunden) Funktion brauchst.

### **3. AWS Lambda aufsetzen**

Bevor mit dem AWS Lambda Setup gestartet wird, muss eine lokale .env Datei angelegt werden. Eine Vorlage werde ich noch nachreichen. Hier werden alle Variablen definiert, die früher in der docker-compose.yml gepflegt wurden. Zusätzlich werden auch die Daten des Bot Benutzers für Google Sheets ab jetzt als Environment Variablen (Beispiel in [`example.env`](example.env)) gespeichert und nicht in der secrets.json Datei.

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
- app.js adaptieren und serverless.yml anlegen
- "serverless offline" installieren zum lokalen testen
- AWS Lambda Funktion deployen

```
serverless deploy
```

- bereitgestellte URL in den Slack Bot eintragen als Endpunkt (siehe [Slack App Konfigurations](#4-slack-app-konfiguration))

### **4. Slack App Konfiguration**

_Hier gehe ich nur auf die technische und nicht die optische Konfiguration der App ein._

Wenn du in deinem Slack Workspace angemeldet bist kannst du [hier](https://api.slack.com/apps) deine Slack Apps sehen. Hast du deine App ausgewählt kannst du die Details bearbeiten.

- **App Home**: `Home Tab`, `Messages Tab` und `Allow users to send Slash commands and messages from the messages tab` aktivieren
- **Interactivity & Shortcuts**: `Interactivity` aktivieren. `Request URL` und `Options Load URL` auf die URL setzen, unter der die [Lambda Funktion](#3-aws-lambda-aufsetzen) erreichbar ist (+ /slack/events ans Ende der URL)
- **Slash Commands**: Hier müssen alle Kommandos hinzugefügt werden, die von der App zur Verfügung gestellt werden. Wichtig ist `Escape channels, users, and links sent to your app` immer zu aktivieren. Auch hier sollte die URL auf die URL gesetzt werden, unter der die [Lambda Funktion](#3-aws-lambda-aufsetzen) erreichbar ist (+ /slack/events ans Ende der URL)
- **OAuth & Permissions**: Alle benötigten Scopes hinzufügen:
  |OAuth Scope|Description|
  |:---:|:---|
  |`channels:history`|View messages and other content in public channels that Schwerathletik Mannheim Service has been added to|
  |`channels:read`|View basic information about public channels in a workspace|
  |`chat:write`|Send messages as @Schwerathletik Mannheim Service|
  |`chat:write.public`|Send messages to channels @Schwerathletik Mannheim Service isn't a member of|
  |`commands`|Add shortcuts and/or slash commands that people can use|
  |`files:read`|View files shared in channels and conversations that Schwerathletik Mannheim Service has been added to|
  |`files:write`|Upload, edit, and delete files as Schwerathletik Mannheim Service|
  |`groups:history`|View messages and other content in private channels that Schwerathletik Mannheim Service has been added to|
  |`groups:read`|View basic information about private channels that Schwerathletik Mannheim Service has been added to|
  |`im:history`|View messages and other content in direct messages that Schwerathletik Mannheim Service has been added to|
  |`im:read`|View basic information about direct messages that Schwerathletik Mannheim Service has been added to|
  |`im:write`|Start direct messages with people|
  |`users:read`|View people in a workspace|
  |`mpim:read`|View basic information about group direct messages that Schwerathletik Mannheim Service has been added to|
  |`channels:join`|Join public channels in a workspace|
- **Event Subscriptions**: `Enable Events` aktivieren. Auch hier sollte die URL auf die URL gesetzt werden, unter der die [Lambda Funktion](#3-aws-lambda-aufsetzen) erreichbar ist (+ /slack/events ans Ende der URL). Bei `Subscribe to bot events` die benötigten Events hinzufügen:
  |Event Name|Description|
  |:---:|:---|
  |`app_home_opened`|User clicked into your App Home|
  |`team_join`|A new member has joined|
  |`function_executed`|Your app function is executed as a step in a workflow|
- **User ID Translation**: `Translate Global IDs` aktivieren

## Funktionen

Der Service Bot hat verschiedene Funktionen und ist in Bereiche unterteilt. Dieses Kapitel erläutert die Besonderheiten und erwähnt die zur Verfügung gestellten Endpunkte. Die genauen Beschreibungen der Kommandos können dem Home-Tab der App in Slack entnommen werden.

Die zentrale App verarbeitet das Event `app_home_opened`.

1. [Pollz](#1-pollz)
2. [Staette](#2-staette)
3. [Arbeitsstunden](#3-arbeitsstunden)
4. [Stammdaten](#4-stammdaten)
5. [Rechnungen](#5-rechnungen)

### **1. Pollz**

Pollz hat aktuell nur eine Funktion und die ist das Kommando `/umfrage`. Es gibt keine Besonderheiten zu beachten.

### **2. Staette**

Staette stellt aktuell das Kommando `/weristda` zur Verfügung. Dafür muss die Environment Variable `STAETTE_CHANNEL` (Beispiel [`example.env`](example.env)) mit der ID des Channels gefüllt werden in dem die Abfragen landen sollen.

Die [`serverless.yml`](serverless.yml) ist außerdem so konfiguriert, dass eine zweite Lambda Funktion mit hilfe einer Cronjob Schedule täglich um 1 Uhr CET läuft und die Abfragen von vergangenen Tagen automatisch löscht. Der Admin hat die Option darüber benachrichtigt zu werden um möglicherweise falsches Systemverhalten besser zu untersuchen. Dafür muss er nur die Environment Variable `CRONJOB_LOG_TO_ADMIN` (Beispiel [`example.env`](example.env)) setzen.

### **3. Arbeitsstunden**

Arbeitsstunden stellt die Kommandos `/arbeitsstunden_anzeigen` und `/arbeitsstunden_erfassen` zur Verfügung. Außerdem konsumiert dieser Teil das Event `team_join` um die Verknüpfung zwischen Slack-ID und Mitglieder-Excel herzustellen.
Alle Genehmigungen laufen über den Admin Channel, welcher im Sheet Sheet `Summe Stunden x` (siehe unten) im aktuellen Jahr hinterlegt ist.

Für diesen Bereich müssen die Environment Variablen `SHEET_ID`, `GOOGLE_SERVICE_ACC_EMAIL` und `GOOGLE_SERVICE_ACC_PRIVATE_KEY` gefüllt werden (Beispiel [`example.env`](example.env)).

Die `SHEET_ID` findet man in der URL der Tabelle um die es geht. Sie steht zwischen `docs.google.com/spreadsheets/d/` und dem nächsten `/`.

Bei die beiden Variablen `GOOGLE_SERVICE_ACC_EMAIL` und `GOOGLE_SERVICE_ACC_PRIVATE_KEY` findet man in der Datei aus dem Schritt [Google Zugangsdaten holen](#2-google-und-slack-zugangsdaten-holen).

**Google Sheet Struktur**

Das Google Sheet erwartet eine spezielle Struktur. Bei den Sheets kommt es auf die Namen an, bei den Spalten nur auf die Reihenfolge, nicht die Titel. Sollte die Struktur unbedingt verändert werden müssen, muss auch der Code angepasst werden (x steht jeweils für das Jahr):

1. Sheet `Allg Daten`

   ![Struktur Sheet Allg Daten](/images/%5BARBEITSSTUNDEN%5D%20Sheet%20Allg%20Daten.png)

2. Sheet `Arbeitseinsätze x`

   ![Struktur Sheet Arbeitseinsätze x](/images/%5BARBEITSSTUNDEN%5D%20Sheet%20Arbeitseins%C3%A4tze%20x.png)

3. Sheet `Summe Stunden x`

   ![Struktur Sheet Summe Stunden x](/images/%5BARBEITSSTUNDEN%5D%20Sheet%20Summe%20Stunden%20x.png)

Das erste valide Jahr ist 2022. Sollte ein User eine Abfrage für ein Jahr starten, für das es noch kein Sheet gibt, so kopiert die App die beiden Sheets des letzten Jahres und leert alle Arbeitseinsätze. Die Soll-Stunden, sowie der Admin Channel können im "Summe Stunden x" Sheet angepasst werden.

### **4. Stammdaten**

Stammdaten hat aktuell nur eine Funktion und die ist das Kommando `/stammdaten`. Diese Funktion baut auf die Funktionen von [Arbeitsstunden](#3-arbeitsstunden) auf. Das Setup ist genau das gleiche. Die Stammdaten werden im Sheet `Allg Daten` gelesen und geändert.
Auch hier laufen die Genehmigungen alle über den Admin Channel, welcher im Sheet Sheet `Summe Stunden x` (siehe unten) im aktuellen Jahr hinterlegt ist.

### **5. Rechnungen**

Rechnungen werden über den Workflow Builder eingereicht. Der Bot implementiert einen Custom Workflow Step, welcher die Rechnung automatisch in Google Drive hochlädt, wo diese nur noch manuell sortiert werden muss.

Wie im Kapitel [1. Google APIs einrichten](#1-google-apis-einrichten) beschrieben, muss der Service Account dem Google Drive Ordner als Bearbeiter hinzugefügt werden.

Der Workflow kann zu Slack mit Hilfe der Datei [Rechnung einreichen.json](/slack-config-files/workflows/Rechnung%20einreichen.json) hinzugefügt werden. Da zum Zeitpunkt der Implementierung Custom steps noch nicht über eine solche Konfig-Datei exportiert werden können, muss noch folgende manuelle Aktion erfolgen.

in Schritt 6 den custom Step einfügen wie hier zu sehen (Bei File ID Dropdown "File ID" auswählen und die ID des Google Drive Ordners auswählen, in den die Datein gelegt werden sollen):

![Konfiguration Workflow Schritt](/images/[RECHNUNGEN]%20Custom%20workflow%20step.png)

## Upgrades & Contribution

1. [Generelle Projektstruktur](#1-generelle-projektstruktur)
2. [Slack App Entwicklung](#2-slack-app-entwicklung)
   1. [Testen mit Glitch (Live Webserver)](#21-testen-mit-glitch)
   1. [Testen mit lokalem Docker Container](#22-testen-mit-lokalem-server)
3. [Contribution Guidelines](#3-contribution-guidelines)

### **1. Generelle Projektstruktur**

Die [Hauptapp](app.js) enthält zentrale Komponenten für die Slack App wie Error Handling und die Erstellung des Home-Views.
Im Ordner [`/helper`](/helper) gibt es für jede Komponente ein Unterverzeichnis. Zusätzlich gibt es ein Unterverzeichnis [`/helper/general`](/helper/general) für allgemeine Funktionen und Komponenten.

Ich habe versucht den Code innerhalb der Komponenten bestmöglich zu Kapseln. Hauptaugenmerk lag hierbei auf der Unterscheidung zwischen der `app.js` und `views.js`. Die `app.js` nimmt die Anpassungen an der Slack App vor und implementiert die erforderliche Logik. Die Views, die z.B. für Nachrichten, Modals und den Homeview genutzt werden sind in der `views.js` definiert und werden mit Hilfe exportierter Funktionen abgerufen.

Alle anderen Versuche den Code zu kapseln sind als nicht festgelegt zu betrachten und meist historisch gewachsen. Sie können also gerne umstrukturiert werden, eventuell nach vorheriger Absprache.

### **2. Slack App Entwicklung**

Slack hat eine sehr gute [API Dokumentation](https://api.slack.com/docs). Hier finden sich alle verfügbaren Methoden und Konzepte.

Slack hat ein eigenes Framework entwickelt, welches das Aufsetzen und Entwickeln von Slack Apps deutlich vereinfach: [Bolt](https://slack.dev/bolt-js/concepts). Hier können wieder viele Beispiele und Konzepte gefunden werden.

Um Layouts für Nachrichten, Popups und den Homeview zu testen kann man einfach den [Block Kit Builder](https://api.slack.com/tools/block-kit-builder) von Slack nutzen. Ist man bei seinem Workspace angemeldet kann man sich die Nachrichten probeweise schicken lassen, oder sogar die Metadaten von Aktionen wie Buttonklicks sehen.

#### 2.1 Testen mit Glitch

Da Docker das Testen in der Produktivumgebung etwas verlangsamt und man im Zweifel seine Features erstmal lokal testen möchte habe ich oft auf [Glitch](https://glitch.com/) zurückgegriffen. Angemeldet mit Github kann man hier ein Projekt erstellen und es läuft während man entwickelt ein Server, der von Slack angesprochen werden kann. Auch wenn es als Entwicklungsumgebung sagen wir ausbaufähig ist, so kann man doch seine Änderungen innerhalb weniger Sekunden testen. Dafür legt man ein neues Projekt an (oder "remixt" die offizielle [Bolt Vorlage](https://glitch.com/edit/#!/bolt-app-template)) und kopiert seine Projektfiles ins Glitch Projekt. Hier läuft direkt der Server. Drückt man unten auf "Preview", dann auf die 3 Punkte und kopiert sich den Link, kann dieser genau wie die eigene Server URL genutzt werden, um die Slack App statt mit dem eigenen Server mit dem Glitch Server zu verbinden. Möchte man möglichst wenig an der Produktionsapp verändern kann man sich einfach eine Test-Slackapp anlegen, welche die Glitch URL für alles nutzt. Nimmt man nun Änderungen am Code in Glitch vor, werden die Änderungen sofort aktiviert und man kann in Slack testen.

#### 2.2 Testen mit lokalem Server

Die zweite, etwas geschicktere Möglichkeit ist es, das fertige Docker Image direkt als Container auf seiner lokalen Maschine zu starten.
Mit AWS Lambda und dem "serverless offline" Paket läuft das relativ identisch. Die Funktion kann einfach per Befehl gestartet werden:

```
serverless offline --noPrependStageInUrl
```

Dieser Server / diese Funktion muss dann öffentlich im Internet verfügbar gemacht werden. Ich habe das mit [ngrok](https://ngrok.com) erreicht. Hier habe ich die .exe heruntergeladen, per Befehl meinen API Key aus dem ngrok Account gesetzt und dann mit einem Befehl den localhost mit Docker Container Port öffentlich verfügbar gemacht unter einer ngrok Webadresse. Diese kann man dann bei Slack hinterlegen und den lokalen Docker Container/ die Lambda Funktion ansteuern.

```bash
.\ngrok.exe http http://localhost:8080
```

### **3. Contribution Guidelines**

Die [generelle Projektstruktur](#1-generelle-projektstruktur) sollte beibehalten werden.

Wenn eine neue Komponente hinzugefügt wird, sollte diese auch mindestens eine `app.js` und `views.js` Datei in einem neuen Verzeichnis liefern. Außerdem muss die [`apps.js`](/helper/general/apps.js) mit den neuen Dateien ergänzt werden. Die `app.js` muss eine Funktion `setupApp` exportieren, welche die erforderlichen Anpassungen an der Slack App vornimmt (Commands, Actions, Events, etc.). Die `views.js` muss eine Funktion `getHomeView` exportieren, welche einen Teil des Homeviews liefert, der in Slack angezeigt wird und Informationen über die Funktionsweise der Komponente beinhaltet.
