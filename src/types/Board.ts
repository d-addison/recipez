import firestore from '@react-native-firebase/firestore';

export interface Board {
  id: string; // Firestore document ID
  ownerUserId: string;
  boardName: string;
  isPublic: boolean;
  createdAt: Date | firestore.Timestamp;
  // description, coverImageUrl, recipeCount, followerCount added later
}