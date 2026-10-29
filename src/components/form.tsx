import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// The building blocks I reuse on every screen: page, card, input, button, label/value row

export function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
            <ThemedText type="subtitle">{title}</ThemedText>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {title && <ThemedText type="smallBold">{title}</ThemedText>}
      {children}
    </ThemedView>
  );
}

type FieldProps = TextInputProps & { label: string };

export function Field({ label, style, ...props }: FieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
          style,
        ]}
        {...props}
      />
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'plain' | 'danger';
};

export function Button({ label, onPress, variant = 'primary' }: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const textColor = isPrimary ? '#ffffff' : variant === 'danger' ? theme.danger : theme.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        isPrimary ? styles.button : styles.plainButton,
        isPrimary && { backgroundColor: theme.primary },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" style={{ color: textColor }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <View style={styles.fieldRow}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  field: {
    flex: 1,
    gap: Spacing.one,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  button: {
    alignItems: 'center',
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: Spacing.two,
    marginTop: Spacing.one,
  },
  plainButton: {
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
