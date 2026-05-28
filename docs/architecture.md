# Architektur & Technologie-Entscheidungen: Make My Day

Basierend auf den funktionalen Anforderungen und den getroffenen Entscheidungen wird das Projekt mit dem folgenden Technologie-Stack und der folgenden Architektur umgesetzt.

## 1. Frontend & App-Bereitstellung
**Entscheidung:** Progressive Web App (PWA) mit React/Next.js
- **Begründung:** Erlaubt eine sehr schnelle Entwicklung mit modernen Web-Technologien. Die App kann über den Browser auf dem Smartphone auf dem Homescreen "installiert" werden (Add to Homescreen) und bietet so ein App-ähnliches Erlebnis ohne den massiven Overhead nativer App-Entwicklung.
- **Vorteile:** Cross-Platform, schnelles Deployment, reibungsloser Zugriff.

## 2. Spracherkennung (Speech-to-Text)
**Entscheidung:** Native Web Speech API
- **Begründung:** Keine externen APIs nötig, komplett kostenlos und direkt über den Browser nutzbar. Für einfache Diktierfunktionen in der PWA ist die Genauigkeit und Geschwindigkeit der systemeigenen Erkennung (insbesondere auf modernen iOS und Android Geräten) mehr als ausreichend.

## 3. NLP & Text-Verständnis
**Entscheidung:** Cloud LLM API (z.B. Gemini, Claude oder OpenAI)
- **Begründung:** Um freie Spracheingaben wie *"Rasenmäher installieren heute vormittag"* oder *"Termin für Vorsorge morgen irgendwann"* zuverlässig in strukturierte Aufgaben-Objekte mit konkretem Zeitbezug umzuwandeln, ist ein Large Language Model am besten geeignet.
- **Vorteile:** Maximale Flexibilität bei der Eingabe, das System "versteht" den Nutzer wirklich, anstatt nur nach starren Schlüsselwörtern zu suchen.

## 4. Datenhaltung & Hosting
**Entscheidung:** Cloud Hosting (Frontend z.B. Vercel, Backend/Datenbank z.B. Supabase oder Firebase)
- **Begründung:** Die App und die Datenbank sind sicher in der Cloud gehostet. Dadurch ist die App von jedem Gerät (Handy, Laptop) erreichbar, ohne dass eigene Server-Hardware im Heimnetzwerk gewartet werden muss.
- **Speicherung:** Die nutzerbasierten Prämissen, Routinen und das Backlog der offenen Aufgaben werden zentral in dieser Cloud-Datenbank abgelegt.

## 5. Externe Integrationen
**Google Calendar:**
- Nutzung der Google Calendar API (OAuth2). Die App liest Termine aus, um diese Zeiten im Tagesplan zu blockieren und bei der Zuweisung von Backlog-Aufgaben zu umgehen.

---

### Zusammenfassender Anwendungs-Workflow:
1. Der Nutzer öffnet die PWA und tippt auf den Mikrofon-Button.
2. Die **Web Speech API** des Handys wandelt die gesprochenen Worte direkt in Text um.
3. Der erkannte Text wird an das Backend gesendet und von der **LLM API** analysiert.
4. Das LLM extrahiert die Aufgabe (Titel) und den gewünschten Zeitrahmen (Priorität) und speichert das Objekt in der **Cloud-Datenbank**.
5. Das System generiert nun einen neuen Tagesplan. Dabei berücksichtigt es:
   - Die in der Datenbank hinterlegten festen **Nutzer-Prämissen** (Routinen, Pausen).
   - Die abgerufenen festen **Google Kalender-Termine**.
   - Die offenen Aufgaben aus dem **Backlog**.
6. Der optimierte Tagesplan wird sofort in der PWA aktualisiert und übersichtlich angezeigt.
