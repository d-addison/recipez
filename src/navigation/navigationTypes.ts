import type {StackScreenProps} from '@react-navigation/stack';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import {ROUTES} from '../constants/routes';
import {InventoryItem, RecipeData} from '../types';

// --- Param Lists ---

// Auth Stack (Login, Signup)
export type AuthStackParamList = {
  [ROUTES.LOGIN]: undefined;
  [ROUTES.SIGNUP]: undefined;
};

// Main Tab Navigator (Inventory, Generate, Book, Settings)
export type MainTabParamList = {
  [ROUTES.INVENTORY]: undefined;
  [ROUTES.GENERATE_RECIPE]: undefined;
  [ROUTES.RECIPE_BOOK]: undefined;
  [ROUTES.SETTINGS]: undefined;
};

// Main Stack (The Tabs Navigator + Screens pushed over tabs like AddEditItem, RecipeDisplay)
export type MainStackParamList = {
  [ROUTES.MAIN_TAB_NAVIGATOR]: NavigatorScreenParams<MainTabParamList>; // The nested tabs
  [ROUTES.ADD_EDIT_ITEM]: {item?: InventoryItem}; // Optional item for editing
  [ROUTES.RECIPE_DISPLAY]: {recipe: RecipeData}; // Pass generated recipe data
};

// App Stack (Root: Switches between Auth and Main)
export type AppStackParamList = {
  [ROUTES.AUTH_STACK]: NavigatorScreenParams<AuthStackParamList>;
  [ROUTES.MAIN_STACK]: NavigatorScreenParams<MainStackParamList>;
  // [ROUTES.ONBOARDING_STACK]: undefined; // Future
};

// --- Screen Prop Types ---

// Auth Screens
export type LoginScreenProps = CompositeScreenProps<
  StackScreenProps<AuthStackParamList, typeof ROUTES.LOGIN>,
  StackScreenProps<AppStackParamList>
>;
export type SignUpScreenProps = CompositeScreenProps<
  StackScreenProps<AuthStackParamList, typeof ROUTES.SIGNUP>,
  StackScreenProps<AppStackParamList>
>;

// Main Tab Screens (Combine with MainStack for navigation capabilities)
export type InventoryScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, typeof ROUTES.INVENTORY>,
  StackScreenProps<MainStackParamList>
>;
export type GenerateRecipeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, typeof ROUTES.GENERATE_RECIPE>,
  StackScreenProps<MainStackParamList>
>;
export type RecipeBookScreenProps = BottomTabScreenProps<
  MainTabParamList,
  typeof ROUTES.RECIPE_BOOK
>;
export type SettingsScreenProps = BottomTabScreenProps<
  MainTabParamList,
  typeof ROUTES.SETTINGS
>;

// Screens pushed onto Main Stack
export type AddEditItemScreenProps = StackScreenProps<
  MainStackParamList,
  typeof ROUTES.ADD_EDIT_ITEM
>;
export type RecipeDisplayScreenProps = StackScreenProps<
  MainStackParamList,
  typeof ROUTES.RECIPE_DISPLAY
>;
