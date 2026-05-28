# Introduction to Next.js & React Fundamentals

Next.js is a powerful React framework used to build full-stack web applications. While React handles the user interface (the "view" layer), Next.js provides the architecture and routing necessary to build production-ready applications.

## Key Concepts

### 1. The App Router
Next.js uses a file-system based router. By creating folders inside the `app/` directory, you automatically create routes for your application. A file named `page.tsx` inside a folder makes that route publicly accessible.

### 2. Server Components vs. Client Components
By default, Next.js uses **React Server Components (RSC)**. 
- **Server Components:** Rendered entirely on the server. They are fast, great for fetching data, and send zero JavaScript to the browser, which improves performance.
- **Client Components:** Rendered in the browser. They are used when you need user interactivity (like clicking buttons, listening to forms) or browser APIs (like `useState`, `useEffect`, or the Web Speech API). You define them by adding the `"use client";` directive at the top of the file.

### 3. Why we use it for "Make My Day"
We are using Next.js because it allows us to quickly build a fast, SEO-friendly web app. We can build our UI components with React, while seamlessly preparing the app to be served as a Progressive Web App (PWA).

### 4. Creating a Next.js Project with `npx`
You often see commands like `npx create-next-app@latest`. 
- **`npx` (Node Package Execute):** A tool that comes with `npm` (Node Package Manager). It allows you to run Node.js packages without installing them globally on your system. It temporarily downloads the latest version of a tool (like `create-next-app`), runs it to scaffold your project, and then removes the tool, keeping your system clean and ensuring you always use the most up-to-date generator.
