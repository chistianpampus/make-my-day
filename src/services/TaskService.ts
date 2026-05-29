import { prisma } from '../lib/prisma';
import { Prisma } from '../generated/prisma/client';

export class TaskService {
  static async getTasks(timeframe?: string | null, excludeTimeframe?: string | null, scheduledDate?: string | null) {
    const where: Prisma.TaskWhereInput = {};
    if (timeframe) where.timeframe = timeframe;
    if (excludeTimeframe) where.timeframe = { not: excludeTimeframe };
    if (scheduledDate !== undefined) {
      where.scheduledDate = scheduledDate;
    }

    return await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createTask(data: { title: string, timeframe: string, priority?: string, isFlexible?: boolean, estimatedDuration?: number | null, scheduledDate?: string | null }) {
    return await prisma.task.create({
      data: {
        title: data.title,
        timeframe: data.timeframe,
        priority: data.priority || "Medium",
        isFlexible: data.isFlexible ?? true,
        estimatedDuration: data.estimatedDuration,
        scheduledDate: data.scheduledDate,
      }
    });
  }

  static async updateTask(id: number, data: Partial<{ completed: boolean, title: string, timeframe: string, priority: string, isFlexible: boolean, estimatedDuration: number | null, scheduledDate: string | null }>) {
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
}
