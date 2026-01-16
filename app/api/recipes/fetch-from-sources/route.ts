import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { sources } = await request.json();

    if (!sources || !Array.isArray(sources)) {
      return NextResponse.json(
        { error: 'Invalid sources array' },
        { status: 400 }
      );
    }

    const enabledSources = sources.filter((s: any) => s.enabled);
    const recipes: any[] = [];
    const errors: any[] = [];

    for (const source of enabledSources) {
      try {
        // Try to fetch the URL
        const fetchResponse = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; DigestiveDiaryBot/1.0)',
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!fetchResponse.ok) {
          errors.push({
            url: source.url,
            error: `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`,
          });
          continue;
        }

        const html = await fetchResponse.text();
        
        // Use AI to extract recipes from HTML
        // Limit HTML length to avoid token limits
        const htmlSnippet = html.substring(0, 50000); // First 50k chars

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a recipe extraction system. Extract recipe information from HTML content. 
              Return a JSON array of recipes found in the content. Each recipe should have: name, description, ingredients (array), instructions (array), tags (array), estimatedMacros (optional).
              If no recipes are found, return an empty array [].
              Maximum 10 recipes per source.`,
            },
            {
              role: 'user',
              content: `Extract recipes from this HTML content:\n\n${htmlSnippet}`,
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 2000,
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');
        const extractedRecipes = result.recipes || [];

        extractedRecipes.forEach((recipe: any) => {
          recipes.push({
            ...recipe,
            sourceUrl: source.url,
          });
        });

      } catch (error: any) {
        errors.push({
          url: source.url,
          error: error.message || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      recipes,
      errors,
    });
  } catch (error: any) {
    console.error('Error fetching recipes from sources:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}
