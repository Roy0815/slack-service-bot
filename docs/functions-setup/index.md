# Einführung

Der Slack Bot besteht aus verschiedenen Komponenten. Es gibt eigenständige Unterapps, welche in `/src` einen eigenen Ordner haben, einzelne Workflow Schritte und externe Webhook Implementierungen.

## Eigenständige Unterapps

Diese Apps implementieren End-to-End Prozesse komplett selbststäntig. Dafür nutzen sie beispielsweise Eintrittspunkte wie so genannte `slash commands` und implementieren alle Schritte der Prozesse vollständig.

Im Ordner `/general` sind zentrale Abhängigkeiten angelegt. Dennoch können einzelne Unterapps gelegentlich von der App [Arbeitsstunden](./components/arbeitsstunden) abhängig sein, da diese sehr ausführlich die Integration mit den Mitgliedsstammdaten implementiert.

Die Einrichtung der Unterapps wird im Kapitel [Komponenten](./components/arbeitsstunden) vorgestellt.
