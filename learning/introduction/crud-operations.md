# Introduction to CRUD Operations

**CRUD** is an acronym that stands for **C**reate, **R**ead, **U**pdate, and **D**elete. These are the four fundamental operations required for any application that relies on persistent data storage.

In the context of "Make My Day", every time you manage your daily planner, you are performing CRUD operations.

## The Four Operations

### 1. Create (C)
This operation adds entirely new records to the database.
- **Example in our app:** When you dictate a new task (e.g., "Install the lawnmower") and the AI processes it, the backend uses a `Create` operation to save this new task into the database.
- **SQL Equivalent:** `INSERT INTO Tasks (title) VALUES ('Install the lawnmower');`
- **Prisma (Next.js) Equivalent:** `prisma.task.create({ data: { title: 'Install the lawnmower' } })`

### 2. Read (R)
This operation retrieves data from the database. It can fetch a specific record or a list of records based on filters.
- **Example in our app:** When you open the website, the app uses a `Read` operation to fetch all your uncompleted tasks from the database so they can be displayed in the UI.
- **SQL Equivalent:** `SELECT * FROM Tasks WHERE status = 'open';`
- **Prisma (Next.js) Equivalent:** `prisma.task.findMany({ where: { status: 'open' } })`

### 3. Update (U)
This operation modifies existing records in the database.
- **Example in our app:** When you finish a task and click the checkbox in the UI, the app sends an `Update` request to change the task's status from "open" to "completed".
- **SQL Equivalent:** `UPDATE Tasks SET status = 'completed' WHERE id = 1;`
- **Prisma (Next.js) Equivalent:** `prisma.task.update({ where: { id: 1 }, data: { status: 'completed' } })`

### 4. Delete (D)
This operation permanently removes records from the database.
- **Example in our app:** If you accidentally dictate a task and hit a trash can icon to remove it, the app sends a `Delete` request to destroy that record.
- **SQL Equivalent:** `DELETE FROM Tasks WHERE id = 1;`
- **Prisma (Next.js) Equivalent:** `prisma.task.delete({ where: { id: 1 } })`

## How CRUD works in Next.js

In a modern Next.js application, CRUD operations are typically handled using **API Routes** (HTTP methods). When we build Sprint 4, we will map standard HTTP methods to these operations:

- `POST /api/tasks` -> **Create**
- `GET /api/tasks` -> **Read**
- `PATCH /api/tasks/[id]` -> **Update**
- `DELETE /api/tasks/[id]` -> **Delete**

Understanding CRUD is the foundation of full-stack web development. Once you know how to Create, Read, Update, and Delete data, you can build almost any software application!
