import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const { updates } = await request.json();

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Updates array is required' }, { status: 400 });
    }

    const taskUpdates = updates.map((update: any) => {
      const { id, updates: data } = update;
      return prisma.task.update({
        where: { id },
        data
      });
    });

    await prisma.$transaction(taskUpdates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error in bulk-update:', error);
    return NextResponse.json({ error: 'Failed to bulk update tasks' }, { status: 500 });
  }
}
