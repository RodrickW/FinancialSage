import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#059669', // Emerald green - matches web app
    primaryContainer: '#ECFDF5',
    secondary: '#10B981', // Green
    secondaryContainer: '#D1FAE5',
    tertiary: '#F59E0B', // Amber
    tertiaryContainer: '#FEF3C7',
    surface: '#FFFFFF',
    surfaceVariant: '#F8FAFC',
    background: '#F1F5F9',
    error: '#EF4444',
    errorContainer: '#FEE2E2',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#1E40AF',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#065F46',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#92400E',
    onSurface: '#1E293B',
    onSurfaceVariant: '#64748B',
    onBackground: '#0F172A',
    onError: '#FFFFFF',
    onErrorContainer: '#B91C1C',
    outline: '#CBD5E1',
    outlineVariant: '#E2E8F0',
    inverseSurface: '#1E293B',
    inverseOnSurface: '#F1F5F9',
    inversePrimary: '#60A5FA',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
  typography: {
    headingLarge: {
      fontSize: 32,
      fontWeight: 'bold' as const,
      lineHeight: 40,
    },
    headingMedium: {
      fontSize: 28,
      fontWeight: 'bold' as const,
      lineHeight: 36,
    },
    headingSmall: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      lineHeight: 32,
    },
    titleLarge: {
      fontSize: 22,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    titleMedium: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    titleSmall: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 22,
    },
    bodyLarge: {
      fontSize: 16,
      fontWeight: 'normal' as const,
      lineHeight: 24,
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: 'normal' as const,
      lineHeight: 20,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: 'normal' as const,
      lineHeight: 16,
    },
    labelLarge: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
    },
    labelMedium: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
    },
    labelSmall: {
      fontSize: 10,
      fontWeight: '500' as const,
      lineHeight: 14,
    },
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
};

export type Theme = typeof theme;