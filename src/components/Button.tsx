import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { colors, radii, spacing } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = PropsWithChildren<
  Omit<PressableProps, 'style'> & {
    variant?: Variant;
    style?: StyleProp<ViewStyle>;
    title: string;
  }
>;

export function Button({ title, variant = 'primary', disabled, style, ...props }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <AppText
        variant="label"
        style={[
          styles.text,
          variant === 'primary' && styles.primaryText,
          variant !== 'primary' && styles.secondaryText,
          disabled && styles.disabledText,
        ]}
      >
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: { transform: [{ scale: 0.98 }] },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  disabled: { opacity: 0.5 },
  text: { textAlign: 'center' },
  primaryText: { color: colors.bg },
  secondaryText: { color: colors.text },
  disabledText: { color: colors.muted },
});
