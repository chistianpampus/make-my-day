"use client";

import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTasks } from '../hooks/useTasks';
import { TodayView } from '../components/TodayView';
import { WeekView } from '../components/WeekView';
import { TaskInput } from '../components/TaskInput';
import { useEffect, useRef, useState } from 'react';
import { Task } from '../types';

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

  const { tasks, isLoadingTasks, toggleTaskCompletion, updateTask, deleteTask, addTask, clearAllTasks } = useTasks({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [activeView, setActiveView] = useState<'today' | 'week'>('today');

  useEffect(() => {
    const checkScreenSize = () => {
      const large = window.innerWidth >= 1024;
      setIsLargeScreen(large);
      // Auto-switch based on breakpoint if we just loaded
      if (!window.sessionStorage.getItem('view_preference')) {
        setActiveView(large ? 'week' : 'today');
      }
    };
    
    checkScreenSize();
    
    // Add listener
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  const lastProcessedTranscript = useRef<string>('');

  useEffect(() => {
    const fullText = (transcript + " " + interimTranscript).trim();
    if (!isListening && fullText && fullText !== lastProcessedTranscript.current) {
      lastProcessedTranscript.current = fullText;
      processTranscript(fullText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript, interimTranscript]);

  const processTranscript = async (text: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript: text,
          currentTime: new Date().toLocaleString(),
          existingTasks: tasks
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse task');
      }

      const data = await response.json();
      
      if (data.created && Array.isArray(data.created)) {
        data.created.forEach((task: Task) => addTask(task));
      }
      
      if (data.updated && Array.isArray(data.updated)) {
        // useTasks hook will be updated or we can just refetch tasks to be safe, 
        // but updateTask does a local state update if we pass the partial data. 
        // Since we already have the full updated task from backend, we can just use that.
        data.updated.forEach((task: Task) => updateTask(task.id, task));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to process task via AI. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processingContent = isProcessing ? (
    <div className="task" style={{ opacity: 0.5, borderLeft: '4px solid #64748b' }}>
      <span className="time">...</span>
      <span className="title">Processing: "{transcript.trim()}"</span>
    </div>
  ) : null;

  return (
    <main>
      <header className="header" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Make My Day</h1>
          <p style={{ margin: '4px 0 0 0' }}>Your Voice-Controlled Daily Planner</p>
        </div>
        <button 
          onClick={clearAllTasks}
          style={{ 
            background: 'transparent', 
            border: '1px solid #ef4444', 
            color: '#ef4444', 
            padding: '6px 12px', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontSize: '0.8rem', 
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Alle Tasks löschen"
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        >
          🗑️ Clear DB
        </button>
      </header>

      <nav className="nav-tabs">
        <button 
          onClick={() => { setActiveView('today'); window.sessionStorage.setItem('view_preference', 'today'); }} 
          className={`nav-tab ${activeView === 'today' ? 'active' : ''}`}
          style={{ cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit' }}
        >
          Today
        </button>
        <button 
          onClick={() => { setActiveView('week'); window.sessionStorage.setItem('view_preference', 'week'); }} 
          className={`nav-tab ${activeView === 'week' ? 'active' : ''}`}
          style={{ cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit' }}
        >
          Week
        </button>
        <a href="/backlog" className="nav-tab">Backlog</a>
      </nav>

      <div style={{ padding: '0 1rem' }}>
        <TaskInput onProcessText={processTranscript} isProcessing={isProcessing} />
      </div>

      {isLoadingTasks ? (
        <p style={{ textAlign: 'center', opacity: 0.7, padding: '2rem' }}>Loading tasks...</p>
      ) : activeView === 'week' ? (
        <WeekView 
          tasks={tasks}
          onToggle={toggleTaskCompletion}
          onDelete={deleteTask}
          onTaskUpdate={updateTask}
          processingContent={processingContent}
        />
      ) : (
        <TodayView 
          tasks={tasks}
          onToggle={toggleTaskCompletion}
          onDelete={deleteTask}
          onTaskUpdate={updateTask}
          processingContent={processingContent}
        />
      )}

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
