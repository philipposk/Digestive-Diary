import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Use gpt-4o for vision
      messages: [
        {
          role: 'system',
          content: `You are analyzing a food product label or food item photo. Extract structured information:
- Food name (main item)
- Quantity/weight (if visible on label)
- Key ingredients or tags (dairy, gluten, etc.)
- Any nutritional information visible

Return JSON format:
{
  "food": "string",
  "quantity": "string (optional)",
  "tags": ["string array"],
  "notes": "string (optional - any additional info from label)"
}

Only extract what you can clearly see. Don't make assumptions.`,
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
              text: 'Extract food information from this image. Return JSON format with food, quantity (optional), tags array, and notes (optional).',
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image' },
      { status: 500 }
    );
  }
}

