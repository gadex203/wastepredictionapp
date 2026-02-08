import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { colors, spacing } from '../theme/tokens';

type Props = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function NavHeader({ title, onBack, right }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable accessibilityRole="button" onPress={onBack} style={({ pressed }) => pressed && styles.pressed}>
            <View style={styles.back}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
              <AppText variant="label">Geri</AppText>
            </View>
          </Pressable>
        ) : null}
      </View>
      <AppText variant="subtitle" style={styles.title} numberOfLines={1}>
        {title}
      </AppText>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  left: { flex: 1 },
  right: { flex: 1, alignItems: 'flex-end' },
  title: { flex: 2, textAlign: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  pressed: { opacity: 0.7 },
});
