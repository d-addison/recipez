import firestore from '@react-native-firebase/firestore';

export interface UserProfile {
  uid: string; // From Auth, matches document ID
  email: string | null;
  username: string; // User-chosen unique handle
  displayName: string;
  profilePictureUrl?: string | null;
  bio?: string | null;
  defaultBoardId: string; // ID of the user's default "My Saved Recipes" board
  createdAt: Date | firestore.Timestamp; // Can be Date or Timestamp type
  // Counts etc will be added later
}