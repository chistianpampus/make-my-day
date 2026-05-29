export type Task = {
  id: number;
  title: string;
  timeframe: string;
  priority: string;
  isFlexible: boolean;
  completed: boolean;
  estimatedDuration: number | null;
  scheduledDate: string | null;
  createdAt: string;
};
