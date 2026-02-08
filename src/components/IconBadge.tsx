import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { colors, radii, spacing } from '../theme/tokens';
import type { WasteType } from '../utils/types';
import { getBinInfo } from '../utils/waste';

type Props = {
  wasteType: WasteType;
  size?: 'sm' | 'md';
};

export function IconBadge({ wasteType, size = 'md' }: Props) {
  const info = getBinInfo(wasteType);
  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <View style={[styles.badge, size === 'sm' && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: info.binColorHex }]} />
      <Ionicons name={info.icon as any} size={iconSize} color={colors.text} />
      <AppText variant="caption" style={styles.label}>
        {info.wasteLabel}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  badgeSm: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: radii.pill },
  label: { fontWeight: '600' },
});

