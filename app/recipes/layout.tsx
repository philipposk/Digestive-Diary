import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Recipes', 'Recipes you can log and check against your own trigger foods.', '/recipes');

export default function RecipesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
