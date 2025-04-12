// Mirror of RecipeData in main app (excluding fields added during save like id, createdAt etc)
export interface RecipeData {
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  calories: string | number | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | string | null;
  ingredients: string[];
  instructions: string[];
  notes?: string | null;
  imageUrl?: string | null; // For future AI images
  aiModelUsed?: string; // Added by function before returning
}
