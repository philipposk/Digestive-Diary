import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query, context, restrictions, preferredTags } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful recipe assistant for a digestive health tracking app. Generate recipe suggestions based on user preferences, dietary restrictions, and food tags they commonly use.

Return recipes in JSON format as an array:
[
  {
    "name": "Recipe name",
    "description": "Brief description",
    "ingredients": ["ingredient 1", "ingredient 2", ...],
    "instructions": ["step 1", "step 2", ...],
    "tags": ["tag1", "tag2", ...],
    "estimatedMacros": {
      "calories": number,
      "protein": number (grams),
      "carbs": number (grams),
      "fat": number (grams)
    }
  },
  ...
]

Guidelines:
- Generate 3-5 recipes
- Respect dietary restrictions (e.g., no dairy, no gluten)
- Consider preferred food tags from user's logged foods
- Include estimated macronutrients (approximate per serving)
- Keep recipes practical and easy to prepare
- Include relevant tags (e.g., "gluten-free", "dairy-free", "high-fiber")

Return only valid JSON array.`,
        },
        {
          role: 'user',
          content: `Generate recipe suggestions for: "${query || 'healthy recipes'}"

${context ? `Context: ${context}` : ''}
${restrictions && restrictions.length > 0 ? `Dietary restrictions to avoid: ${restrictions.join(', ')}` : ''}
${preferredTags && preferredTags.length > 0 ? `Preferred food tags to include: ${preferredTags.join(', ')}` : ''}

Generate 3-5 recipes that match these preferences. Return JSON array format.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    const content = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);
    
    // Handle both { recipes: [...] } and [...] formats
    const recipes = parsed.recipes || (Array.isArray(parsed) ? parsed : []);

    return NextResponse.json({ recipes });
  } catch (error: any) {
    console.error('Recipe suggestions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate recipe suggestions' },
      { status: 500 }
    );
  }
}
