import React, {useState} from 'react';
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
  Platform,
} from 'react-native';
// Using react-native-picker/picker is a common choice
import {Picker} from '@react-native-picker/picker';
import {useRecipeStore} from '../../store/recipeStore';
import type {GenerateRecipeScreenProps} from '../../navigation/navigationTypes';
import {ROUTES} from '../../constants/routes';

// Time constraint options for the picker
const timeOptions = [
  {label: 'Any Time Available', value: 'any'},
  {label: 'Under 15 Minutes', value: '<15m'},
  {label: '15 - 30 Minutes', value: '15-30m'},
  {label: '30 - 60 Minutes', value: '30-60m'},
  {label: 'Over 60 Minutes', value: '>60m'},
];

const GenerateRecipeScreen: React.FC<GenerateRecipeScreenProps> = ({
  navigation,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedTime, setSelectedTime] = useState<string>('any'); // Default to 'any'

  // Get state and actions from recipe store
  const {generateRecipe, isLoading, error} = useRecipeStore(state => ({
    generateRecipe: state.generateRecipe,
    isLoading: state.isLoading,
    error: state.error,
  }));

  // Handle the generation process
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert(
        'Input Needed',
        'Please describe what you want to make, including key ingredients you want to use!',
      );
      return;
    }

    // Call the generateRecipe action from the store
    const success = await generateRecipe(prompt, selectedTime);

    // Check the store state *after* the promise resolves
    const recipeResult = useRecipeStore.getState().generatedRecipe;
    const generationError = useRecipeStore.getState().error;

    if (success && recipeResult) {
      // Navigate to display screen on success
      navigation.navigate(ROUTES.RECIPE_DISPLAY, {recipe: recipeResult});
      // Optionally clear the form
      // setPrompt('');
      // setSelectedTime('any');
    } else {
      // Show error if generation failed
      Alert.alert(
        'Generation Failed',
        generationError ||
          'Could not generate recipe. Please check your prompt or try again later.',
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Prompt Input Area */}
      <Text style={styles.label}>Describe Your Recipe Request</Text>
      <Text style={styles.subLabel}>
        Include ingredients you want to use, meal type, number of people, etc.
      </Text>
      <TextInput
        style={styles.textArea}
        placeholder="e.g., Easy weeknight dinner for 2 using the chicken thighs and broccoli from my fridge."
        placeholderTextColor="#9CA3AF"
        value={prompt}
        onChangeText={setPrompt}
        multiline
        numberOfLines={5} // Suggest number of lines
      />

      {/* Time Constraint Picker */}
      <Text style={styles.label}>Max Cooking Time</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedTime}
          onValueChange={itemValue => setSelectedTime(itemValue)}
          style={styles.picker} // Apply style to picker itself
          itemStyle={styles.pickerItem} // Style for individual items (iOS)
        >
          {timeOptions.map(opt => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>

      {/* Display error if exists */}
      {error && !isLoading && <Text style={styles.errorText}>{error}</Text>}

      {/* Generate Button or Loading Indicator */}
      <View style={styles.buttonContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#34D399" />
        ) : (
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerate}
            disabled={isLoading}>
            <Text style={styles.generateButtonText}>Generate Recipe</Text>
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
    backgroundColor: '#FFFFFF', // White background
  },
  label: {
    fontSize: 16,
    fontWeight: '600', // Semibold
    color: '#1F2937', // Dark Gray
    marginBottom: 8,
    marginTop: 15,
  },
  subLabel: {
    fontSize: 13,
    color: '#6B7280', // Medium Gray
    marginBottom: 15,
  },
  textArea: {
    minHeight: 120, // Make textarea taller
    borderColor: '#D1D5DB', // Gray 300
    borderWidth: 1,
    marginBottom: 25,
    paddingTop: 15, // Add padding inside text area
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#F9FAFB', // Light input background
    textAlignVertical: 'top', // Align placeholder text top
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22, // Improve readability
  },
  pickerContainer: {
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#D1D5DB', // Gray 300
    borderRadius: 8,
    backgroundColor: '#F9FAFB', // Light input background
    overflow: 'hidden', // Clip picker corners on Android
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 50, // iOS needs height for the wheel
    width: '100%',
    color: '#1F2937',
  },
  pickerItem: {
    // Style for iOS picker items if needed
    height: 180, // Match picker height for iOS wheel
  },
  loader: {
    marginTop: 30, // Space when loading indicator shows
  },
  errorText: {
    color: '#DC2626', // Red 600
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 'auto', // Push button towards bottom if content is short
    paddingTop: 20,
  },
  generateButton: {
    backgroundColor: '#34D399', // Primary Green
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: '#FFFFFF', // White
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GenerateRecipeScreen;
