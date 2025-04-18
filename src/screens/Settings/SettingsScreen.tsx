import React from 'react';
import {View, Text, StyleSheet, Alert, Pressable} from 'react-native'; // Import Pressable
import type {SettingsScreenProps} from '../../navigation/navigationTypes';
import {useAuthStore} from '../../store/authStore';
import Icon from 'react-native-vector-icons/Ionicons'; // Import Icon if using for options

// Inventory store clear is now handled within authStore logout listener logic

const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  // --- CORRECTED STATE SELECTION ---
  // Get state and actions from auth store individually
  const logoutAction = useAuthStore(state => state.logout);
  const isLoading = useAuthStore(state => state.isLoading);
  const userProfile = useAuthStore(state => state.userProfile);
  // ---------------------------------

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
      {/* Profile Information Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarPlaceholder}>
          {/* TODO: Add profile picture later using <Image /> */}
          <Text style={styles.avatarText}>
            {/* Get first letter of display name, fallback to '?' */}
            {userProfile?.displayName?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.displayName}>
          {userProfile?.displayName || 'User'}
        </Text>
        <Text style={styles.username}>@{userProfile?.username || '...'}</Text>
        {/* Email might be sensitive, consider if it should be displayed */}
        {/* <Text style={styles.email}>{userProfile?.email || 'No email'}</Text> */}
      </View>

      {/* Placeholder for future settings options */}
      <View style={styles.settingsOptions}>
        {/* Example Setting Row Structure (using Pressable) */}
        {/*
                <Pressable style={({pressed}) => [styles.optionRow, pressed && styles.optionRowPressed]} onPress={() => Alert.alert("Coming Soon", "Edit Profile functionality.")}>
                    <View style={styles.optionTextContainer}>
                         <Icon name="person-outline" size={22} color="#4B5563" style={styles.optionIcon} />
                         <Text style={styles.optionText}>Edit Profile</Text>
                    </View>
                    <Icon name="chevron-forward-outline" size={20} color="#9CA3AF" />
                </Pressable>
                 <Pressable style={({pressed}) => [styles.optionRow, pressed && styles.optionRowPressed]} onPress={() => Alert.alert("Coming Soon", "Notification settings.")}>
                     <View style={styles.optionTextContainer}>
                        <Icon name="notifications-outline" size={22} color="#4B5563" style={styles.optionIcon} />
                        <Text style={styles.optionText}>Notifications</Text>
                    </View>
                    <Icon name="chevron-forward-outline" size={20} color="#9CA3AF" />
                </Pressable>
                 */}
        <Text style={styles.comingSoonText}>More settings coming soon!</Text>
      </View>

      {/* Logout Button Container - Pushed towards the bottom */}
      <View style={styles.logoutContainer}>
        <Pressable
          onPress={handleLogout}
          disabled={isLoading}
          style={({pressed}) => [
            styles.logoutButton,
            isLoading && styles.buttonDisabled, // Apply disabled style
            pressed && styles.buttonPressed, // Apply pressed style
          ]}
          android_ripple={{color: '#FCA5A5'}}>
          <Text style={styles.logoutButtonText}>
            {isLoading ? 'Logging out...' : 'Logout'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

// StyleSheet for component styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Very light gray background (Tailwind Gray 50)
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF', // White background for profile section
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // Gray 200 divider
    marginBottom: 10, // Space below profile section
  },
  avatarPlaceholder: {
    width: 90, // Slightly larger avatar
    height: 90,
    borderRadius: 45, // Keep it circular
    backgroundColor: '#34D399', // Primary Green
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 40, // Larger initial
    fontWeight: '500',
  },
  displayName: {
    fontSize: 22, // Larger display name
    fontWeight: '600',
    color: '#1F2937', // Gray 800
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#6B7280', // Gray 500
    marginBottom: 6,
  },
  email: {
    // Style if you decide to show email
    fontSize: 14,
    color: '#9CA3AF', // Gray 400
  },
  settingsOptions: {
    flex: 1, // Takes available space to push logout down
    paddingHorizontal: 15, // Padding for options list
    paddingTop: 10,
  },
  comingSoonText: {
    textAlign: 'center',
    color: '#9CA3AF', // Gray 400
    marginTop: 30,
    fontSize: 14,
  },
  // Styles for future option rows
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10, // Padding within the row
    backgroundColor: '#FFFFFF', // White background for rows
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // Very light divider
    borderRadius: 8, // Optional: rounded corners for rows
    marginBottom: 8, // Optional: space between rows
  },
  optionRowPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Subtle feedback
  },
  optionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    color: '#374151', // Gray 700
  },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30, // Consistent padding
  },
  logoutButton: {
    backgroundColor: '#FEF2F2', // Lighter red background (Tailwind Red 50)
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1, // Optional: add a border
    borderColor: '#FEE2E2', // Match background or slightly darker red
  },
  logoutButtonText: {
    color: '#DC2626', // Red 600 text
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6, // Indicate disabled state visually
  },
  // Style for pressed state feedback (e.g., background change or opacity)
  buttonPressed: {
    backgroundColor: '#FEE2E2', // Slightly darker red background on press (Tailwind Red 100)
  },
});

export default SettingsScreen;
