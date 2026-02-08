import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radii, shadow, spacing } from '../theme/tokens';

type Props = PropsWithChildren<
  ViewProps & {
    style?: StyleProp<ViewStyle>;
    padded?: boolean;
  }
>;

export function Card({ children, style, padded = true, ...props }: Props) {
  return (
    <View {...props} style={[styles.card, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.card,
  },
  padded: { padding: spacing.lg },
});
