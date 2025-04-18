import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Pressable, // Import Pressable
} from 'react-native';
import {useInventoryStore} from '../../store/inventoryStore';
import type {AddEditItemScreenProps} from '../../navigation/navigationTypes';
import {InventoryCategory, InventoryItem} from '../../types';
import Icon from 'react-native-vector-icons/Ionicons'; // Using icons for categories
// Attempt to import theme styles
import {colors, typography, commonStyles} from '../../theme';

const categories: InventoryCategory[] = [
  'fridge',
  'pantry',
  'freezer',
  'tools',
];
// Ensure these icon names match your chosen icon set (Ionicons)
const categoryIcons: {[key in InventoryCategory]: string} = {
  fridge: 'snow-outline',
  pantry: 'file-tray-full-outline',
  freezer: 'cube-outline',
  tools: 'build-outline',
};

// --- Define Default Fallback Styles ---
const defaultColors = {
  primary: '#34D399',
  secondary: '#059669',
  background: '#F5F5F7',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#FFFFFF',
  },
  status: {
    error: '#DC2626',
  },
};
const defaultTypography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    body: 14,
    button: 16,
  },
};
const defaultCommonStyles = {
  container: {
    padding: 16,
    backgroundColor: defaultColors.background,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
};

// --- Determine Styles to Use (Prioritize Imported Theme) ---
// Use different variable names to avoid conflict with imports
const colorsToUse = colors || defaultColors;
const typographyToUse = typography || defaultTypography;
const commonStylesToUse = commonStyles || defaultCommonStyles;
// --- End Style Determination ---

const AddEditItemScreen: React.FC<AddEditItemScreenProps> = ({
  navigation,
  route,
}) => {
  const item =
    route.params && 'item' in route.params ? route.params.item : undefined;
  const isEditing = !!item;

  const [name, setName] = useState(item?.name || '');
  const [quantity, setQuantity] = useState(item?.quantity || '');
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory>(
    item?.category || 'fridge',
  );

  const addItem = useInventoryStore(state => state.addItem);
  const updateItem = useInventoryStore(state => state.updateItem);
  const isLoading = useInventoryStore(state => state.isLoading);
  const error = useInventoryStore(state => state.error);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? `Edit ${item?.name || 'Item'}` : 'Add New Item',
    });
  }, [isEditing, item?.name, navigation]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedQuantity = quantity.trim();

    if (!trimmedName) {
      Alert.alert('Input Required', 'Please enter an item name.');
      return;
    }

    let success = false;
    if (isEditing && item) {
      const dataToUpdate: Partial<Omit<InventoryItem, 'id' | 'createdAt'>> = {};
      if (trimmedName !== item.name) {
        dataToUpdate.name = trimmedName;
      }
      if (trimmedQuantity !== item.quantity) {
        dataToUpdate.quantity = trimmedQuantity;
      }
      if (selectedCategory !== item.category) {
        dataToUpdate.category = selectedCategory;
      }

      if (Object.keys(dataToUpdate).length > 0) {
        success = await updateItem(item.id, dataToUpdate);
      } else {
        navigation.goBack();
        return;
      }
    } else {
      success = await addItem({
        name: trimmedName,
        quantity: trimmedQuantity,
        category: selectedCategory,
      });
    }

    if (success) {
      navigation.goBack();
    } else {
      const currentError = useInventoryStore.getState().error;
      Alert.alert(
        'Error Saving Item',
        currentError || 'An unknown error occurred while saving.',
      );
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container} // Use final styles
      keyboardShouldPersistTaps="handled">
      {/* Item Name Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Item Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Chicken Breast, Olive Oil"
          placeholderTextColor={colorsToUse.text.secondary} // Use final styles
          value={name}
          onChangeText={setName}
          autoCapitalize="sentences"
        />
      </View>

      {/* Quantity Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Quantity / Amount (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 2 lbs, 1 container, Half full"
          placeholderTextColor={colorsToUse.text.secondary} // Use final styles
          value={quantity}
          onChangeText={setQuantity}
        />
      </View>

      {/* Category Selection */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Category *</Text>
        <View style={styles.categorySelector}>
          {categories.map(cat => (
            <Pressable
              key={cat}
              style={({pressed}) => [
                styles.categoryButton,
                selectedCategory === cat && styles.categoryButtonSelected,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => setSelectedCategory(cat)}
              android_ripple={{color: '#ccc'}}>
              <Icon
                name={categoryIcons[cat]}
                size={20}
                color={
                  selectedCategory === cat
                    ? colorsToUse.primary // Use final styles
                    : colorsToUse.text.secondary // Use final styles
                }
              />
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === cat && styles.categoryButtonTextSelected,
                ]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Display error if exists */}
      {error && !isLoading && <Text style={styles.errorText}>{error}</Text>}

      {/* Save Button or Loading Indicator */}
      <View style={styles.buttonContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colorsToUse.secondary} /> // Use final styles
        ) : (
          <Pressable
            onPress={handleSave}
            disabled={isLoading}
            style={({pressed}) => [
              styles.saveButton,
              pressed && styles.buttonPressed,
              isLoading && styles.buttonDisabled,
            ]}
            android_ripple={{color: colorsToUse.text.light}}>
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update Item' : 'Add Item'}
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
};

// --- Styles Definition (using the determined *ToUse variables) ---
const styles = StyleSheet.create({
  container: {
    ...commonStylesToUse.container, // Spread final common styles
    flexGrow: 1,
  },
  formGroup: {
    marginBottom: 25,
  },
  label: {
    fontFamily: typographyToUse.fontFamily.medium,
    fontSize: typographyToUse.fontSize.body,
    color: colorsToUse.text.primary, // Use final styles
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderColor: colorsToUse.primary, // Use final styles
    borderWidth: 1,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: colorsToUse.text.light, // Use final styles
    fontSize: typographyToUse.fontSize.button,
    fontFamily: typographyToUse.fontFamily.regular,
    color: colorsToUse.text.primary, // Use final styles
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: colorsToUse.primary, // Use final styles
    backgroundColor: colorsToUse.text.light, // Use final styles
    borderRadius: 8,
  },
  categoryButtonSelected: {
    borderColor: colorsToUse.secondary, // Use final styles
    backgroundColor: colorsToUse.background, // Use final styles
  },
  categoryButtonText: {
    fontFamily: typographyToUse.fontFamily.medium,
    fontSize: typographyToUse.fontSize.body,
    color: colorsToUse.text.secondary, // Use final styles
    marginLeft: 8,
  },
  categoryButtonTextSelected: {
    color: colorsToUse.primary, // Use final styles
    fontWeight: '600',
  },
  errorText: {
    fontFamily: typographyToUse.fontFamily.regular,
    fontSize: typographyToUse.fontSize.body,
    color: colorsToUse.status.error, // Use final styles
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 30,
  },
  saveButton: {
    backgroundColor: colorsToUse.secondary, // Use final styles
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...commonStylesToUse.shadow, // Spread final shadow styles
  },
  saveButtonText: {
    fontFamily: typographyToUse.fontFamily.bold,
    fontSize: typographyToUse.fontSize.button,
    color: colorsToUse.text.light, // Use final styles
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default AddEditItemScreen;
