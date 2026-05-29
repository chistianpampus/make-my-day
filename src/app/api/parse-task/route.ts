import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TaskService } from '../../../services/TaskService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { transcript, currentTime, existingTasks } = await request.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Valid transcript is required' }, { status: 400 });
    }
    
    const timeContext = currentTime ? `The current date and time is: ${currentTime}. Use this to understand relative terms like "tomorrow", "next week", etc.\n` : '';
    const tasksContext = existingTasks && existingTasks.length > 0 
      ? `Here are the user's CURRENT tasks. If the user's dictation refers to changing/updating one of these (e.g. changing its time, duration, or title), you should UPDATE it instead of creating a new one.\nCurrent Tasks: ${JSON.stringify(existingTasks.map((t: any) => ({ id: t.id, title: t.title, timeConstraint: t.timeConstraint, scheduledStartTime: t.scheduledStartTime, estimatedDuration: t.estimatedDuration })))}\n`
      : 'The user has no existing tasks right now.\n';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a daily planner app. The user just dictated a task (or multiple tasks) via voice recognition.
Your job is to extract the core task details for EACH task mentioned.
${timeContext}
${tasksContext}

1. Fix any grammar, capitalization, and punctuation.
2. CRITICAL: Do NOT translate the task. Output the title in the exact same language the user spoke it.
3. Keep the title concise and action-oriented.
4. Extract any free-text time constraints or specific times the user mentions into the 'timeConstraint' field (e.g., "am Nachmittag", "after lunch", "exactly at 11:00"). CRITICAL: Strip out any day references like "heute" or "morgen" from this string! For example, if the user says "heute am Vormittag", this field must be strictly "am Vormittag". If no constraints are mentioned, set it to null.
5. Determine priority ("High", "Medium", "Low") based on the urgency of the user's voice command.
6. Estimate the duration of the task in minutes (estimatedDuration: number). If the user specifies a duration, use it. Otherwise, estimate it based on typical values for such a task.
8. If the task is scheduled for a specific day, provide a 'scheduledDate' in YYYY-MM-DD format based on the current date/time context. If the task is for today/heute, use today's date. If it's for 'tomorrow'/'morgen', use tomorrow's date. If a weekday like 'Freitag' is mentioned, calculate its YYYY-MM-DD date. If it's unscheduled, set 'scheduledDate' to null.

Decide if the user wants to CREATE new tasks, or UPDATE existing ones from the 'Current Tasks' list.
Output strict JSON matching this schema:
{
  "create": [
    {
      "title": "Cleaned up task title in the original language",
      "timeConstraint": "Extracted time constraint (e.g. 'after lunch', 'exactly at 11:00') or null",
      "priority": "Medium",
      "estimatedDuration": 30,
      "scheduledDate": "2023-10-26"
    }
  ],
  "update": [
    {
      "id": 123,
      "changes": {
        "title": "New Title",
        "estimatedDuration": 90
      }
    }
  ]
}`
        },
        {
          role: 'user',
          content: transcript
        }
      ],
      response_format: { type: 'json_object' }
    });

    const resultText = response.choices[0].message.content;
    
    if (!resultText) {
      throw new Error('No response from LLM');
    }

    const parsedResult = JSON.parse(resultText);
    const tasksToCreate = parsedResult.create || [];
    const tasksToUpdate = parsedResult.update || [];

    if (!Array.isArray(tasksToCreate) || !Array.isArray(tasksToUpdate)) {
      throw new Error('Invalid schema parsed from LLM');
    }

    // Save using the service layer
    const createdTasks = await Promise.all(
      tasksToCreate.map((task: any) =>
        TaskService.createTask({
          title: task.title,
          timeConstraint: task.timeConstraint,
          priority: task.priority,
          estimatedDuration: task.estimatedDuration,
          scheduledDate: task.scheduledDate,
        })
      )
    );

    const updatedTasks = await Promise.all(
      tasksToUpdate.map((updateOp: any) => 
        TaskService.updateTask(updateOp.id, updateOp.changes)
      )
    );

    return NextResponse.json({ created: createdTasks, updated: updatedTasks });
  } catch (error) {
    console.error('Error parsing task:', error);
    return NextResponse.json({ error: 'Failed to parse task' }, { status: 500 });
  }
}
