export const ROUTES = {
    // Navigators
    AUTH_NAVIGATOR: 'AuthNavigator',
    MAIN_STACK_NAVIGATOR: 'MainStackNavigator', // Changed name for clarity
    MAIN_TAB_NAVIGATOR: 'MainTabNavigator',
  
    // Auth Screens
    LOGIN: 'Login',
    SIGNUP: 'SignUp',
  
    // Main Tab Screens
    INVENTORY: 'Inventory',
    GENERATE_RECIPE: 'GenerateRecipe',
    RECIPE_BOOK: 'RecipeBook',
    SETTINGS: 'Settings',
  
    // Other Screens (pushed onto Main Stack)
    ADD_EDIT_ITEM: 'AddEditItem',
    RECIPE_DISPLAY: 'RecipeDisplay',
  
     // App Stack Screens (Root)
     AUTH_STACK: 'Auth',
     MAIN_STACK: 'Main',
     // ONBOARDING_STACK: 'Onboarding' // For future
  };