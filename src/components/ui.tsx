import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// All the small building blocks I use on every screen live here

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

function useToneColors(tone: Tone) {
  const theme = useTheme();
  switch (tone) {
    case 'primary':
      return { color: theme.primary, soft: theme.primarySoft };
    case 'success':
      return { color: theme.success, soft: theme.successSoft };
    case 'warning':
      return { color: theme.warning, soft: theme.warningSoft };
    case 'danger':
      return { color: theme.danger, soft: theme.dangerSoft };
    default:
      return { color: theme.textSecondary, soft: theme.backgroundSelected };
  }
}

type ScreenProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  // Modals sit above the tab bar and have their own header, so they need less padding
  modal?: boolean;
};

export function Screen({ title, subtitle, children, modal }: ScreenProps) {
  const theme = useTheme();
  const content = (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, modal && styles.modalContent]}
        keyboardShouldPersistTaps="handled">
        {title && (
          <View style={styles.header}>
            <ThemedText style={styles.title}>{title}</ThemedText>
            {subtitle && (
              <ThemedText type="small" themeColor="textSecondary">
                {subtitle}
              </ThemedText>
            )}
          </View>
        )}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      {modal ? (
        content
      ) : (
        <SafeAreaView style={styles.flex} edges={['top']}>
          {content}
        </SafeAreaView>
      )}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        style,
      ]}>
      {children}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
      {children}
    </ThemedText>
  );
}

export function IconBadge({ name, tone = 'primary', size = 40 }: { name: IconName; tone?: Tone; size?: number }) {
  const { color, soft } = useToneColors(tone);
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: soft, width: size, height: size, borderRadius: size / 3 },
      ]}>
      <Icon name={name} color={color} size={size * 0.5} />
    </View>
  );
}

export function Pill({ label, tone }: { label: string; tone: Tone }) {
  const { color, soft } = useToneColors(tone);
  return (
    <View style={[styles.pill, { backgroundColor: soft }]}>
      <ThemedText type="smallBold" style={[styles.pillText, { color }]}>
        {label}
      </ThemedText>
    </View>
  );
}

export function ProgressBar({ value, tone }: { value: number; tone: Tone }) {
  const theme = useTheme();
  const { color } = useToneColors(tone);
  const width = `${Math.min(Math.max(value, 0), 1) * 100}%` as const;
  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.bar, { width, backgroundColor: color }]} />
    </View>
  );
}

type StatTileProps = {
  icon: IconName;
  label: string;
  value: string;
  unit?: string;
  tone?: Tone;
};

export function StatTile({ icon, label, value, unit, tone = 'primary' }: StatTileProps) {
  return (
    <Card style={styles.tile}>
      <IconBadge name={icon} tone={tone} size={32} />
      <View>
        <View style={styles.valueRow}>
          <ThemedText style={styles.tileValue}>{value}</ThemedText>
          {unit && (
            <ThemedText type="small" themeColor="textSecondary">
              {unit}
            </ThemedText>
          )}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      </View>
    </Card>
  );
}

export function TileGrid({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

type FieldProps = TextInputProps & {
  label: string;
  hint?: string;
  unit?: string;
};

export function Field({ label, hint, unit, style, ...props }: FieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View
        style={[
          styles.inputWrap,
          { borderColor: theme.border, backgroundColor: theme.backgroundElement },
        ]}>
        <TextInput
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }, style]}
          {...props}
        />
        {unit && (
          <ThemedText type="smallBold" themeColor="textSecondary">
            {unit}
          </ThemedText>
        )}
      </View>
      {hint && (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      )}
    </View>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <View style={styles.fieldRow}>{children}</View>;
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function Button({ label, onPress, icon, variant = 'primary' }: ButtonProps) {
  const theme = useTheme();
  const colors = {
    primary: { bg: theme.primary, fg: theme.onPrimary },
    secondary: { bg: theme.primarySoft, fg: theme.primary },
    danger: { bg: theme.dangerSoft, fg: theme.danger },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: colors.bg }, pressed && styles.pressed]}>
      {icon && <Icon name={icon} color={colors.fg} size={18} />}
      <ThemedText type="smallBold" style={{ color: colors.fg }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, color }: { icon: IconName; onPress: () => void; color: string }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <Icon name={icon} color={color} size={18} />
    </Pressable>
  );
}

type Option<T extends string> = { value: T; label: string; icon?: IconName };

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.backgroundSelected }]}>
      {options.map((option) => {
        const selected = option.value === value;
        const color = selected ? theme.primary : theme.textSecondary;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: theme.backgroundElement }]}>
            {option.icon && <Icon name={option.icon} color={color} size={16} />}
            <ThemedText type="smallBold" style={{ color }} numberOfLines={1}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <Card style={styles.empty}>
      <IconBadge name={icon} size={56} />
      <ThemedText type="smallBold" style={styles.centerText}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
        {body}
      </ThemedText>
    </Card>
  );
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
  modalContent: {
    paddingBottom: Spacing.six,
  },
  header: {
    gap: Spacing.half,
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: 700,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 12,
    marginTop: Spacing.two,
  },
  card: {
    padding: Spacing.three,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.half,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 12,
    lineHeight: 16,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '40%',
    gap: Spacing.three,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  tileValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
  },
  field: {
    flex: 1,
    gap: Spacing.one,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.three,
    fontSize: 17,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  iconButton: {
    padding: Spacing.one,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: Spacing.one,
    gap: Spacing.one,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    borderRadius: 9,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  centerText: {
    textAlign: 'center',
  },
});
