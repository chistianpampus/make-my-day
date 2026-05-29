import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }

  try {
    const dailySchedule = await prisma.dailySchedule.findUnique({
      where: { date }
    });

    if (!dailySchedule) {
      return NextResponse.json({ schedule: null });
    }

    return NextResponse.json({ schedule: JSON.parse(dailySchedule.blocks) });
  } catch (error) {
    console.error('Error fetching daily schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date, schedule } = await request.json();

    if (!date || !schedule || !Array.isArray(schedule)) {
      return NextResponse.json({ error: 'Date and schedule array are required' }, { status: 400 });
    }

    // 1. Save or update the DailySchedule
    await prisma.dailySchedule.upsert({
      where: { date },
      update: { blocks: JSON.stringify(schedule) },
      create: { date, blocks: JSON.stringify(schedule) }
    });

    // 2. Bulk update tasks in the DB based on the schedule
    // We iterate through all blocks of type 'task' and update their scheduledStartTime and estimatedDuration
    const taskUpdates = schedule
      .filter((block: any) => block.type === 'task' && block.referenceId)
      .map((block: any) => {
        // Calculate duration if possible
        let durationMinutes = null;
        if (block.startTime && block.endTime) {
          const [startH, startM] = block.startTime.split(':').map(Number);
          const [endH, endM] = block.endTime.split(':').map(Number);
          if (!isNaN(startH) && !isNaN(endH)) {
            const diff = (endH * 60 + endM) - (startH * 60 + startM);
            if (diff > 0) durationMinutes = diff;
          }
        }

        return prisma.task.update({
          where: { id: block.referenceId },
          data: {
            scheduledStartTime: block.startTime,
            estimatedDuration: durationMinutes,
            scheduledDate: date // enforce the date just in case
          }
        });
      });

    await prisma.$transaction(taskUpdates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving schedule:', error);
    return NextResponse.json({ error: 'Failed to save schedule' }, { status: 500 });
  }
}
