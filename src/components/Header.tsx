"use client";

import React from 'react';
import { useCompactView } from '../contexts/CompactViewContext';

import packageJson from '../../package.json';

interface HeaderProps {
  onClearDB?: () => void;
}

export function Header({ onClearDB }: HeaderProps) {
  const { isCompact, toggleCompact } = useCompactView();

  return (
    <header className="header" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <div>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          Make My Day
          <span style={{ fontSize: '0.6rem', padding: '2px 6px', background: 'var(--surface-border)', borderRadius: '4px', opacity: 0.6 }}>v{packageJson.version}</span>
        </h1>
        <p style={{ margin: '4px 0 0 0' }}>Your Voice-Controlled Daily Planner</p>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={toggleCompact}
          style={{
            background: isCompact ? 'var(--primary)' : 'transparent',
            border: `1px solid ${isCompact ? 'transparent' : 'var(--surface-border)'}`,
            color: isCompact ? 'white' : 'var(--foreground)',
            padding: '6px 10px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            opacity: 0.8
          }}
          title={isCompact ? 'Normal View' : 'Compact View'}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
        >
          {isCompact ? '🗗 Normal' : '🗕 Compact'}
        </button>

        {onClearDB && (
          <button 
            onClick={onClearDB}
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
            🗑️ Clear
          </button>
        )}
      </div>
    </header>
  );
}
