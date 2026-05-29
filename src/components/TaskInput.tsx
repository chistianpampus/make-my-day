import React, { useState } from 'react';

interface TaskInputProps {
  onProcessText: (text: string) => Promise<void>;
  isProcessing: boolean;
}

export function TaskInput({ onProcessText, isProcessing }: TaskInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isProcessing) return;
    
    const inputToProcess = text;
    setText('');
    await onProcessText(inputToProcess);
  };

  return (
    <form onSubmit={handleSubmit} className="task-input-form" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a new task (e.g., 'Meeting at 3pm tomorrow')"
        disabled={isProcessing}
        className="glass-input"
        style={{
          flex: 1,
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.05)',
          color: '#fff',
          fontSize: '1rem',
          outline: 'none'
        }}
      />
      <button 
        type="submit" 
        disabled={!text.trim() || isProcessing}
        className="primary-button"
        style={{
          padding: '12px 24px',
          borderRadius: '12px',
          border: 'none',
          background: '#3b82f6',
          color: '#fff',
          fontWeight: 'bold',
          cursor: (!text.trim() || isProcessing) ? 'not-allowed' : 'pointer',
          opacity: (!text.trim() || isProcessing) ? 0.5 : 1,
          transition: 'all 0.2s'
        }}
      >
        {isProcessing ? 'Adding...' : 'Add'}
      </button>
    </form>
  );
}
