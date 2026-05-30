export type Task = {
  id: number;
  title: string;
  timeConstraint: string | null;
  scheduledStartTime: string | null;
  priority: string;
  completed: boolean;
  isLocked: boolean;
  estimatedDuration: number | null;
  scheduledDate: string | null;
  createdAt: string;
};
