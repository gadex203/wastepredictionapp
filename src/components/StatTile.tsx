import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { Card } from './Card';
import { spacing } from '../theme/tokens';

type Props = PropsWithChildren<{
  label: string;
  value: string | number;
  style?: StyleProp<ViewStyle>;
}>;

export function StatTile({ label, value, children, style }: Props) {
  return (
    <Card style={[styles.card, style]} padded={false}>
      <View style={styles.inner}>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        <AppText variant="subtitle">{String(value)}</AppText>
        {children}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  inner: { padding: spacing.lg, gap: 6 },
});
