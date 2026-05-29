import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { tasks, routines, targetDate } = await request.json();

    if (!tasks || !routines) {
      return NextResponse.json({ error: 'Tasks and routines are required' }, { status: 400 });
    }

    const tasksContext = tasks.length > 0 
      ? JSON.stringify(tasks.map((t: any) => ({ 
          id: t.id, 
          title: t.title, 
          timeConstraint: t.timeConstraint,
          scheduledStartTime: t.scheduledStartTime,
          priority: t.priority, 
          estimatedDuration: t.estimatedDuration 
        })))
      : '[]';

    const routinesContext = routines.length > 0
      ? JSON.stringify(routines.map((r: any) => ({
          id: r.id,
          title: r.title,
          timePremise: r.timePremise,
          minDuration: r.minDuration,
          maxDuration: r.maxDuration
        })))
      : '[]';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI scheduling engine for a daily planner app. The target date to schedule is: ${targetDate || 'Today'}.
Your job is to generate a chronological timeline for the day by placing the provided tasks and routines on a schedule.

Rules:
1. Parse the temporal premises of routines (e.g. "before 08:00") and place them accordingly. Choose a reasonable duration between minDuration and maxDuration.
2. Place tasks at their exact scheduledStartTime if provided, or respect their timeConstraint (e.g. "after 14:00").
3. Distribute the remaining tasks in the remaining gaps. Prioritize "High" priority tasks earlier or during prime time.
4. Add a buffer/break of about 10-15 minutes between tasks where appropriate. Do not stack 10 tasks back-to-back without breaks.
5. Make the schedule realistic (e.g. don't schedule work tasks at 3 AM unless requested).
6. Output MUST be a strictly sorted chronological JSON array of scheduled blocks.

Input Tasks:
${tasksContext}

Input Routines:
${routinesContext}

Output strict JSON matching this schema:
{
  "schedule": [
    {
      "type": "routine", // or "task" or "break"
      "referenceId": 1, // ID of the task or routine (null for break)
      "title": "Morgenroutine",
      "startTime": "07:30",
      "endTime": "08:15"
    },
    {
      "type": "break",
      "referenceId": null,
      "title": "Puffer",
      "startTime": "08:15",
      "endTime": "08:30"
    }
  ]
}`
        },
        {
          role: 'user',
          content: 'Please generate the optimal schedule.'
        }
      ],
      response_format: { type: 'json_object' }
    });

    const resultText = response.choices[0].message.content;
    
    if (!resultText) {
      throw new Error('No response from LLM');
    }

    const parsedResult = JSON.parse(resultText);
    const schedule = parsedResult.schedule || [];

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error generating schedule:', error);
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 });
  }
}
