# Sprint 4: Database & Backlog Management

**Focus:** Set up the Cloud Database to persistently store the user's backlog of tasks and their daily routines.

## 📋 Tasks for the Agent

- [x] **Database Choice:** Initialize Prisma ORM with SQLite.
- [x] **Database Schema:** Create models for `Task` and `Routine`.
- [x] **API Routes:** Create `/api/tasks` and `/api/tasks/[id]` for full CRUD functionality.
- [x] **LLM DB Integration:** Update the `/api/parse-task` endpoint to auto-save to the database.
- [x] **UI Updates:** Connect the Backlog UI to the database so tasks persist on refresh. Add visual indicators for `priority` and `isFlexible`.
- [x] **Backlog UI:** Create a view where the user can manually see all unassigned, open tasks in their backlog.
