# Schwerathletik Mannheim Slack Service Bot

Slack Bot für administrative Aufgaben innerhalb Schwerathletik Mannheim 2018 e.V.

**Inhalt**

- [Setup](#setup)
- [Funktionen](#funktionen)
- [Upgrades & Contribution](#upgrades--contribution)

## Setup

Grundlegend und ausreichend ist ein Server, auf dem [Docker](https://www.docker.com/) läuft. Hier kann das Image aus diesem Repository aufgespielt und konfiguriert werden. Ich denke man könnte direkt einen Docker Service anmieten, da ich aber bereits einen Linux Server hatte, habe ich nicht weiter in diese Richtung recherchiert.

Hier im Setup werde ich die Schritte auflisten, die ich beim Aufsetzen meines Servers und des Service Bots durchgeführt habe.

**Wo immer möglich habe ich Links zu Guides eingefügt. Trotzdem kann hier oder auch an anderen Stellen eine kurze Google Recherche notwendig sein.**

1. [Server aufsetzen](#1-server-aufsetzen)
2. [Google Sheets einrichten](#2-google-sheets-einrichten)
3. [Google und Slack Zugangsdaten holen](#3-google-und-slack-zugangsdaten-holen)
4. [Docker Image starten](#4-docker-image-starten)
5. [Slack App Konfiguration](#5-slack-app-konfiguration)

### **1. Server aufsetzen**

- [Server mieten](#server-mieten)
- [_[optional]_ Domain kaufen und verlinken](#optional-domain-kaufen-und-verlinken)
- [Server sichern](#server-sichern)
- [Docker installieren](#docker-installieren)
- [_[optional]_ Nginx Proxy Manager](#optional-nginx-proxy-manager)

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

tbd: docker-compose verlinken

### **2. Google Sheets einrichten**

Für die Integration mit Google Sheets wird die offizielle Google Sheets API genutzt, die über eine sehr gute [Dokumentation](https://developers.google.com/sheets/api/guides/concepts) verfügt.
In der [Google Cloud Console](console.cloud.google.com/welcome) können die persönlichen Projekte eingesehen werden. Ich habe das Projekt aktuell auf meinem persönlichen Gmail Account. Mitarbeiter hinzufügen geht dort nicht. Hier könnte man in Zukunft schauen es auf einen Schwerathletik-Organisationsaccount umzuhängen.

Danach muss die Google Sheets API im Projekt [aktiviert](https://console.cloud.google.com/flows/enableapi?apiid=sheets.googleapis.com&hl=de) werden.

Nun wird noch ein Dienstkonto benötigt. Das kann [hier](https://console.cloud.google.com/iam-admin/serviceaccounts?hl=de) errstellt werden.

### **3. Google und Slack Zugangsdaten holen**

Slack

Wenn du aktuell in deinem Workspace angemeldet bist kommst du [hier](https://api.slack.com/apps) zu deinen Slack Apps. Wenn du als Contributor zu eine App hinzugefügt wurdest oder die App selbst erstellt hast kannst du sie hier in der Liste sehen. Direkt auf der ersten Seite _"Basic Information"_ kannst du das Signing Secret der App sehen. Im Abschnitt _"OAuth & Permissions"_ kannst du das Bot Token finden, sobald die App auf dem Workspace installiert ist. Sollte das nicht reichen musst du auch direkt die Scopes für den Bot hinzufügen wie in [Sektion 5](#5-slack-app-konfiguration) beschrieben.

Google

Wenn du allen Schritten im Punkt [2. Google Sheets einrichten](#2-google-sheets-einrichten) gefolgt bist kannst du jetzt zum angelegten Dienstkonto navigieren. Hier kannst du in den Details einen Schlüssel erstellen, den du beim einrichten der [Arbeitsstunden](#3-arbeitsstunden) Funktion brauchst.

### **4. Docker Image starten**

Um das Docker Image zu starten sollte die [docker-compose.yml](docker-compose.yml) auf den Server kopiert werden. Hier müssen die mit `#` gefüllten Environment Variablen angepasst werden. Generell sind auf jeden Fall `SLACK_SIGNING_SECRET` und `SLACK_BOT_TOKEN` zu füllen. Funktionsspezifische Variablen werden im Abschnitt [Funktionen](#funktionen) erläutert. In die Variable `APP_ADMIN` kann die Slack-ID des Administrators eingetragen werden. Dieser erhält die Fehlermeldungen der App als Slack Nachricht.

Während man im Verzeichnis ist kann man dann mit den folgenden Kommandos die neuste Version der Images ziehen und den Container starten:

```bash
sudo docker-compose pull && sudo docker-compose up -d
```

Sollte man keinen [NPM](#optional-nginx-proxy-manager) verwenden, muss der Abschnitt `networks` aus der [docker-compose.yml](docker-compose.yml) gelöscht werden:

```
networks:
  proxy:
    external:
      name: proxy
```

### **5. Slack App Konfiguration**

_Hier gehe ich nur auf die technische und nicht die optische Konfiguration der App ein._

Wenn du in deinem Slack Workspace angemeldet bist kannst du [hier](https://api.slack.com/apps) deine Slack Apps sehen. Hast du deine App ausgewählt kannst du die Details bearbeiten.

- **App Home**: `Home Tab`, `Messages Tab` und `Allow users to send Slash commands and messages from the messages tab` aktivieren
- **Interactivity & Shortcuts**: `Interactivity` aktivieren. `Request URL` und `Options Load URL` auf die URL setzen, unter der das [Docker Image](#4-docker-image-starten) erreichbar ist (+ /slack/events ans Ende der URL)
- **Slash Commands**: Hier müssen alle Kommandos hinzugefügt werden, die von der App zur Verfügung gestellt werden. Wichtig ist `Escape channels, users, and links sent to your app` immer zu aktivieren. Auch hier sollte die URL auf die URL gesetzt werden, unter der das [Docker Image](#4-docker-image-starten) erreichbar ist (+ /slack/events ans Ende der URL)
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
- **Event Subscriptions**: `Enable Events` aktivieren. Auch hier sollte die URL auf die URL gesetzt werden, unter der das [Docker Image](#4-docker-image-starten) erreichbar ist (+ /slack/events ans Ende der URL). Bei `Subscribe to bot events` die benötigten Events hinzufügen:
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

Staette stellt aktuell das Kommando `/weristda` zur Verfügung. Dafür muss die [Environment Variable](#4-docker-image-starten) `STAETTE_CHANNEL` mit der ID des Channels gefüllt werden in dem die Abfragen landen sollen.

Das Docker Image beinhaltet außerdem einen Cronjob, welcher täglich um 1 Uhr CET läuft und die Abfragen von vergangenen Tagen automatisch löscht. Der Admin hat die Option darüber benachrichtigt zu werden um möglicherweise falsches Systemverhalten besser zu untersuchen. Dafür muss er nur die [Environment Variable](#4-docker-image-starten) `CRONJOB_LOG_TO_ADMIN` setzen. Möchte er nicht benachrichtigt werden kann diese Variable aus dem [docker-compose.yml](docker-compose.yml) gelöscht werden.

### **3. Arbeitsstunden**

Arbeitsstunden stellt die Kommandos `/arbeitsstunden_anzeigen` und `/arbeitsstunden_erfassen` zur Verfügung. Außerdem konsumiert dieser Teil das Event `team_join` um die Verknüpfung zwischen Slack-ID und Mitglieder-Excel herzustellen.

Für diesen Bereich müssen die [Environment Variablen](#4-docker-image-starten) `SHEET_ID` und `GOOGLE_APPLICATION_CREDENTIALS` gefüllt werden.

Die `SHEET_ID` findet man in der URL der Tabelle um die es geht. Sie steht zwischen `docs.google.com/spreadsheets/d/` und dem nächsten `/`.

Bei den `GOOGLE_APPLICATION_CREDENTIALS` wird der Pfad **im Docker Container** zu einer `secret.json` Datei angegeben. Diese Datei enthält die Daten, die beim erstellen der [Google Zugangsdaten](#3-google-und-slack-zugangsdaten-holen) heruntergeladen wurden. Da die Docker Container bei jedem neu erstellen ihre Daten verlieren, können gewisse Verzeichnisse auf die Verzeichnisse des Servers _gemounted_ werden. Das heißt, dass Dateien, die hier auf dem Server liegen auch immer im angegebenen Verzeichnis im Container verfügbar sind. Im [docker-compose.yml](docker-compose.yml) ist vorgesehen, dass im Ordner dieser Datei ein weiterer Ordner `volume` existiert, in welchem die `secret.json` liegen soll. Folgender Teil im [docker-compose.yml](docker-compose.yml) führt das "mounting" durch:

```
volumes:
    - ./volume:/var/lib/files
```

## Upgrades & Contribution

WIP

## Version

2.0
