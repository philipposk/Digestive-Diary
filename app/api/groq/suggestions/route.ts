import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { context, userData } = await request.json();

    if (!context) {
      return NextResponse.json(
        { error: 'No context provided' },
        { status: 400 }
      );
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Provide quick, non-intrusive suggestions for logging based on context.
No medical advice. Only suggest what might be helpful to log.
Keep responses very brief (1-2 sentences max).`,
        },
        {
          role: 'user',
          content: `Context: ${context}. User data: ${JSON.stringify(userData || {})}`,
        },
      ],
      model: 'mixtral-8x7b-32768',
    });

    const suggestion = completion.choices[0].message.content;
    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestion' },
      { status: 500 }
    );
  }
}

