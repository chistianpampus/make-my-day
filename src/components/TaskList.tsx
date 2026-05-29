import { Task } from '../types';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  emptyMessage?: string;
  onToggle: (id: number, currentStatus: boolean) => void;
  onDelete: (id: number) => void;
  onUpdate?: (id: number, data: Partial<Task>) => void;
  processingContent?: React.ReactNode;
}

export function TaskList({ 
  tasks, 
  isLoading, 
  emptyMessage = "No tasks found.", 
  onToggle, 
  onDelete,
  onUpdate,
  processingContent
}: TaskListProps) {
  return (
    <section className="glass-panel schedule-container">
      {isLoading ? (
        <p style={{ textAlign: 'center', opacity: 0.7 }}>Loading tasks...</p>
      ) : tasks.length === 0 && !processingContent ? (
        <p style={{ textAlign: 'center', opacity: 0.7 }}>{emptyMessage}</p>
      ) : null}

      {/* Optional slot for Processing/Loading items injected at the top */}
      {processingContent}
      
      {tasks.map((task) => (
        <TaskCard 
          key={task.id} 
          task={task} 
          onToggle={onToggle} 
          onDelete={onDelete} 
          onUpdate={onUpdate}
        />
      ))}
    </section>
  );
}
