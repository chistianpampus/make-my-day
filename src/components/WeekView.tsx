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
  arrayMove
} from '@dnd-kit/sortable';
import { addDays, format, startOfToday } from 'date-fns';
import { getWaterfallUpdates } from '../lib/timeUtils';

import { Task } from '../types';
import { DroppableContainer } from './DroppableContainer';
import { SortableTaskItem } from './SortableTaskItem';
import { TaskCard } from './TaskCard';
import { SchedulingCopilot } from './SchedulingCopilot';

interface WeekViewProps {
  initialTasks: Task[];
  onTaskUpdate: (id: number, data: Partial<Task>) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, completed: boolean) => void;
  processingContent?: React.ReactNode;
}

export function WeekView({ initialTasks, onTaskUpdate, onDelete, onToggle, processingContent }: WeekViewProps) {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  const [activeId, setActiveId] = React.useState<number | null>(null);
  const [activeTargetContainerId, setActiveTargetContainerId] = React.useState<string | null>(null);

  // States for Copilot / Day Planning
  const [isCopilotOpen, setIsCopilotOpen] = React.useState(false);
  const [copilotDate, setCopilotDate] = React.useState<string | null>(null);
  const [copilotTasks, setCopilotTasks] = React.useState<Task[]>([]);
  const [previewSchedule, setPreviewSchedule] = React.useState<any[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const today = startOfToday();
  const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');
  const day2Str = format(addDays(today, 2), 'yyyy-MM-dd');
  const day3Str = format(addDays(today, 3), 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const applyWaterfallForDate = async (dateKey: string | null) => {
    const list = getTasksForDate(dateKey);
    if (list.length === 0) return;
    const updates = getWaterfallUpdates(list, list);
    if (updates.length > 0) {
      updates.forEach(u => onTaskUpdate(u.id, u.updates));
      try {
        await fetch('/api/tasks/bulk-update', {
          method: 'POST',
          body: JSON.stringify({ updates }),
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        console.error("Bulk update failed", err);
      }
    }
  };

  const handleOpenCopilot = (dateKey: string | null) => {
    setCopilotDate(dateKey);
    setCopilotTasks(getTasksForDate(dateKey));
    setPreviewSchedule(null);
    setIsCopilotOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!previewSchedule) return;
    
    // In WeekView, we only save the task times, because it's a lightweight view
    // (We extract all task updates from the schedule array)
    const taskUpdates = previewSchedule
      .filter((s: any) => s.type === 'task' && s.referenceId)
      .map((s: any) => ({
        id: s.referenceId,
        updates: {
          scheduledStartTime: s.startTime,
          estimatedDuration: s.duration || 30
        }
      }));

    if (taskUpdates.length > 0) {
      taskUpdates.forEach((u: any) => onTaskUpdate(u.id, u.updates));
      try {
        await fetch('/api/tasks/bulk-update', {
          method: 'POST',
          body: JSON.stringify({ updates: taskUpdates }),
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        console.error("Bulk update failed", err);
      }
    }
    
    // Also save the full schedule via /api/schedule to persist routines if the user wants them
    // Actually, calling /api/schedule ensures routines are saved too!
    const dateToSave = copilotDate || new Date().toISOString().split('T')[0];
    try {
      await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateToSave,
          schedule: previewSchedule
        })
      });
      // The parent component should refetch, but we already optimistically updated tasks
    } catch(err) {
      console.error(err);
    }
  };

  const getTasksForDate = (dateStr: string | null) => {
    return tasks.filter(t => {
      if (dateStr === todayStr) {
        const isImplicitlyToday = !t.scheduledDate && t.scheduledStartTime !== null;
        const isExplicitlyTodayOrPast = t.scheduledDate && t.scheduledDate <= todayStr && t.scheduledDate !== 'later';
        return isExplicitlyTodayOrPast || isImplicitlyToday;
      }
      if (dateStr === null) {
        const isImplicitlyToday = !t.scheduledDate && t.scheduledStartTime !== null;
        if (isImplicitlyToday) return false;
        if (!t.scheduledDate || t.scheduledDate === 'later') return true;
        return t.scheduledDate > day3Str;
      }
      return t.scheduledDate === dateStr;
    }).sort((a, b) => {
      if (a.scheduledStartTime && !b.scheduledStartTime) return -1;
      if (!a.scheduledStartTime && b.scheduledStartTime) return 1;
      if (a.scheduledStartTime && b.scheduledStartTime) {
        return a.scheduledStartTime.localeCompare(b.scheduledStartTime);
      }
      return a.id - b.id;
    });
  };

  const todayTasks = useMemo(() => getTasksForDate(todayStr), [tasks, todayStr]);
  const tomorrowTasks = useMemo(() => getTasksForDate(tomorrowStr), [tasks, tomorrowStr]);
  const day2Tasks = useMemo(() => getTasksForDate(day2Str), [tasks, day2Str]);
  const day3Tasks = useMemo(() => getTasksForDate(day3Str), [tasks, day3Str]);
  const laterTasks = useMemo(() => getTasksForDate(null), [tasks]);

  const activeTask = useMemo(() => tasks.find((t) => t.id === activeId), [activeId, tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(parseInt(event.active.id as string, 10));
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) {
      setActiveTargetContainerId(null);
      return;
    }
    
    let targetContainerId = over.id as string;
    
    if (!targetContainerId.startsWith('container-')) {
      const overTaskId = parseInt(targetContainerId, 10);
      const overTask = tasks.find(t => t.id === overTaskId);
      if (overTask) {
        const sd = overTask.scheduledDate;
        const isImplicitlyToday = !sd && overTask.scheduledStartTime !== null;
        const isExplicitlyTodayOrPast = sd && sd <= todayStr && sd !== 'later';
        
        if (isExplicitlyTodayOrPast || isImplicitlyToday) targetContainerId = 'container-today';
        else if (sd === tomorrowStr) targetContainerId = 'container-tomorrow';
        else if (sd === day2Str) targetContainerId = 'container-day2';
        else if (sd === day3Str) targetContainerId = 'container-day3';
        else targetContainerId = 'container-later';
      }
    }
    setActiveTargetContainerId(targetContainerId);

    // Optimistically move task to target container to make items shift
    const activeTaskId = parseInt(active.id as string, 10);
    const activeTask = tasks.find(t => t.id === activeTaskId);
    if (activeTask) {
      let targetDate: string | null = null;
      if (targetContainerId === 'container-tomorrow') targetDate = tomorrowStr;
      else if (targetContainerId === 'container-day2') targetDate = day2Str;
      else if (targetContainerId === 'container-day3') targetDate = day3Str;
      else if (targetContainerId === 'container-later') targetDate = 'later';
      else if (targetContainerId === 'container-today') targetDate = todayStr;

      if (targetDate !== null) {
        const actualTarget = targetDate === 'later' ? null : targetDate;
        
        const isSame = 
          (activeTask.scheduledDate === actualTarget) || 
          (!activeTask.scheduledDate && actualTarget === null && targetContainerId === 'container-later') ||
          (!activeTask.scheduledDate && actualTarget === todayStr && targetContainerId === 'container-today');

        if (!isSame) {
          setTasks(prev => prev.map(t => {
            if (t.id === activeTaskId) {
              return { ...t, scheduledDate: actualTarget };
            }
            return t;
          }));
        }
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTargetContainerId(null);

    if (!over) return;

    const taskId = parseInt(active.id as string, 10);
    const overIdStr = over.id as string;
    let targetContainerId = overIdStr;
    let overTaskId: number | null = null;
    let isReorderingWithinSameDay = false;
    
    if (!targetContainerId.startsWith('container-')) {
      overTaskId = parseInt(targetContainerId, 10);
      const overTask = tasks.find(t => t.id === overTaskId);
      if (overTask) {
        const sd = overTask.scheduledDate;
        const isImplicitlyToday = !sd && overTask.scheduledStartTime !== null;
        const isExplicitlyTodayOrPast = sd && sd <= todayStr && sd !== 'later';
        
        if (isExplicitlyTodayOrPast || isImplicitlyToday) targetContainerId = 'container-today';
        else if (sd === tomorrowStr) targetContainerId = 'container-tomorrow';
        else if (sd === day2Str) targetContainerId = 'container-day2';
        else if (sd === day3Str) targetContainerId = 'container-day3';
        else targetContainerId = 'container-later';
        
        isReorderingWithinSameDay = true;
      }
    }

    if (isReorderingWithinSameDay && overTaskId && overTaskId !== taskId) {
      // Determine the list we are reordering in
      let dateKey: string | null = null;
      if (targetContainerId === 'container-today') dateKey = todayStr;
      else if (targetContainerId === 'container-tomorrow') dateKey = tomorrowStr;
      else if (targetContainerId === 'container-day2') dateKey = day2Str;
      else if (targetContainerId === 'container-day3') dateKey = day3Str;
      
      const originalList = getTasksForDate(dateKey);
      const activeIndex = originalList.findIndex(t => t.id === taskId);
      const overIndex = originalList.findIndex(t => t.id === overTaskId);

      if (overIndex !== -1 && dateKey !== null) {
        let newArray: Task[];
        let activeTaskWasOutside = false;
        
        if (activeIndex !== -1) {
          newArray = arrayMove(originalList, activeIndex, overIndex);
        } else {
          const activeTask = tasks.find(t => t.id === taskId);
          if (!activeTask) return;
          newArray = [...originalList];
          newArray.splice(overIndex, 0, activeTask);
          activeTaskWasOutside = true;
        }

        const updates = getWaterfallUpdates(originalList, newArray);
        
        if (activeTaskWasOutside) {
          // Update the date!
          const activeUpdate = updates.find(u => u.id === taskId);
          if (activeUpdate) {
            activeUpdate.updates.scheduledDate = dateKey;
          } else {
            updates.push({ id: taskId, updates: { scheduledDate: dateKey }});
          }
        }
        
        if (updates.length > 0) {
          updates.forEach(u => onTaskUpdate(u.id, u.updates));
          try {
            await fetch('/api/tasks/bulk-update', {
              method: 'POST',
              body: JSON.stringify({ updates }),
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (err) {
            console.error("Bulk update failed", err);
          }
        }
      }
      return;
    }

    let targetDate: string | null = null;
    
    if (targetContainerId === 'container-tomorrow') targetDate = tomorrowStr;
    else if (targetContainerId === 'container-day2') targetDate = day2Str;
    else if (targetContainerId === 'container-day3') targetDate = day3Str;
    else if (targetContainerId === 'container-later') targetDate = 'later';
    else if (targetContainerId === 'container-today') targetDate = todayStr;

    if (targetDate !== null) {
      const actualTarget = targetDate === 'later' ? null : targetDate;
      const originalTask = initialTasks.find(t => t.id === taskId);
      
      if (originalTask) {
        const isSame = 
          (originalTask.scheduledDate === actualTarget) || 
          (!originalTask.scheduledDate && actualTarget === null && targetContainerId === 'container-later') ||
          (!originalTask.scheduledDate && actualTarget === todayStr && targetContainerId === 'container-today');

        if (!isSame) {
          onTaskUpdate(taskId, { 
            scheduledDate: actualTarget,
            scheduledStartTime: null // POINT 21: Clear time when moving to another day
          });
        }
      }
    }
  };

  const renderColumn = (id: string, title: string, subtitle: string, columnTasks: Task[], dateKey: string | null, includeProcessing = false) => {
    // Apply preview times if the copilot is generating a schedule for THIS date
    const tasksToRender = columnTasks.map(t => {
      if (previewSchedule && copilotDate === dateKey) {
        const pTask = previewSchedule.find(s => s.type === 'task' && s.referenceId === t.id);
        if (pTask) {
          // Calculate duration if it has start and end times
          let durationMinutes = t.estimatedDuration;
          if (pTask.startTime && pTask.endTime) {
            const [sh, sm] = pTask.startTime.split(':').map(Number);
            const [eh, em] = pTask.endTime.split(':').map(Number);
            if (!isNaN(sh) && !isNaN(eh)) {
              const diff = (eh * 60 + em) - (sh * 60 + sm);
              if (diff > 0) durationMinutes = diff;
            }
          }
          return { ...t, scheduledStartTime: pTask.startTime, estimatedDuration: durationMinutes };
        }
      }
      return t;
    });

    return (
      <div style={{ flex: '1 1 250px', minWidth: '250px' }}>
        <DroppableContainer 
          id={id} 
          title={title} 
          subtitle={subtitle}
          emptyText="No tasks scheduled."
          isHighlighted={activeTargetContainerId === id}
        >
          {dateKey !== null && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => applyWaterfallForDate(dateKey)}
                title="Wasserfall (Zeiten skriptbasiert berechnen)"
                style={{ flex: 1, padding: '4px 8px', fontSize: '0.8rem', background: 'var(--surface-border)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'var(--foreground)' }}
              >
                ⬇️ Wasserfall
              </button>
              <button 
                onClick={() => handleOpenCopilot(dateKey)}
                title="KI-Plan (Scheduling Copilot starten)"
                style={{ flex: 1, padding: '4px 8px', fontSize: '0.8rem', background: 'var(--primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#fff' }}
              >
                🪄 KI-Plan
              </button>
            </div>
          )}
          {includeProcessing && processingContent}
          <SortableContext 
            items={tasksToRender.map(t => t.id.toString())} 
            strategy={verticalListSortingStrategy}
          >
            {tasksToRender.map(task => (
              <SortableTaskItem 
                key={`task-${task.id}`} 
                task={task} 
                onToggle={onToggle} 
                onDelete={onDelete} 
                onUpdate={onTaskUpdate}
              />
            ))}
          </SortableContext>
        </DroppableContainer>
      </div>
    );
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="week-view-container" style={{ display: 'flex', gap: '16px', padding: '16px', overflowX: 'auto', minHeight: 'calc(100vh - 200px)' }}>
        {renderColumn('container-today', 'Heute', format(today, 'EEEE, d. MMM'), todayTasks, todayStr, true)}
        {renderColumn('container-tomorrow', 'Morgen', format(addDays(today, 1), 'EEEE, d. MMM'), tomorrowTasks, tomorrowStr)}
        {renderColumn('container-day2', format(addDays(today, 2), 'EEEE'), format(addDays(today, 2), 'd. MMM'), day2Tasks, day2Str)}
        {renderColumn('container-day3', format(addDays(today, 3), 'EEEE'), format(addDays(today, 3), 'd. MMM'), day3Tasks, day3Str)}
        {renderColumn('container-later', 'Später', 'Ungeplant', laterTasks, null)}
      </div>

      <SchedulingCopilot 
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        tasks={copilotTasks}
        targetDate={copilotDate || todayStr}
        onPreviewSchedule={(sched) => setPreviewSchedule(sched)}
        onSaveSchedule={handleSaveSchedule}
      />

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
