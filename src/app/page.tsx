"use client";

import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useEffect, useState, useRef } from 'react';

type Task = {
  title: string;
  timeframe: string;
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
  
  // Ref to prevent duplicate API calls for the same transcript
  const lastProcessedTranscript = useRef<string>('');

  useEffect(() => {
    // When listening stops and we have a new transcript, process it
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
      setTasks((prev) => [...prev, newTask]);
    } catch (err) {
      console.error(err);
      alert("Failed to process task via AI. Please try again.");
    } finally {
      setIsProcessing(false);
      // Note: We don't clear the transcript here so the bubble isn't instantly lost, 
      // but you can clear it if you prefer.
    }
  };

  return (
    <main>
      <header className="header">
        <h1>Make My Day</h1>
        <p>Your Voice-Controlled Daily Planner</p>
      </header>

      <section className="glass-panel schedule-container">
        {/* Static Dummy Data */}
        <div className="task">
          <span className="time">09:00</span>
          <span className="title">Morning Routine</span>
        </div>
        <div className="task blocked">
          <span className="time">10:00</span>
          <span className="title">Project Sync (Google Calendar)</span>
        </div>
        <div className="task">
          <span className="time">11:00</span>
          <span className="title">Install lawnmower</span>
        </div>
        
        {/* Dynamically Generated Tasks from LLM */}
        {tasks.map((task, index) => (
          <div key={index} className="task" style={{ borderLeft: '4px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.1)' }}>
            <span className="time" style={{ color: '#8b5cf6' }}>{task.timeframe}</span>
            <span className="title">{task.title}</span>
          </div>
        ))}

        {/* Display raw transcript briefly while processing to show something is happening */}
        {isProcessing && (
          <div className="task" style={{ opacity: 0.5, borderLeft: '4px solid #64748b' }}>
            <span className="time">...</span>
            <span className="title">Processing: "{transcript.trim()}"</span>
          </div>
        )}
      </section>

      {/* Floating Transcript Bubble (visible when listening, processing, or error) */}
      {(isListening || isProcessing || error) && (
        <div className={`transcript-bubble ${error ? 'error' : ''}`}>
          {error 
            ? error 
            : isProcessing 
              ? "AI is extracting your task..."
              : ((transcript + " " + interimTranscript).trim() || "Listening...")}
        </div>
      )}

      {/* Action Buttons Container */}
      <div className="action-buttons-container">
        
        {/* Restart Button (visible when actively listening or when there is text) */}
        {(isListening || transcript || interimTranscript) && !isProcessing && (
          <button 
            className="secondary-action-button restart-button"
            onClick={() => {
              lastProcessedTranscript.current = ''; // Allow the same phrase to be spoken again if restarted
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
            // Loading Spinner
            <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="32" height="32">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isListening ? (
            // Stop Icon (Send/Finish representation)
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
              <path d="M9 16h6v-6h4l-7-7-7 7h4v6z" />
            </svg>
          ) : (
            // Standard Microphone Icon
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
