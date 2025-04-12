import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native'; // Import useFocusEffect
import {useInventoryStore} from '../../store/inventoryStore';
import {useAuthStore} from '../../store/authStore';
import type {InventoryScreenProps} from '../../navigation/navigationTypes';
import {InventoryItem, InventoryCategory} from '../../types';
import {ROUTES} from '../../constants/routes';
import Icon from 'react-native-vector-icons/Ionicons'; // For icons

// Category Tabs Component
const CategoryTabs = ({
  selectedCategory,
  onSelectCategory,
}: {
  selectedCategory: InventoryCategory;
  onSelectCategory: (cat: InventoryCategory) => void;
}) => {
  const categories: InventoryCategory[] = [
    'fridge',
    'pantry',
    'freezer',
    'tools',
  ];
  const categoryIcons: {[key in InventoryCategory]: string} = {
    // Example icons
    fridge: 'snow-outline',
    pantry: 'file-tray-full-outline',
    freezer: 'cube-outline', // Could be better
    tools: 'construct-outline',
  };

  return (
    <View style={styles.tabBar}>
      {categories.map(cat => (
        <TouchableOpacity
          key={cat}
          style={[
            styles.tabItem,
            selectedCategory === cat && styles.tabItemActive,
          ]}
          onPress={() => onSelectCategory(cat)}
          activeOpacity={0.7}>
          <Icon
            name={categoryIcons[cat]}
            size={22}
            color={selectedCategory === cat ? '#34D399' : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabText,
              selectedCategory === cat && styles.tabTextActive,
            ]}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const InventoryScreen: React.FC<InventoryScreenProps> = ({navigation}) => {
  // Get state and actions from stores
  const {inventoryItems, isLoading, error, fetchInventory, deleteItem} =
    useInventoryStore();
  const {userProfile} = useAuthStore(); // Check if user is logged in

  const [selectedCategory, setSelectedCategory] =
    useState<InventoryCategory>('fridge');

  // Use useFocusEffect to refetch data when the screen comes into focus
  // This ensures data is fresh if added/edited on another screen or logged in
  useFocusEffect(
    useCallback(() => {
      if (userProfile?.uid) {
        console.log('Inventory Screen Focused: Fetching inventory...');
        fetchInventory(); // Call the action from the store
      } else {
        console.log('Inventory Screen Focused: No user profile, cannot fetch.');
        // Inventory store state should be cleared on logout by authStore
      }
    }, [userProfile, fetchInventory]), // Re-run if userProfile or fetchInventory function changes
  );

  // Navigate to Add/Edit screen for editing
  const handleEdit = (item: InventoryItem) => {
    navigation.navigate(ROUTES.ADD_EDIT_ITEM, {item}); // Pass item data for editing
  };

  // Show confirmation alert before deleting
  const handleDelete = (item: InventoryItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"? This cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Make onPress async
            const success = await deleteItem(item.id); // Call delete action
            if (!success) {
              Alert.alert(
                'Error',
                useInventoryStore.getState().error || 'Failed to delete item.',
              );
            }
          },
        },
      ],
    );
  };

  // Render function for each item in the FlatList
  const renderItem = ({item}: {item: InventoryItem}) => (
    <View style={styles.inventoryItem}>
      {/* Item Details */}
      <View style={styles.itemDetailsContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        {/* Only show quantity if it exists */}
        {item.quantity && (
          <Text style={styles.itemQuantity}>{item.quantity}</Text>
        )}
      </View>
      {/* Action Buttons */}
      <View style={styles.itemActions}>
        <TouchableOpacity
          onPress={() => handleEdit(item)}
          style={styles.actionButton}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 5}}>
          <Icon name="pencil-outline" size={20} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={styles.actionButton}
          hitSlop={{top: 10, bottom: 10, left: 5, right: 10}}>
          <Icon name="trash-outline" size={20} color="#DC2626" />{' '}
          {/* Red for delete */}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Filter items based on the selected category tab
  const filteredItems = inventoryItems.filter(
    item => item.category === selectedCategory,
  );

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <CategoryTabs
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Conditional Rendering based on state */}
      {isLoading && inventoryItems.length === 0 && (
        <ActivityIndicator size="large" color="#34D399" style={styles.loader} />
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {!isLoading && !error && filteredItems.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Your {selectedCategory} is empty.
          </Text>
          <Text style={styles.emptySubText}>
            Tap the '+' button to add items!
          </Text>
        </View>
      )}

      {/* List of items */}
      {!error && filteredItems.length > 0 && (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          // Add pull-to-refresh functionality
          onRefresh={fetchInventory}
          refreshing={isLoading && inventoryItems.length > 0} // Show refresh indicator only when actively loading *during* a refresh
        />
      )}

      {/* Floating Action Button to Add Item */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate(ROUTES.ADD_EDIT_ITEM, {})} // Pass empty object for 'add' mode
        activeOpacity={0.8}>
        <Icon name="add-outline" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5F5F7'}, // Use light gray bg
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {borderBottomColor: '#34D399'}, // Green underline for active tab
  tabText: {color: '#94A3B8', fontWeight: '500', fontSize: 13, marginTop: 4}, // Gray text for inactive
  tabTextActive: {color: '#34D399', fontWeight: '600'}, // Green text for active
  loader: {flex: 1, justifyContent: 'center', alignItems: 'center'}, // Center loader if list is empty
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 10,
  },
  emptySubText: {fontSize: 14, color: '#9CA3AF', textAlign: 'center'},
  list: {paddingVertical: 15, paddingHorizontal: 15}, // Add padding around list items
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White background for item card
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  itemDetailsContainer: {
    flex: 1, // Allow text to take available space
    marginRight: 10, // Space before action buttons
  },
  itemName: {fontSize: 16, fontWeight: '500', color: '#1F2937'}, // Dark text for name
  itemQuantity: {fontSize: 14, color: '#6B7280', marginTop: 2}, // Medium gray for quantity
  itemActions: {flexDirection: 'row', alignItems: 'center'},
  actionButton: {padding: 8}, // Add padding for easier touch target
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 60,
    height: 60,
    backgroundColor: '#34D399', // Primary green
    borderRadius: 30, // Make it circular
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for FAB
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  // FAB text style removed as we use Icon now
});

export default InventoryScreen;
