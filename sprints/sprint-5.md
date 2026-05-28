# Sprint 5: Google Calendar & Scheduling Engine

**Focus:** Integrate Google Calendar to fetch blocked times and build the algorithm that generates the final daily schedule.

## 📋 Tasks for the Agent

- [ ] **Google OAuth Setup:** Implement Google authentication to request read access to the user's calendar.
- [ ] **Fetch Calendar Events:** Retrieve the user's fixed appointments for the current day.
- [ ] **Scheduling Algorithm:** Build the logic that takes fixed appointments, fixed routines, and available backlog tasks, and combines them into an optimized daily schedule with generous breaks.
- [ ] **Dynamic Daily Plan UI:** Connect the scheduling algorithm to the main `page.tsx` UI so the static dummy data is replaced by the real generated schedule.
