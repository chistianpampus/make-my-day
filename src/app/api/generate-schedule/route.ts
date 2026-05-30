import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages, tasks, routines, targetDate, currentTime } = await request.json();

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
          estimatedDuration: t.estimatedDuration,
          isLocked: t.isLocked
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

    const systemPrompt = `You are a conversational AI scheduling assistant for a daily planner app.
Target date: ${targetDate || 'Today'}
Current Local Time: ${currentTime || 'Unknown'}

Input Tasks:
${tasksContext}

Input Routines:
${routinesContext}

Rules:
1. You chat with the user to build a chronological timeline for the day.
2. If scheduling for today, ALWAYS start scheduling from the 'Current Local Time' rounded up to the nearest 15-minute interval.
3. CRITICAL OMISSION RULE: Any 'Routines' or 'Tasks' whose natural time (timePremise, scheduledStartTime, or logical time of day like morning) falls BEFORE the 'Current Local Time' MUST be entirely skipped and omitted from the schedule. Do NOT schedule a 'Morning Routine' if it is already afternoon. Do NOT shift past routines into the future. Just leave them out completely.
4. If the user provides a hint or request (e.g. "I want to finish by 16:00"), adjust the schedule accordingly.
5. If you can fulfill the user's request, provide the proposed schedule in the "schedule" array and optionally a "messageToUser" explaining what you did.
6. If the user's request is impossible (e.g. 10 hours of tasks but they want to leave at 12:00), ask them a clarifying question via "messageToUser" and leave the "schedule" array empty.
7. STRICT TIME CONSTRAINTS & LOCKING: 
   - If a task has 'isLocked': true AND a 'scheduledStartTime', this is a HARD FIXED BLOCK. You MUST NOT change its time. You MUST schedule all other tasks and routines AROUND it, ensuring no overlap.
   - If a task has a specific 'scheduledStartTime' or a rigid 'timeConstraint' (e.g. 'um 17:45'), treat it as a HARD constraint. Instead of shifting strict tasks, reduce the 'estimatedDuration' of earlier, more flexible tasks to make the timeline fit.
8. NO UNSOLICITED ADDITIONS: You MUST NOT invent, hallucinate, or add any new tasks, routines, or events that were not explicitly provided in the 'Input Tasks' or 'Input Routines' arrays. Only schedule what the user gave you (and the break buffers).
9. If you do provide a schedule:
   - Include all routines and tasks.
   - Insert generous 10-15 minute "break" blocks between tasks.
   - Sort strictly chronologically.
   - Use types: "task", "routine", "break". For tasks, set referenceId to the task's integer ID.

Output must be strictly JSON matching this schema:
{
  "messageToUser": "A friendly message or question to the user (optional, can be null)",
  "schedule": [
    {
      "type": "task" | "routine" | "break",
      "referenceId": 123 | null,
      "title": "Task title",
      "startTime": "09:00",
      "endTime": "10:00"
    }
  ] // Leave empty array if you only want to ask a question
}`;

    // Prepare message history
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...(messages || [{ role: 'user', content: 'Bitte plane meinen Tag optimal.' }])
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: apiMessages,
      response_format: { type: 'json_object' }
    });

    const resultText = response.choices[0].message.content;
    
    if (!resultText) {
      throw new Error('No response from LLM');
    }

    const parsedResult = JSON.parse(resultText);
    
    return NextResponse.json({ 
      messageToUser: parsedResult.messageToUser || null,
      schedule: parsedResult.schedule || [] 
    });
  } catch (error) {
    console.error('Error generating schedule:', error);
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 });
  }
}
