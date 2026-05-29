# Requirements: Make My Day

This document defines the functional and non-functional requirements for the intelligent, voice-controlled day planner.

## Objective
The **"Make My Day"** project is a tool for planning the day. The goal is to plan the day on a smartphone with minimal interaction effort, primarily using voice input. The system should intelligently combine fixed user-based routines, scheduled appointments from Google Calendar, and tasks captured via voice into a clear daily plan.

## Functional Requirements
- [ ] **Voice Input**: New TODOs must be addable via voice input (e.g., "Install lawnmower this morning", "Checkup appointment sometime tomorrow").
- [ ] **Backlog Management**: The captured, open tasks are stored in a backlog (e.g., saved in an SQLite database or Text/MD file).
- [ ] **User-Based Premises & Routines**: The system must consider daily or weekly routines (e.g., go to bed at 10:00 PM, no screen time 1 hour before, eat nothing at least 2 hours before bedtime). These premises should also be stored in a database or MD file.
- [ ] **Daily Plan View**: A directly accessible daily plan with specific times must always be displayed.
- [ ] **Google Calendar Integration**: Fixed appointments from the Google Calendar must be considered.
- [ ] **Intelligent Scheduling**:
  - Clear statements from voice input (that something should be done on a specific day / at a specific time) must be prioritized.
  - The system must understand relative dates (e.g., "tomorrow") by providing the current date and time to the AI.
  - The system must estimate the duration of a task if not explicitly mentioned by the user.
  - The system must be capable of extracting and separating multiple independent tasks from a single voice dictation.
  - The system must understand voice commands to update existing tasks (e.g., changing time or title).
  - Remaining free time in the daily plan should be automatically filled with tasks from the backlog.
- [ ] **Planning Premises**: The planning should be generous, e.g., with automatic breaks of 10-15 minutes between individual activities.
- [ ] **Task Editing**: Users must be able to manually edit tasks (Title, Timeframe, Priority, Duration, etc.) via keyboard/UI directly in the list.
- [ ] **Keyboard Input**: Users must be able to input new tasks via keyboard in addition to voice input.
- [ ] **Today View (Drag & Drop)**: A view showing only the current day, accompanied by blocks for the next 3 days and a "Later" block. Users must be able to drag & drop tasks from today into these 4 blocks, where they "sink" in and get rescheduled to the corresponding day/bucket.
- [ ] **Week View**: A view optimized for large displays that shows detailed columns for today, the next 3 days, and a "Later" summary block. Each column should look and behave similarly to the detail view in the "Today" view. The view must utilize the available screen space fully to display the columns wider.

## Non-Functional Requirements
- [ ] **Mobile Usability**: The tool should be accessible on the mobile phone with minimal interactions.
- [ ] **Efficiency**: Operations (e.g., adding tasks) should be possible with as few iterations as possible.
