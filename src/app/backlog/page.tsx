"use client";

import { useTasks } from '../../hooks/useTasks';
import { TaskList } from '../../components/TaskList';
import { Header } from '../../components/Header';

export default function Backlog() {
  const { tasks, isLoadingTasks, toggleTaskCompletion, deleteTask, updateTask } = useTasks({ scheduledDate: null });

  return (
    <main>
      <Header />

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
