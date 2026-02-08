import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { AppText } from './AppText';
import { colors, radii, spacing } from '../theme/tokens';

type Props = Omit<PressableProps, 'style'> & {
  label: string;
  selected?: boolean;
};

export function Chip({ label, selected = false, disabled, ...props }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <AppText
        variant="caption"
        style={[styles.label, selected && styles.labelSelected, disabled && styles.labelDisabled]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: '#ECFDF3',
  },
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  label: { color: colors.text },
  labelSelected: { color: colors.text, fontWeight: '600' },
  labelDisabled: { color: colors.muted },
});

