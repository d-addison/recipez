import { firebaseAuth, firebaseFirestore } from './firebase';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore'; // Import Firestore package for types
import { UserProfile, Board } from '../types';

// --- Authentication Functions ---

export const loginWithEmail = async (email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> => {
  console.log('Attempting login for:', email);
  try {
      return await firebaseAuth.signInWithEmailAndPassword(email, password);
  } catch (error: any) {
      console.error("Firebase Login Error:", error.code, error.message);
      // Provide more user-friendly messages based on error codes
      let friendlyMessage = "Login failed. Please check your credentials.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          friendlyMessage = "Invalid email or password.";
      } else if (error.code === 'auth/invalid-email') {
          friendlyMessage = "Please enter a valid email address.";
      }
      throw new Error(friendlyMessage); // Rethrow a cleaner error
  }
};

export const signUpWithEmail = async (email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> => {
  console.log('Attempting signup for:', email);
   try {
      return await firebaseAuth.createUserWithEmailAndPassword(email, password);
   } catch (error: any) {
        console.error("Firebase Signup Error:", error.code, error.message);
        let friendlyMessage = "Signup failed. Please try again.";
        if (error.code === 'auth/email-already-in-use') {
          friendlyMessage = 'This email address is already registered.';
        } else if (error.code === 'auth/invalid-email') {
          friendlyMessage = 'Please enter a valid email address.';
        } else if (error.code === 'auth/weak-password') {
          friendlyMessage = 'Password is too weak. Please choose a stronger password.';
        }
        throw new Error(friendlyMessage); // Rethrow
   }
};

export const logout = async (): Promise<void> => {
  console.log('Attempting logout');
  try {
     await firebaseAuth.signOut();
  } catch (error: any) {
      console.error("Firebase Logout Error:", error.code, error.message);
      throw new Error(error.message || "Logout failed"); // Rethrow
  }
};

export const onAuthStateChangedWrapper = (
  callback: (user: FirebaseAuthTypes.User | null) => void
): (() => void) => { // Returns the unsubscribe function
  console.log('Setting up auth state listener');
  return firebaseAuth.onAuthStateChanged(callback);
};


// --- User Profile Functions ---

const getUserDocRef = (userId: string) => {
  return firebaseFirestore.collection('users').doc(userId);
}

// Gets profile, OR creates it if initialData is provided and it doesn't exist
export const getUserProfile = async (userId: string, initialData?: Omit<UserProfile, 'uid' | 'createdAt'>): Promise<UserProfile | null> => {
    const userDocRef = getUserDocRef(userId);
    console.log(`Getting profile for ${userId}, initialData provided: ${!!initialData}`);
    try {
        const docSnap = await userDocRef.get();
        if (docSnap.exists()) {
            console.log(`Profile found for ${userId}`);
            const data = docSnap.data() as any; // Cast to any for easier access initially
            return {
                uid: userId,
                email: data.email || null,
                username: data.username || '',
                displayName: data.displayName || '',
                profilePictureUrl: data.profilePictureUrl || null,
                bio: data.bio || null,
                defaultBoardId: data.defaultBoardId || '', // Important!
                createdAt: (data.createdAt as firestore.Timestamp)?.toDate() ?? new Date(), // Handle timestamp
            } as UserProfile;
        } else if (initialData) {
            console.log(`Creating user profile for ${userId}`);
            // TODO: Add check for username uniqueness before setting (requires query/Cloud Function)
            const profileToCreate = {
                ...initialData,
                createdAt: firestore.FieldValue.serverTimestamp(),
            };
            await userDocRef.set(profileToCreate);
            console.log(`Profile created for ${userId}`);
            // Re-fetch to get resolved timestamp (or construct object)
             return {
                uid: userId,
                ...initialData,
                createdAt: new Date(), // Use current date as approximation before server resolves
             } as UserProfile;
        } else {
             console.warn(`User profile not found for ${userId} and no initial data provided.`);
             return null; // User exists in Auth but not Firestore, and not signing up
        }
    } catch (error) {
        console.error(`Error getting/creating user profile ${userId}:`, error);
        throw new Error("Failed to load or create user profile.");
    }
};

// --- Default Board Creation ---

export const createDefaultBoard = async (userId: string): Promise<string> => {
    const boardData: Omit<Board, 'id' | 'createdAt'> = {
        ownerUserId: userId,
        boardName: "My Saved Recipes", // Default name
        isPublic: false, // Default private
    };
    try {
        const boardRef = await firebaseFirestore.collection('boards').add({
            ...boardData,
            createdAt: firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Created default board ${boardRef.id} for user ${userId}`);
        return boardRef.id;
    } catch (error) {
        console.error(`Error creating default board for user ${userId}:`, error);
        throw new Error("Failed to create default recipe board during signup.");
    }
};