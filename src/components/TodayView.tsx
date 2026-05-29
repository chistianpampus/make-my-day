import React, { useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { addDays, format, startOfToday } from 'date-fns';

import { Task } from '../types';
import { DroppableContainer } from './DroppableContainer';
import { SortableTaskItem } from './SortableTaskItem';
import { TaskCard } from './TaskCard';

interface TodayViewProps {
  tasks: Task[];
  onTaskUpdate: (id: number, data: Partial<Task>) => void;
  onToggle: (id: number, currentStatus: boolean) => void;
  onDelete: (id: number) => void;
  processingContent?: React.ReactNode;
}

export function TodayView({ tasks, onTaskUpdate, onToggle, onDelete, processingContent }: TodayViewProps) {
  const [activeId, setActiveId] = React.useState<number | null>(null);
  const [activeTargetContainerId, setActiveTargetContainerId] = React.useState<string | null>(null);
  
  const [schedule, setSchedule] = React.useState<any[]>([]);
  const [isScheduling, setIsScheduling] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const today = startOfToday();
  const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');
  const day2Str = format(addDays(today, 2), 'yyyy-MM-dd');
  const day3Str = format(addDays(today, 3), 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  // Filter tasks for today
  const todayTasks = useMemo(() => 
    tasks.filter(t => {
      const isImplicitlyToday = !t.scheduledDate && t.scheduledStartTime !== null;
      const isExplicitlyTodayOrPast = t.scheduledDate && t.scheduledDate <= todayStr && t.scheduledDate !== 'later';
      return isExplicitlyTodayOrPast || isImplicitlyToday;
    }),
  [tasks, todayStr]);

  const activeTask = useMemo(() => tasks.find((t) => t.id === activeId), [activeId, tasks]);

  const generateSchedule = async () => {
    setIsScheduling(true);
    try {
      const routinesRes = await fetch('/api/routines');
      const routines = await routinesRes.json();
      
      const schedRes = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: todayTasks, routines, targetDate: todayStr })
      });
      
      if (!schedRes.ok) throw new Error('Failed to generate schedule');
      const data = await schedRes.json();
      setSchedule(data.schedule);
    } catch (error) {
      console.error(error);
      alert('Failed to generate schedule');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(parseInt(event.active.id as string, 10));
  };

  const handleDragOver = (event: any) => {
    const { over } = event;
    if (!over) {
      setActiveTargetContainerId(null);
      return;
    }
    let targetContainerId = over.id as string;
    if (!targetContainerId.startsWith('container-')) {
      targetContainerId = 'container-today';
    }
    setActiveTargetContainerId(targetContainerId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTargetContainerId(null);

    if (!over) return;

    const taskId = parseInt(active.id as string, 10);
    let targetContainerId = over.id as string;
    if (!targetContainerId.startsWith('container-')) {
      targetContainerId = 'container-today';
    }

    // Determine target date based on the container dropped into
    let targetDate: string | null = null;
    
    if (targetContainerId === 'container-tomorrow') targetDate = tomorrowStr;
    else if (targetContainerId === 'container-day2') targetDate = day2Str;
    else if (targetContainerId === 'container-day3') targetDate = day3Str;
    else if (targetContainerId === 'container-later') targetDate = 'later';
    else if (targetContainerId === 'container-today') targetDate = todayStr;

    if (targetDate !== null) {
      let actualTarget = targetDate === 'later' ? null : targetDate;
      
      if (targetContainerId === 'container-later') {
        const inputDate = window.prompt("Für wann möchtest du diesen Task planen? (YYYY-MM-DD eingeben oder leer lassen für 'irgendwann')", "");
        if (inputDate === null) {
          // User clicked Cancel, abort the drop
          return;
        }
        actualTarget = inputDate.trim() ? inputDate.trim() : null;
      }

      const task = tasks.find(t => t.id === taskId);
      
      if (task) {
        const updates: Partial<Task> = {};
        let needsUpdate = false;

        if (task.scheduledDate !== actualTarget) {
          updates.scheduledDate = actualTarget;
          needsUpdate = true;
        }

        // If moved to later without a date, we must clear the timeframe too,
        // otherwise it will be caught by the "implicitly today" filter!
        if (targetContainerId === 'container-later' && actualTarget === null && task.scheduledStartTime !== null) {
          updates.scheduledStartTime = null;
          needsUpdate = true;
        }

        if (needsUpdate) {
          onTaskUpdate(taskId, updates);
        }
      }
    }
  };

  const renderScheduleItem = (item: any, index: number) => {
    if (item.type === 'task') {
      const task = todayTasks.find(t => t.id === item.referenceId);
      if (!task) return null;
      return (
        <div key={`sched-task-${item.referenceId}-${index}`} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ minWidth: '45px', fontSize: '0.8rem', opacity: 0.7, textAlign: 'right' }}>
            {item.startTime}
          </div>
          <div style={{ flexGrow: 1 }}>
            <SortableTaskItem 
              task={task} 
              onToggle={onToggle} 
              onDelete={onDelete} 
              onUpdate={onTaskUpdate}
            />
          </div>
        </div>
      );
    } else if (item.type === 'routine') {
      return (
        <div key={`sched-routine-${index}`} style={{ display: 'flex', gap: '8px', alignItems: 'center', opacity: 0.8 }}>
          <div style={{ minWidth: '45px', fontSize: '0.8rem', opacity: 0.7, textAlign: 'right' }}>
            {item.startTime}
          </div>
          <div style={{ flexGrow: 1, padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', borderRadius: '4px' }}>
            <strong>{item.title}</strong>
          </div>
        </div>
      );
    } else if (item.type === 'break') {
      return (
        <div key={`sched-break-${index}`} style={{ display: 'flex', gap: '8px', alignItems: 'center', opacity: 0.5, margin: '8px 0' }}>
          <div style={{ minWidth: '45px', fontSize: '0.7rem', textAlign: 'right' }}>
            {item.startTime}
          </div>
          <div style={{ flexGrow: 1, height: '1px', background: 'currentColor' }} />
          <div style={{ fontSize: '0.7rem' }}>{item.title}</div>
          <div style={{ flexGrow: 1, height: '1px', background: 'currentColor' }} />
        </div>
      );
    }
    return null;
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', gap: '24px', padding: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Left Side: Today's Tasks */}
        <div style={{ flex: '1 1 350px', minWidth: '300px' }}>
          <DroppableContainer 
            id="container-today" 
            title="TODAY" 
            subtitle={format(today, 'EEEE, MMM d, yyyy')}
            emptyText="No tasks for today. Add one or drag from elsewhere!"
            isDropZoneOnly={false}
            isHighlighted={activeTargetContainerId === 'container-today'}
            headerRight={
              <button 
                onClick={generateSchedule}
                disabled={isScheduling || todayTasks.length === 0}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: (isScheduling || todayTasks.length === 0) ? 'not-allowed' : 'pointer',
                  opacity: (isScheduling || todayTasks.length === 0) ? 0.5 : 1
                }}
              >
                {isScheduling ? 'Optimizing...' : 'Optimize 🪄'}
              </button>
            }
          >
            {processingContent}
            <SortableContext 
              items={todayTasks.map(t => t.id.toString())} 
              strategy={verticalListSortingStrategy}
            >
              {schedule.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {schedule.map((item, i) => renderScheduleItem(item, i))}
                </div>
              ) : (
                todayTasks.map(task => (
                  <SortableTaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={onToggle} 
                    onDelete={onDelete} 
                    onUpdate={onTaskUpdate}
                  />
                ))
              )}
            </SortableContext>
          </DroppableContainer>
        </div>

        {/* Right Side: Future Drop Zones */}
        <div style={{ flex: '1 1 300px', minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <DroppableContainer 
            id="container-tomorrow" 
            title="TOMORROW" 
            subtitle={format(addDays(today, 1), 'EEEE')}
            isDropZoneOnly={true}
            emptyText="Drag tasks here to plan ahead"
            isHighlighted={activeTargetContainerId === 'container-tomorrow'}
          />
          <DroppableContainer 
            id="container-day2" 
            title="IN 2 DAYS" 
            subtitle={format(addDays(today, 2), 'EEEE')}
            isDropZoneOnly={true}
            emptyText="Drag tasks here to plan ahead"
            isHighlighted={activeTargetContainerId === 'container-day2'}
          />
          <DroppableContainer 
            id="container-day3" 
            title="IN 3 DAYS" 
            subtitle={format(addDays(today, 3), 'EEEE')}
            isDropZoneOnly={true}
            emptyText="Drag tasks here to plan ahead"
            isHighlighted={activeTargetContainerId === 'container-day3'}
          />
          <DroppableContainer 
            id="container-later" 
            title="LATER" 
            isDropZoneOnly={true}
            emptyText="Drag tasks here to plan ahead"
            isHighlighted={activeTargetContainerId === 'container-later'}
          />
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard 
            task={activeTask} 
            onToggle={() => {}} 
            onDelete={() => {}} 
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
