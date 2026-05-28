"use client";

import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useEffect, useState, useRef } from 'react';

type Task = {
  id: number;
  title: string;
  timeframe: string;
  priority: string;
  isFlexible: boolean;
  completed: boolean;
  createdAt: string;
};

export default function Home() {
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    toggleListening,
    restartListening,
    isSupported
  } = useSpeechRecognition();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  
  const lastProcessedTranscript = useRef<string>('');

  // Fetch tasks on initial load
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks?excludeTimeframe=Unscheduled');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (!isListening && transcript && transcript !== lastProcessedTranscript.current) {
      lastProcessedTranscript.current = transcript;
      processTranscript(transcript);
    }
  }, [isListening, transcript]);

  const processTranscript = async (text: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse task');
      }

      const newTask: Task = await response.json();
      // Add the new task to the top of the list
      setTasks((prev) => [newTask, ...prev]);
    } catch (err) {
      console.error(err);
      alert("Failed to process task via AI. Please try again.");
    } finally {
      setIsProcessing(false);
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
        <a href="/" className="nav-tab active">Today</a>
        <a href="/backlog" className="nav-tab">Backlog</a>
      </nav>

      <section className="glass-panel schedule-container">
        
        {isLoadingTasks ? (
          <p style={{ textAlign: 'center', opacity: 0.7 }}>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.7 }}>Your day is clear! Tap the microphone to add a task.</p>
        ) : null}

        {/* Display raw transcript briefly while processing */}
        {isProcessing && (
          <div className="task" style={{ opacity: 0.5, borderLeft: '4px solid #64748b' }}>
            <span className="time">...</span>
            <span className="title">Processing: "{transcript.trim()}"</span>
          </div>
        )}
        
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

      {/* Floating Transcript Bubble */}
      {(isListening || isProcessing || error) && (
        <div className={`transcript-bubble ${error ? 'error' : ''}`}>
          {error 
            ? error 
            : isProcessing 
              ? "AI is parsing your task..."
              : ((transcript + " " + interimTranscript).trim() || "Listening...")}
        </div>
      )}

      {/* Action Buttons Container */}
      <div className="action-buttons-container">
        
        {/* Restart Button */}
        {(isListening || transcript || interimTranscript) && !isProcessing && (
          <button 
            className="secondary-action-button restart-button"
            onClick={() => {
              // Set the current transcript as the 'lastProcessed' so the useEffect ignores it and doesn't send it to the AI
              lastProcessedTranscript.current = transcript; 
              restartListening();
            }}
            aria-label="Restart dictation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
          </button>
        )}

        {/* Main Microphone / Stop Action Button */}
        <button 
          className={`mic-button ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''}`} 
          onClick={toggleListening}
          aria-label={isListening ? "Stop and finish" : "Start voice input"}
          disabled={!isSupported || isProcessing}
        >
          {isProcessing ? (
            <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="32" height="32">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isListening ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
              <path d="M9 16h6v-6h4l-7-7-7 7h4v6z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          )}
        </button>

      </div>

      {!isSupported && (
        <p style={{ textAlign: 'center', color: '#ef4444', marginTop: '20px' }}>
          Your browser doesn't support the Web Speech API.
        </p>
      )}
    </main>
  );
}
