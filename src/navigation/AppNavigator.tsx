import React, {useEffect} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {ActivityIndicator, View, StyleSheet} from 'react-native';

import AuthNavigator from './AuthNavigator'; // Handles Login/Signup stack
import MainTabNavigator from './MainTabNavigator'; // The bottom tabs
import AddEditItemScreen from '../screens/Inventory/AddEditItemScreen'; // Screens pushed over tabs
import RecipeDisplayScreen from '../screens/Generation/RecipeDisplayScreen';

import {useAuthStore} from '../store/authStore'; // Import auth store hook
import {ROUTES} from '../constants/routes';
import type {AppStackParamList, MainStackParamList} from './navigationTypes';

const AppStack = createStackNavigator<AppStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>(); // Separate stack for screens over tabs

/**
 * Main Navigator component includes the Bottom Tab Navigator
 * and any screens that should be pushed on top of the tabs.
 */
const MainNavigator = () => {
  return (
    <MainStack.Navigator /* screenOptions={{ headerShown: false }} // Set header options per screen below */
    >
      {/* The Tab Navigator is the primary screen in this stack */}
      <MainStack.Screen
        name={ROUTES.MAIN_TAB_NAVIGATOR}
        component={MainTabNavigator}
        options={{headerShown: false}} // Hide header for the tab navigator itself
      />
      {/* Screens accessible when logged in, pushed over tabs */}
      <MainStack.Screen
        name={ROUTES.ADD_EDIT_ITEM}
        component={AddEditItemScreen}
        options={{
          headerShown: true,
          title: 'Add/Edit Item', // Title set dynamically in screen, this is fallback
          headerBackTitleVisible: false, // Common iOS pattern
          headerTintColor: '#1F2937', // Example color for back arrow/title
        }}
      />
      <MainStack.Screen
        name={ROUTES.RECIPE_DISPLAY}
        component={RecipeDisplayScreen}
        options={{
          headerShown: true,
          // Title is set dynamically in the screen component based on recipe
          headerBackTitleVisible: false,
          headerTintColor: '#1F2937',
          // Save button added dynamically in screen component headerRight
        }}
      />
    </MainStack.Navigator>
  );
};

/**
 * Root navigator that decides whether to show Authentication screens
 * or the main application screens (including potential onboarding).
 */
const AppNavigator = () => {
  // Get required state and actions from the Zustand auth store
  const {firebaseUser, isLoading, checkAuthState, userProfile} = useAuthStore();

  useEffect(() => {
    console.log('AppNavigator Mounted: Setting up Auth Listener...');
    // Setup the auth state listener when the app mounts.
    // Returns an unsubscribe function for cleanup.
    const unsubscribe = checkAuthState();

    // Cleanup listener on component unmount
    return () => {
      console.log('AppNavigator Unmounted: Cleaning up auth listener...');
      unsubscribe();
    };
    // checkAuthState function reference is stable, so only run once on mount
  }, [checkAuthState]);

  // Show loading indicator while the initial auth state is being determined
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34D399" />
      </View>
    );
  }

  // TODO V1+: Add Onboarding Check Here
  // Example: Fetch onboarding status with userProfile or from AsyncStorage
  // const isOnboardingComplete = userProfile?.onboardingComplete ?? false;
  const isOnboardingComplete = true; // Assume complete for V1 initial build

  return (
    // The root navigator container
    <AppStack.Navigator screenOptions={{headerShown: false}}>
      {!firebaseUser ? (
        // CASE 1: No user logged in -> Show Authentication Stack
        <AppStack.Screen name={ROUTES.AUTH_STACK} component={AuthNavigator} />
      ) : !isOnboardingComplete ? (
        // CASE 2: User logged in BUT onboarding not complete -> Show Onboarding (Not implemented)
        // This branch is currently unused as isOnboardingComplete is hardcoded to true.
        // Replace with your Onboarding Navigator when ready.
        // <AppStack.Screen name={ROUTES.ONBOARDING_STACK} component={OnboardingNavigator} />
        <AppStack.Screen name={ROUTES.MAIN_STACK} component={MainNavigator} /> // Fallback to main for now
      ) : (
        // CASE 3: User logged in AND onboarding complete -> Show Main App Stack
        <AppStack.Screen name={ROUTES.MAIN_STACK} component={MainNavigator} />
      )}
    </AppStack.Navigator>
  );
};

// Basic styles for the loading container
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Use a neutral background
  },
});

export default AppNavigator;
