import { NextResponse } from 'next/server';
import { TaskService } from '../../../services/TaskService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe');
    const excludeTimeframe = searchParams.get('excludeTimeframe');
    const scheduledDate = searchParams.get('scheduledDate');

    const tasks = await TaskService.getTasks(timeframe, excludeTimeframe, scheduledDate);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('API Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.title || !data.timeframe) {
      return NextResponse.json({ error: 'Title and timeframe are required' }, { status: 400 });
    }
    
    const task = await TaskService.createTask(data);
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
