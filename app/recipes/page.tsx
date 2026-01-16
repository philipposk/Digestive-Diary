'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Recipe } from '@/types';
import { generateSampleRecipes } from '@/lib/generateRecipes';
import Link from 'next/link';

export default function RecipesPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showPreloaded, setShowPreloaded] = useState(true);
  
  const recipes = useAppStore((state) => state.recipes);
  const setRecipes = useAppStore((state) => state.setRecipes);
  const recipeSourcesSettings = useAppStore((state) => state.recipeSourcesSettings);
  const experiments = useAppStore((state) => state.experiments);
  const foodLogs = useAppStore((state) => state.foodLogs);

  // Initialize recipes on first load
  useEffect(() => {
    if (recipes.length === 0) {
      const sampleRecipes = generateSampleRecipes();
      setRecipes(sampleRecipes);
    }
  }, [recipes.length, setRecipes]);

  // Extract common tags from food logs
  const commonTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    foodLogs.forEach(log => {
      log.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  }, [foodLogs]);

  // Get all unique tags from preloaded recipes
  const allRecipeTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach(recipe => {
      recipe.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [recipes]);

  // Filter recipes based on selected tag and enabled sources
  const filteredRecipes = useMemo(() => {
    let filtered = recipes.filter(recipe => {
      // Filter by enabled sources (match by URL domain)
      if (recipe.sourceUrl) {
        const sourceUrl = recipe.sourceUrl; // Type narrowing
        const sourceEnabled = recipeSourcesSettings.sources.some(s => {
          if (!s.enabled) return false;
          try {
            const recipeDomain = new URL(sourceUrl).hostname;
            const sourceDomain = new URL(s.url).hostname;
            return recipeDomain === sourceDomain || sourceUrl.startsWith(s.url);
          } catch {
            return sourceUrl.startsWith(s.url);
          }
        });
        if (!sourceEnabled) return false;
      }
      // Filter by selected tag
      if (selectedTag) {
        return recipe.tags.includes(selectedTag);
      }
      return true;
    });

    // Filter by query if provided
    if (query.trim()) {
      const queryLower = query.toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.name.toLowerCase().includes(queryLower) ||
        recipe.description?.toLowerCase().includes(queryLower) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(queryLower))
      );
    }

    return filtered;
  }, [recipes, selectedTag, query, recipeSourcesSettings]);

  // Get active experiment restrictions
  const activeExperiments = useMemo(() => {
    return experiments.filter(e => e.active).map(e => ({
      name: e.name.toLowerCase(),
      restrictions: e.name.toLowerCase().includes('no') || e.name.toLowerCase().includes('avoid')
        ? e.name.toLowerCase().replace(/no|avoid|test/gi, '').trim().split(/\s+/)
        : []
    }));
  }, [experiments]);

  const handleSearch = async () => {
    if (!query.trim() && commonTags.length === 0 && activeExperiments.length === 0) {
      alert('Please enter a search query or log some foods to get personalized suggestions');
      return;
    }

    setIsLoading(true);
    try {
      // Build context from user data
      const context = [];
      if (activeExperiments.length > 0) {
        context.push(`Diet restrictions: ${activeExperiments.map(e => e.name).join(', ')}`);
      }
      if (commonTags.length > 0) {
        context.push(`Commonly used food tags: ${commonTags.join(', ')}`);
      }

      const response = await fetch('/api/openai/recipe-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim() || 'healthy recipes',
          context: context.join('. '),
          restrictions: activeExperiments.flatMap(e => e.restrictions),
          preferredTags: commonTags,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recipe suggestions');
      }

      const data = await response.json();
      // Convert AI recipes to Recipe format and add to store
      const aiRecipes: Recipe[] = (data.recipes || []).map((r: any, idx: number) => ({
        id: `ai-recipe-${Date.now()}-${idx}`,
        name: r.name,
        description: r.description,
        ingredients: r.ingredients || [],
        instructions: r.instructions || [],
        tags: r.tags || [],
        estimatedMacros: r.estimatedMacros,
        sourceUrl: undefined, // AI generated, no source
      }));
      
      setRecipes([...recipes, ...aiRecipes]);
      setShowPreloaded(false); // Switch to show AI results
    } catch (error) {
      console.error('Recipe search error:', error);
      alert('Failed to get recipe suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Recipe Suggestions</h1>
      
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Search for Recipes</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedTag(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="e.g., gluten-free pasta, dairy-free desserts"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Search'}
            </button>
          </div>
        </div>

        {activeExperiments.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Active Diet Experiments
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Suggestions will consider: {activeExperiments.map(e => e.name).join(', ')}
            </p>
          </div>
        )}

        {commonTags.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span>Based on your logged foods, we&apos;ll suggest recipes with: </span>
            {commonTags.map((tag, idx) => (
              <button
                key={tag}
                onClick={() => {
                  setSelectedTag(tag);
                  setQuery('');
                  setShowPreloaded(true);
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  selectedTag === tag
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="ml-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                (clear filter)
              </button>
            )}
          </div>
        )}

        {/* All recipe tags for filtering */}
        {allRecipeTags.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by tag:
            </p>
            <div className="flex flex-wrap gap-2">
              {allRecipeTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTag(tag);
                    setQuery('');
                    setShowPreloaded(true);
                  }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedTag === tag
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Show filtered preloaded recipes */}
      {(showPreloaded || !query.trim()) && filteredRecipes.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {selectedTag ? `Showing ${filteredRecipes.length} recipes with tag: ${selectedTag}` : `Showing ${filteredRecipes.length} preloaded recipes`}
          </p>
        </div>
      )}

      {filteredRecipes.length > 0 && (
        <div className="space-y-6">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-semibold">{recipe.name}</h2>
                {recipe.sourceUrl && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {(() => {
                      try {
                        return new URL(recipe.sourceUrl!).hostname;
                      } catch {
                        return recipe.sourceUrl;
                      }
                    })()}
                  </span>
                )}
              </div>
              {recipe.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{recipe.description}</p>
              )}
              
              {recipe.tags && recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {recipe.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTag(tag);
                        setQuery('');
                        setShowPreloaded(true);
                      }}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {recipe.estimatedMacros && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Estimated Macronutrients (per serving)
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Calories:</span>
                      <span className="font-medium ml-1">{recipe.estimatedMacros.calories}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Protein:</span>
                      <span className="font-medium ml-1">{recipe.estimatedMacros.protein}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Carbs:</span>
                      <span className="font-medium ml-1">{recipe.estimatedMacros.carbs}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Fat:</span>
                      <span className="font-medium ml-1">{recipe.estimatedMacros.fat}g</span>
                    </div>
                  </div>
                </div>
              )}

              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2">Ingredients</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {recipe.ingredients.map((ingredient, i) => (
                      <li key={i}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
              )}

              {recipe.instructions && recipe.instructions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Instructions</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {recipe.instructions.map((instruction, i) => (
                      <li key={i}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredRecipes.length === 0 && !isLoading && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {selectedTag 
              ? `No recipes found with tag "${selectedTag}". Try selecting a different tag or search for recipes.`
              : 'No recipes found. Try selecting a tag above or search for recipes.'}
          </p>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Or chat with AI for personalized suggestions:
            </p>
            <Link
              href={`/chat?query=${encodeURIComponent('Suggest recipes for me based on my dietary preferences and logged foods')}`}
              className="inline-block px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              🤖 Ask AI: What recipes should I try?
            </Link>
          </div>
        </div>
      )}

      {filteredRecipes.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Need more recipe ideas?
          </p>
          <Link
            href={`/chat?query=${encodeURIComponent('Suggest more recipes for me')}`}
            className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
          >
            🤖 Chat with AI for more suggestions
          </Link>
        </div>
      )}

      <div className="mt-6">
        <Link 
          href="/"
          className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
        >
          ← Back to Log
        </Link>
      </div>
    </div>
  );
}
