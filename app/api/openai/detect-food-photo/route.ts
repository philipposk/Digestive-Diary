import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { guard, safeJsonParse } from '@/lib/apiGuard';
import { DetectFoodPhotoSchema } from '@/lib/validation';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const g = await guard(request, DetectFoodPhotoSchema, { bucket: 'detect-food', capacity: 30, refillPerMinute: 30 });
  if (!g.ok) return g.response;
  const { imageBase64 } = g.data as { imageBase64: string };

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Detect if image contains food that someone is eating/ate
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are analyzing a photo to determine if it shows food that someone is eating, has eaten, or is about to eat. This is for a food logging app.

Return JSON format:
{
  "isFood": boolean (true if photo shows food that looks like it was/is being consumed),
  "confidence": number (0-1, confidence level),
  "reasoning": "string (brief explanation)",
  "foodDetected": "string (what food is visible, if any)",
  "portionSize": "string (description of portion size if visible)",
  "setting": "string (e.g., 'plate', 'restaurant', 'hand', 'container')"
}

Only return isFood: true if the photo realistically shows food that looks like:
- Food on a plate/bowl (appears to be someone's meal)
- Food being held (in hand, fork, etc.)
- Half-eaten food
- Food in a realistic eating context (restaurant, kitchen table, etc.)

Do NOT return isFood: true for:
- Food in grocery store packaging
- Food advertisements
- Food still in original packaging (unless clearly being consumed)
- Random objects that aren't food`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: 'Does this photo show food that someone is eating, has eaten, or is about to eat? Analyze and return JSON with isFood, confidence, reasoning, foodDetected, portionSize, and setting.',
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300,
    });

    const result = safeJsonParse(completion.choices[0]?.message?.content, {});
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Food photo detection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
