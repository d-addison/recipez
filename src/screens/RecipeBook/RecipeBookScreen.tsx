import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable, // Import Pressable
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {RecipeBookScreenProps} from '../../navigation/navigationTypes';
import {useAuthStore} from '../../store/authStore';
import {RecipeData} from '../../types'; // Assuming RecipeData includes an 'id' when fetched
import {fetchRecipesFromBoard} from '../../services/recipeService'; // Adjust path if needed

// TODO: Implement this service function
// Example signature in recipeService.ts:
// export const fetchRecipesFromBoard = async (boardId: string): Promise<RecipeData[]> => { ... }

const RecipeBookScreen: React.FC<RecipeBookScreenProps> = ({navigation}) => {
  // Pass navigation if needed for navigating to recipe details
  const {userProfile} = useAuthStore();
  const [savedRecipes, setSavedRecipes] = useState<RecipeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch recipes when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadRecipes = async () => {
        if (userProfile?.defaultBoardId) {
          setIsLoading(true);
          setError(null);
          try {
            // --- USE THE IMPLEMENTED FUNCTION ---
            console.log(
              `Loading recipes from board: ${userProfile.defaultBoardId}`,
            );
            const recipes = await fetchRecipesFromBoard(
              userProfile.defaultBoardId,
            );
            console.log(`Fetched ${recipes.length} recipes`);
            setSavedRecipes(recipes);
            // --- END OF CHANGE ---
          } catch (err: any) {
            console.error('Error in loadRecipes:', err); // Log the full error
            setError(err.message || 'Failed to load saved recipes.');
            // Alert moved outside the try block based on original code, but could be here too
            // Alert.alert('Error', err.message || 'Failed to load saved recipes.');
            setSavedRecipes([]); // Clear recipes on error
          } finally {
            setIsLoading(false);
          }
        } else {
          // Handle case where user profile or board ID isn't available yet
          console.log(
            'User profile or defaultBoardId not available, clearing recipes.',
          );
          setSavedRecipes([]); // Clear recipes if no board ID
          setError(null); // Clear any previous error
          setIsLoading(false); // Ensure loading stops
        }
      };

      loadRecipes();

      // Optional cleanup function if needed (e.g., aborting fetch)
      // return () => { console.log("RecipeBookScreen blurred"); };
    }, [userProfile?.uid, userProfile?.defaultBoardId]), // Rerun if user or their board changes
  );

  const renderRecipeItem = ({item}: {item: RecipeData}) => (
    <Pressable
      // Example navigation:
      // onPress={() => navigation.navigate(ROUTES.RECIPE_DISPLAY as any, { recipeId: item.id })} // Pass ID to fetch details
      onPress={() =>
        Alert.alert('Coming Soon', 'Viewing saved recipes details.')
      }
      style={({pressed}) => [
        styles.recipeItem,
        pressed && styles.buttonPressed, // Style for pressed state
      ]}
      android_ripple={{color: '#eee'}}>
      <Text style={styles.recipeTitle}>{item.title}</Text>
      {/* Add more details like image thumbnail later */}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {isLoading &&
        savedRecipes.length === 0 && ( // Show loader only when initially loading
          <ActivityIndicator
            size="large"
            color="#34D399"
            style={styles.loader}
          />
        )}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {!isLoading && !error && savedRecipes.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Your recipe book is empty. Generate and save some recipes!
          </Text>
        </View>
      )}

      {!error && savedRecipes.length > 0 && (
        <FlatList
          data={savedRecipes}
          renderItem={renderRecipeItem}
          keyExtractor={item => item.id || item.title} // Use ID if available from fetch
          contentContainerStyle={styles.list}
          // Add pull-to-refresh later if needed
          // onRefresh={loadRecipes}
          // refreshing={isLoading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loader: {
    flex: 1, // Make loader take full space when shown alone
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 15,
  },
  emptyContainer: {
    flex: 1, // Make empty message take full space
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
  },
  list: {
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  recipeItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    // Add shadow like inventory items
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  // Style for pressed state feedback (e.g., background change)
  buttonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Subtle background change on press
  },
});

export default RecipeBookScreen;
