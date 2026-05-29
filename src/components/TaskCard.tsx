import { useState, useEffect, useRef } from 'react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onToggle: (id: number, currentStatus: boolean) => void;
  onDelete: (id: number) => void;
  onUpdate?: (id: number, data: Partial<Task>) => void;
}

export function TaskCard({ task, onToggle, onDelete, onUpdate }: TaskCardProps) {
  // Local state for inline editing
  const [title, setTitle] = useState(task.title);
  const [timeframe, setTimeframe] = useState(task.timeframe);
  const [duration, setDuration] = useState(task.estimatedDuration ? task.estimatedDuration.toString() : '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state if props change from outside
  useEffect(() => setTitle(task.title), [task.title]);
  useEffect(() => setTimeframe(task.timeframe), [task.timeframe]);
  useEffect(() => setDuration(task.estimatedDuration ? task.estimatedDuration.toString() : '')), [task.estimatedDuration];

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            checked={task.completed} 
            onChange={() => onToggle(task.id, task.completed)} 
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
            aria-label="Mark completed"
          />
          <input 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            onBlur={() => handleUpdate('timeframe', timeframe)}
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
            title="Klicken zum Bearbeiten"
          />
        </div>

        <div className="task-actions-compact" style={{ display: 'flex', gap: '4px', opacity: 0.7 }}>
          <button 
            onClick={() => onDelete(task.id)}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
            title="Task löschen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      
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
        
        <button 
          onClick={() => onUpdate && onUpdate(task.id, { isFlexible: !task.isFlexible })}
          style={{ 
            fontSize: '0.75rem', 
            background: 'var(--surface-border)', 
            padding: '3px 8px', 
            borderRadius: '6px', 
            color: 'var(--foreground)', 
            opacity: 0.85,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Klicken um zwischen Flexibel und Strict zu wechseln"
        >
          {task.isFlexible ? '🧘 Flexible' : '📌 Strict'}
        </button>
      </div>
    </div>
  );
}
