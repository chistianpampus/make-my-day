import { useState, useEffect, useRef } from 'react';
import { Task } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface TaskCardProps {
  task: Task;
  onToggle: (id: number, currentStatus: boolean) => void;
  onDelete: (id: number) => void;
  onUpdate?: (id: number, data: Partial<Task>) => void;
}

export function TaskCard({ task, onToggle, onDelete, onUpdate }: TaskCardProps) {
  // Local state for inline editing
  const [title, setTitle] = useState(task.title);
  const [scheduledStartTime, setScheduledStartTime] = useState(task.scheduledStartTime || '');
  const [scheduledDate, setScheduledDate] = useState(task.scheduledDate || '');
  const [duration, setDuration] = useState(task.estimatedDuration ? task.estimatedDuration.toString() : '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // AI Edit State
  const [isAIEditOpen, setIsAIEditOpen] = useState(false);
  const [aiText, setAiText] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const { isListening, transcript, toggleListening } = useSpeechRecognition();
  
  useEffect(() => {
    if (transcript) setAiText(transcript);
  }, [transcript]);

  const handleAIEditSubmit = async () => {
    if (!aiText.trim()) return;
    setIsAILoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/edit-single-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, transcript: aiText, task })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update task');
      }
      
      if (data.updated && onUpdate) {
        onUpdate(task.id, data.updated); 
      }
      
      setIsAIEditOpen(false);
      setAiText('');
    } catch (err: any) {
      setAiError(err.message || 'AI konnte den Befehl nicht verarbeiten');
      setTimeout(() => setAiError(null), 3000);
      setIsAIEditOpen(false);
      setAiText('');
    } finally {
      setIsAILoading(false);
    }
  };

  // Sync state if props change from outside
  useEffect(() => setTitle(task.title), [task.title]);
  useEffect(() => setScheduledStartTime(task.scheduledStartTime || ''), [task.scheduledStartTime]);
  useEffect(() => setScheduledDate(task.scheduledDate || ''), [task.scheduledDate]);
  useEffect(() => setDuration(task.estimatedDuration ? task.estimatedDuration.toString() : ''), [task.estimatedDuration]);

  // Auto-resize the textarea for the title
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [title]);

  const handleUpdate = (field: keyof Task, value: any) => {
    if (onUpdate && task[field] !== value) {
      onUpdate(task.id, { [field]: value });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.blur(); // Triggers onBlur
    }
  };

  return (
    <div 
      className={`task ${task.completed ? 'completed' : ''} task-card-hover`}
      style={{ 
        borderLeft: `4px solid ${task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#3b82f6'}`, 
        background: task.completed ? 'rgba(0,0,0,0.03)' : 'var(--surface)',
        opacity: task.completed ? 0.6 : 1,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        position: 'relative',
        width: '100%',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Top Row: Timeframe (left) and Actions (right) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <input 
            type="checkbox" 
            checked={task.completed} 
            onChange={() => onToggle(task.id, task.completed)} 
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
            aria-label="Mark completed"
          />
          <input 
            value={scheduledStartTime}
            onChange={(e) => setScheduledStartTime(e.target.value)}
            onBlur={() => {
              handleUpdate('scheduledStartTime', scheduledStartTime.trim() === '' ? null : scheduledStartTime);
            }}
            onKeyDown={handleKeyDown}
            style={{ 
              fontWeight: 600, 
              color: 'var(--primary)', 
              fontSize: '0.95rem',
              background: 'transparent',
              border: '1px solid transparent',
              borderRadius: '4px',
              padding: '2px 4px',
              width: '80px',
              outline: 'none'
            }}
            placeholder="00:00"
            title="Uhrzeit bearbeiten"
          />
        </div>

        <div className="task-actions-compact" style={{ display: 'flex', gap: '4px', opacity: 0.7 }}>
          <button 
            onClick={() => setIsAIEditOpen(!isAIEditOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', opacity: isAIEditOpen ? 1 : 0.6 }}
            title="AI Edit"
          >
            ✨
          </button>
        </div>
      </div>

      {/* AI Edit Row */}
      {isAIEditOpen && (
        <div style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(59, 130, 246, 0.1)', padding: '6px 8px', borderRadius: '4px', marginTop: '4px', border: '1px dashed var(--primary)' }}>
          <button 
            onClick={toggleListening}
            style={{ background: isListening ? '#ef4444' : 'var(--surface)', color: isListening ? 'white' : 'var(--foreground)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            🎤
          </button>
          <input 
            value={aiText}
            onChange={e => setAiText(e.target.value)}
            onKeyDown={e => {
              e.stopPropagation();
              if (e.key === 'Enter') handleAIEditSubmit();
            }}
            placeholder="Was soll ich ändern?"
            style={{ flexGrow: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--foreground)' }}
            disabled={isAILoading}
            autoFocus
          />
          <button 
            onClick={handleAIEditSubmit}
            disabled={isAILoading || !aiText.trim()}
            style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem', cursor: isAILoading || !aiText.trim() ? 'not-allowed' : 'pointer', opacity: isAILoading || !aiText.trim() ? 0.5 : 1 }}
          >
            {isAILoading ? '⏳' : 'GO'}
          </button>
        </div>
      )}
      {aiError && (
        <div style={{ width: '100%', padding: '4px', color: '#ef4444', fontSize: '0.75rem', textAlign: 'center' }}>
          {aiError}
        </div>
      )}
      
      {/* Middle Row: Full width Title */}
      <div style={{ width: '100%' }}>
        <textarea 
          ref={textareaRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => handleUpdate('title', title)}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{ 
            fontWeight: 500, 
            fontSize: '1rem',
            textDecoration: task.completed ? 'line-through' : 'none',
            width: '100%',
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: '4px',
            padding: '2px 4px',
            color: 'var(--foreground)',
            outline: 'none',
            resize: 'none',
            overflow: 'hidden',
            lineHeight: 1.4,
            fontFamily: 'inherit'
          }}
          placeholder="Task Titel"
          title="Klicken zum Bearbeiten"
        />
      </div>

      {/* Time Constraint Display */}
      {task.timeConstraint && (
        <div style={{ width: '100%', padding: '0 4px', marginTop: '-2px', marginBottom: '4px' }}>
          <span style={{ 
            fontSize: '0.75rem', 
            fontStyle: 'italic', 
            opacity: 0.7, 
            color: 'var(--foreground)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            {task.timeConstraint}
          </span>
        </div>
      )}

      {/* Bottom Row: Centered Badges */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '2px' }}>
        <span 
          style={{ 
            fontSize: '0.75rem', 
            background: 'var(--surface-border)', 
            padding: '3px 8px', 
            borderRadius: '6px', 
            color: 'var(--foreground)', 
            opacity: 0.85,
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}
          title="Dauer in Minuten bearbeiten"
        >
          ⏱ 
          <input 
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            onBlur={() => handleUpdate('estimatedDuration', duration ? parseInt(duration) : null)}
            onKeyDown={handleKeyDown}
            style={{
              width: '30px',
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              fontSize: 'inherit',
              textAlign: 'center',
              outline: 'none',
              padding: 0
            }}
            placeholder="0"
          /> 
          min
        </span>
      </div>

      {/* Delete Button (Bottom Left) */}
      <button 
        onClick={() => onDelete(task.id)}
        style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '4px', opacity: 0.6, transition: 'opacity 0.2s' }}
        title="Task löschen"
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  );
}
