import {Timestamp} from 'firebase/firestore';

export type InventoryCategory = 'fridge' | 'pantry' | 'freezer' | 'tools';

export interface InventoryItem {
  id: string; // Firestore document ID
  name: string;
  quantity: string;
  category: InventoryCategory;
  createdAt: Timestamp;
}
