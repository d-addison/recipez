import {firebaseFunctions, firebaseFirestore} from './firebase';
import {RecipeData} from '../types';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

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

// Function to fetch recipes linked to a specific board
export const fetchRecipesFromBoard = async (
  boardId: string,
): Promise<RecipeData[]> => {
  if (!boardId) {
    console.warn('fetchRecipesFromBoard called without boardId.');
    return [];
  }
  console.log(`Fetching recipes for board ID: ${boardId}`);

  try {
    const boardRecipesSnapshot = await firebaseFirestore
      .collection('boards')
      .doc(boardId)
      .collection('boardRecipes')
      .orderBy('addedAt', 'desc')
      .get();

    if (boardRecipesSnapshot.empty) {
      console.log(`No recipe links found in board ${boardId}.`);
      return [];
    }

    const recipeFetchPromises: Promise<FirebaseFirestoreTypes.DocumentSnapshot>[] =
      [];
    boardRecipesSnapshot.forEach(doc => {
      const boardRecipeData = doc.data();

      // --- FIX: Replace instanceof with duck typing ---
      if (
        boardRecipeData?.recipeRef &&
        typeof boardRecipeData.recipeRef.path === 'string' && // Check for path property
        typeof boardRecipeData.recipeRef.get === 'function' // Check for get method
      ) {
        // Assume it's a valid DocumentReference if it has path and get()
        recipeFetchPromises.push(boardRecipeData.recipeRef.get());
      } else {
        console.warn(
          `Invalid or missing recipeRef in boardRecipes doc: ${doc.id} for board ${boardId}. Found:`,
          boardRecipeData?.recipeRef,
        );
      }
      // --- End of FIX ---
    });

    // Prevent Promise.all([]) on empty valid refs which throws no error but is pointless
    if (recipeFetchPromises.length === 0) {
      console.log('No valid recipe references found to fetch.');
      return [];
    }

    const recipeSnapshots = await Promise.all(recipeFetchPromises);

    const fetchedRecipes: RecipeData[] = [];
    recipeSnapshots.forEach(recipeDoc => {
      if (recipeDoc.exists) {
        const recipeData = recipeDoc.data() as Omit<RecipeData, 'id'>;
        fetchedRecipes.push({
          ...recipeData,
          id: recipeDoc.id,
          // Convert timestamps if necessary for your RecipeData type
          // createdAt: (recipeData.createdAt as FirebaseFirestoreTypes.Timestamp)?.toDate(),
        });
      } else {
        console.warn(
          `Referenced recipe document (Path: ${recipeDoc.ref.path}) does not exist.`,
        );
      }
    });

    console.log(
      `Successfully fetched ${fetchedRecipes.length} recipes for board ${boardId}.`,
    );
    return fetchedRecipes;
  } catch (error: any) {
    // Log the specific error before throwing a generic one
    console.error(`Error fetching recipes from board ${boardId}:`, error);
    throw new Error('Failed to load your saved recipes. Please try again.');
  }
};
