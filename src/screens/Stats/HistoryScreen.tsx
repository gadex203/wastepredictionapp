import { Image, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { StatsStackParamList } from '../../navigation/types';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { IconBadge } from '../../components/IconBadge';
import { NavHeader } from '../../components/NavHeader';
import { Screen } from '../../components/Screen';
import { useAppState } from '../../state/AppStateProvider';
import { spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<StatsStackParamList, 'History'>;

export function HistoryScreen({ navigation }: Props) {
  const state = useAppState();
  const scans = [...state.scanHistory].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <NavHeader title="Geçmiş" onBack={() => navigation.goBack()} />

        {scans.length === 0 ? (
          <Card>
            <AppText variant="subtitle">Henüz tarama yok</AppText>
            <AppText tone="muted" style={styles.topSpace}>
              Geçmişte görmek için bir taramayı onaylayın.
            </AppText>
          </Card>
        ) : (
          scans.map((s) => (
            <Card key={s.id} padded={false}>
              <View style={styles.row}>
                <Image source={{ uri: s.photoUri }} style={styles.thumb} />
                <View style={styles.meta}>
                  <IconBadge wasteType={s.confirmation.selectedWasteType} size="sm" />
                  <AppText variant="caption" tone="muted" style={styles.topSpace}>
                    {new Date(s.createdAt).toLocaleString()}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    +{s.confirmation.awardedPoints} puan
                  </AppText>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  meta: { flex: 1 },
  topSpace: { marginTop: spacing.sm },
});
