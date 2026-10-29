/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  // backgroundElement is the card color, background is the page behind the cards
  light: {
    text: '#14171C',
    background: '#F2F4F7',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E6E9EE',
    textSecondary: '#667085',
    primary: '#1F6FEB',
    primarySoft: '#E4EDFD',
    onPrimary: '#FFFFFF',
    success: '#16A34A',
    successSoft: '#DCF5E5',
    warning: '#D97706',
    warningSoft: '#FDEFD9',
    danger: '#DC2626',
    dangerSoft: '#FBE1E1',
    border: '#E2E5EA',
  },
  dark: {
    text: '#F2F4F7',
    background: '#0B0D10',
    backgroundElement: '#171A1F',
    backgroundSelected: '#252A31',
    textSecondary: '#98A2B3',
    primary: '#4D8EF7',
    primarySoft: '#1A2A45',
    onPrimary: '#FFFFFF',
    success: '#3CCB73',
    successSoft: '#123222',
    warning: '#F5A524',
    warningSoft: '#3A2A10',
    danger: '#F26464',
    dangerSoft: '#3D1A1A',
    border: '#2A2F37',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
