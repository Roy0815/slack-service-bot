# Contributing

## Projektstrukur

Die generelle Struktur des Projektes sollte bei Weiterentwicklungen beibehalten werden.

Eigenständige Apps ([Erklärung](../functions-setup/index.md)) bekommen einen eignen Ordner.

Übergreifende Hilfsfunktionen (ohne direkte Slack Interaktion) sind im Ordner `/src/general` eingegliedert.

Nach Möglichkeit sollten neue Funktionen als Workflow Schritte implementiert werden, da Workflows flexibler von nicht-technischen Admins/ Usern angepasst werden können. Nur, wenn die Komplexität der Funktionen sehr hoch ist, ist eine eigenständige Komponente attraktiver.

Workflow Schritte werden im Ordner `/src/workflows` implementiert und in Unterordnern gruppiert.

## Komponenten und Workflow Schritte

Komponenten benötigen mindestens eine `app.js`, die ein `appComponent` exportiert.

Dazu gehört die Funktion `setupApp`, in der alle Bestandteile der App registriert werden, sowie optional die Methode `getHomeView`, um Erklärungen der Komponente auf dem Profil des Bots hinzuzufügen.

Die Komponente wird dann in `/src/general/apps.js` importiert und im Array exportiert.

<<< ../../src/general/types.js#appComponent

Workflow Schritte folgen einem ähnlichen Prinzip.

Jeder Unterordner in `/src/workflows` hat eine `app.js`, welche die Schritte in einer `setupApp` Funktion registriert. In der `/src/workflows/app.js` werden dann alle Workflow Apps gesammelt und exportiert.

## Design Pattern

Als Design Pattern folgt der Bot grob dem Model-View-Controller-Pattern.

Das heißt, jede Komponente oder Workflow Schritt Gruppe sollte unterteilt werden. Die Funktionen in den jeweiligen `app.js` Dateien sollten so kurz wie möglich gehalten und Imports auf ein Minimum begrenzt werden.

Für die Hauptlogik wird ein `controller.js` verwendet, welcher die benötigten Funktionen exportiert, sodass sie von der `app.js` konsumiert werden können.

Weitere übliche Hilfsdateien sind:

| Datei          | Inhalt                                                                                                                                                                                                                                        | Benutzung                                                        |
| -------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `constants.js` | Konstante Werte, die mehrmals benutzt werden oder deren Nutzung zentral bekannt sein sollte                                                                                                                                                   | In `app.js` direkt oder export via `controller.js`               |
| `views.js`     | Definition aller Slack UI Elemente (Blocks und Nachrichten)                                                                                                                                                                                   | In der `controller.js` Import, Kopie und Anpassung               |
| `*models*.js`  | Die Model Dateien steuern die Interaktionen mit anderen Schnittstellen. Muss eine Komponente bspw. mit der Google Sheets API interagieren, wird eine `sheets.js` Datei angelegt für alle Hilfsfunktionen, die mit Google Sheets interagieren. | In `controller.js`, ggf. Export von dort zur Nutzung in `app.js` |
