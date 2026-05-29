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

interface WeekViewProps {
  tasks: Task[];
  onTaskUpdate: (id: number, data: Partial<Task>) => void;
  onToggle: (id: number, currentStatus: boolean) => void;
  onDelete: (id: number) => void;
  processingContent?: React.ReactNode;
}

export function WeekView({ tasks: initialTasks, onTaskUpdate, onToggle, onDelete, processingContent }: WeekViewProps) {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  const [activeId, setActiveId] = React.useState<number | null>(null);
  const [activeTargetContainerId, setActiveTargetContainerId] = React.useState<string | null>(null);

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

  const getTasksForDate = (dateStr: string | null) => {
    return tasks.filter(t => {
      if (dateStr === todayStr) {
        const isImplicitlyToday = !t.scheduledDate && t.timeframe !== 'Unscheduled';
        const isExplicitlyTodayOrPast = t.scheduledDate && t.scheduledDate <= todayStr && t.scheduledDate !== 'later';
        return isExplicitlyTodayOrPast || isImplicitlyToday;
      }
      if (dateStr === null) {
        const isImplicitlyToday = !t.scheduledDate && t.timeframe !== 'Unscheduled';
        if (isImplicitlyToday) return false;
        if (!t.scheduledDate || t.scheduledDate === 'later') return true;
        return t.scheduledDate > day3Str;
      }
      return t.scheduledDate === dateStr;
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
        const isImplicitlyToday = !sd && overTask.timeframe !== 'Unscheduled';
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTargetContainerId(null);

    if (!over) return;

    const taskId = parseInt(active.id as string, 10);
    let targetContainerId = over.id as string;
    
    if (!targetContainerId.startsWith('container-')) {
      const overTaskId = parseInt(targetContainerId, 10);
      const overTask = tasks.find(t => t.id === overTaskId);
      if (overTask) {
        const sd = overTask.scheduledDate;
        const isImplicitlyToday = !sd && overTask.timeframe !== 'Unscheduled';
        const isExplicitlyTodayOrPast = sd && sd <= todayStr && sd !== 'later';
        
        if (isExplicitlyTodayOrPast || isImplicitlyToday) targetContainerId = 'container-today';
        else if (sd === tomorrowStr) targetContainerId = 'container-tomorrow';
        else if (sd === day2Str) targetContainerId = 'container-day2';
        else if (sd === day3Str) targetContainerId = 'container-day3';
        else targetContainerId = 'container-later';
      }
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
          onTaskUpdate(taskId, { scheduledDate: actualTarget });
        }
      }
    }
  };

  const renderColumn = (id: string, title: string, subtitle: string, columnTasks: Task[], includeProcessing = false) => (
    <div style={{ flex: '1 1 250px', minWidth: '250px' }}>
      <DroppableContainer 
        id={id} 
        title={title} 
        subtitle={subtitle}
        emptyText="No tasks scheduled."
        isHighlighted={activeTargetContainerId === id}
      >
        {includeProcessing && processingContent}
        <SortableContext 
          items={columnTasks.map(t => t.id.toString())} 
          strategy={verticalListSortingStrategy}
        >
          {columnTasks.map(task => (
            <SortableTaskItem 
              key={task.id} 
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

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="week-view-container" style={{ display: 'flex', gap: '16px', padding: '16px', overflowX: 'auto', minHeight: 'calc(100vh - 200px)' }}>
        {renderColumn('container-today', 'TODAY', format(today, 'MMM d, EEEE'), todayTasks, true)}
        {renderColumn('container-tomorrow', 'TOMORROW', format(addDays(today, 1), 'MMM d, EEEE'), tomorrowTasks)}
        {renderColumn('container-day2', format(addDays(today, 2), 'EEEE'), format(addDays(today, 2), 'MMM d'), day2Tasks)}
        {renderColumn('container-day3', format(addDays(today, 3), 'EEEE'), format(addDays(today, 3), 'MMM d'), day3Tasks)}
        {renderColumn('container-later', 'LATER', 'Backlog & Future', laterTasks)}
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
