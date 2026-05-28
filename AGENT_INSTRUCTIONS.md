# Agent Instructions: Make My Day

This file contains global instructions and context for any AI agent working on this project. Read this file before making any major changes to the code.

## 1. Project Context & Architecture
- **Project:** Make My Day
- **Goal:** An intelligent, voice-controlled day planner, optimized for minimal interactions on the smartphone.
- **Tech Stack:** Next.js (Progressive Web App), Native Web Speech API for voice input, Cloud LLMs for NLP, Cloud Backend (e.g., Vercel/Supabase).

## 2. Sprint Workflow
Development is divided into sprints. Agents work as follows:
1. Check the currently active sprint in the `sprints/` folder (e.g., `sprint-1.md`).
2. Strictly execute the tasks defined there.
3. When you complete a task, you must update the markdown file and mark the task as done (`[x]`).
4. Push working intermediate states to the GitHub repository.

## 3. Coding Conventions & Design
- **Mobile First:** The UI must primarily be developed for small smartphone screens. Large clickable areas, simple menus.
- **Aesthetics & UI:** Use modern web design. Crystal clear typography (Inter/Roboto), well-coordinated colors, smooth micro-animations, and Dark Mode support are mandatory. Avoid a generic "default look".
- **React/Next.js:** Use functional components and modern React hooks. Keep components small and reusable.
- **Dependencies:** Install as few external libraries as possible. For example, strictly use the built-in `Web Speech API` for speech recognition and no heavy audio libraries.

## 4. Language and Communication
- **PROJECT LANGUAGE:** English. All code, documentation, and agent responses MUST be in English.
- **Important Rule:** Even if the user asks a question or writes a prompt in German (or any other language), the AI agent must ALWAYS reply in English and write all documentation in English.
- Communicate proactively, solution-oriented, and keep it concise. Focus on execution.

## 5. Learning Materials Generation
- **Rule:** Whenever new technical concepts or tools (e.g., Next.js, PWA, Firebase) are introduced to the project, the agent MUST proactively prompt the user to ask if learning materials should be generated for them.
- If the user agrees, the agent must create two items for each concept:
  1. An `introduction.md` file in the `learning/introduction/` directory, describing the main concept on an introductory level.
  2. A `.csv` file in the `learning/flashcards/` directory, formatted for Anki import (containing concise Q&A flashcards about the core concepts).

## 6. Architecture & Graphical Documentation
- **Rule:** Before starting any major implementation tasks, the agent MUST document the architecture or verify the validity of existing architectural documentation.
- **Graphical Requirement:** Architectural documentation should ideally be visual. The agent MUST proactively make proposals for creating or updating graphical architecture documentation (e.g., using Markdown Mermaid diagrams for component structures, data flows, or workflows).

## 7. Version Control & Branching Strategy
- **Rule:** Agents MUST NEVER develop new features or execute sprint tasks directly on the `main` branch. 
- Before starting any development work, the agent MUST create and checkout a new development branch (e.g., `feature/sprint-1` or `feature/short-description`).
- Changes should be committed to this feature branch and pushed to the remote repository.
