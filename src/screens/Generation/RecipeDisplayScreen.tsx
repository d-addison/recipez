import React, {useMemo, useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
  Pressable,
} from 'react-native';
import type {RecipeData} from '../../types/Recipe'; // Adjust path as needed
import type {RecipeDisplayScreenProps} from '../../navigation/navigationTypes'; // Adjust path as needed
import {useInventoryStore} from '../../store/inventoryStore'; // Adjust path as needed
import {useRecipeStore} from '../../store/recipeStore'; // Adjust path as needed
import Icon from 'react-native-vector-icons/Ionicons';

// --- Header Buttons Component (Remains the same) ---
const HeaderButtons = ({
  onShare,
  onSave,
  isSaving,
  hasBeenSaved,
}: {
  onShare: () => void;
  onSave: () => void;
  isSaving: boolean;
  hasBeenSaved: boolean;
}) => (
  <View style={styles.headerButtons}>
    <Pressable
      onPress={onShare}
      style={({pressed}) => [
        styles.headerButton,
        pressed && styles.buttonPressed,
      ]}
      disabled={isSaving}
      android_ripple={{color: '#ccc', borderless: true}}>
      <Icon name="share-social-outline" size={24} color="#34D399" />
    </Pressable>
    {isSaving ? (
      <ActivityIndicator color="#34D399" style={styles.headerLoader} />
    ) : (
      <Pressable
        onPress={onSave}
        style={({pressed}) => [
          styles.headerButton,
          pressed && styles.buttonPressed,
        ]}
        disabled={hasBeenSaved}
        android_ripple={{color: '#ccc', borderless: true}}>
        <Icon
          name={hasBeenSaved ? 'bookmark' : 'bookmark-outline'}
          size={24}
          color={hasBeenSaved ? '#065F46' : '#34D399'}
        />
      </Pressable>
    )}
  </View>
);

// --- Main Screen Component ---
const RecipeDisplayScreen: React.FC<RecipeDisplayScreenProps> = ({
  route,
  navigation,
}) => {
  // --- State and Store Hooks ---
  const recipe = route.params?.recipe as RecipeData | undefined;
  const {inventoryItems} = useInventoryStore();

  // --- FIX: Select state individually from Zustand ---
  const saveCurrentRecipe = useRecipeStore(state => state.saveCurrentRecipe);
  const isSaving = useRecipeStore(state => state.isSaving);
  const saveError = useRecipeStore(state => state.saveError);
  // --- End of FIX ---

  const [hasBeenSaved, setHasBeenSaved] = useState(false);

  // --- Memoized Callbacks for Actions (Remain the same) ---
  const handleSave = useCallback(async () => {
    if (!recipe) {
      console.warn('Save attempted without a recipe.');
      return;
    }
    if (hasBeenSaved) {
      console.log('Recipe already saved.');
      return;
    }
    // Now `saveCurrentRecipe` reference from the store is stable
    const success = await saveCurrentRecipe();
    if (success) {
      Alert.alert(
        'Recipe Saved!',
        `"${recipe.title}" has been added to your Recipe Book.`,
      );
      setHasBeenSaved(true);
    }
    // Error handled by useEffect below
  }, [recipe, saveCurrentRecipe, hasBeenSaved]); // `saveCurrentRecipe` is now stable

  const handleShare = useCallback(async () => {
    if (!recipe) {
      console.warn('Share attempted without a recipe.');
      return;
    }
    try {
      const ingredientsText = recipe.ingredients?.join('\n- ');
      const instructionsText = recipe.instructions
        ?.map((step, i) => `${i + 1}. ${step}`)
        .join('\n');
      const message = `Check out this recipe: ${
        recipe.title
      }\n\nIngredients:\n- ${ingredientsText || 'N/A'}\n\nInstructions:\n${
        instructionsText || 'N/A'
      }\n\nGenerated with RecipEz!`;
      await Share.share({message: message, title: recipe.title});
    } catch (error: any) {
      Alert.alert(
        'Sharing Failed',
        error.message || 'An unknown error occurred.',
      );
    }
  }, [recipe]);

  // --- Owned Ingredient Logic (Remains the same, already memoized) ---
  const ownedIngredientNames = useMemo(() => {
    return new Set(inventoryItems.map(item => item.name.trim().toLowerCase()));
  }, [inventoryItems]);

  const isIngredientOwned = useCallback(
    (ingredientLine: string): boolean => {
      if (!ingredientLine) {
        return false;
      }
      const lineLower = ingredientLine.trim().toLowerCase();
      for (const ownedName of ownedIngredientNames) {
        if (ownedName && lineLower.includes(ownedName)) {
          return true;
        }
      }
      return false;
    },
    [ownedIngredientNames],
  );

  // --- Memoize the render function for headerRight (Remains the same) ---
  // Its dependencies `handleSave` and `isSaving` are now stable
  const renderHeaderRight = useCallback(
    () => (
      <HeaderButtons
        onShare={handleShare}
        onSave={handleSave}
        isSaving={isSaving} // `isSaving` is now stable unless value changes
        hasBeenSaved={hasBeenSaved}
      />
    ),
    [handleShare, handleSave, isSaving, hasBeenSaved], // Dependencies are now stable
  );

  // --- Effects ---
  // Update navigation options (Remains the same)
  // `renderHeaderRight` dependency is now stable
  useEffect(() => {
    if (!recipe) {
      navigation.setOptions({
        title: 'Loading Recipe...',
        headerRight: undefined,
      });
      return;
    }
    navigation.setOptions({
      title: recipe.title || 'Generated Recipe',
      headerRight: renderHeaderRight, // Pass stable memoized function reference
    });
  }, [navigation, recipe, renderHeaderRight]); // Dependencies are now stable

  // Effect for handling save errors (Remains the same)
  useEffect(() => {
    if (saveError) {
      console.error('Save Error:', saveError);
      Alert.alert('Error Saving', saveError || 'Could not save the recipe.');
      // Consider adding: useRecipeStore.getState().clearSaveError();
    }
  }, [saveError]);

  // --- Render Logic (Remains the same) ---
  if (!recipe) {
    console.log('RecipeDisplayScreen rendering without recipe data.');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34D399" />
        <Text style={styles.loadingText}>Loading Recipe...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}>
      {/* Title and Description Card */}
      <View style={styles.titleCard}>
        <Text style={styles.title}>{recipe.title}</Text>
        {recipe.description && (
          <Text style={styles.description}>{recipe.description}</Text>
        )}
      </View>

      {/* Details Bar */}
      <View style={styles.detailsBar}>
        {recipe.prepTime && (
          <View style={styles.detailItem}>
            <Icon name="time-outline" size={16} color="#05603A" />
            <Text style={styles.detailValue}>{recipe.prepTime}</Text>
            <Text style={styles.detailLabel}>Prep</Text>
          </View>
        )}
        {recipe.cookTime && (
          <View style={styles.detailItem}>
            <Icon name="timer-outline" size={16} color="#05603A" />
            <Text style={styles.detailValue}>{recipe.cookTime}</Text>
            <Text style={styles.detailLabel}>Cook</Text>
          </View>
        )}
        {recipe.servings && (
          <View style={styles.detailItem}>
            <Icon name="restaurant-outline" size={16} color="#05603A" />
            <Text style={styles.detailValue}>{recipe.servings}</Text>
            <Text style={styles.detailLabel}>Serves</Text>
          </View>
        )}
        {recipe.calories && (
          <View style={styles.detailItem}>
            <Icon name="flash-outline" size={16} color="#05603A" />
            <Text style={styles.detailValue}>{String(recipe.calories)}</Text>
            <Text style={styles.detailLabel}>Calories</Text>
          </View>
        )}
        {recipe.difficulty && (
          <View style={styles.detailItem}>
            <Icon name="server-outline" size={16} color="#05603A" />
            <Text style={styles.detailValue}>{recipe.difficulty}</Text>
            <Text style={styles.detailLabel}>Difficulty</Text>
          </View>
        )}
      </View>

      {/* Ingredients Section */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {recipe.ingredients.map((ing, index) => {
            const owned = isIngredientOwned(ing);
            return (
              <View
                key={`ingredient-${index}`}
                style={styles.listItemContainer}>
                <Icon
                  name={owned ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={owned ? '#34D399' : '#9CA3AF'}
                  style={styles.listItemIcon}
                />
                <Text
                  style={[styles.listItemText, owned && styles.ownedItemText]}>
                  {ing}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Instructions Section */}
      {recipe.instructions && recipe.instructions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {recipe.instructions.map((step, index) => (
            <View key={`instruction-${index}`} style={styles.stepItemContainer}>
              <Text style={styles.stepNumber}>{index + 1}.</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Notes Section (Optional) */}
      {recipe.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes & Tips</Text>
          <Text style={styles.notesText}>{recipe.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
};

// --- Styles (Remain the same) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light gray background
  },
  contentContainer: {
    paddingBottom: 40, // Ensure space at the bottom
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280', // Gray text
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 10, // Adjust spacing as needed
    alignItems: 'center',
  },
  headerButton: {
    paddingHorizontal: 10,
    paddingVertical: 5, // Make touch area slightly larger
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLoader: {
    marginHorizontal: 10, // Consistent horizontal spacing with button
    width: 24, // Match icon size approx
    height: 24,
  },
  buttonPressed: {
    opacity: 0.6, // Visual feedback for press
  },
  titleCard: {
    backgroundColor: '#FFFFFF', // White card background
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // Subtle border
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937', // Dark gray text
    marginBottom: 8,
    lineHeight: 30, // Adjust line height for readability
  },
  description: {
    fontSize: 15,
    color: '#6B7280', // Medium gray text
    lineHeight: 22,
  },
  detailsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start', // Align items to the top
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#F0FDF4', // Light green background
    flexWrap: 'wrap', // Allow items to wrap on smaller screens if needed
  },
  detailItem: {
    alignItems: 'center',
    minWidth: 60, // Give items some minimum width
    paddingHorizontal: 4, // Small horizontal padding
    marginBottom: 10, // Add space if wrapping occurs
  },
  detailLabel: {
    fontSize: 11,
    color: '#065F46', // Darker green text
    textTransform: 'uppercase',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 13,
    color: '#047857', // Medium green text
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF', // White background for sections
    paddingVertical: 20,
    paddingHorizontal: 25,
    marginTop: 8, // Space between sections
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6', // Subtle separator
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827', // Very dark gray/black
    marginBottom: 18,
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align icon with the start of the text line
    marginBottom: 10,
  },
  listItemIcon: {
    marginRight: 10,
    marginTop: 3, // Adjust vertical alignment with text
  },
  listItemText: {
    flex: 1, // Allow text to wrap
    fontSize: 16,
    color: '#374151', // Dark text for readability
    lineHeight: 24,
  },
  ownedItemText: {
    color: '#065F46', // Dark green for owned items
  },
  stepItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  stepNumber: {
    fontSize: 16,
    color: '#34D399', // Use accent color for step number
    fontWeight: 'bold',
    marginRight: 10,
    width: 25, // Fixed width for alignment
    lineHeight: 24, // Match text line height
    textAlign: 'right', // Align number to the right before the dot
  },
  stepText: {
    flex: 1, // Allow text to take remaining space and wrap
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  notesText: {
    fontSize: 15,
    color: '#4B5563', // Slightly lighter text for notes
    fontStyle: 'italic',
    lineHeight: 22,
  },
});

export default RecipeDisplayScreen;
