# Schwerathletik Mannheim Slack Service Bot
Slack Bot für administrative Aufgaben innerhalb Schwerathletik Mannheim 2018 e.V.

## Setup
Grundlegend und ausreichend ist ein Server, auf dem [Docker](https://www.docker.com/) läuft. Hier kann das Image aus diesem Repository aufgespielt und konfiguriert werden. Ich denke man könnte direkt einen Docker Service anmieten, da ich aber bereits einen Linux Server hatte, habe ich nicht weiter in diese Richtung recherchiert.

Hier im Setup werde ich die Schritte auflisten, die ich beim Aufsetzen meines Servers und des Service Bots durchgeführt habe.

**Wo immer möglich habe ich Links zu Guides eingefügt. Trotzdem kann hier oder auch an anderen Stellen eine kurze Google Recherche notwendig sein.**

1. [Server aufsetzen](#1-server-aufsetzen)
2. [Google und Slack Zugangsdaten holen](#2-google-und-slack-zugangsdaten-holen)
3. [Docker Image starten](#3-docker-image-starten)
4. [Slack App verlinken](#4-slack-app-verlinken)
5. [Google Sheets verknüpfen](#5-google-sheets-verkn%C3%BCpfen)

### 1. Server aufsetzen
- [Server mieten](#server-mieten)
- [*[optional]* Domain kaufen und verlinken](#optional-domain-kaufen-und-verlinken)
- [Server sichern](#server-sichern)
- [Docker installieren](#docker-installieren)
- [*[optional]* Nginx Proxy Manager](#optional-nginx-proxy-manager)

#### Server mieten
Ich habe mich auf Grund des Preis-/Leistungsverhältnisses für einen Server von [Netcup](https://www.netcup-sonderangebote.de/) entschieden. Das Produkt ist ein VPS (Virtual Private Server) mit 2GB Arbeitsspeicher und 20GB Festplatte.

#### *[optional]* Domain kaufen und verlinken
Eine Domain wird nicht unbedingt benötigt, da man auch über die IP des Servers zugreifen kann. Falls man dennoch eine möchte muss man diese kaufen/mieten und mit dem Server verlinken. Bei Netcup geht das im [Customer Control Panel](https://www.customercontrolpanel.de/).

#### Server sichern
Nun geht es ans technische Einrichten des Servers. Hierbei habe ich mich auf die Basics beschränkt diesen zu sichern. Dazu gibt es einmal ein paar [generelle Hinweise](https://forum.netcup.de/administration-eines-server-vserver/vserver-server-kvm-server/10174-basics-administration-eines-virtuellen-oder-dedizierten-linux-servers/), [Fail2Ban](https://www.digitalocean.com/community/tutorials/how-to-protect-ssh-with-fail2ban-on-ubuntu-14-04) und den [Remote Zugriff per SSH](https://linuxhint.com/enable_ssh_debian_10/). Außerdem habe ich mir einen User mit root Berechtigungen angelegt und den root User deaktiviert für zusätzliche Sicherheit. [Guide](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-20-04)

[Fail2Ban](https://www.the-lazy-dev.com/en/install-fail2ban-with-docker/) gibts auch für Docker, habe ich aktuell noch nicht.

#### Docker installieren
Docker ist das Herz wenn man das Image laufen lassen möchte. Es gibt eine ausführliche [Dokumentation](https://docs.docker.com/engine/install/ubuntu/).

#### *[optional]* Nginx Proxy Manager
SSL Verschlüsselung, Subdomains und Ports für Docker Container festlegen kann auf Linux Servern echt nervtötend sein. Mit Nginx bekommt man einen Manager mit UI, welcher sehr leicht zu konfigurieren ist. [Setup](https://nginxproxymanager.com/setup/#running-the-app)

### 2. Google und Slack Zugangsdaten holen
tbd

### 3. Docker Image starten
tbd

### 4. Slack App verlinken
tbd

### 5. Google Sheets verknüpfen
tbd



## Funktionen
Der Service Bot hat verschiedene Funktionen und ist in Bereiche unterteilt. Die generellen Funktionen und Besonderheiten werden hier erläutert.

1. [Pollz](#1-pollz)
2. [Staette](#2-staette)
3. [Arbeitsstunden](#3-arbeitsstunden)

### 1. Pollz
tbd

### 2. Staette
tbd

### 3. Arbeitsstunden
tbd

## Version
2.0
