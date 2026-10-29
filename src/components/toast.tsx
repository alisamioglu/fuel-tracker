import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// A small card that slides in from the top after I save something

type Toast = {
  emoji: string;
  title: string;
  body?: string;
};

const ToastContext = createContext<(toast: Toast) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<(Toast & { key: number })[]>([]);
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const toast = queue[0];

  // Each toast stays for a few seconds, then the next one in line shows up
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setQueue((q) => q.slice(1)), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  function show(next: Toast) {
    setQueue((q) => [...q, { ...next, key: Date.now() + Math.random() }]);
  }

  return (
    <ToastContext.Provider value={show}>
      {children}
      <View pointerEvents="box-none" style={[styles.layer, { top: insets.top + Spacing.two }]}>
        {toast && (
          <Animated.View key={toast.key} entering={FadeInUp.springify()} exiting={FadeOutUp}>
            <Pressable
              onPress={() => setQueue((q) => q.slice(1))}
              style={[
                styles.toast,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <ThemedText style={styles.emoji}>{toast.emoji}</ThemedText>
              <View style={styles.text}>
                <ThemedText type="smallBold">{toast.title}</ThemedText>
                {toast.body && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {toast.body}
                  </ThemedText>
                )}
              </View>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 480,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  emoji: {
    fontSize: 30,
    lineHeight: 36,
  },
  text: {
    flexShrink: 1,
  },
});
