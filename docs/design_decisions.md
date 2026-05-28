# Designentscheidungen (Architecture Decision Records - ADRs)

Hier werden wichtige Architektur- und Designentscheidungen dokumentiert. Dies hilft dabei, den Kontext und die Gründe für bestimmte technische Entscheidungen auch später noch nachvollziehen zu können.

## Vorlage für einen neuen Eintrag

### [Datum] - [Kurzer Titel der Entscheidung]
**Status:** [Vorgeschlagen | Akzeptiert | Abgelehnt | Veraltet]

**Kontext:** 
*Warum muss diese Entscheidung getroffen werden? Was ist das zugrundeliegende Problem? Welche Alternativen gibt es?*

**Entscheidung:** 
*Welche Option wurde gewählt und warum (inkl. Begründung)?*

**Konsequenzen:** 
*Welche Auswirkungen hat diese Entscheidung? (z.B. "Gut, weil X", "Schlecht, weil wir Y tun müssen")*

---

## Log der Entscheidungen

### 2026-05-28 - Initiale Projektstruktur
**Status:** Akzeptiert

**Kontext:** 
Das Projekt wird gestartet und es wird ein Ort für wichtige Dokumentationen benötigt, bevor mit der Implementierung begonnen wird.

**Entscheidung:** 
Wir legen ein `docs/` Verzeichnis mit dedizierten Markdown-Dateien für Anforderungen, Architektur und Designentscheidungen an.

**Konsequenzen:** 
- Gut: Wichtige Projektinformationen sind versioniert und nahe am zukünftigen Code.
- Gut: Jeder Entwickler kann die Dokumentation leicht lesen und bearbeiten.
