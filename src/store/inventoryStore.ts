import {create} from 'zustand';
import {InventoryItem} from '../types';
import {
  fetchUserInventory as fetchUserInventoryService,
  addInventoryItem as addInventoryItemService,
  updateInventoryItem as updateInventoryItemService,
  deleteInventoryItem as deleteInventoryItemService,
} from '../services/inventoryService.ts';
import {useAuthStore} from './authStore'; // To get userId

interface InventoryState {
  inventoryItems: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  // Actions
  fetchInventory: () => Promise<void>;
  addItem: (
    itemData: Omit<InventoryItem, 'id' | 'createdAt'>,
  ) => Promise<boolean>;
  updateItem: (
    itemId: string,
    updatedData: Partial<Omit<InventoryItem, 'id' | 'createdAt'>>,
  ) => Promise<boolean>; // Ensure correct type
  deleteItem: (itemId: string) => Promise<boolean>;
  clearInventoryState: () => void; // For logout
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  inventoryItems: [],
  isLoading: false,
  error: null,

  clearInventoryState: () =>
    set({inventoryItems: [], isLoading: false, error: null}),

  fetchInventory: async () => {
    const userId = useAuthStore.getState().userProfile?.uid;
    if (!userId) {
      console.warn('Cannot fetch inventory: No user ID found.');
      // set({ error: "Please login to view inventory.", inventoryItems: [], isLoading: false }); // Optionally clear
      return;
    }
    set({isLoading: true, error: null});
    try {
      const items = await fetchUserInventoryService(userId);
      set({inventoryItems: items, isLoading: false});
    } catch (fetchError: any) {
      console.error('Error fetching inventory:', fetchError);
      set({
        error: fetchError.message || 'Failed to load inventory.',
        isLoading: false,
      });
    }
  },

  addItem: async itemData => {
    const userId = useAuthStore.getState().userProfile?.uid;
    if (!userId) {
      set({error: 'Cannot add item: User not logged in.'});
      return false;
    }
    set({isLoading: true, error: null}); // Indicate loading
    try {
      await addInventoryItemService(userId, itemData);
      set({isLoading: false});
      await get().fetchInventory(); // Refetch to get accurate data with server ID/timestamp
      return true;
    } catch (addError: any) {
      console.error('Error adding item:', addError);
      set({error: addError.message || 'Failed to add item.', isLoading: false});
      return false;
    }
  },

  updateItem: async (itemId, updatedData) => {
    const userId = useAuthStore.getState().userProfile?.uid;
    if (!userId) {
      set({error: 'Cannot update item: User not logged in.'});
      return false;
    }
    set({isLoading: true, error: null});
    try {
      await updateInventoryItemService(userId, itemId, updatedData);
      set({isLoading: false});
      await get().fetchInventory(); // Refetch
      return true;
    } catch (updateError: any) {
      console.error('Error updating item:', updateError);
      set({
        error: updateError.message || 'Failed to update item.',
        isLoading: false,
      });
      return false;
    }
  },

  deleteItem: async itemId => {
    const userId = useAuthStore.getState().userProfile?.uid;
    if (!userId) {
      set({error: 'Cannot delete item: User not logged in.'});
      return false;
    }
    set({isLoading: true, error: null});
    try {
      await deleteInventoryItemService(userId, itemId);
      set({isLoading: false});
      // Refetch *after* successful deletion is often safer than just local removal
      await get().fetchInventory();
      return true;
    } catch (deleteError: any) {
      console.error('Error deleting item:', deleteError);
      set({
        error: deleteError.message || 'Failed to delete item.',
        isLoading: false,
      });
      return false;
    }
  },
}));
