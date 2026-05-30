import React, { useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SchedulingCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: any[];
  targetDate: string;
  onPreviewSchedule: (schedule: any[]) => void;
  onSaveSchedule: () => void;
}

export function SchedulingCopilot({ isOpen, onClose, tasks, targetDate, onPreviewSchedule, onSaveSchedule }: SchedulingCopilotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasProposedSchedule, setHasProposedSchedule] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const { isListening, transcript, toggleListening } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) setInputText(transcript);
  }, [transcript]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Initial trigger when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      handleOptimization();
    }
  }, [isOpen]);

  const handleOptimization = async (userHint?: string) => {
    setIsLoading(true);
    try {
      const newMessages = [...messages];
      if (userHint) {
        newMessages.push({ role: 'user', content: userHint });
        setMessages(newMessages);
      }

      const routinesRes = await fetch('/api/routines');
      const routines = await routinesRes.json();

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const res = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.length > 0 ? newMessages : undefined,
          tasks,
          routines,
          targetDate,
          currentTime
        })
      });

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      
      if (data.messageToUser) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.messageToUser }]);
      } else if (!data.schedule || data.schedule.length === 0) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Hier ist dein fertiger Plan!' }]);
      }

      if (data.schedule && data.schedule.length > 0) {
        onPreviewSchedule(data.schedule);
        setHasProposedSchedule(true);
      } else {
        setHasProposedSchedule(false);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Es gab leider einen Fehler bei der Optimierung.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    handleOptimization(text);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      maxWidth: '400px',
      background: 'var(--surface)',
      borderLeft: '1px solid var(--surface-border)',
      boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Scheduling Copilot 🪄 <span style={{fontSize: '0.9rem', opacity: 0.7}}>({targetDate === new Date().toISOString().split('T')[0] ? 'Heute' : targetDate})</span></h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--foreground)' }}>&times;</button>
      </div>

      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface-border)',
            color: msg.role === 'user' ? '#fff' : 'var(--foreground)',
            padding: '8px 12px',
            borderRadius: '12px',
            maxWidth: '85%',
            lineHeight: 1.4,
            fontSize: '0.9rem'
          }}>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', padding: '8px', opacity: 0.6 }}>
            Denkt nach... ⏳
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {hasProposedSchedule && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--surface-border)', display: 'flex', gap: '8px' }}>
          <button 
            onClick={onClose}
            style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--foreground)', cursor: 'pointer' }}
          >
            Verwerfen
          </button>
          <button 
            onClick={() => {
              onSaveSchedule();
              onClose();
            }}
            style={{ flex: 1, padding: '10px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Plan Speichern
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ padding: '16px', borderTop: '1px solid var(--surface-border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button 
          type="button"
          onClick={toggleListening}
          style={{ 
            background: isListening ? '#ef4444' : 'var(--surface-border)', 
            color: isListening ? 'white' : 'var(--foreground)', 
            border: 'none', 
            borderRadius: '50%', 
            width: '40px', 
            height: '40px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          🎤
        </button>
        <input 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Hinweise für den Planer..."
          disabled={isLoading}
          style={{
            flexGrow: 1,
            background: 'var(--background)',
            border: '1px solid var(--surface-border)',
            borderRadius: '20px',
            padding: '10px 16px',
            color: 'var(--foreground)',
            outline: 'none'
          }}
        />
        <button 
          type="submit"
          disabled={!inputText.trim() || isLoading}
          style={{
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (!inputText.trim() || isLoading) ? 'not-allowed' : 'pointer',
            opacity: (!inputText.trim() || isLoading) ? 0.5 : 1,
            flexShrink: 0
          }}
        >
          ↑
        </button>
      </form>
    </div>
  );
}
