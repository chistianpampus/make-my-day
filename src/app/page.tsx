"use client";

import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useEffect } from 'react';

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

  // For debugging or logging when transcript updates
  useEffect(() => {
    if (transcript) {
      console.log("Final Transcript:", transcript);
      // In Sprint 3, we will send this `transcript` to the LLM backend here!
    }
  }, [transcript]);

  return (
    <main>
      <header className="header">
        <h1>Make My Day</h1>
        <p>Your Voice-Controlled Daily Planner</p>
      </header>

      <section className="glass-panel schedule-container">
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
        
        {/* Display previous voice transcript for testing/verification ONLY when stopped */}
        {!isListening && transcript && (
          <div className="task" style={{ borderLeft: '4px solid #3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
            <span className="time">New</span>
            <span className="title">"{transcript.trim()}"</span>
          </div>
        )}
      </section>

      {/* Floating Transcript Bubble (visible only when listening or error) */}
      {(isListening || error) && (
        <div className={`transcript-bubble ${error ? 'error' : ''}`}>
          {error ? error : ((transcript + " " + interimTranscript).trim() || "Listening...")}
        </div>
      )}

      {/* Action Buttons Container */}
      <div className="action-buttons-container">
        
        {/* Restart Button (visible when actively listening or when there is text) */}
        {(isListening || transcript || interimTranscript) && (
          <button 
            className="secondary-action-button restart-button"
            onClick={restartListening}
            aria-label="Restart dictation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
          </button>
        )}

        {/* Main Microphone / Stop Action Button */}
        <button 
          className={`mic-button ${isListening ? 'listening' : ''}`} 
          onClick={toggleListening}
          aria-label={isListening ? "Stop and finish" : "Start voice input"}
          disabled={!isSupported}
        >
          {isListening ? (
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
