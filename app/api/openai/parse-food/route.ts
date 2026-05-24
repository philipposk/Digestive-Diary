import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { guard, safeJsonParse } from '@/lib/apiGuard';
import { ParseFoodSchema } from '@/lib/validation';
import { fenceUserData, USER_DATA_NOTICE } from '@/lib/promptSafe';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const g = await guard(request, ParseFoodSchema, { bucket: 'parse-food', capacity: 30, refillPerMinute: 30 });
  if (!g.ok) return g.response;
  const { text } = g.data as { text: string };

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract food information from the input below.

${USER_DATA_NOTICE}

Return JSON only with this shape:
{ "foods": [{ "name": string, "quantity"?: string, "tags": string[] }], "suggested_tags": string[] }
No nutritional analysis. No health judgments.`,
        },
        { role: 'user', content: fenceUserData({ text }) },
      ],
      response_format: { type: 'json_object' },
    });

    const result = safeJsonParse(completion.choices[0]?.message?.content, { foods: [], suggested_tags: [] });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Food parsing error:', error);
    return NextResponse.json({ error: 'Failed to parse food' }, { status: 500 });
  }
}
