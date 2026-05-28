import { NextResponse } from 'next/server';
import OpenAI from 'openai';

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
Your job is to extract the core task and the requested timeframe.
1. Fix any grammar, capitalization, and punctuation.
2. CRITICAL: Do NOT translate the task. Output the title in the exact same language the user spoke it (e.g., German input -> German output).
3. Keep the title concise and action-oriented.
4. If no timeframe is mentioned, set it to "Unscheduled".
Output strict JSON matching this schema:
{
  "title": "Cleaned up task title in the original language",
  "timeframe": "Extracted timeframe (e.g. 'Morning', '10:00', 'Tomorrow', 'Unscheduled')"
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

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error('Error parsing task:', error);
    return NextResponse.json({ error: 'Failed to parse task' }, { status: 500 });
  }
}
