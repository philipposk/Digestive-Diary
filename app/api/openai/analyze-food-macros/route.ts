import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, foodName, quantity } = await request.json();

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
          content: `You are analyzing a food photo to estimate macronutrients and portion size. 

Analyze the food in the image and estimate:
- Portion weight in grams (estimate based on visual size)
- Calories (kcal)
- Protein (grams)
- Carbohydrates (grams)
- Fat (grams)
- Fiber (grams, if visible/applicable)

Be realistic with estimates. If the food is on a plate, estimate the portion size. Use common knowledge of food nutrition.

Return JSON format:
{
  "portionWeight": number (grams),
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "fiber": number (grams, optional)
}

Only provide numbers. Use 0 if you cannot estimate.`,
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
              text: `Analyze this food photo${foodName ? ` of ${foodName}` : ''}${quantity ? ` (${quantity})` : ''}. Estimate macronutrients and portion weight. Return JSON with portionWeight, calories, protein, carbs, fat, and fiber (optional).`,
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Macro analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
