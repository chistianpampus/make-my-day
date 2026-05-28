# Introduction to Prisma & Relational Databases (MySQL/SQLite)

When building web applications, you need a place to safely store your data. This is typically done using a **Relational Database**. However, writing raw SQL queries inside JavaScript code can be messy, insecure, and error-prone. This is where **Prisma** comes in.

## 1. What is a Relational Database?

A relational database stores data in strict, organized tables (like spreadsheets) that can relate to one another (e.g., a `User` has many `Tasks`).

- **MySQL:** A powerful, industry-standard database server. It is incredibly robust and powers some of the largest apps in the world. However, it requires you to set up a server or use a cloud provider (like PlanetScale or AWS), which adds overhead when just starting out.
- **SQLite:** A lightweight database that does *not* require a server. Instead, it saves the entire database as a single file right inside your project folder. 

> **Why we start with SQLite:** Because SQLite requires zero setup and no accounts, it is perfect for rapid MVP development. 

## 2. What is Prisma?

**Prisma** is a modern **ORM** (Object-Relational Mapper) for Node.js and TypeScript. 
Its job is to act as a seamless translator between your Next.js code and your database engine.

Instead of writing raw SQL strings like this:
```sql
INSERT INTO Tasks (title, timeframe) VALUES ('Clean house', 'Morning');
```

You write simple, strongly-typed TypeScript code with Prisma:
```typescript
const task = await prisma.task.create({
  data: {
    title: 'Clean house',
    timeframe: 'Morning'
  }
})
```

### The Magic of the Prisma Schema
The core of Prisma is a single file called `schema.prisma`. In this file, you define your database connection and all your tables (called "Models"). 

```prisma
// 1. We tell Prisma what database we are using
datasource db {
  provider = "mysql" // Or "sqlite", "postgresql", etc.
  url      = env("DATABASE_URL")
}

// 2. We define our Tables
model Task {
  id        Int      @id @default(autoincrement())
  title     String
  timeframe String
  completed Boolean  @default(false)
}
```

## 3. Switching from SQLite to MySQL
One of the best features of Prisma is that it completely abstracts away the underlying database engine. 

If we build our app using SQLite today, all of our `prisma.task.create(...)` and `prisma.task.findMany(...)` application code remains 100% identical. 

If your app goes viral tomorrow and you need the massive scale of a cloud MySQL database, the migration is trivially easy:
1. Change `provider = "sqlite"` to `provider = "mysql"` in your `schema.prisma` file.
2. Update your `.env` file with your new MySQL database URL.
3. Run `npx prisma db push`.
Prisma handles the rest! You do not need to rewrite a single line of your actual application code.
