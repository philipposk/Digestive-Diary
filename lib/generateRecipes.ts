import { Recipe } from '@/types';
import { getCuratedRecipes } from './recipeDataset';

export function generateSampleRecipes(): Recipe[] {
  return getCuratedRecipes();
}
