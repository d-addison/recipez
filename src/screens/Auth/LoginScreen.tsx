import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { ROUTES } from '../../constants/routes';
import type { LoginScreenProps } from '../../navigation/navigationTypes';
import { useAuthStore } from '../../store/authStore';

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Get state and actions from Zustand store
  const { login, isLoading, error } = useAuthStore(state => ({
      login: state.login,
      isLoading: state.isLoading,
      error: state.error,
  }));

  const handleLogin = async () => {
    // Basic validation
    if (!email.trim() || !password.trim()) {
        Alert.alert("Error", "Please enter both email and password.");
        return;
    }
    // Call the login action from the store
    const success = await login(email, password);
    if (!success) {
        // Error is set in the store, but show an alert for immediate feedback
        // Access the latest error state directly from the store if needed
        const currentError = useAuthStore.getState().error;
        Alert.alert("Login Failed", currentError || "An unknown error occurred.");
    }
    // Navigation is handled automatically by the AppNavigator based on auth state change
  };

  const goToSignUp = () => {
    navigation.navigate(ROUTES.SIGNUP); // Navigate to the SignUp screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Login to RecipEz</Text>

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor="#9CA3AF" // Gray 400
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry // Hides password input
      />

      {/* Display error message from the store */}
      {error && !isLoading && <Text style={styles.errorText}>{error}</Text>}

      {/* Show ActivityIndicator while loading */}
      {isLoading ? (
           <ActivityIndicator size="large" color="#34D399" style={styles.loader}/>
       ) : (
           <>
            {/* Primary login button */}
            <TouchableOpacity style={styles.buttonPrimary} onPress={handleLogin} disabled={isLoading}>
                <Text style={styles.buttonTextPrimary}>Login</Text>
            </TouchableOpacity>

            {/* Secondary action link */}
            <TouchableOpacity style={styles.buttonSecondary} onPress={goToSignUp} disabled={isLoading}>
                <Text style={styles.buttonTextSecondary}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
           </>
       )}
    </View>
  );
};

// Styles using StyleSheet for better organization and performance
const styles = StyleSheet.create({
  container: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 30,
      backgroundColor: '#F5F5F7' // Light Gray background
    },
  title: {
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
      color: '#1F2937' // Dark Gray
    },
  subtitle: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 40,
      color: '#6B7280' // Medium Gray
  },
  input: {
      height: 50,
      borderColor: '#D1D5DB', // Gray 300
      borderWidth: 1,
      marginBottom: 15,
      paddingHorizontal: 15,
      borderRadius: 8,
      backgroundColor: '#FFFFFF', // White
      fontSize: 16,
      color: '#1F2937'
    },
  errorText: {
      color: '#DC2626', // Red 600
      textAlign: 'center',
      marginBottom: 10,
      fontSize: 14
    },
  loader: {
      marginTop: 20, // Give space when loading indicator shows
      marginBottom: 76 // Approximate space taken by buttons
  },
  buttonPrimary: {
      backgroundColor: '#34D399', // Primary Green
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 15,
      marginTop: 10, // Space above button
  },
  buttonTextPrimary: {
      color: '#FFFFFF', // White
      fontSize: 16,
      fontWeight: '600',
  },
  buttonSecondary: {
      paddingVertical: 10, // Less padding for secondary action
      alignItems: 'center',
  },
  buttonTextSecondary: {
      color: '#34D399', // Primary Green
      fontSize: 14,
      fontWeight: '500',
  }
});

export default LoginScreen;