# Agent Instructions: Make My Day

Diese Datei enthält globale Instruktionen und Kontext für jeden KI-Agenten, der an diesem Projekt arbeitet. Lese diese Datei, bevor du größere Änderungen am Code vornimmst.

## 1. Projekt-Kontext & Architektur
- **Projekt:** Make My Day
- **Ziel:** Ein intelligenter, sprachgesteuerter Tagesplaner, optimiert für minimale Interaktionen auf dem Smartphone.
- **Tech-Stack:** Next.js (Progressive Web App), Native Web Speech API für Spracheingabe, Cloud LLMs für NLP, Cloud-Backend (z.B. Vercel/Supabase).

## 2. Der Sprint-Workflow
Die Entwicklung ist in Sprints unterteilt. Agenten arbeiten wie folgt:
1. Prüfe den aktuell aktiven Sprint im Ordner `sprints/` (z.B. `sprint-1.md`).
2. Arbeite die dort definierten Tasks strikt ab.
3. Wenn du einen Task abgeschlossen hast, musst du die Markdown-Datei aktualisieren und den Task als erledigt markieren (`[x]`).
4. Pushe funktionsfähige Zwischenstände in das GitHub-Repository.

## 3. Coding Conventions & Design
- **Mobile First:** Die UI muss primär für kleine Smartphone-Displays entwickelt werden. Große, klickbare Flächen, einfache Menüs.
- **Ästhetik & UI:** Nutze modernes Web-Design. Glasklare Typografie (Inter/Roboto), gut abgestimmte Farben, flüssige Mikro-Animationen und Dark-Mode-Support sind Pflicht. Vermeide generisches "Standard-Aussehen".
- **React/Next.js:** Nutze funktionale Komponenten und moderne React-Hooks. Halte die Komponenten klein und wiederverwendbar.
- **Abhängigkeiten (Dependencies):** Installiere so wenig externe Bibliotheken wie möglich. Nutze z.B. für die Spracherkennung strikt die im Browser verbaute `Web Speech API` und keine fetten Audio-Libraries.

## 4. Sprache und Kommunikation
- Die Kommunikation mit dem User findet auf **Deutsch** statt.
- Der Code selbst (Variablen, Funktionen, Kommentare) sollte auf **Englisch** verfasst sein, wie es dem Industrie-Standard entspricht.
- Kommuniziere stets proaktiv, lösungsorientiert und halte dich kurz. Fokus auf Ausführung.
