"use client";

import { useEffect, useState } from 'react';

type Task = {
  id: number;
  title: string;
  timeframe: string;
  priority: string;
  isFlexible: boolean;
  completed: boolean;
  createdAt: string;
};

export default function Backlog() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Fetch tasks on initial load
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks?timeframe=Unscheduled');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const toggleTaskCompletion = async (id: number, currentStatus: boolean) => {
    // Optimistic UI update
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
    
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus })
      });
    } catch (err) {
      console.error('Failed to update task', err);
      // Revert on failure
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: currentStatus } : t));
    }
  };

  const deleteTask = async (id: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    // Optimistic UI update
    setTasks(tasks.filter(t => t.id !== id));
    
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete task', err);
      fetchTasks(); // Re-fetch to restore state
    }
  };

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

      <section className="glass-panel schedule-container">
        
        {isLoadingTasks ? (
          <p style={{ textAlign: 'center', opacity: 0.7 }}>Loading backlog...</p>
        ) : tasks.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.7 }}>No tasks in your backlog!</p>
        ) : null}

        {/* Render Real Database Tasks */}
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className={`task ${task.completed ? 'completed' : ''}`}
            style={{ 
              borderLeft: `4px solid ${task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#3b82f6'}`, 
              background: task.completed ? 'rgba(0,0,0,0.05)' : 'var(--surface)',
              opacity: task.completed ? 0.6 : 1
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '80px' }}>
              <span className="time" style={{ color: 'var(--foreground)', fontSize: '0.9rem' }}>{task.timeframe}</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{task.isFlexible ? 'Flexible' : 'Strict'}</span>
            </div>
            
            <span className="title" style={{ flexGrow: 1, textDecoration: task.completed ? 'line-through' : 'none' }}>
              {task.title}
            </span>

            <div className="task-actions" style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="checkbox" 
                checked={task.completed} 
                onChange={() => toggleTaskCompletion(task.id, task.completed)} 
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                aria-label="Mark completed"
              />
              <button 
                onClick={() => deleteTask(task.id)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                aria-label="Delete task"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
