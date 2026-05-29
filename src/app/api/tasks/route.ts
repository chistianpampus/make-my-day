import { NextResponse } from 'next/server';
import { TaskService } from '../../../services/TaskService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let scheduledDate: string | null | undefined = searchParams.get('scheduledDate') || undefined;
    if (scheduledDate === 'null') scheduledDate = null;

    const tasks = await TaskService.getTasks(scheduledDate);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('API Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    const task = await TaskService.createTask(data);
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await TaskService.deleteAllTasks();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error clearing tasks:', error);
    return NextResponse.json({ error: 'Failed to clear tasks' }, { status: 500 });
  }
}

