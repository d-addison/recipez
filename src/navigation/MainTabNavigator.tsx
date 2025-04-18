import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import InventoryScreen from '../screens/Inventory/InventoryScreen';
import GenerateRecipeScreen from '../screens/Generation/GenerateRecipeScreen';
import RecipeBookScreen from '../screens/RecipeBook/RecipeBookScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import {ROUTES} from '../constants/routes';
import type {MainTabParamList} from './navigationTypes';
import Icon from 'react-native-vector-icons/Ionicons'; // Example icon library

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  // Define Icon colors directly or use theme context later
  const activeColor = '#34D399'; // Example: Primary Accent
  const inactiveColor = '#94A3B8'; // Example: Secondary Accent

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName = 'alert-circle-outline'; // Default icon

          if (route.name === ROUTES.INVENTORY) {
            iconName = focused ? 'list-circle' : 'list-circle-outline';
          } else if (route.name === ROUTES.GENERATE_RECIPE) {
            iconName = focused ? 'bulb' : 'bulb-outline';
          } else if (route.name === ROUTES.RECIPE_BOOK) {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === ROUTES.SETTINGS) {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          // You can return any component that you like here!
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: true, // Show headers per tab by default
        headerTitleStyle: {
          // Basic header title styling
          fontWeight: '600',
          color: '#1F2937',
        },
        headerStyle: {
          // Basic header styling
          borderBottomWidth: 1,
          borderBottomColor: '#F5F5F7',
        },
      })}>
      <Tab.Screen
        name={ROUTES.INVENTORY}
        component={InventoryScreen}
        options={{title: 'My Kitchen'}}
      />
      <Tab.Screen
        name={ROUTES.GENERATE_RECIPE}
        component={GenerateRecipeScreen}
        options={{title: 'Generate'}}
      />
      <Tab.Screen
        name={ROUTES.RECIPE_BOOK}
        component={RecipeBookScreen}
        options={{title: 'Recipe Book'}}
      />
      <Tab.Screen name={ROUTES.SETTINGS} component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
