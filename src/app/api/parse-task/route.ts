import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '../../../lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Valid transcript is required' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a daily planner app. The user just dictated a task via voice recognition.
Your job is to extract the core task details.
1. Fix any grammar, capitalization, and punctuation.
2. CRITICAL: Do NOT translate the task. Output the title in the exact same language the user spoke it.
3. Keep the title concise and action-oriented.
4. If no timeframe is mentioned, set it to "Unscheduled".
5. Determine priority ("High", "Medium", "Low") based on the urgency of the user's voice command.
6. Determine if the task is time-flexible (isFlexible: boolean). If the user mentions a strict meeting or appointment, it's false. Otherwise true.
Output strict JSON matching this schema:
{
  "title": "Cleaned up task title in the original language",
  "timeframe": "Extracted timeframe (e.g. 'Morning', '10:00', 'Tomorrow', 'Unscheduled')",
  "priority": "Medium",
  "isFlexible": true
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

    // Save directly to Prisma
    const savedTask = await prisma.task.create({
      data: {
        title: parsedResult.title,
        timeframe: parsedResult.timeframe,
        priority: parsedResult.priority || "Medium",
        isFlexible: parsedResult.isFlexible ?? true,
      }
    });

    return NextResponse.json(savedTask);
  } catch (error) {
    console.error('Error parsing task:', error);
    return NextResponse.json({ error: 'Failed to parse task' }, { status: 500 });
  }
}
