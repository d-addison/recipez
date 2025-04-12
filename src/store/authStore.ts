import {create} from 'zustand';
import type {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {UserProfile} from '../types'; // Import UserProfile type
import {
  loginWithEmail,
  signUpWithEmail,
  logout as logoutService, // renamed to avoid conflict
  onAuthStateChangedWrapper,
  getUserProfile,
  createDefaultBoard,
} from '../services/authService'; // Add new service imports
import {useInventoryStore} from './inventoryStore'; // Import inventory store

interface AuthState {
  firebaseUser: FirebaseAuthTypes.User | null; // Renamed for clarity
  userProfile: UserProfile | null; // Added profile data
  isLoading: boolean;
  error: string | null;
  setFirebaseUser: (user: FirebaseAuthTypes.User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void; // Added setter
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  checkAuthState: () => () => void; // Returns unsubscribe function
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    displayName: string,
    username: string,
    email: string,
    password: string,
  ) => Promise<boolean>; // Added profile fields
  logout: () => Promise<void>;
  fetchUserProfile: (uid: string) => Promise<void>; // Added action
}

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  userProfile: null, // Initialize profile as null
  isLoading: true, // Start loading initially
  error: null,
  setFirebaseUser: user => set({firebaseUser: user}),
  setUserProfile: profile => set({userProfile: profile}), // Setter implementation
  setLoading: loading => set({isLoading: loading}),
  setError: error => set({error, isLoading: false}),

  checkAuthState: () => {
    console.log('Setting up Auth Listener...');
    set({isLoading: true});
    const unsubscribe = onAuthStateChangedWrapper(async fbUser => {
      console.log('Auth State Changed:', fbUser?.uid ?? 'No User');
      set({firebaseUser: fbUser});
      if (fbUser) {
        await get().fetchUserProfile(fbUser.uid); // Fetch profile when auth state confirms user
      } else {
        set({userProfile: null}); // Clear profile on logout
        useInventoryStore.getState().clearInventoryState(); // Clear inventory on logout
      }
      // Set loading false only after potential profile fetch attempt completes
      set({isLoading: false});
    });
    return unsubscribe; // Return the unsubscribe function for cleanup
  },

  fetchUserProfile: async (uid: string) => {
    console.log('Fetching user profile for:', uid);
    // Avoid fetching if already loaded unless forced? For now, always fetch on checkAuthState.
    try {
      const profile = await getUserProfile(uid);
      if (profile) {
        console.log('User profile fetched:', profile.username);
        set({userProfile: profile});
      } else {
        console.warn('User profile fetch returned null for uid:', uid);
        // This might happen during signup before profile is fully created, handle gracefully
        // Or if data is missing in Firestore. Might need recovery/logout logic here.
        set({userProfile: null, error: 'User profile not found.'});
      }
    } catch (fetchError: any) {
      console.error('Error fetching user profile:', fetchError);
      set({error: 'Failed to load user profile.'});
      // Maybe force logout if profile is essential
      // await get().logout();
    }
  },

  login: async (email, password) => {
    set({isLoading: true, error: null});
    try {
      await loginWithEmail(email, password);
      // Auth state listener will handle fetching profile and setting user
      return true;
    } catch (loginError: any) {
      console.error('Login error:', loginError);
      const message = loginError.message || 'Failed to login';
      set({error: message, isLoading: false});
      return false;
    }
  },

  signup: async (displayName, username, email, password) => {
    set({isLoading: true, error: null});
    try {
      // 1. Create Firebase Auth user
      const userCredential = await signUpWithEmail(email, password);
      const fbUser = userCredential.user;
      if (!fbUser) {
        throw new Error('Signup failed: No user created.');
      }

      // 2. Create Default Board
      const defaultBoardId = await createDefaultBoard(fbUser.uid);
      // createDefaultBoard now throws on error, no need to check null

      // 3. Create User Profile in Firestore
      const profileData: Omit<UserProfile, 'uid' | 'createdAt'> = {
        email: fbUser.email,
        username: username.toLowerCase().trim(), // Ensure lowercase and trimmed
        displayName: displayName.trim(),
        defaultBoardId: defaultBoardId,
      };
      // getUserProfile service function handles the creation if it doesn't exist
      await getUserProfile(fbUser.uid, profileData);

      // Auth listener should pick up the new user and profile eventually.
      return true;
    } catch (signupError: any) {
      console.error('Signup error:', signupError);
      // TODO: Consider cleaning up auth user if Firestore profile/board creation fails
      const message = signupError.message || 'Failed to signup';
      set({error: message, isLoading: false});
      return false;
    }
  },

  logout: async () => {
    console.log('Initiating logout action...');
    set({isLoading: true});
    try {
      await logoutService(); // Call the renamed service function
      // Listener will set firebaseUser and userProfile to null
    } catch (logoutError: any) {
      console.error('Logout error:', logoutError);
      const message = logoutError.message || 'Failed to logout';
      set({error: message});
    } finally {
      set({isLoading: false});
    }
  },
}));
