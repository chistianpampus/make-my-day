import { prisma } from '../lib/prisma';
import { Prisma } from '../generated/prisma/client';

export class TaskService {
  static async getTasks(scheduledDate?: string | null) {
    const where: Prisma.TaskWhereInput = {};
    if (scheduledDate !== undefined) {
      where.scheduledDate = scheduledDate;
    }

    return await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createTask(data: { title: string, timeConstraint?: string | null, scheduledStartTime?: string | null, priority?: string, estimatedDuration?: number | null, scheduledDate?: string | null }) {
    return await prisma.task.create({
      data: {
        title: data.title,
        timeConstraint: data.timeConstraint,
        scheduledStartTime: data.scheduledStartTime,
        priority: data.priority || "Medium",
        estimatedDuration: data.estimatedDuration,
        scheduledDate: data.scheduledDate,
      }
    });
  }

  static async updateTask(id: number, data: Partial<{ completed: boolean, title: string, timeConstraint: string | null, scheduledStartTime: string | null, priority: string, estimatedDuration: number | null, scheduledDate: string | null }>) {
    // POINT 21: If date is changing, and start time isn't explicitly provided in this update, clear it.
    if (data.scheduledDate !== undefined) {
      const currentTask = await prisma.task.findUnique({ where: { id } });
      if (currentTask && currentTask.scheduledDate !== data.scheduledDate) {
        if (data.scheduledStartTime === undefined) {
          data.scheduledStartTime = null;
        }
      }
    }

    return await prisma.task.update({
      where: { id },
      data
    });
  }

  static async deleteTask(id: number) {
    return await prisma.task.delete({
      where: { id }
    });
  }

  static async deleteAllTasks() {
    return await prisma.task.deleteMany({});
  }
}
