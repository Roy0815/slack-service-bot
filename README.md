# Schwerathletik Mannheim Slack Service Bot

Slack Bot für administrative Aufgaben innerhalb Schwerathletik Mannheim 2018 e.V.

**Inhalt**

- [Setup](#setup)
- [Funktionen](#funktionen)
- [Upgrades & Contribution](#upgrades--contribution)

## Setup

Grundlegend und ausreichend ist ein Server, auf dem [Docker](https://www.docker.com/) läuft. Hier kann das Image aus diesem Repository aufgespielt und konfiguriert werden.
Alternativ kann auch ein Cloud Service für Docker direkt genutzt werden, was ich hier am Beispiel Google Cloud Run kurz erläutere.

Hier im Setup werde ich die Schritte auflisten, die ich beim Aufsetzen meines Servers und des Service Bots durchgeführt habe.

**Wo immer möglich habe ich Links zu Guides eingefügt. Trotzdem kann hier oder auch an anderen Stellen eine kurze Google Recherche notwendig sein.**

1. [Google Sheets einrichten](#1-google-sheets-einrichten)
1. [Google und Slack Zugangsdaten holen](#2-google-und-slack-zugangsdaten-holen)
1. Umgebung für Docker wählen **(eine der beiden, ich empfehle Google Cloud Run)**
   1. [Server aufsetzen](#31-server-aufsetzen)
   1. [Google Cloud Run aufsetzen](#32-google-cloud-run-aufsetzen)
1. [Slack App Konfiguration](#4-slack-app-konfiguration)

### **1. Google Sheets einrichten**

Für die Integration mit Google Sheets wird die offizielle Google Sheets API genutzt, die über eine sehr gute [Dokumentation](https://developers.google.com/sheets/api/guides/concepts) verfügt.
In der [Google Cloud Console](console.cloud.google.com/welcome) können die persönlichen Projekte eingesehen werden. Ich habe das Projekt aktuell auf meinem persönlichen Gmail Account. Mitarbeiter hinzufügen geht dort nicht. Hier könnte man in Zukunft schauen es auf einen Schwerathletik-Organisationsaccount umzuhängen.

Danach muss die Google Sheets API im Projekt [aktiviert](https://console.cloud.google.com/flows/enableapi?apiid=sheets.googleapis.com&hl=de) werden.

Nun wird noch ein Dienstkonto benötigt. Das kann [hier](https://console.cloud.google.com/iam-admin/serviceaccounts?hl=de) errstellt werden.

Die Email des Dienstkontos muss als Bearbeiter bei der Google Sheet Datei hinzugefügt werden.

### **2. Google und Slack Zugangsdaten holen**

Slack

Wenn du aktuell in deinem Workspace angemeldet bist kommst du [hier](https://api.slack.com/apps) zu deinen Slack Apps. Wenn du als Contributor zu eine App hinzugefügt wurdest oder die App selbst erstellt hast kannst du sie hier in der Liste sehen. Direkt auf der ersten Seite _"Basic Information"_ kannst du das Signing Secret der App sehen. Im Abschnitt _"OAuth & Permissions"_ kannst du das Bot Token finden, sobald die App auf dem Workspace installiert ist. Sollte das nicht reichen musst du auch direkt die Scopes für den Bot hinzufügen wie in [Sektion 4](#4-slack-app-konfiguration) beschrieben.

Google

Wenn du allen Schritten im Punkt [1. Google Sheets einrichten](#1-google-sheets-einrichten) gefolgt bist kannst du jetzt zum angelegten Dienstkonto navigieren. Hier kannst du in den Details einen Schlüssel erstellen, den du beim einrichten der [Arbeitsstunden](#3-arbeitsstunden) Funktion brauchst.

### **3.1 Server aufsetzen**

- [Server mieten](#server-mieten)
- [_[optional]_ Domain kaufen und verlinken](#optional-domain-kaufen-und-verlinken)
- [Server sichern](#server-sichern)
- [Docker installieren](#docker-installieren)
- [_[optional]_ Nginx Proxy Manager](#optional-nginx-proxy-manager)
- [Docker Image starten](#docker-image-starten)

#### **Server mieten**

Ich habe mich auf Grund des Preis-/Leistungsverhältnisses für einen Server von [Netcup](https://www.netcup-sonderangebote.de/) entschieden. Das Produkt ist ein VPS (Virtual Private Server) mit 2GB Arbeitsspeicher und 20GB Festplatte.

#### **_[optional]_ Domain kaufen und verlinken**

Eine Domain wird nicht unbedingt benötigt, da man auch über die IP des Servers zugreifen kann. Falls man dennoch eine möchte muss man diese kaufen/mieten und mit dem Server verlinken. Bei Netcup geht das im [Customer Control Panel](https://www.customercontrolpanel.de/).

#### **Server sichern**

Nun geht es ans technische Einrichten des Servers. Hierbei habe ich mich auf die Basics beschränkt diesen zu sichern. Dazu gibt es einmal ein paar [generelle Hinweise](https://forum.netcup.de/administration-eines-server-vserver/vserver-server-kvm-server/10174-basics-administration-eines-virtuellen-oder-dedizierten-linux-servers/), [Fail2Ban](https://www.digitalocean.com/community/tutorials/how-to-protect-ssh-with-fail2ban-on-ubuntu-14-04) und den [Remote Zugriff per SSH](https://linuxhint.com/enable_ssh_debian_10/). Außerdem habe ich mir einen User mit root Berechtigungen angelegt und den root User deaktiviert für zusätzliche Sicherheit. [Guide](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-20-04)

[Fail2Ban](https://www.the-lazy-dev.com/en/install-fail2ban-with-docker/) gibts auch für Docker, habe ich aktuell noch nicht.

#### **Docker installieren**

Docker ist das Herz wenn man das Image laufen lassen möchte. Es gibt eine ausführliche [Dokumentation](https://docs.docker.com/engine/install/ubuntu/).

Nach der Installation muss der Docker Daemon [gestartet](https://docs.docker.com/config/daemon/start/) werden.

#### **_[optional]_ Nginx Proxy Manager**

SSL Verschlüsselung, Subdomains und Ports für Docker Container festlegen kann auf Linux Servern echt nervtötend sein. Mit Nginx bekommt man einen Manager mit UI, welcher sehr leicht zu konfigurieren ist. [Setup](https://nginxproxymanager.com/setup/#running-the-app)

Für den NPM ist es notwendig ein Docker Netzwerk zu [erstellen](https://docs.docker.com/engine/reference/commandline/network_create/), welches es den Containern ermöglicht untereinander zu kommunizieren.

Beispiel: [`docker-compose.yml`](/example-docker-compose-files/npm-docker-compose.yml) für NPM

Hier müssen die mit `#` gefüllten Variablen festgelegt werden. Ich weiß nicht mehr genau ob NPM die User für die Datenbank im Container selbst anlegt, oder ob man das manuell übernehmen muss.

#### **Docker Image starten**

Um das Docker Image zu starten sollte die [docker-compose.yml](docker-compose.yml) auf den Server kopiert werden. Hier müssen die mit `#` gefüllten Environment Variablen angepasst werden. Generell sind auf jeden Fall `SLACK_SIGNING_SECRET` und `SLACK_BOT_TOKEN` zu füllen. Funktionsspezifische Variablen werden im Abschnitt [Funktionen](#funktionen) erläutert. In die Variable `APP_ADMIN` kann die Slack-ID des Administrators eingetragen werden. Dieser erhält die Fehlermeldungen der App als Slack Nachricht.

Während man im Verzeichnis ist kann man dann mit den folgenden Kommandos die neuste Version der Images ziehen und den Container starten:

```bash
sudo docker-compose pull && sudo docker-compose up -d
```

Sollte man keinen [NPM](#optional-nginx-proxy-manager) verwenden, muss der Abschnitt `networks` aus der [`docker-compose.yml`](docker-compose.yml) gelöscht werden:

```
networks:
  proxy:
    external:
      name: proxy
```

### **3.2 Google Cloud Run aufsetzen**

- [Secrets anlegen](#secrets-anlegen)
- [Docker container konfigurieren](#docker-container-konfigurieren)
- [Automatischen Docker Build auf main branch aufsetzen](#automatischen-docker-build-auf-main-branch-aufsetzen)

#### Secrets anlegen

Im angelegten Google Projekt zum [Secret Manager](https://console.cloud.google.com/security/secret-manager) navigieren und diesen aktivieren. Hier kann man dann ein neues Secret erstellen und die Datei aus Schritt [2. Google und Slack Zugangsdaten holen](#2-google-und-slack-zugangsdaten-holen) für Google Sheets hochladen.

#### Docker container konfigurieren

[Google Cloud Run](https://console.cloud.google.com/run) aktivieren und einen neuen Dienst erstellen.

Wenn das Container Image auf Dockerhub ist, ist die URL docker.io/{user}/{repository}:{tag}

In der weiteren Konfiguration habe ich zunächst eingestellt:
Max. Anzahl Instanzen: 10
Port: 8080
CPU Limit: 2
Arbeitsspeicher Limit: 512 MB
Umgebungsvariablen: siehe [Docker Image starten](#docker-image-starten) (lediglich die `GOOGLE_APPLICATION_CREDENTIALS` müssen angepasst werden)

Für die `GOOGLE_APPLICATION_CREDENTIALS` muss ein Volume für das Secret erstellt werden, welches zuvor angelegt wurde. Als Bereistellungspfad im Volume habe ich `/var/lib/files/google-sheets` gewählt.
Dieser Pfad muss bei der Umgebungsvariable eingetragen werden.

#### Automatischen Docker Build auf main branch aufsetzen

In der Cloud Run Konsole, im Slack Service Dienst den Button "Kontinuierliche Bereitstellung bearbeiten" drücken. Hier wird man in wenigen Schritten durch die Konfiguration geleitet, welche recht selbsterklärend ist:

- Google Build API aktivieren
- GitHub Repository verlinken und Google Build API berechtigen
- auf Main branch einschränken und speichern

### **4. Slack App Konfiguration**

_Hier gehe ich nur auf die technische und nicht die optische Konfiguration der App ein._

Wenn du in deinem Slack Workspace angemeldet bist kannst du [hier](https://api.slack.com/apps) deine Slack Apps sehen. Hast du deine App ausgewählt kannst du die Details bearbeiten.

- **App Home**: `Home Tab`, `Messages Tab` und `Allow users to send Slash commands and messages from the messages tab` aktivieren
- **Interactivity & Shortcuts**: `Interactivity` aktivieren. `Request URL` und `Options Load URL` auf die URL setzen, unter der das [Docker Image](#4-docker-image-starten) erreichbar ist (+ /slack/events ans Ende der URL)
- **Slash Commands**: Hier müssen alle Kommandos hinzugefügt werden, die von der App zur Verfügung gestellt werden. Wichtig ist `Escape channels, users, and links sent to your app` immer zu aktivieren. Auch hier sollte die URL auf die URL gesetzt werden, unter der das Docker Image (entweder [Cloud Run](#32-google-cloud-run-aufsetzen) oder [Server](#docker-image-starten)) erreichbar ist (+ /slack/events ans Ende der URL)
- **OAuth & Permissions**: Alle benötigten Scopes hinzufügen:
  |OAuth Scope|Description|
  |:---:|:---|
  |`channels:history`|View messages and other content in public channels that Schwerathletik Mannheim Service has been added to|
  |`channels:read`|View basic information about public channels in a workspace|
  |`chat:write`|Send messages as @Schwerathletik Mannheim Service|
  |`chat:write.public`|Send messages to channels @Schwerathletik Mannheim Service isn't a member of|
  |`commands`|Add shortcuts and/or slash commands that people can use|
  |`files:write`|Upload, edit, and delete files as Schwerathletik Mannheim Service|
  |`groups:history`|View messages and other content in private channels that Schwerathletik Mannheim Service has been added to|
  |`groups:read`|View basic information about private channels that Schwerathletik Mannheim Service has been added to|
  |`im:history`|View messages and other content in direct messages that Schwerathletik Mannheim Service has been added to|
  |`im:read`|View basic information about direct messages that Schwerathletik Mannheim Service has been added to|
  |`im:write`|Start direct messages with people|
  |`users:read`|View people in a workspace|
- **Event Subscriptions**: `Enable Events` aktivieren. Auch hier sollte die URL auf die URL gesetzt werden, unter der das Docker Image (entweder [Cloud Run](#32-google-cloud-run-aufsetzen) oder [Server](#docker-image-starten)) erreichbar ist (+ /slack/events ans Ende der URL). Bei `Subscribe to bot events` die benötigten Events hinzufügen:
  |Event Name|Description|
  |:---:|:---|
  |`app_home_opened`|User clicked into your App Home|
  |`team_join`|A new member has joined|
- **User ID Translation**: `Translate Global IDs` aktivieren

## Funktionen

Der Service Bot hat verschiedene Funktionen und ist in Bereiche unterteilt. Dieses Kapitel erläutert die Besonderheiten und erwähnt die zur Verfügung gestellten Endpunkte. Die genauen Beschreibungen der Kommandos können dem Home-Tab der App in Slack entnommen werden.

Die zentrale App verarbeitet das Event `app_home_opened`.

1. [Pollz](#1-pollz)
2. [Staette](#2-staette)
3. [Arbeitsstunden](#3-arbeitsstunden)

### **1. Pollz**

Pollz hat aktuell nur eine Funktion und die ist das Kommando `/umfrage`. Es gibt keine Besonderheiten zu beachten.

### **2. Staette**

Staette stellt aktuell das Kommando `/weristda` zur Verfügung. Dafür muss die [Environment Variable](#docker-image-starten) `STAETTE_CHANNEL` mit der ID des Channels gefüllt werden in dem die Abfragen landen sollen.

Das Docker Image beinhaltet außerdem einen Cronjob, welcher täglich um 1 Uhr CET läuft und die Abfragen von vergangenen Tagen automatisch löscht. Der Admin hat die Option darüber benachrichtigt zu werden um möglicherweise falsches Systemverhalten besser zu untersuchen. Dafür muss er nur die [Environment Variable](#docker-image-starten) `CRONJOB_LOG_TO_ADMIN` setzen. Möchte er nicht benachrichtigt werden kann diese Variable aus dem [`docker-compose.yml`](docker-compose.yml) gelöscht werden.

### **3. Arbeitsstunden**

Arbeitsstunden stellt die Kommandos `/arbeitsstunden_anzeigen` und `/arbeitsstunden_erfassen` zur Verfügung. Außerdem konsumiert dieser Teil das Event `team_join` um die Verknüpfung zwischen Slack-ID und Mitglieder-Excel herzustellen.

Für diesen Bereich müssen die [Environment Variablen](#docker-image-starten) `SHEET_ID` und `GOOGLE_APPLICATION_CREDENTIALS` gefüllt werden.

Die `SHEET_ID` findet man in der URL der Tabelle um die es geht. Sie steht zwischen `docs.google.com/spreadsheets/d/` und dem nächsten `/`.

Bei den `GOOGLE_APPLICATION_CREDENTIALS` wird der Pfad **im Docker Container** zu einer `secret.json` Datei angegeben. Diese Datei enthält die Daten, die beim erstellen der [Google Zugangsdaten](#2-google-und-slack-zugangsdaten-holen) heruntergeladen wurden. Da die Docker Container bei jedem neu erstellen ihre Daten verlieren, können gewisse Verzeichnisse auf die Verzeichnisse des Servers _gemounted_ werden. Das heißt, dass Dateien, die hier auf dem Server liegen auch immer im angegebenen Verzeichnis im Container verfügbar sind. Im [`docker-compose.yml`](docker-compose.yml) ist vorgesehen, dass im Ordner dieser Datei ein weiterer Ordner `volume` existiert, in welchem die `secret.json` liegen soll. Folgender Teil im [`docker-compose.yml`](docker-compose.yml) führt das "mounting" durch:

```
volumes:
    - ./volume:/var/lib/files
```

**Google Sheet Struktur**

Das Google Sheet erwartet eine spezielle Struktur. Bei den Sheets kommt es auf die Namen an, bei den Spalten nur auf die Reihenfolge, nicht die Titel. Sollte die Struktur unbedingt verändert werden müssen, muss auch der Code angepasst werden (x steht jeweils für das Jahr):

1. Sheet `Allg Daten`
   ![Struktur Sheet Allg Daten](/images/%5BARBEITSSTUNDEN%5D%20Sheet%20Allg%20Daten.png)
2. Sheet `Arbeitseinsätze x`

   ![Struktur Sheet Arbeitseinsätze x](/images/%5BARBEITSSTUNDEN%5D%20Sheet%20Arbeitseins%C3%A4tze%20x.png)

3. Sheet `Summe Stunden x`
   ![Struktur Sheet Summe Stunden x](/images/%5BARBEITSSTUNDEN%5D%20Sheet%20Summe%20Stunden%20x.png)

Das erste valide Jahr ist 2022. Sollte ein User eine Abfrage für ein Jahr starten, für das es noch kein Sheet gibt, so kopiert die App die beiden Sheets des letzten Jahres und leert alle Arbeitseinsätze. Die Soll-Stunden, sowie der Admin Channel können im "Summe Stunden x" Sheet angepasst werden.

## Upgrades & Contribution

1. [Generelle Projektstruktur](#1-generelle-projektstruktur)
2. [Slack App Entwicklung](#2-slack-app-entwicklung)
   1. [Testen mit Glitch (Live Webserver)](#21-testen-mit-glitch)
   1. [Testen mit lokalem Docker Container](#22-testen-mit-lokalem-docker-container)
3. [Docker Image Deployment](#3-docker-image-deployment)
4. [Contribution Guidelines](#4-contribution-guidelines)

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

#### 2.2 Testen mit lokalem Docker Container

Die zweite, etwas geschicktere Möglichkeit ist es, das fertige Docker Image direkt als Container auf seiner lokalen Maschine zu starten. Dieser muss dann öffentlich im Internet verfügbar gemacht werden. Ich habe das mit [ngrok](https://ngrok.com) erreicht. Hier habe ich die .exe heruntergeladen, per Befehl meinen API Key aus dem ngrok Account gesetzt und dann mit einem Befehl den localhost mit Docker Container Port öffentlich verfügbar gemacht unter einer ngrok Webadresse. Diese kann man dann bei Slack hinterlegen und den lokalen Docker Container ansteuern.

```bash
ngrok http http://localhost:8080`
```

### **3. Docker Image Deployment**

Möchte man Änderungen am Code nun auf den Server Deployen muss man folgende Schritte ausführen:

1. Account bei einem Docker Hub erstellen (ich bin bei [hub.docker.com](https://hub.docker.com/), da es einfach und kostenlos war)
2. öffentliches Image anlegen
3. in deiner lokalen IDE Docker installieren ([Guide](https://docs.docker.com/get-docker/))
4. bei Dockerhub einloggen

```bash
docker login -u *username*
```

5. Docker Image erstellen

```bash
docker build -t *username*/*imagename* .
```

6. Docker Image pushen

```bash
docker push *username*/*imagename*
```

7. auf dem Server ins Verzeichnis der `docker-compose.yml` gehen, die neusten Images ziehen und Container neu erstellen

```bash
sudo docker-compose pull && sudo docker-compose up -d
```

8. regelmäßig die alten Images vom Server entfernen um Speicher freizugeben

```bash
sudo docker image prune
```

### **4. Contribution Guidelines**

Die [generelle Projektstruktur](#1-generelle-projektstruktur) sollte beibehalten werden.

Wenn eine neue Komponente hinzugefügt wird, sollte diese auch mindestens eine `app.js` und `views.js` Datei in einem neuen Verzeichnis liefern. Außerdem muss die [`apps.js`](/helper/general/apps.js) mit den neuen Dateien ergänzt werden. Die `app.js` muss eine Funktion `setupApp` exportieren, welche die erforderlichen Anpassungen an der Slack App vornimmt (Commands, Actions, Events, etc.). Die `views.js` muss eine Funktion `getHomeView` exportieren, welche einen Teil des Homeviews liefert, der in Slack angezeigt wird und Informationen über die Funktionsweise der Komponente beinhaltet.

## Version

2.0
