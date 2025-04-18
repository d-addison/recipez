// Theme colors and typography for the app

export const colors = {
  // New color palette
  primary: '#00514F', // Dark teal - for main elements, header backgrounds
  secondary: '#448539', // Green - for buttons, interactive elements
  accent: '#E7FF22', // Bright yellow - for highlights, accents
  background: '#F2F4F5', // Light gray - for backgrounds

  // Text colors
  text: {
    primary: '#00514F', // Dark teal - for primary text
    secondary: '#448539', // Green - for secondary text
    light: '#F2F4F5', // Light - for text on dark backgrounds
  },

  // Status colors
  status: {
    error: '#DC2626',
    success: '#448539', // Using secondary green for success states
    warning: '#F59E0B',
  },
};

export const typography = {
  fontFamily: {
    regular: 'Sora-Regular',
    medium: 'Sora-Medium',
    bold: 'Sora-Bold',
    light: 'Sora-Light',
  },
  fontSize: {
    small: 12,
    body: 14,
    button: 16,
    title: 18,
    header: 22,
  },
};

// Common style mixins
export const commonStyles = {
  shadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  // Add more common styles as needed
};

export default {colors, typography, commonStyles};
