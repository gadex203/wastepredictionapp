import { ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { StatsStackParamList } from '../../navigation/types';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { IconBadge } from '../../components/IconBadge';
import { NavHeader } from '../../components/NavHeader';
import { ProgressBar } from '../../components/ProgressBar';
import { Screen } from '../../components/Screen';
import { StatTile } from '../../components/StatTile';
import { useAppState } from '../../state/AppStateProvider';
import {
  getTotalConfirmedScans,
  getWasteTypeCounts,
  getWeeklyCompletedChallengeCount,
} from '../../state/selectors';
import { spacing } from '../../theme/tokens';
import type { WasteType } from '../../utils/types';
import { getBinInfo } from '../../utils/waste';

type Props = NativeStackScreenProps<StatsStackParamList, 'Stats'>;

const ORDER: WasteType[] = ['plastic', 'paper', 'glass', 'metal', 'battery', 'unknown'];

export function StatsScreen({ navigation }: Props) {
  const state = useAppState();
  const totalScans = getTotalConfirmedScans(state);
  const counts = getWasteTypeCounts(state);
  const weeklyCompleted = getWeeklyCompletedChallengeCount(state, new Date());

  const maxCount = Math.max(0, ...Object.values(counts));
  const estimatedHours = Math.max(0, Math.round(totalScans * 0.6));

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <NavHeader
          title="İstatistikler"
          right={<Button title="Geçmiş" variant="ghost" onPress={() => navigation.navigate('History')} />}
        />

        <View style={styles.grid}>
          <StatTile label="Taranan öğe" value={totalScans} />
          <StatTile label="Toplam puan" value={state.totalPoints} />
        </View>
        <View style={styles.grid}>
          <StatTile label="Günlük seri" value={state.streak.current} />
          <StatTile label="Haftalık görev" value={weeklyCompleted} />
        </View>

        <Card>
          <AppText variant="subtitle">Atık türü dağılımı</AppText>
          <View style={styles.dist}>
            {ORDER.map((t) => (
              <View key={t} style={styles.distRow}>
                <View style={styles.distHeader}>
                  <IconBadge wasteType={t} size="sm" />
                  <AppText variant="caption" tone="muted">
                    {counts[t]}
                  </AppText>
                </View>
                <ProgressBar value={counts[t]} max={maxCount} color={getBinInfo(t).binColorHex} />
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <AppText variant="subtitle">Tahmini etki (demo)</AppText>
          <AppText tone="muted" style={styles.topSpace}>
            Tahmini etki: yaklaşık {estimatedHours} saat aydınlatmaya eşdeğer enerji.
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.topSpace}>
            Bu, ders demosu için kaba bir tahmindir.
          </AppText>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  grid: { flexDirection: 'row', gap: spacing.md },
  dist: { marginTop: spacing.lg, gap: spacing.lg },
  distRow: { gap: spacing.sm },
  distHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  topSpace: { marginTop: spacing.sm },
});
