module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Make sure plugins is an array
    [
      // Add this block for react-native-dotenv
      'module:react-native-dotenv',
      {
        envName: 'APP_ENV',
        moduleName: '@env', // How you'll import it (e.g., import { API_KEY } from '@env')
        path: '.env',
        // Optional: Allowlist/Blocklist specific variables
        // allowlist: null,
        // blocklist: null,
        // allowUndefined: true, // Set to true if you want undefined vars to not throw errors
      },
    ],
    // ... other plugins like 'react-native-reanimated/plugin' if you use it
  ],
};
