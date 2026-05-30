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
import { SchedulingCopilot } from './SchedulingCopilot';

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
  const [previewSchedule, setPreviewSchedule] = React.useState<any[] | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = React.useState(false);

  const today = startOfToday();
  const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');
  const day2Str = format(addDays(today, 2), 'yyyy-MM-dd');
  const day3Str = format(addDays(today, 3), 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  // Load saved schedule on mount
  React.useEffect(() => {
    fetch(`/api/schedule?date=${todayStr}`)
      .then(res => res.json())
      .then(data => {
        if (data.schedule) setSchedule(data.schedule);
      })
      .catch(console.error);
  }, [todayStr]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Filter tasks for today
  const todayTasks = useMemo(() => 
    tasks.filter(t => {
      const isImplicitlyToday = !t.scheduledDate && t.scheduledStartTime !== null;
      const isExplicitlyTodayOrPast = t.scheduledDate && t.scheduledDate <= todayStr && t.scheduledDate !== 'later';
      return isExplicitlyTodayOrPast || isImplicitlyToday;
    }).sort((a, b) => {
      if (a.scheduledStartTime && !b.scheduledStartTime) return -1;
      if (!a.scheduledStartTime && b.scheduledStartTime) return 1;
      if (a.scheduledStartTime && b.scheduledStartTime) {
        return a.scheduledStartTime.localeCompare(b.scheduledStartTime);
      }
      return a.id - b.id;
    }),
  [tasks, todayStr]);

  const activeTask = useMemo(() => tasks.find((t) => t.id === activeId), [activeId, tasks]);

  const saveSchedule = async () => {
    if (!previewSchedule) return;
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayStr, schedule: previewSchedule })
      });
      if (res.ok) {
        setSchedule(previewSchedule);
        setPreviewSchedule(null);
        window.location.reload(); // Reload to sync updated task times from DB
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save schedule');
    }
  };

  const currentScheduleToRender = useMemo(() => {
    if (previewSchedule) return previewSchedule;
    
    if (schedule.length > 0) {
      const mixed: any[] = [];
      // 1. Add all scheduled tasks using their LIVE DB times
      todayTasks.forEach(t => {
        if (t.scheduledStartTime) {
          mixed.push({ 
            type: 'task', 
            referenceId: t.id, 
            startTime: t.scheduledStartTime,
            isLive: true // flag to indicate we should use live task data
          });
        }
      });
      // 2. Add routines and breaks from the saved AI schedule
      schedule.forEach(item => {
        if (item.type !== 'task') mixed.push(item);
      });
      // 3. Sort everything chronologically
      return mixed.sort((a, b) => {
        if (a.startTime && !b.startTime) return -1;
        if (!a.startTime && b.startTime) return 1;
        if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
        return 0;
      });
    }
    return [];
  }, [schedule, previewSchedule, todayTasks]);

  const unscheduledTasks = useMemo(() => {
    if (currentScheduleToRender.length === 0) return [];
    if (previewSchedule) {
      return todayTasks.filter(t => !previewSchedule.find((item: any) => item.type === 'task' && item.referenceId === t.id));
    }
    return todayTasks.filter(t => !t.scheduledStartTime);
  }, [currentScheduleToRender, previewSchedule, todayTasks]);

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

      let displayTask = { ...task };

      // If we are previewing the schedule, override the task's properties with the AI's proposal
      if (!item.isLive) {
        let durationMinutes: number | null = null;
        if (item.startTime && item.endTime) {
          const [sh, sm] = item.startTime.split(':').map(Number);
          const [eh, em] = item.endTime.split(':').map(Number);
          if (!isNaN(sh) && !isNaN(eh)) {
            const diff = (eh * 60 + em) - (sh * 60 + sm);
            if (diff > 0) durationMinutes = diff;
          }
        }
        displayTask = {
          ...task,
          scheduledStartTime: item.startTime,
          estimatedDuration: durationMinutes ?? task.estimatedDuration
        };
      }

      return (
        <SortableTaskItem 
          key={`sched-task-${item.referenceId}-${index}`}
          task={displayTask} 
          onToggle={onToggle} 
          onDelete={onDelete} 
          onUpdate={onTaskUpdate}
        />
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
                onClick={() => setIsCopilotOpen(true)}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Optimize 🪄
              </button>
            }
          >
            {processingContent}
            <SortableContext 
              items={todayTasks.map(t => t.id.toString())} 
              strategy={verticalListSortingStrategy}
            >
              {currentScheduleToRender.length > 0 ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentScheduleToRender.map((item, i) => renderScheduleItem(item, i))}
                  </div>
                  {unscheduledTasks.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                      <h4 style={{ opacity: 0.5, borderBottom: '1px solid currentColor', paddingBottom: '4px', marginBottom: '8px' }}>Unscheduled Tasks</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {unscheduledTasks.map(task => (
                          <SortableTaskItem 
                            key={task.id} 
                            task={task} 
                            onToggle={onToggle} 
                            onDelete={onDelete} 
                            onUpdate={onTaskUpdate}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {todayTasks.map(task => (
                    <SortableTaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={onToggle} 
                      onDelete={onDelete} 
                      onUpdate={onTaskUpdate}
                    />
                  ))}
                </div>
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

      <SchedulingCopilot 
        isOpen={isCopilotOpen}
        onClose={() => {
          setIsCopilotOpen(false);
          setPreviewSchedule(null);
        }}
        tasks={todayTasks.filter(t => !t.completed)}
        targetDate={todayStr}
        onPreviewSchedule={setPreviewSchedule}
        onSaveSchedule={saveSchedule}
      />
    </DndContext>
  );
}
