import {getAuth} from '@react-native-firebase/auth';
import {getFirestore} from '@react-native-firebase/firestore';
import {getFunctions} from '@react-native-firebase/functions';

console.log('Firebase service module loaded (Modular).');

// Initialize and export the service instances using modular functions
export const firebaseAuth = getAuth();
export const firebaseFirestore = getFirestore();
// Optionally specify region if needed: getFunctions(undefined, 'your-region')
export const firebaseFunctions = getFunctions();
