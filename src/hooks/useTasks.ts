import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';

export const useTasks = (options?: { scheduledDate?: string | null }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // We stringify the options to safely use them in the dependency array
  const optsKey = JSON.stringify(options || {});

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoadingTasks(true);
      const params = new URLSearchParams();
      if (options && 'scheduledDate' in options) {
        if (options.scheduledDate === null) {
          params.append('scheduledDate', 'null');
        } else if (options.scheduledDate !== undefined) {
          params.append('scheduledDate', options.scheduledDate);
        }
      }
      
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setIsLoadingTasks(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optsKey]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback((newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const toggleTaskCompletion = useCallback(async (id: number, currentStatus: boolean) => {
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
    
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus })
      });
      if (!res.ok) throw new Error('Update failed');
    } catch (err) {
      console.error('Failed to update task', err);
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: currentStatus } : t));
    }
  }, []);

  const updateTask = useCallback(async (id: number, data: Partial<Task>) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Update failed');
      const updatedTask = await res.json();
      // Ensure we have the server version (e.g. if DB sanitizes or sets defaults)
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    } catch (err) {
      console.error('Failed to update task', err);
      // We could revert here, but for simplicity we fetch again
      fetchTasks();
      throw err;
    }
  }, [fetchTasks]);

  const deleteTask = useCallback(async (id: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    setTasks(prev => prev.filter(t => t.id !== id));
    
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch (err) {
      console.error('Failed to delete task', err);
      // Restore state by fetching again
      fetchTasks();
    }
  }, [fetchTasks]);

  const clearAllTasks = useCallback(async () => {
    if (!confirm("Are you sure you want to delete ALL tasks? This cannot be undone.")) return;
    
    setTasks([]);
    
    try {
      const res = await fetch(`/api/tasks`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Clear all failed');
    } catch (err) {
      console.error('Failed to clear all tasks', err);
      fetchTasks();
    }
  }, [fetchTasks]);

  return { tasks, isLoadingTasks, addTask, toggleTaskCompletion, updateTask, deleteTask, clearAllTasks, fetchTasks };
};
