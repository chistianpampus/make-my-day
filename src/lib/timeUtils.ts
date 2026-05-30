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

export function getRoundedCurrentTime(): string {
  const now = new Date();
  const m = now.getMinutes();
  const remainder = 15 - (m % 15);
  // If exactly on a 15 min boundary, it might add 15. That's fine or we can do `remainder === 15 ? 0 : remainder`.
  const addMins = remainder === 15 ? 0 : remainder;
  now.setMinutes(m + addMins);
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function getWaterfallUpdates(originalList: Task[], reorderedList: Task[], fallbackAnchorTime: string = "08:00"): { id: number, updates: Partial<Task> }[] {
  // Find the anchor time: the earliest scheduledStartTime in the original list, or the fallback
  let anchorTime = fallbackAnchorTime;
  const validTimes = originalList.map(t => t.scheduledStartTime).filter(Boolean).sort() as string[];
  if (validTimes.length > 0) {
    anchorTime = validTimes[0];
  }

  let currentMinutes = timeToMinutes(anchorTime);
  const updates: { id: number, updates: Partial<Task> }[] = [];

  for (let i = 0; i < reorderedList.length; i++) {
    const task = reorderedList[i];
    const duration = task.estimatedDuration || 30; // Default to 30 mins if unknown

    if (task.isLocked && task.scheduledStartTime) {
      const lockedMinutes = timeToMinutes(task.scheduledStartTime);
      
      // If we overshot the locked task, we must shift the previous unlocked tasks backwards
      if (currentMinutes > lockedMinutes) {
        const excess = currentMinutes - lockedMinutes;
        for (let j = i - 1; j >= 0; j--) {
          const prevTask = reorderedList[j];
          if (prevTask.isLocked) break; // Stop backtracking if we hit another locked task

          const existingUpdate = updates.find(u => u.id === prevTask.id);
          const baseTimeStr = existingUpdate ? (existingUpdate.updates.scheduledStartTime as string) : prevTask.scheduledStartTime;
          if (!baseTimeStr) continue;

          const shiftedTime = minutesToTime(Math.max(0, timeToMinutes(baseTimeStr) - excess));
          
          if (existingUpdate) {
            existingUpdate.updates.scheduledStartTime = shiftedTime;
          } else if (prevTask.scheduledStartTime !== shiftedTime) {
            updates.push({ id: prevTask.id, updates: { scheduledStartTime: shiftedTime } });
          }
        }
      }
      
      currentMinutes = lockedMinutes + duration;
    } else {
      const newStartTime = minutesToTime(currentMinutes);
      if (task.scheduledStartTime !== newStartTime) {
        updates.push({ id: task.id, updates: { scheduledStartTime: newStartTime } });
      }
      currentMinutes += duration;
    }
  }
  
  return updates;
}
