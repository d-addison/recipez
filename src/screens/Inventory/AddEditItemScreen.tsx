import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useInventoryStore} from '../../store/inventoryStore';
import type {AddEditItemScreenProps} from '../../navigation/navigationTypes';
import {InventoryCategory} from '../../types';
import Icon from 'react-native-vector-icons/Ionicons'; // Using icons for categories

const categories: InventoryCategory[] = [
  'fridge',
  'pantry',
  'freezer',
  'tools',
];
const categoryIcons: {[key in InventoryCategory]: string} = {
  // Match icons from InventoryScreen
  fridge: 'snow-outline',
  pantry: 'file-tray-full-outline',
  freezer: 'cube-outline',
  tools: 'construct-outline',
};

const AddEditItemScreen: React.FC<AddEditItemScreenProps> = ({
  navigation,
  route,
}) => {
  // Get item from route params if editing, otherwise it's undefined (adding)
  const {item} = route.params;
  const isEditing = !!item; // Boolean check if item exists

  // Initialize state based on whether we are editing or adding
  const [name, setName] = useState(item?.name || '');
  const [quantity, setQuantity] = useState(item?.quantity || '');
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory>(
    item?.category || 'fridge',
  ); // Default to 'fridge'

  // Get actions and state from Zustand store
  const {addItem, updateItem, isLoading, error} = useInventoryStore(state => ({
    addItem: state.addItem,
    updateItem: state.updateItem,
    isLoading: state.isLoading,
    error: state.error, // Get error state for display
  }));

  // Set the header title dynamically based on editing or adding mode
  useEffect(() => {
    navigation.setOptions({title: isEditing ? 'Edit Item' : 'Add New Item'});
  }, [isEditing, navigation]);

  // Handle saving the item (either update or add)
  const handleSave = async () => {
    // Basic validation
    if (!name.trim()) {
      Alert.alert('Input Required', 'Please enter an item name.');
      return;
    }
    // Category is guaranteed by default state

    let success = false;
    if (isEditing && item) {
      // Call update action if editing
      const dataToUpdate: Partial<Omit<InventoryItem, 'id' | 'createdAt'>> = {};
      if (name !== item.name) {
        dataToUpdate.name = name.trim();
      }
      if (quantity !== item.quantity) {
        dataToUpdate.quantity = quantity.trim();
      }
      if (selectedCategory !== item.category) {
        dataToUpdate.category = selectedCategory;
      }

      if (Object.keys(dataToUpdate).length > 0) {
        success = await updateItem(item.id, dataToUpdate);
      } else {
        // No changes made, just go back
        navigation.goBack();
        return;
      }
    } else {
      // Call add action if adding
      success = await addItem({
        name: name.trim(),
        quantity: quantity.trim(),
        category: selectedCategory,
      });
    }

    if (success) {
      navigation.goBack(); // Go back to the previous screen (inventory list) on success
    } else {
      // Show error from the store
      Alert.alert(
        'Error',
        useInventoryStore.getState().error || 'Failed to save item.',
      );
    }
  };

  return (
    // Use ScrollView to handle different screen sizes and keyboard appearance
    <ScrollView contentContainerStyle={styles.container}>
      {/* Item Name Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Item Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Chicken Breast, Olive Oil"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
          autoCapitalize="sentences" // Capitalize first letter
        />
      </View>

      {/* Quantity Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Quantity / Amount (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 2 lbs, 1 container, Half full"
          placeholderTextColor="#9CA3AF"
          value={quantity}
          onChangeText={setQuantity}
        />
      </View>

      {/* Category Selection */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Category *</Text>
        <View style={styles.categorySelector}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                selectedCategory === cat && styles.categoryButtonSelected,
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}>
              <Icon
                name={categoryIcons[cat]}
                size={20}
                color={selectedCategory === cat ? '#067647' : '#6B7280'}
              />
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === cat && styles.categoryButtonTextSelected,
                ]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Display error if exists */}
      {error && !isLoading && <Text style={styles.errorText}>{error}</Text>}

      {/* Save Button or Loading Indicator */}
      <View style={styles.buttonContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#34D399" />
        ) : (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isLoading}>
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update Item' : 'Add Item'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 25,
    backgroundColor: '#FFFFFF', // Use white background for form screens
  },
  formGroup: {
    marginBottom: 25, // Increased spacing
  },
  label: {
    color: '#334155', // Slate 700
    fontWeight: '500',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    height: 50,
    borderColor: '#D1D5DB', // Gray 300
    borderWidth: 1,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#F9FAFB', // Slightly off-white input bg
    fontSize: 16,
    color: '#1F2937',
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow wrapping on smaller screens
    gap: 10, // Use gap for spacing
    marginTop: 5,
  },
  categoryButton: {
    flexDirection: 'row', // Icon and text side-by-side
    alignItems: 'center',
    justifyContent: 'center', // Center content
    flexGrow: 1, // Allow buttons to grow
    minWidth: '45%', // Ensure minimum width, roughly 2 per row
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1.5, // Slightly thicker border
    borderColor: '#D1D5DB', // Gray 300
    backgroundColor: '#FFFFFF',
    borderRadius: 8, // Slightly more rounded
  },
  categoryButtonSelected: {
    borderColor: '#34D399', // Primary Green border
    backgroundColor: '#EBFDF5', // Very light green background
  },
  categoryButtonText: {
    color: '#6B7280', // Medium Gray text
    fontSize: 14,
    marginLeft: 8, // Space between icon and text
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#067647', // Darker Green text when selected
    fontWeight: '600',
  },
  errorText: {
    color: '#DC2626', // Red 600
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 30, // Space above the save button
  },
  saveButton: {
    backgroundColor: '#34D399', // Primary Green
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF', // White
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddEditItemScreen;
