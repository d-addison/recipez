import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppNavigator} from './src/navigation';
import {StatusBar, LogBox} from 'react-native';
import {useAuthStore} from './src/store/authStore'; // Import store

// Optional: Ignore specific warnings if necessary (use sparingly)
LogBox.ignoreLogs([
  'Warning: TextInput.Icon needs testing implementation', // Example
]);

// Configure default status bar style globally
StatusBar.setBarStyle('dark-content'); // Or 'light-content' depending on default theme

const App = () => {
  // Get the checkAuthState function from the store
  const checkAuthState = useAuthStore(state => state.checkAuthState);

  useEffect(() => {
    // Setup the auth listener when the app mounts
    const unsubscribe = checkAuthState();
    // Clean up the listener when the app unmounts
    return () => {
      console.log('Cleaning up auth listener...');
      unsubscribe();
    };
  }, [checkAuthState]); // Dependency array ensures it runs once

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
