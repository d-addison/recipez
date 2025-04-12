// src/services/inventoryService.ts

import {firebaseFirestore} from './firebase'; // Import initialized Firestore instance
import {InventoryItem, InventoryCategory} from '../types'; // Import necessary types
import firestore from '@react-native-firebase/firestore'; // Import Firestore package for types like Timestamp and FieldValue

/**
 * Helper function to get the Firestore collection reference for a specific user's inventory.
 * @param userId - The authenticated user's ID.
 * @returns Firestore CollectionReference
 * @throws Error if userId is not provided.
 */
const getUserInventoryCollection = (
  userId: string,
) /* <-- No : TypeAnnotation */ => {
  if (!userId) {
    console.error('Attempted to get inventory collection without userId.');
    throw new Error('User ID is required to access inventory.');
  }
  // Path: /users/{userId}/inventory
  const collectionRef = firebaseFirestore // Assign to variable to easily check inferred type if needed
    .collection('users')
    .doc(userId)
    .collection('inventory');

  // Hover over collectionRef in VS Code to see the inferred type
  return collectionRef;
};

/**
 * Fetches all inventory items for a specific user, ordered by creation date descending.
 * @param userId - The authenticated user's ID.
 * @returns Promise<InventoryItem[]> - An array of inventory items.
 * @throws Error if fetching fails.
 */
export const fetchUserInventory = async (
  userId: string,
): Promise<InventoryItem[]> => {
  console.log('Service: Fetching inventory for user:', userId);
  try {
    // Get documents, order by 'createdAt' descending (most recent first)
    const snapshot = await getUserInventoryCollection(userId)
      .orderBy('createdAt', 'desc')
      .get();

    // Map Firestore documents to InventoryItem objects
    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      // Basic validation and default values
      const name =
        data.name && typeof data.name === 'string' ? data.name : 'Unnamed Item';
      const quantity =
        data.quantity && typeof data.quantity === 'string' ? data.quantity : '';
      const category =
        data.category && typeof data.category === 'string'
          ? (data.category as InventoryCategory)
          : 'pantry'; // Default to pantry
      const createdAt =
        data.createdAt instanceof firestore.Timestamp
          ? data.createdAt.toDate()
          : new Date(); // Convert Timestamp or use current date

      return {
        id: doc.id, // Use the document ID as the item ID
        name: name,
        quantity: quantity,
        category: category,
        createdAt: createdAt,
      };
    });
    console.log(`Service: Fetched ${items.length} inventory items.`);
    return items;
  } catch (error: any) {
    console.error(
      `Service Error: Fetching inventory for user ${userId}:`,
      error,
    );
    // Provide a more generic error message to the caller
    throw new Error('Failed to fetch your inventory items. Please try again.');
  }
};

/**
 * Adds a new inventory item to a user's collection in Firestore.
 * @param userId - The authenticated user's ID.
 * @param itemData - Object containing the new item's data (name, quantity, category).
 * @returns Promise<string> - The ID of the newly created Firestore document.
 * @throws Error if adding fails or required data is missing.
 */
export const addInventoryItem = async (
  userId: string,
  itemData: Omit<InventoryItem, 'id' | 'createdAt'>,
): Promise<string> => {
  console.log('Service: Adding item for user:', userId, itemData);
  // Validate required fields
  if (!itemData.name || !itemData.category) {
    console.error('Service Error: Missing name or category for new item.');
    throw new Error('Item name and category are required to add an item.');
  }

  // Prepare the data to be saved, ensuring quantity is at least an empty string
  const newItemData = {
    name: itemData.name.trim(), // Trim whitespace
    quantity: itemData.quantity?.trim() || '', // Trim or default to empty string
    category: itemData.category,
    createdAt: firestore.FieldValue.serverTimestamp(), // Use server timestamp for creation time
  };

  try {
    // Add the new document to the user's inventory subcollection
    const docRef = await getUserInventoryCollection(userId).add(newItemData);
    console.log(`Service: Item added successfully with ID: ${docRef.id}`);
    return docRef.id; // Return the new document ID
  } catch (error: any) {
    console.error(
      `Service Error: Adding inventory item for user ${userId}:`,
      error,
    );
    throw new Error('Failed to add the inventory item. Please try again.');
  }
};

/**
 * Updates specific fields of an existing inventory item in Firestore.
 * @param userId - The authenticated user's ID.
 * @param itemId - The ID of the inventory item document to update.
 * @param updatedData - An object containing the fields to update (e.g., { name: 'New Name', quantity: '1' }).
 * @returns Promise<void>
 * @throws Error if updating fails or no data is provided.
 */
export const updateInventoryItem = async (
  userId: string,
  itemId: string,
  updatedData: Partial<Omit<InventoryItem, 'id' | 'createdAt'>>, // Allow partial updates, exclude forbidden fields
): Promise<void> => {
  console.log(
    'Service: Updating item:',
    itemId,
    'for user:',
    userId,
    updatedData,
  );

  // Create a clean object with only the fields to update
  const dataToUpdate: {[key: string]: any} = {};
  if (updatedData.name !== undefined) {
    dataToUpdate.name = updatedData.name.trim();
  }
  if (updatedData.quantity !== undefined) {
    dataToUpdate.quantity = updatedData.quantity.trim();
  }
  if (updatedData.category !== undefined) {
    dataToUpdate.category = updatedData.category;
  }

  // Prevent update if no actual changes are provided
  if (Object.keys(dataToUpdate).length === 0) {
    console.warn(
      'Service Warning: Update called with no data fields to change.',
    );
    // Optionally throw an error or just return if no-op is acceptable
    // throw new Error("No fields provided to update.");
    return; // Exit function if nothing to update
  }

  // Optionally add an 'updatedAt' timestamp
  // dataToUpdate.updatedAt = firestore.FieldValue.serverTimestamp();

  try {
    // Update the specific document in the user's inventory subcollection
    await getUserInventoryCollection(userId).doc(itemId).update(dataToUpdate);
    console.log(`Service: Item ${itemId} updated successfully.`);
  } catch (error: any) {
    console.error(
      `Service Error: Updating inventory item ${itemId} for user ${userId}:`,
      error,
    );
    throw new Error('Failed to update the inventory item. Please try again.');
  }
};

/**
 * Deletes an inventory item document from Firestore.
 * @param userId - The authenticated user's ID.
 * @param itemId - The ID of the inventory item document to delete.
 * @returns Promise<void>
 * @throws Error if deletion fails.
 */
export const deleteInventoryItem = async (
  userId: string,
  itemId: string,
): Promise<void> => {
  console.log('Service: Deleting item:', itemId, 'for user:', userId);
  try {
    // Delete the specific document from the user's inventory subcollection
    await getUserInventoryCollection(userId).doc(itemId).delete();
    console.log(`Service: Item ${itemId} deleted successfully.`);
  } catch (error: any) {
    console.error(
      `Service Error: Deleting inventory item ${itemId} for user ${userId}:`,
      error,
    );
    throw new Error('Failed to delete the inventory item. Please try again.');
  }
};
