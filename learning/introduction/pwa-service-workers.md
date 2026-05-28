# Introduction to Progressive Web Apps (PWA) & Service Workers

A Progressive Web App (PWA) is a website that looks and behaves like a native mobile app. Users can "install" it directly to their smartphone's home screen without going through an App Store.

## Key Concepts

### 1. The Web App Manifest (`manifest.json`)
This is a simple JSON file that tells the browser how your web app should behave when installed on the user's desktop or mobile device. It includes information like:
- The app's name
- The icons (used for the home screen)
- The display mode (e.g., `standalone` to hide the browser's address bar)
- Theme colors

### 2. Service Workers
A Service Worker is a script that the browser runs in the background, entirely separate from the web page. 
- **Caching:** It acts like a proxy server sitting between your web app and the network. It can intercept network requests and serve cached files, allowing the app to load instantly or even work offline.
- **Background Features:** Service workers are responsible for background synchronization and push notifications.

### 3. Why we use it for "Make My Day"
Since "Make My Day" is meant to be a daily planner with minimal friction, wrapping it as a PWA allows you to tap an icon on your phone and instantly access the interface, skipping the browser UI.
