import React from 'react';
import { useDroppable, useDndContext } from '@dnd-kit/core';

interface DroppableContainerProps {
  id: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  emptyText?: string;
  isDropZoneOnly?: boolean;
  isHighlighted?: boolean;
  headerRight?: React.ReactNode;
}

export function DroppableContainer({ id, title, subtitle, children, emptyText, isDropZoneOnly, isHighlighted, headerRight }: DroppableContainerProps) {
  const { setNodeRef } = useDroppable({
    id,
    data: { type: 'Container', containerId: id }
  });

  const { over } = useDndContext();
  
  // Determine if this container is the target.
  // It's the target if `over.id` is this container, OR if `over.id` is a task inside this container.
  // We can't perfectly know if a task is in this container without looking at the task data,
  // but we can check if `over` exists and maybe we just rely on a simpler check.
  // Actually, dnd-kit provides `over?.data?.current?.sortable?.containerId`.
  // Wait, SortableContext doesn't automatically set containerId unless it has `id` prop which it doesn't.
  // But wait, our dragEnd logic manually resolves it.
  
  // Let's use a simpler heuristic: if over.id === id, it's definitely over the empty container area.
  // If it's over a task, the task makes room anyway. But to add the dashed border globally to the container,
  // we might need to know the active container. 
  
  const isDirectlyOver = over?.id === id;
  const activeHighlight = isHighlighted || isDirectlyOver;
  
  const style: React.CSSProperties = {
    padding: '16px',
    borderRadius: '16px',
    background: activeHighlight ? 'rgba(255, 255, 255, 0.1)' : 'var(--surface)',
    border: activeHighlight ? '2px dashed var(--primary)' : '2px dashed transparent',
    transition: 'all 0.2s ease',
    minHeight: isDropZoneOnly ? '120px' : '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--foreground)' }}>{title}</h3>
          {subtitle && <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{subtitle}</span>}
        </div>
        {headerRight && <div>{headerRight}</div>}
      </div>
      
      {!isDropZoneOnly && (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {children}
          {(!children || React.Children.count(children) === 0) && emptyText && (
            <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5, border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px' }}>
              {emptyText}
            </div>
          )}
        </div>
      )}

      {isDropZoneOnly && (
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px' }}>
          {emptyText || "Drag tasks here"}
        </div>
      )}
    </div>
  );
}
