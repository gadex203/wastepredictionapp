import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';

type Props = {
  value: number;
  max: number;
  color?: string;
};

export function ProgressBar({ value, max, color = colors.primary }: Props) {
  const clamped = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ now: value, max }}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    backgroundColor: '#EEF2F6',
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  fill: { height: '100%', borderRadius: radii.pill },
});

