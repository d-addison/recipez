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
} from 'react-native';
import type {SignUpScreenProps} from '../../navigation/navigationTypes';
import {useAuthStore} from '../../store/authStore';
import {ROUTES} from '../../constants/routes';

const SignUpScreen: React.FC<SignUpScreenProps> = ({navigation}) => {
  // State for form inputs
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Get state and actions from Zustand store
  const {signup, isLoading, error} = useAuthStore(state => ({
    signup: state.signup,
    isLoading: state.isLoading,
    error: state.error,
  }));

  const handleSignUp = async () => {
    // --- Input Validation ---
    if (
      !displayName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(
        'Password Mismatch',
        'The passwords you entered do not match.',
      );
      return;
    }
    if (username.includes(' ') || username !== username.toLowerCase()) {
      Alert.alert(
        'Invalid Username',
        'Username must be lowercase and contain no spaces.',
      );
      return;
    }
    // TODO: Add more robust validation if needed (e.g., email format, password strength)
    // A username uniqueness check ideally requires a separate async validation against Firestore.

    // --- Call Signup Action ---
    const success = await signup(
      displayName.trim(),
      username.trim(),
      email.trim(),
      password,
    );

    if (!success) {
      // Show specific error from the store if available
      const currentError = useAuthStore.getState().error;
      Alert.alert(
        'Sign Up Failed',
        currentError || 'An unknown error occurred during sign up.',
      );
    }
    // Navigation is handled by AppNavigator based on auth state changes
  };

  // Function to navigate back to Login screen
  const goToLogin = () => {
    navigation.goBack(); // Go back to the previous screen (Login)
  };

  return (
    // Use ScrollView to prevent inputs being hidden by keyboard
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join RecipEz!</Text>

      {/* Input Fields */}
      <TextInput
        style={styles.input}
        placeholder="Display Name"
        placeholderTextColor="#9CA3AF"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Username (lowercase, no spaces)"
        placeholderTextColor="#9CA3AF"
        value={username}
        // Automatically format username: lowercase, no spaces
        onChangeText={text =>
          setUsername(text.toLowerCase().replace(/\s/g, ''))
        }
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor="#9CA3AF"
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
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#9CA3AF"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {/* Display error message */}
      {error && !isLoading && <Text style={styles.errorText}>{error}</Text>}

      {/* Loading Indicator or Buttons */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#34D399" style={styles.loader} />
      ) : (
        <>
          {/* Primary sign up button */}
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={handleSignUp}
            disabled={isLoading}>
            <Text style={styles.buttonTextPrimary}>Sign Up</Text>
          </TouchableOpacity>

          {/* Secondary action link */}
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={goToLogin}
            disabled={isLoading}>
            <Text style={styles.buttonTextSecondary}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

// Styles (Similar to Login for consistency)
const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Needed for ScrollView content to fill
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40, // Add vertical padding
    backgroundColor: '#F5F5F7',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#6B7280',
  },
  input: {
    height: 50,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#1F2937',
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  loader: {
    marginTop: 20,
    marginBottom: 76, // Approximate space for buttons
  },
  buttonPrimary: {
    backgroundColor: '#34D399',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonTextSecondary: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SignUpScreen;
