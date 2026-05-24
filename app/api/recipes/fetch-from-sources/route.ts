import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { guard } from '@/lib/apiGuard';
import { RecipeFetchSchema } from '@/lib/validation';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const g = await guard(request, RecipeFetchSchema, { bucket: 'recipe-fetch', capacity: 5, refillPerMinute: 5 });
  if (!g.ok) return g.response;
  const { sources } = g.data as { sources: Array<{ url: string; enabled: boolean }> };

  try {
    const enabledSources = sources.filter((s) => s.enabled);
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
          const error = {
            url: source.url,
            error: `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`,
          };
          errors.push(error);
          // Return error info that can be used to create admin notification
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
              Return a JSON object with a "recipes" array. Each recipe should have: name (string), description (string), ingredients (array of strings), instructions (array of strings), tags (array of strings), estimatedMacros (optional object with calories, protein, carbs, fat).
              If no recipes are found, return {"recipes": []}.
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

        const raw = completion.choices[0]?.message?.content || '{}';
        let result: any;
        try {
          result = JSON.parse(raw);
        } catch (parseErr: any) {
          errors.push({
            url: source.url,
            error: `Malformed AI JSON: ${parseErr.message || 'parse failed'}`,
          });
          continue;
        }

        const extractedRecipes = Array.isArray(result?.recipes) ? result.recipes : [];
        if (!Array.isArray(result?.recipes)) {
          errors.push({
            url: source.url,
            error: 'AI response missing recipes array',
          });
        }

        extractedRecipes.forEach((recipe: any) => {
          if (!recipe || typeof recipe.name !== 'string') return;
          recipes.push({
            name: recipe.name,
            description: typeof recipe.description === 'string' ? recipe.description : undefined,
            ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.filter((i: any) => typeof i === 'string') : [],
            instructions: Array.isArray(recipe.instructions) ? recipe.instructions.filter((i: any) => typeof i === 'string') : [],
            tags: Array.isArray(recipe.tags) ? recipe.tags.filter((t: any) => typeof t === 'string') : [],
            estimatedMacros: recipe.estimatedMacros && typeof recipe.estimatedMacros === 'object' ? recipe.estimatedMacros : undefined,
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
