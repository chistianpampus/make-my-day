import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TaskService } from '../../../services/TaskService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { taskId, transcript, task } = await request.json();

    if (!taskId || !transcript || !task) {
      return NextResponse.json({ error: 'taskId, transcript, and task are required' }, { status: 400 });
    }

    const now = new Date();
    const currentDate = now.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a daily planner app. The user wants to modify ONE SPECIFIC TASK using a voice or text command.
The current date is: ${currentDate}.

Here is the current state of the task:
${JSON.stringify({ 
  title: task.title, 
  timeConstraint: task.timeConstraint, 
  scheduledStartTime: task.scheduledStartTime, 
  priority: task.priority, 
  estimatedDuration: task.estimatedDuration,
  scheduledDate: task.scheduledDate
})}

The user's command is provided below.
Your job is to determine WHICH fields of the task should be updated based on the command.
Output ONLY the fields that should be changed. If a field shouldn't change, do not include it in the output JSON.

Rules for fields:
- 'title': String. Keep it concise.
- 'scheduledDate': String ("YYYY-MM-DD") or null. If the user mentions a day (e.g., "heute", "morgen", "Montag"), calculate the exact YYYY-MM-DD based on the current date (${currentDate}) and update this field.
- 'timeConstraint': String or null. Extract ONLY the time-of-day portion (e.g. "am Vormittag", "am Nachmittag", "nach dem Essen"). CRITICAL: Strip out any day references like "heute" or "morgen" from this string! For example, if the user says "heute am Vormittag", this field must be strictly "am Vormittag".
- 'scheduledStartTime': String ("HH:mm") or null. Use this if the user wants a strict specific time (e.g. "exactly at 14:00").
- 'priority': "High", "Medium", or "Low".
- 'estimatedDuration': Number (minutes) or null.

Output a strict JSON object with ONLY the fields to update, matching this schema:
{
  "changes": {
    "estimatedDuration": 20,
    "timeConstraint": "after mowing the lawn"
  }
}
If no fields can be confidently updated based on the transcript, output { "changes": {} }.`
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
    const changes = parsedResult.changes || {};

    if (Object.keys(changes).length === 0) {
      // The AI couldn't figure out what to change
      return NextResponse.json({ error: 'Could not understand changes from transcript', noChanges: true }, { status: 400 });
    }

    // Update the task in the database
    const updatedTask = await TaskService.updateTask(taskId, changes);

    return NextResponse.json({ updated: updatedTask });
  } catch (error) {
    console.error('Error editing single task:', error);
    return NextResponse.json({ error: 'Failed to parse task changes' }, { status: 500 });
  }
}
