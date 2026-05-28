# Sprint 3: Cloud LLM API Integration

**Focus:** Connect the application to a Cloud LLM to intelligently parse the transcribed voice text into structured tasks with dates/times.

## 📋 Tasks for the Agent

- [ ] **Backend API Route:** Create a Next.js Serverless Function (API Route) to securely communicate with the LLM.
- [ ] **LLM Integration:** Integrate the chosen LLM SDK (Gemini, OpenAI, or Claude).
- [ ] **Prompt Engineering:** Design the system prompt that instructs the LLM to extract "Task Title", "Priority", and "Requested Timeframe" from natural language.
- [ ] **Frontend Connection:** Send the finalized transcript from the Web Speech API to this new backend route and handle the structured JSON response.
