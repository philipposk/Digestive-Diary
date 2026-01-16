import { Recipe } from '@/types';

export function generateSampleRecipes(): Recipe[] {
  const recipes: Recipe[] = [];
  
  // Sample recipes with diverse tags
  const recipeTemplates = [
    // Gluten-free recipes
    { name: 'Quinoa Salad Bowl', tags: ['gluten-free', 'fiber-rich', 'vegetarian'], macros: { calories: 320, protein: 12, carbs: 45, fat: 12, fiber: 8 } },
    { name: 'Zucchini Noodles with Pesto', tags: ['gluten-free', 'vegetarian', 'low-carb'], macros: { calories: 280, protein: 8, carbs: 15, fat: 22, fiber: 5 } },
    { name: 'Baked Salmon with Sweet Potato', tags: ['gluten-free', 'fatty', 'protein-rich'], macros: { calories: 450, protein: 35, carbs: 35, fat: 18, fiber: 6 } },
    { name: 'Coconut Curry Chicken', tags: ['gluten-free', 'spicy', 'protein-rich'], macros: { calories: 380, protein: 32, carbs: 18, fat: 22, fiber: 4 } },
    { name: 'Cauliflower Rice Stir-Fry', tags: ['gluten-free', 'low-carb', 'vegetarian'], macros: { calories: 220, protein: 8, carbs: 20, fat: 12, fiber: 6 } },
    
    // Dairy-free recipes
    { name: 'Dairy-Free Banana Bread', tags: ['dairy-free', 'gluten-free', 'sweet'], macros: { calories: 180, protein: 4, carbs: 28, fat: 7, fiber: 3 } },
    { name: 'Avocado Chocolate Pudding', tags: ['dairy-free', 'gluten-free', 'sweet'], macros: { calories: 240, protein: 4, carbs: 18, fat: 20, fiber: 10 } },
    { name: 'Coconut Milk Curry', tags: ['dairy-free', 'spicy', 'vegetarian'], macros: { calories: 320, protein: 10, carbs: 25, fat: 22, fiber: 6 } },
    { name: 'Almond Milk Smoothie', tags: ['dairy-free', 'fiber-rich', 'sweet'], macros: { calories: 200, protein: 6, carbs: 32, fat: 8, fiber: 8 } },
    { name: 'Vegan Tacos', tags: ['dairy-free', 'gluten-free', 'spicy'], macros: { calories: 350, protein: 15, carbs: 45, fat: 14, fiber: 12 } },
    
    // Processed food alternatives
    { name: 'Homemade Whole Wheat Bread', tags: ['processed', 'fiber-rich', 'gluten'], macros: { calories: 280, protein: 12, carbs: 52, fat: 4, fiber: 8 } },
    { name: 'Fresh Pasta with Tomato Sauce', tags: ['processed', 'gluten', 'vegetarian'], macros: { calories: 420, protein: 14, carbs: 68, fat: 10, fiber: 6 } },
    { name: 'Grilled Chicken Wrap', tags: ['processed', 'gluten', 'protein-rich'], macros: { calories: 380, protein: 28, carbs: 40, fat: 14, fiber: 5 } },
    { name: 'Sweet Potato Fries', tags: ['processed', 'fiber-rich', 'gluten-free'], macros: { calories: 240, protein: 3, carbs: 42, fat: 8, fiber: 7 } },
    { name: 'Homemade Granola Bars', tags: ['processed', 'sweet', 'fiber-rich'], macros: { calories: 200, protein: 5, carbs: 32, fat: 8, fiber: 4 } },
    
    // High fiber recipes
    { name: 'Black Bean Soup', tags: ['fiber-rich', 'vegetarian', 'gluten-free'], macros: { calories: 280, protein: 15, carbs: 45, fat: 6, fiber: 18 } },
    { name: 'Lentil Salad', tags: ['fiber-rich', 'vegetarian', 'protein-rich'], macros: { calories: 320, protein: 18, carbs: 52, fat: 8, fiber: 16 } },
    { name: 'Overnight Oats', tags: ['fiber-rich', 'gluten', 'dairy'], macros: { calories: 300, protein: 12, carbs: 48, fat: 8, fiber: 8 } },
    { name: 'Chia Pudding', tags: ['fiber-rich', 'dairy-free', 'gluten-free'], macros: { calories: 250, protein: 8, carbs: 28, fat: 12, fiber: 14 } },
    { name: 'Roasted Brussels Sprouts', tags: ['fiber-rich', 'vegetarian', 'gluten-free'], macros: { calories: 140, protein: 5, carbs: 18, fat: 6, fiber: 7 } },
    
    // Spicy recipes
    { name: 'Spicy Thai Basil Chicken', tags: ['spicy', 'gluten-free', 'protein-rich'], macros: { calories: 360, protein: 32, carbs: 22, fat: 18, fiber: 3 } },
    { name: 'Hot and Sour Soup', tags: ['spicy', 'gluten-free', 'low-carb'], macros: { calories: 180, protein: 12, carbs: 15, fat: 8, fiber: 2 } },
    { name: 'Jalapeño Poppers', tags: ['spicy', 'dairy', 'processed'], macros: { calories: 280, protein: 10, carbs: 18, fat: 20, fiber: 3 } },
    { name: 'Spicy Black Bean Burgers', tags: ['spicy', 'fiber-rich', 'vegetarian'], macros: { calories: 320, protein: 16, carbs: 42, fat: 10, fiber: 12 } },
    { name: 'Szechuan Tofu', tags: ['spicy', 'gluten-free', 'vegetarian'], macros: { calories: 280, protein: 18, carbs: 22, fat: 14, fiber: 4 } },
    
    // Protein-rich recipes
    { name: 'Grilled Chicken Breast', tags: ['protein-rich', 'gluten-free', 'low-carb'], macros: { calories: 280, protein: 45, carbs: 2, fat: 10, fiber: 0 } },
    { name: 'Egg Scramble with Vegetables', tags: ['protein-rich', 'gluten-free', 'vegetarian'], macros: { calories: 320, protein: 22, carbs: 12, fat: 20, fiber: 4 } },
    { name: 'Greek Yogurt Parfait', tags: ['protein-rich', 'dairy', 'fiber-rich'], macros: { calories: 280, protein: 20, carbs: 35, fat: 8, fiber: 6 } },
    { name: 'Tuna Salad', tags: ['protein-rich', 'gluten-free', 'low-carb'], macros: { calories: 260, protein: 32, carbs: 8, fat: 12, fiber: 2 } },
    { name: 'Turkey Meatballs', tags: ['protein-rich', 'gluten', 'processed'], macros: { calories: 320, protein: 28, carbs: 18, fat: 16, fiber: 2 } },
  ];
  
  recipeTemplates.forEach((template, idx) => {
    recipes.push({
      id: `recipe-${idx + 1}`,
      name: template.name,
      description: `A delicious ${template.name.toLowerCase()} recipe.`,
      ingredients: [
        'Main ingredient 1 (2 cups)',
        'Main ingredient 2 (1 cup)',
        'Seasoning (to taste)',
        'Oil or fat (2 tbsp)',
        'Optional additions (as desired)',
      ],
      instructions: [
        'Prepare all ingredients by washing and chopping as needed',
        'Heat oil in a pan over medium heat',
        'Add main ingredients and cook until tender',
        'Season with spices and herbs',
        'Serve hot and enjoy!',
      ],
      tags: template.tags,
      estimatedMacros: template.macros,
      sourceName: 'Sample Recipe Collection',
      sourceUrl: 'https://example.com/recipes',
    });
  });
  
  // Duplicate some recipes to reach ~100 (with variations)
  const additionalRecipes: Recipe[] = [];
  for (let i = 0; i < 75; i++) {
    const baseRecipe = recipeTemplates[i % recipeTemplates.length];
    additionalRecipes.push({
      id: `recipe-${recipes.length + i + 1}`,
      name: `${baseRecipe.name} Variation ${Math.floor(i / recipeTemplates.length) + 1}`,
      description: `A variation of ${baseRecipe.name.toLowerCase()}.`,
      ingredients: baseRecipe.ingredients,
      instructions: baseRecipe.instructions,
      tags: [...baseRecipe.tags, i % 2 === 0 ? 'quick' : 'comfort-food'],
      estimatedMacros: {
        ...baseRecipe.macros,
        calories: baseRecipe.macros.calories + (Math.floor(Math.random() * 100) - 50),
      },
      sourceName: ['AllRecipes', 'BBC Good Food', 'Food Network'][i % 3],
      sourceUrl: `https://example.com/recipe/${recipes.length + i + 1}`,
    });
  }
  
  return [...recipes, ...additionalRecipes];
}
