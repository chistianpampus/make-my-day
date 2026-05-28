# Anforderungen (Requirements): Make My Day

In diesem Dokument werden die funktionalen und nicht-funktionalen Anforderungen für den intelligenten, sprachgesteuerten Tagesplaner definiert.

## Zielsetzung
Das Projekt **"Make My Day"** ist ein Tool zur Planung des Tages. Ziel ist es, den Tag mit minimalem Interaktionsaufwand auf dem Smartphone zu planen, wobei die Interaktion primär über Sprache erfolgt. Das System soll feste nutzerbasierte Routinen, feste Termine aus dem Google-Kalender und per Sprache erfasste Aufgaben intelligent zu einem übersichtlichen Tagesplan kombinieren.

## Funktionale Anforderungen
- [ ] **Spracheingabe**: Neue TODOs müssen per Spracheingabe (z.B. "Rasenmäher installieren heute vormittag", "Termin für Vorsorge morgen irgendwann") ergänzt werden können.
- [ ] **Backlog-Verwaltung**: Die erfassten, offenen Aufgaben werden in einem Backlog hinterlegt (Speicherung z.B. in einer SQLite-Datenbank oder Text-/MD-Datei).
- [ ] **Nutzerbasierte Prämissen & Routinen**: Das System muss tägliche oder wöchentliche Routinen berücksichtigen (z.B. Schlafengehen um 22:00 Uhr, 1h vorher keine Bildschirmarbeit, mind. 2h vor dem Schlafengehen nichts mehr essen). Diese Prämissen sollen ebenfalls in einer Datenbank oder MD-Datei hinterlegt sein.
- [ ] **Tagesplan-Ansicht**: Es soll stets ein direkt zugreifbarer Tagesplan mit konkreter Uhrzeit angezeigt werden.
- [ ] **Google Calendar Integration**: Feste Termine aus dem Google-Terminkalender müssen berücksichtigt werden.
- [ ] **Intelligente Zeitplanung**:
  - Klare Aussagen aus der Spracheingabe (dass etwas an einem bestimmten Tag / zu einer bestimmten Zeit getan werden soll) müssen priorisiert werden.
  - Verbleibende freie Zeit im Tagesplan soll automatisch mit Aufgaben aus dem Backlog aufgefüllt werden.
- [ ] **Planungs-Prämissen**: Die Planung soll eher großzügig erfolgen, z.B. mit automatischen Pausen von 10-15 Minuten zwischen den einzelnen Tätigkeiten.

## Nicht-funktionale Anforderungen
- [ ] **Mobile Usability**: Das Tool soll auf dem Handy über minimal wenige Interaktionen zugreifbar sein.
- [ ] **Effizienz**: Die Operationen (z.B. Aufgaben ergänzen) sollen mit jeweils möglichst wenigen Iterationen möglich sein.
