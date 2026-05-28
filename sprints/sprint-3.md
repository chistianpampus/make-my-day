# Sprint 3: Cloud LLM API Integration

**Focus:** Connect the application to a Cloud LLM to intelligently parse the transcribed voice text into structured tasks with dates/times.

## 📋 Tasks for the Agent

- [x] **Backend API Route for LLM:** Create a Next.js Serverless Function (`src/app/api/...`) to securely communicate with the LLM so API keys are not exposed to the browser.
- [x] **LLM SDK Integration:** Integrate the chosen LLM SDK (Gemini, OpenAI, or Claude).
- [x] **LLM Prompt Engineering:** Design the system prompt to instruct the LLM to extract the *Task Title*, *Priority*, and *Requested Timeframe* from the unstructured transcript, returning strict JSON.
- [x] **Frontend Connection:** Update the `page.tsx` to send the `transcript` state to the backend API as soon as the Speech API completes, and render the resulting structured JSON into the UI.
