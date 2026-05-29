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
      const isImplicitlyToday = !t.scheduledDate && t.timeframe !== 'Unscheduled';
      const isExplicitlyTodayOrPast = t.scheduledDate && t.scheduledDate <= todayStr && t.scheduledDate !== 'later';
      return isExplicitlyTodayOrPast || isImplicitlyToday;
    }),
  [tasks, todayStr]);

  const activeTask = useMemo(() => tasks.find((t) => t.id === activeId), [activeId, tasks]);

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
      // Optimistic update via onTaskUpdate
      const actualTarget = targetDate === 'later' ? null : targetDate;
      const task = tasks.find(t => t.id === taskId);
      
      // If it changed, call update
      if (task && task.scheduledDate !== actualTarget) {
        // Only update if it actually moved to a different container
        // If it was already null and moved to later, nothing changes.
        // If it was already today and moved to today, nothing changes.
        const isSame = 
          (task.scheduledDate === actualTarget) || 
          (!task.scheduledDate && actualTarget === null && targetContainerId === 'container-later') ||
          (!task.scheduledDate && actualTarget === todayStr && targetContainerId === 'container-today');
          
        if (!isSame) {
          onTaskUpdate(taskId, { scheduledDate: actualTarget });
        }
      }
    }
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
          >
            {processingContent}
            <SortableContext 
              items={todayTasks.map(t => t.id.toString())} 
              strategy={verticalListSortingStrategy}
            >
              {todayTasks.map(task => (
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
