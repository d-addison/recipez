import firebase from '@react-native-firebase/app'; // Default import often works
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';

// Ensure Firebase is initialized (usually done automatically via config files)
if (firebase.apps.length === 0) {
  firebase.initializeApp(); // Potentially needed in some edge cases
}

// Export the service instances
export const firebaseAuth = auth();
export const firebaseFirestore = firestore();
export const firebaseFunctions = functions(); // Optionally specify region if needed: functions('your-region')

// Optional: Configure Firestore settings (e.g., persistence)
firebaseFirestore.settings({
  persistence: true, // Enable offline persistence
  // cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED, // Optional: Adjust cache size
});
