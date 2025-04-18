import {firebaseAuth, firebaseFirestore} from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type FirebaseAuthTypes, // Import the main types namespace
} from '@react-native-firebase/auth';
import {
  collection,
  doc, // Import doc
  getDoc, // Import getDoc
  setDoc, // Import setDoc
  addDoc, // Import addDoc
  Timestamp,
} from '@react-native-firebase/firestore';
import {UserProfile, Board} from '../types';

// --- Authentication Functions ---

export const loginWithEmail = async (
  email: string,
  password: string,
): Promise<FirebaseAuthTypes.UserCredential> => {
  // Revert type hint
  console.log('Attempting login for:', email);
  try {
    // Use modular function call
    return await signInWithEmailAndPassword(firebaseAuth, email, password);
  } catch (error: any) {
    console.error('Firebase Login Error:', error.code, error.message);
    // Provide more user-friendly messages based on error codes
    let friendlyMessage = 'Login failed. Please check your credentials.';
    if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/invalid-credential'
    ) {
      friendlyMessage = 'Invalid email or password.';
    } else if (error.code === 'auth/invalid-email') {
      friendlyMessage = 'Please enter a valid email address.';
    }
    throw new Error(friendlyMessage); // Rethrow a cleaner error
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string,
): Promise<FirebaseAuthTypes.UserCredential> => {
  // Revert type hint
  console.log('Attempting signup for:', email);
  try {
    // Use modular function call
    return await createUserWithEmailAndPassword(firebaseAuth, email, password);
  } catch (error: any) {
    console.error('Firebase Signup Error:', error.code, error.message);
    let friendlyMessage = 'Signup failed. Please try again.';
    if (error.code === 'auth/email-already-in-use') {
      friendlyMessage = 'This email address is already registered.';
    } else if (error.code === 'auth/invalid-email') {
      friendlyMessage = 'Please enter a valid email address.';
    } else if (error.code === 'auth/weak-password') {
      friendlyMessage =
        'Password is too weak. Please choose a stronger password.';
    }
    throw new Error(friendlyMessage); // Rethrow
  }
};

export const logout = async (): Promise<void> => {
  console.log('Attempting logout');
  try {
    // Use modular function call
    await signOut(firebaseAuth);
  } catch (error: any) {
    console.error('Firebase Logout Error:', error.code, error.message);
    throw new Error(error.message || 'Logout failed'); // Rethrow
  }
};

export const onAuthStateChangedWrapper = (
  callback: (user: FirebaseAuthTypes.User | null) => void, // Revert type hint
): (() => void) => {
  // Returns the unsubscribe function
  console.log('Setting up auth state listener');
  // Use modular function call
  return onAuthStateChanged(firebaseAuth, callback);
};

// --- User Profile Functions ---

const getUserDocRef = (userId: string) => {
  // Use modular doc() function
  return doc(collection(firebaseFirestore, 'users'), userId);
};

// Gets profile, OR creates it if initialData is provided and it doesn't exist
export const getUserProfile = async (
  userId: string,
  initialData?: Omit<UserProfile, 'uid' | 'createdAt'>,
): Promise<UserProfile | null> => {
  const userDocRef = getUserDocRef(userId);
  console.log(
    `Getting profile for ${userId}, initialData provided: ${!!initialData}`,
  );
  try {
    // Use modular getDoc()
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists) {
      // Check exists property
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
        // Keep createdAt as a Timestamp. Provide a fallback if it's missing.
        createdAt: (data.createdAt as Timestamp) ?? Timestamp.now(),
      } as UserProfile;
    } else if (initialData) {
      console.log(`Creating user profile for ${userId}`);
      // TODO: Add check for username uniqueness before setting (requires query/Cloud Function)
      const profileToCreate = {
        ...initialData,
        createdAt: Timestamp.now(),
      };
      // Use modular setDoc()
      await setDoc(userDocRef, profileToCreate);
      console.log(`Profile created for ${userId}`);
      // Re-fetch to get resolved timestamp (or construct object)
      return {
        uid: userId,
        ...initialData,
        // Use a client-side Timestamp as approximation before server resolves
        createdAt: Timestamp.now(),
      } as UserProfile;
    } else {
      console.warn(
        `User profile not found for ${userId} and no initial data provided.`,
      );
      return null; // User exists in Auth but not Firestore, and not signing up
    }
  } catch (error) {
    console.error(`Error getting/creating user profile ${userId}:`, error);
    throw new Error('Failed to load or create user profile.');
  }
};

// --- Default Board Creation ---

export const createDefaultBoard = async (userId: string): Promise<string> => {
  const boardData: Omit<Board, 'id' | 'createdAt'> = {
    ownerUserId: userId,
    boardName: 'My Saved Recipes', // Default name
    isPublic: false, // Default private
  };
  try {
    // Use modular addDoc() and collection()
    const boardRef = await addDoc(collection(firebaseFirestore, 'boards'), {
      ...boardData,
      createdAt: Timestamp.now(), // Set createdAt to now
    });
    console.log(`Created default board ${boardRef.id} for user ${userId}`);
    return boardRef.id;
  } catch (error) {
    console.error(`Error creating default board for user ${userId}:`, error);
    throw new Error('Failed to create default recipe board during signup.');
  }
};
