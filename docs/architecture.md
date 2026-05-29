# Architecture & Technology Decisions: Make My Day

Based on the functional requirements and the decisions made, the project will be implemented using the following technology stack and architecture.

## 1. Frontend & App Delivery
**Decision:** Progressive Web App (PWA) with React/Next.js
- **Reasoning:** Allows for very fast development with modern web technologies. The app can be "installed" on the smartphone's home screen via the browser, offering an app-like experience without the massive overhead of native app development.
- **Advantages:** Cross-platform, fast deployment, seamless access.

## 2. Speech Recognition (Speech-to-Text)
**Decision:** Native Web Speech API
- **Reasoning:** No external APIs required, completely free, and directly usable via the browser. For simple dictation features in the PWA, the accuracy and speed of the system's native recognition (especially on modern iOS and Android devices) are more than sufficient.

## 3. NLP & Text Understanding
**Decision:** Cloud LLM API (e.g., Gemini, Claude, or OpenAI)
- **Reasoning:** To reliably convert free-form voice inputs like *"Install lawnmower this morning"* or *"Checkup appointment sometime tomorrow"* into structured task objects with specific time references, a Large Language Model is best suited.
- **Advantages:** Maximum flexibility for inputs; the system truly "understands" the user instead of just looking for rigid keywords.

## 4. Data Storage & Hosting
**Decision:** Cloud Hosting (Frontend e.g., Vercel, Backend/Database e.g., Supabase or Firebase)
- **Reasoning:** The app and database are securely hosted in the cloud. This makes the app accessible from any device (phone, laptop) without needing to maintain personal server hardware on a home network.
- **Storage:** User-based premises, routines, and the backlog of open tasks will be centrally stored in this cloud database.

## 5. External Integrations
**Google Calendar:**
- Utilization of the Google Calendar API (OAuth2). The app reads appointments to block these times in the daily plan and avoid them when assigning backlog tasks.

---

### Summary Application Workflow:
1. The user opens the PWA and taps the microphone button.
2. The phone's **Web Speech API** converts the spoken words directly into text.
3. The recognized text is sent to the backend and analyzed by the **LLM API**.
4. The LLM extracts the task (title) and the desired timeframe (priority), and saves the object in the **Cloud Database**.
5. The system now generates a new daily plan, taking into account:
   - Fixed **user premises** (routines, breaks) stored in the database.
   - Fetched fixed **Google Calendar appointments**.
   - Open tasks from the **backlog**.
6. The optimized daily plan is immediately updated and clearly displayed in the PWA.

### Component Block Diagram

```mermaid
flowchart TD
    subgraph Frontend [Next.js PWA Client]
        UI[React UI Components]
        Speech[Web Speech API Hook]
        Dnd[DnD Kit Drag & Drop]
        Copilot[Scheduling Copilot UI]
    end

    subgraph Backend [Next.js API Routes]
        API_Parse[POST /api/parse-task]
        API_Tasks[GET/POST /api/tasks]
        API_Sched[GET/POST /api/schedule]
        API_Gen[POST /api/generate-schedule]
    end

    subgraph External [External Services]
        LLM[OpenAI API GPT-4o-mini]
        GC[Google Calendar - Future]
    end

    subgraph Storage [Database]
        DB[(SQLite via Prisma)]
    end

    %% Connections
    UI <--> API_Tasks
    UI <--> API_Sched
    Speech --> API_Parse
    Dnd --> API_Tasks
    Copilot <--> API_Gen
    Copilot --> API_Sched

    API_Parse <--> LLM
    API_Gen <--> LLM
    
    API_Tasks <--> DB
    API_Sched <--> DB
    
    API_Gen -.-> GC
```

### Sequence Diagrams for Key Operations

#### 1. Voice Task Capture & Parsing
```mermaid
sequenceDiagram
    autonumber
    participant User
    participant UI as PWA (Header/Voice)
    participant API as /api/parse-task
    participant LLM as OpenAI (GPT)
    participant DB as SQLite DB

    User->>UI: Taps Mic & Speaks (e.g., "Mow lawn tomorrow")
    UI->>UI: Web Speech API transcribes
    UI->>API: POST transcribed text
    API->>LLM: Analyze text for intent & timeframe
    LLM-->>API: Structured JSON (Title, Date, Constraints)
    API->>DB: Prisma create Task
    API-->>UI: Returns created Task
    UI-->>User: UI updates with new Task
```

#### 2. Conversational Scheduling Copilot (Optimization)
```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Copilot as Scheduling Copilot UI
    participant GenAPI as /api/generate-schedule
    participant LLM as OpenAI (GPT)
    participant SchedAPI as /api/schedule
    participant DB as SQLite DB

    User->>Copilot: Clicks "Optimize" & optionally speaks hint
    Copilot->>GenAPI: POST Tasks, Routines, Chat History
    GenAPI->>LLM: Generate timeline / Evaluate hints
    LLM-->>GenAPI: Proposed Schedule OR Clarifying Question
    GenAPI-->>Copilot: Render Schedule / Question in UI
    
    alt User provides more hints
        User->>Copilot: Types/Speaks adjustment
        Copilot->>GenAPI: POST updated Chat History
        GenAPI->>LLM: Re-evaluate
        LLM-->>GenAPI: Updated Schedule
        GenAPI-->>Copilot: Render new Schedule
    end

    User->>Copilot: Clicks "Save Schedule"
    Copilot->>SchedAPI: POST approved schedule blocks
    SchedAPI->>DB: Bulk Update Tasks (Start Times)
    SchedAPI->>DB: Upsert DailySchedule Blob
    SchedAPI-->>Copilot: Success
    Copilot-->>User: UI reloads with final timeline
```
