import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe');
    const excludeTimeframe = searchParams.get('excludeTimeframe');

    const where: any = {};
    if (timeframe) where.timeframe = timeframe;
    if (excludeTimeframe) where.timeframe = { not: excludeTimeframe };

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
