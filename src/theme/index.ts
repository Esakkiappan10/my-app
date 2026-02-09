
// Design System: Modern Light Mode with Premium Feel
import { Platform } from 'react-native';

export const colors = {
    // Backgrounds - Soft and clean
    background: '#F8FAFC',      // Slate 50 (Light Gray)
    surface: '#FFFFFF',         // Pure White
    surfaceLight: '#F1F5F9',    // Slate 100
    surfaceHover: '#E2E8F0',    // Slate 200

    // Primary Palette - Modern Blue to Violet
    primary: '#3B82F6',         // Blue 500
    primaryLight: '#60A5FA',    // Blue 400
    primaryDark: '#2563EB',     // Blue 600
    secondary: '#8B5CF6',       // Violet 500
    secondaryLight: '#A78BFA',  // Violet 400
    accent: '#06B6D4',          // Cyan 500 (fresh accent)

    // Semantic Colors
    success: '#10B981',         // Emerald 500
    successLight: '#D1FAE5',    // Emerald 100
    warning: '#F59E0B',         // Amber 500
    warningLight: '#FEF3C7',    // Amber 100
    error: '#EF4444',           // Red 500
    errorLight: '#FEE2E2',      // Red 100
    info: '#3B82F6',            // Blue 500
    infoLight: '#DBEAFE',       // Blue 100

    // Text Hierarchy
    text: '#0F172A',            // Slate 900 (Almost black)
    textSecondary: '#475569',   // Slate 600
    textMuted: '#94A3B8',       // Slate 400
    textInverted: '#FFFFFF',    // White

    // UI Elements
    border: '#E2E8F0',          // Slate 200
    borderFocus: '#3B82F6',     // Blue 500
    divider: '#F1F5F9',         // Slate 100
    overlay: 'rgba(15, 23, 42, 0.4)', // Slate 900 with opacity
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
};

export const gradients = {
    // Premium gradients
    primary: ['#3B82F6', '#2563EB'] as const,
    primarySoft: ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.02)'] as const,
    violet: ['#8B5CF6', '#7C3AED'] as const,
    success: ['#10B981', '#059669'] as const,
    surface: ['#FFFFFF', '#F8FAFC'] as const,
    glass: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)'] as const,
    glow: ['rgba(59, 130, 246, 0.15)', 'transparent'] as const,
    shimmer: ['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent'] as const,
};

export const shadows = {
    xs: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 1,
        elevation: 1,
    },
    sm: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    xl: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    glow: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    glowSuccess: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
};

export const spacing = {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
};

export const typography = {
    // Font families - using system fonts that look premium
    fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
    }),
    fontFamilyMono: Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'monospace',
    }),

    // Font sizes
    sizes: {
        xs: 11,
        sm: 13,
        base: 15,
        md: 17,
        lg: 20,
        xl: 24,
        xxl: 32,
        xxxl: 40,
    },

    // Font weights
    weights: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
        extrabold: '800' as const,
    },

    // Line heights
    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    // Letter spacing
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
    },
};

export const layout = {
    radius: 12, // Default radius for backward compatibility
    radiusScale: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 28,
        full: 9999,
    },
    headerHeight: Platform.OS === 'ios' ? 44 : 56,
    tabBarHeight: Platform.OS === 'ios' ? 84 : 64,
    maxWidth: 428, // iPhone 14 Pro Max width
};

// Animation presets
export const animation = {
    duration: {
        instant: 100,
        fast: 200,
        normal: 300,
        slow: 500,
    },
    spring: {
        gentle: { tension: 40, friction: 7 },
        bouncy: { tension: 50, friction: 5 },
        snappy: { tension: 100, friction: 10 },
    },
};
