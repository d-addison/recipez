import {firebaseFunctions, firebaseFirestore} from './firebase';
import {RecipeData} from '../types';
import firestore from '@react-native-firebase/firestore';

export const callGenerateRecipe = async (
  prompt: string,
  timeConstraint: string,
): Promise<RecipeData> => {
  console.log(
    `Calling generateRecipe Cloud Function with prompt: "${prompt}", time: ${timeConstraint}`,
  );
  try {
    // Ensure region matches your function deployment if not default 'us-central1'
    // const generateRecipeCallable = firebaseFunctions.region('your-region').httpsCallable('generateRecipe');
    const generateRecipeCallable =
      firebaseFunctions.httpsCallable('generateRecipe');
    const result = await generateRecipeCallable({prompt, timeConstraint}); // Pass timeConstraint
    console.log('Raw result from callable function:', result);
    // Check if data exists and has a title (basic validation)
    if (result.data && (result.data as any).title) {
      return result.data as RecipeData;
    } else {
      console.error(
        'Received invalid data structure from function:',
        result.data,
      );
      throw new Error('Received invalid recipe data from the server.');
    }
  } catch (error: any) {
    console.error(
      'Error calling generateRecipe function:',
      error.code,
      error.message,
      error.details,
    );
    // Provide more user-friendly messages
    let friendlyMessage = 'Failed to generate recipe. Please try again.';
    if (error.code === 'unavailable') {
      friendlyMessage =
        'Could not connect to the recipe service. Please check your internet connection.';
    } else if (error.code === 'internal') {
      friendlyMessage =
        'An internal server error occurred while generating the recipe.';
    } else if (error.message?.includes('process the recipe response format')) {
      friendlyMessage =
        'The recipe service returned an unexpected format. Please try again later.';
    } else if (error.message?.includes('Unknown error or empty response')) {
      friendlyMessage =
        'The recipe service did not return a valid recipe. This might be due to safety filters or an issue with the request.';
    }
    throw new Error(friendlyMessage);
  }
};

// Function to save a recipe to the user's default board
export const saveRecipeToDefaultBoard = async (
  userId: string,
  defaultBoardId: string,
  recipeData: RecipeData,
): Promise<void> => {
  if (!userId || !defaultBoardId || !recipeData || !recipeData.title) {
    // Add title check
    throw new Error('Missing required data for saving recipe.');
  }
  console.log(
    `Saving recipe "${recipeData.title}" to board ${defaultBoardId} for user ${userId}`,
  );

  // 1. Prepare recipe data for top-level collection (ensure no undefined fields problematic for Firestore)
  const recipeToSave: Omit<RecipeData, 'id'> = {
    title: recipeData.title,
    description: recipeData.description || '',
    prepTime: recipeData.prepTime || '',
    cookTime: recipeData.cookTime || '',
    servings: recipeData.servings || '',
    ingredients: recipeData.ingredients || [],
    instructions: recipeData.instructions || [],
    calories: recipeData.calories || null,
    difficulty: recipeData.difficulty || null,
    notes: recipeData.notes || null,
    imageUrl: recipeData.imageUrl || null,
    originalUserId: userId,
    prompt: recipeData.prompt || '', // Capture prompt if available
    createdAt: firestore.FieldValue.serverTimestamp(), // Use server timestamp directly
    aiModelUsed: recipeData.aiModelUsed || 'unknown', // Track model used
  };

  try {
    // 2. Add to top-level 'recipes' collection
    const recipeDocRef = await firebaseFirestore
      .collection('recipes')
      .add(recipeToSave);
    const recipeId = recipeDocRef.id;
    console.log(`Recipe saved to recipes collection with ID: ${recipeId}`);

    // 3. Add link to the board's subcollection
    const boardRecipeData = {
      // Store a reference, not the whole recipe!
      recipeRef: firebaseFirestore.doc(`recipes/${recipeId}`),
      addedByUserId: userId,
      addedAt: firestore.FieldValue.serverTimestamp(),
    };
    await firebaseFirestore
      .collection('boards')
      .doc(defaultBoardId)
      .collection('boardRecipes')
      .doc(recipeId) // Use recipeId as the doc ID here too for easy lookup/overwrite
      .set(boardRecipeData);

    console.log('Recipe link saved to boardRecipes subcollection.');

    // 4. TODO LATER (V2/Cloud Function): Increment recipeCount on the board document.
  } catch (error: any) {
    console.error('Error saving recipe:', error);
    throw new Error('Failed to save the recipe to your board.');
  }
};
