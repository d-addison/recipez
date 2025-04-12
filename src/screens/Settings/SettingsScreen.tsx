import React from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import type {SettingsScreenProps} from '../../navigation/navigationTypes';
import {useAuthStore} from '../../store/authStore';
// Inventory store clear is now handled within authStore logout listener logic

const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  // Get state and actions from auth store
  const {
    logout: logoutAction,
    isLoading,
    userProfile,
  } = useAuthStore(state => ({
    logout: state.logout,
    isLoading: state.isLoading,
    userProfile: state.userProfile,
  }));

  // Handle logout confirmation and action
  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout', // Title
      'Are you sure you want to logout from RecipEz?', // Message
      [
        // Buttons
        {
          text: 'Cancel',
          style: 'cancel', // Default cancel style
        },
        {
          text: 'Logout',
          style: 'destructive', // iOS red text
          onPress: async () => {
            await logoutAction();
            // Navigation back to Auth stack is handled by AppNavigator
            // Clearing inventory state is handled by auth listener now
          },
        },
      ],
      {cancelable: true}, // Allow dismissing by tapping outside on Android
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatarPlaceholder}>
          {/* TODO: Add profile picture later */}
          <Text style={styles.avatarText}>
            {userProfile?.displayName?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.displayName}>
          {userProfile?.displayName || 'User'}
        </Text>
        <Text style={styles.username}>@{userProfile?.username || '...'}</Text>
        <Text style={styles.email}>{userProfile?.email || 'No email'}</Text>
      </View>

      {/* TODO: Add other settings options here (e.g., Edit Profile, Notifications, etc.) */}
      <View style={styles.settingsOptions}>
        {/* Example Setting Row */}
        {/* <TouchableOpacity style={styles.optionRow}>
                    <Text style={styles.optionText}>Edit Profile</Text>
                    <Icon name="chevron-forward-outline" size={20} color="#6B7280" />
                </TouchableOpacity> */}
        <Text style={{textAlign: 'center', color: '#9CA3AF', marginTop: 20}}>
          More settings coming soon!
        </Text>
      </View>

      {/* Logout Button Container - Pushed to bottom */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoading}>
          <Text style={styles.logoutButtonText}>
            {isLoading ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: 'center', // Don't center align everything
    paddingTop: 20, // Space from header
    backgroundColor: '#F9FAFB', // Very light gray background
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // Light divider
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#34D399', // Use primary color for placeholder
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '500',
  },
  displayName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    color: '#6B7280', // Medium gray
    marginBottom: 6,
  },
  email: {
    fontSize: 14,
    color: '#9CA3AF', // Lighter gray
  },
  settingsOptions: {
    paddingHorizontal: 20,
    flex: 1, // Takes available space to push logout down
  },
  // Example Option Row Style (Uncomment when adding options)
  // optionRow: {
  //     flexDirection: 'row',
  //     justifyContent: 'space-between',
  //     alignItems: 'center',
  //     paddingVertical: 15,
  //     borderBottomWidth: 1,
  //     borderBottomColor: '#F3F4F6',
  // },
  // optionText: {
  //     fontSize: 16,
  //     color: '#374151',
  // },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40, // Space from bottom edge or tab bar
    paddingTop: 20,
  },
  logoutButton: {
    backgroundColor: '#FEE2E2', // Light red background
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#DC2626', // Red text
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
