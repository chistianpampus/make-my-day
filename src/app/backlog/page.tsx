"use client";

import { useTasks } from '../../hooks/useTasks';
import { TaskList } from '../../components/TaskList';

export default function Backlog() {
  const { tasks, isLoadingTasks, toggleTaskCompletion, deleteTask, updateTask } = useTasks({ timeframe: 'Unscheduled' });

  return (
    <main>
      <header className="header">
        <h1>Make My Day</h1>
        <p>Your Voice-Controlled Daily Planner</p>
      </header>

      <nav className="nav-tabs">
        <a href="/" className="nav-tab">Today</a>
        <a href="/backlog" className="nav-tab active">Backlog</a>
      </nav>

      <TaskList 
        tasks={tasks}
        isLoading={isLoadingTasks}
        emptyMessage="No tasks in your backlog!"
        onToggle={toggleTaskCompletion}
        onDelete={deleteTask}
        onUpdate={updateTask}
      />
    </main>
  );
}
