import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { timelineData } = await request.json();

    if (!timelineData) {
      return NextResponse.json(
        { error: 'No timeline data provided' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Create a timeline summary of user's logged data for their personal use.
Include patterns and correlations. No medical conclusions.
This is for informational purposes only, not medical advice.`,
        },
        {
          role: 'user',
          content: JSON.stringify(timelineData),
        },
      ],
    });

    const summary = completion.choices[0].message.content;
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

