import {Timestamp} from 'firebase/firestore';

export interface Board {
  id: string; // Firestore document ID
  ownerUserId: string;
  boardName: string;
  isPublic: boolean;
  createdAt: Timestamp;
  // description, coverImageUrl, recipeCount, followerCount added later
}
