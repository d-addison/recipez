import {create} from 'zustand';
import {RecipeData} from '../types';
import {
  callGenerateRecipe,
  saveRecipeToDefaultBoard,
} from '../services/recipeService';
import {useAuthStore} from './authStore';

interface RecipeState {
  generatedRecipe: RecipeData | null;
  currentPrompt: string | null; // Store the prompt used
  isLoading: boolean;
  error: string | null;
  isSaving: boolean; // Added saving indicator
  saveError: string | null; // Added specific save error
  // Actions
  generateRecipe: (prompt: string, timeConstraint: string) => Promise<boolean>;
  saveCurrentRecipe: () => Promise<boolean>;
  clearGeneratedRecipe: () => void;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  generatedRecipe: null,
  currentPrompt: null,
  isLoading: false,
  error: null,
  isSaving: false,
  saveError: null,

  clearGeneratedRecipe: () =>
    set({generatedRecipe: null, currentPrompt: null, error: null}),

  generateRecipe: async (prompt, timeConstraint) => {
    set({
      isLoading: true,
      error: null,
      generatedRecipe: null,
      currentPrompt: prompt,
      saveError: null,
    }); // Clear previous results/errors
    try {
      const recipe = await callGenerateRecipe(prompt, timeConstraint);
      set({generatedRecipe: recipe, isLoading: false});
      return true;
    } catch (genError: any) {
      console.error('Error generating recipe in store:', genError);
      set({
        error: genError.message || 'Failed to generate recipe.',
        isLoading: false,
      });
      return false;
    }
  },

  saveCurrentRecipe: async () => {
    const {generatedRecipe, currentPrompt} = get();
    const {userProfile} = useAuthStore.getState(); // Get user profile from auth store

    if (!generatedRecipe || !userProfile || !userProfile.defaultBoardId) {
      console.error(
        'Cannot save recipe: Missing recipe data, user profile, or default board ID.',
      );
      set({
        saveError: 'Could not save recipe - missing information.',
        isSaving: false,
      });
      return false;
    }

    set({isSaving: true, saveError: null});
    try {
      // Add prompt to recipe data before saving if not already there
      const recipeToSave: RecipeData = {
        ...generatedRecipe,
        prompt: currentPrompt ?? undefined, // Add prompt if available
        // Ensure other potential fields are handled or excluded if needed
      };
      await saveRecipeToDefaultBoard(
        userProfile.uid,
        userProfile.defaultBoardId,
        recipeToSave,
      );
      set({isSaving: false});
      console.log('Recipe saved successfully!');
      // Optionally: clearGeneratedRecipe(); // Or set a 'saved' flag on generatedRecipe
      return true;
    } catch (saveError: any) {
      console.error('Error saving recipe in store action:', saveError);
      set({
        saveError: saveError.message || 'Failed to save recipe.',
        isSaving: false,
      });
      return false;
    }
  },
}));
