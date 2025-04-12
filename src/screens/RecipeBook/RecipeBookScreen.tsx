import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {RecipeBookScreenProps} from '../../navigation/navigationTypes';
import {useAuthStore} from '../../store/authStore';
import {fetchRecipesFromBoard} from '../../services/recipeService'; // Assuming this service function exists
import {RecipeData} from '../../types'; // Assuming RecipeData includes an 'id' when fetched

// TODO: Implement this service function
// Example signature in recipeService.ts:
// export const fetchRecipesFromBoard = async (boardId: string): Promise<RecipeData[]> => { ... }

const RecipeBookScreen: React.FC<RecipeBookScreenProps> = ({navigation}) => {
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
            // Placeholder: Need to implement fetchRecipesFromBoard in services
            // This function should query the 'boardRecipes' subcollection,
            // then fetch the actual recipe data using the 'recipeRef'.
            // const recipes = await fetchRecipesFromBoard(userProfile.defaultBoardId);
            console.warn(
              'fetchRecipesFromBoard service function not implemented yet.',
            );
            const recipes: RecipeData[] = []; // Placeholder
            setSavedRecipes(recipes);
          } catch (err: any) {
            setError(err.message || 'Failed to load saved recipes.');
            Alert.alert(
              'Error',
              err.message || 'Failed to load saved recipes.',
            );
          } finally {
            setIsLoading(false);
          }
        } else {
          // Handle case where user profile or board ID isn't available yet
          setSavedRecipes([]); // Clear recipes if no board ID
        }
      };

      loadRecipes();
    }, [userProfile]), // Rerun when user profile (and thus defaultBoardId) might change
  );

  const renderRecipeItem = ({item}: {item: RecipeData}) => (
    <TouchableOpacity
      style={styles.recipeItem}
      // onPress={() => navigation.navigate(ROUTES.RECIPE_DISPLAY, { recipe: item })} // Navigate to display if needed
      onPress={() =>
        Alert.alert('Coming Soon', 'Viewing saved recipes details.')
      }>
      <Text style={styles.recipeTitle}>{item.title}</Text>
      {/* Add more details like image thumbnail later */}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isLoading && (
        <ActivityIndicator size="large" color="#34D399" style={styles.loader} />
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {!isLoading && !error && savedRecipes.length === 0 && (
        <Text style={styles.emptyText}>
          Your recipe book is empty. Generate and save some recipes!
        </Text>
      )}

      {!isLoading && !error && savedRecipes.length > 0 && (
        <FlatList
          data={savedRecipes}
          renderItem={renderRecipeItem}
          keyExtractor={item => item.id || item.title} // Use ID if available from fetch
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center', // Remove center align to allow list at top
    // alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loader: {
    marginTop: 50,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 15,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6B7280',
    paddingHorizontal: 30,
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
});

export default RecipeBookScreen;
