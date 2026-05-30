import { Task } from '../types';

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function getWaterfallUpdates(originalList: Task[], reorderedList: Task[]): { id: number, updates: Partial<Task> }[] {
  // Find the anchor time: the earliest scheduledStartTime in the original list, or "08:00"
  let anchorTime = "08:00";
  const validTimes = originalList.map(t => t.scheduledStartTime).filter(Boolean).sort() as string[];
  if (validTimes.length > 0) {
    anchorTime = validTimes[0];
  }

  let currentMinutes = timeToMinutes(anchorTime);
  const updates: { id: number, updates: Partial<Task> }[] = [];

  for (const task of reorderedList) {
    const newStartTime = minutesToTime(currentMinutes);
    if (task.scheduledStartTime !== newStartTime) {
      updates.push({ id: task.id, updates: { scheduledStartTime: newStartTime } });
    }
    const duration = task.estimatedDuration || 30; // Default to 30 mins if unknown
    currentMinutes += duration;
  }
  
  return updates;
}
