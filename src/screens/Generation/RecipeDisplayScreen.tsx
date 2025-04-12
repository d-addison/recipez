import React, {useMemo, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Button,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Share,
} from 'react-native';
import type {RecipeDisplayScreenProps} from '../../navigation/navigationTypes';
import {useInventoryStore} from '../../store/inventoryStore';
import {useRecipeStore} from '../../store/recipeStore'; // To save
import Icon from 'react-native-vector-icons/Ionicons'; // For icons

const RecipeDisplayScreen: React.FC<RecipeDisplayScreenProps> = ({
  route,
  navigation,
}) => {
  // Get the recipe passed via navigation parameters
  const {recipe} = route.params;
  // Get inventory items to check for owned ingredients
  const {inventoryItems} = useInventoryStore();
  // Get save action and state from recipe store
  const {saveCurrentRecipe, isSaving, saveError} = useRecipeStore(state => ({
    saveCurrentRecipe: state.saveCurrentRecipe,
    isSaving: state.isSaving,
    saveError: state.saveError,
  }));

  // Keep track if recipe has been saved in this session
  const [hasBeenSaved, setHasBeenSaved] = useState(false);

  // --- Owned Ingredient Logic ---
  // Memoize the set of owned ingredient names (lowercase) for efficiency
  const ownedIngredientNames = useMemo(() => {
    console.log('Recalculating owned ingredients set'); // Check how often this runs
    return new Set(inventoryItems.map(item => item.name.trim().toLowerCase()));
  }, [inventoryItems]);

  // Function to check if an ingredient line likely contains an owned item
  const isIngredientOwned = (ingredientLine: string): boolean => {
    const lineLower = ingredientLine.trim().toLowerCase();
    // Basic check: see if any owned item name is a substring of the ingredient line
    for (const ownedName of ownedIngredientNames) {
      if (ownedName && lineLower.includes(ownedName)) {
        return true;
      }
    }
    // TODO: More sophisticated matching could be added later (e.g., singular/plural, basic units)
    return false;
  };

  // --- Actions ---
  const handleSave = async () => {
    const success = await saveCurrentRecipe();
    if (success) {
      Alert.alert(
        'Recipe Saved!',
        `"${recipe?.title}" has been added to your Recipe Book.`,
      );
      setHasBeenSaved(true); // Mark as saved for this session
    } else {
      // Access latest error state
      Alert.alert(
        'Error Saving',
        useRecipeStore.getState().saveError || 'Could not save the recipe.',
      );
    }
  };

  const handleShare = async () => {
    if (!recipe) {
      return;
    }
    try {
      // Basic text sharing
      const ingredientsText = recipe.ingredients?.join('\n- ');
      const instructionsText = recipe.instructions
        ?.map((step, i) => `${i + 1}. ${step}`)
        .join('\n');
      const message = `Check out this recipe: ${recipe.title}\n\nIngredients:\n- ${ingredientsText}\n\nInstructions:\n${instructionsText}\n\nGenerated with RecipEz!`;

      await Share.share({
        message: message,
        title: recipe.title, // Optional title for some platforms
      });
    } catch (error: any) {
      Alert.alert('Sharing Failed', error.message);
    }
  };

  // --- Effects ---
  // Set navigation options dynamically
  useEffect(() => {
    navigation.setOptions({
      title: recipe?.title || 'Generated Recipe', // Set header title
      headerRight: () => (
        // Add Save and Share buttons to header
        <View style={styles.headerButtons}>
          {/* Share Button */}
          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerButton}
            disabled={isSaving}>
            <Icon name="share-social-outline" size={24} color="#34D399" />
          </TouchableOpacity>
          {/* Save Button or Loading Indicator */}
          {isSaving ? (
            <ActivityIndicator color="#34D399" style={styles.headerLoader} />
          ) : (
            <TouchableOpacity
              onPress={handleSave}
              style={styles.headerButton}
              disabled={hasBeenSaved}>
              <Icon
                name={hasBeenSaved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={hasBeenSaved ? '#34D399' : '#34D399'}
              />
            </TouchableOpacity>
          )}
        </View>
      ),
    });
  }, [navigation, recipe, handleSave, isSaving, hasBeenSaved, handleShare]); // Add dependencies

  // Display error if saving failed after attempting
  useEffect(() => {
    if (saveError) {
      // Optionally show an alert here too, or rely on a banner component
      console.log('Save error state updated:', saveError);
    }
  }, [saveError]);

  // Render loading or message if recipe data is missing
  if (!recipe) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading recipe details...</Text>
      </View>
    );
  }

  // --- Render UI ---
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

      {/* Details Bar (Prep, Cook, etc.) */}
      <View style={styles.detailsBar}>
        <View style={styles.detailItem}>
          <Icon name="time-outline" size={16} color="#05603A" />
          <Text style={styles.detailValue}>{recipe.prepTime || 'N/A'}</Text>
          <Text style={styles.detailLabel}>Prep</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="timer-outline" size={16} color="#05603A" />
          <Text style={styles.detailValue}>{recipe.cookTime || 'N/A'}</Text>
          <Text style={styles.detailLabel}>Cook</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="restaurant-outline" size={16} color="#05603A" />
          <Text style={styles.detailValue}>{recipe.servings || 'N/A'}</Text>
          <Text style={styles.detailLabel}>Serves</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="flash-outline" size={16} color="#05603A" />
          <Text style={styles.detailValue}>{recipe.calories || 'N/A'}</Text>
          <Text style={styles.detailLabel}>Calories</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="server-outline" size={16} color="#05603A" />
          <Text style={styles.detailValue}>{recipe.difficulty || 'N/A'}</Text>
          <Text style={styles.detailLabel}>Difficulty</Text>
        </View>
      </View>

      {/* Ingredients Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients?.map((ing, index) => {
          const owned = isIngredientOwned(ing);
          return (
            <View key={index} style={styles.listItemContainer}>
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

      {/* Instructions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        {recipe.instructions?.map((step, index) => (
          <View key={index} style={styles.stepItemContainer}>
            <Text style={styles.stepNumber}>{index + 1}.</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

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

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Use a very light gray or off-white
  },
  contentContainer: {
    paddingBottom: 40, // Ensure space at the bottom
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 10,
  },
  headerButton: {
    paddingHorizontal: 10, // Space out buttons
    paddingVertical: 5,
  },
  headerLoader: {
    marginHorizontal: 15,
  },
  titleCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 25,
    // Removed margin, sections handle spacing now
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 30,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  detailsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute items
    alignItems: 'flex-start', // Align items top
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#F0FDF4', // Light green background
    // borderBottomWidth: 1,
    // borderBottomColor: '#D1FAE5',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1, // Allow items to take equal space
    paddingHorizontal: 4, // Small horizontal padding
  },
  detailLabel: {
    fontSize: 11,
    color: '#065F46', // Darker Green
    textTransform: 'uppercase',
    marginTop: 4, // Space below value
    fontWeight: '500',
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 13,
    color: '#047857', // Medium Green
    fontWeight: '600',
    marginTop: 2, // Space below icon
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 25,
    marginTop: 8, // Space between sections
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600', // Semibold
    color: '#111827', // Near black
    marginBottom: 18,
    // borderBottomWidth: 1, // Optional divider line
    // borderBottomColor: '#E5E7EB',
    // paddingBottom: 8,
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align icon top
    marginBottom: 10,
  },
  listItemIcon: {
    marginRight: 10,
    marginTop: 2, // Align icon slightly better with text line
  },
  listItemText: {
    flex: 1, // Allow text to wrap
    fontSize: 16,
    color: '#374151', // Gray 700
    lineHeight: 24,
  },
  ownedItemText: {
    // fontWeight: '500', // Slightly bolder if owned
    color: '#065F46', // Darker green for owned text
  },
  stepItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  stepNumber: {
    fontSize: 16,
    color: '#34D399', // Primary Green for step numbers
    fontWeight: 'bold',
    marginRight: 10,
    width: 25, // Allocate fixed width
    lineHeight: 24,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#374151', // Gray 700
    lineHeight: 24,
  },
  notesText: {
    fontSize: 15,
    color: '#4B5563', // Gray 600
    fontStyle: 'italic',
    lineHeight: 22,
  },
});

export default RecipeDisplayScreen;
