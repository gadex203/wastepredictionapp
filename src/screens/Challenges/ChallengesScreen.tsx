import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { NavHeader } from '../../components/NavHeader';
import { ProgressBar } from '../../components/ProgressBar';
import { Screen } from '../../components/Screen';
import { useAppState } from '../../state/AppStateProvider';
import { getWeeklyChallengeStatus } from '../../state/selectors';
import { colors, spacing } from '../../theme/tokens';

export function ChallengesScreen() {
  const state = useAppState();
  const challenges = getWeeklyChallengeStatus(state, new Date());

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <NavHeader title="Görevler" />

        <AppText variant="caption" tone="muted">
          Haftalık görevler, onayladığınız taramalar ve quizlerle güncellenir.
        </AppText>

        {challenges.map((c) => {
          const done = Boolean(c.completedAt);
          return (
            <Card key={c.id} style={done && styles.doneCard}>
              <View style={styles.row}>
                <View style={styles.left}>
                  <AppText variant="subtitle">{c.title}</AppText>
                  <AppText tone="muted" style={styles.topSpace}>
                    {c.description}
                  </AppText>
                </View>
                <View style={styles.right}>
                  <AppText variant="label">+{c.rewardPoints}</AppText>
                  <AppText variant="caption" tone="muted">
                    puan
                  </AppText>
                </View>
              </View>

              <View style={styles.topSpace}>
                <View style={styles.progressHeader}>
                  <AppText variant="caption" tone="muted">
                    {Math.min(c.progress, c.target)} / {c.target}
                  </AppText>
                  {done ? (
                    <AppText variant="caption" style={styles.doneText}>
                      Tamamlandı
                    </AppText>
                  ) : null}
                </View>
                <ProgressBar
                  value={Math.min(c.progress, c.target)}
                  max={c.target}
                  color={done ? colors.primary : colors.warning}
                />
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', gap: spacing.lg },
  left: { flex: 1 },
  right: { alignItems: 'flex-end', justifyContent: 'center' },
  topSpace: { marginTop: spacing.sm },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  doneCard: { borderColor: colors.primary, backgroundColor: '#ECFDF3' },
  doneText: { color: colors.primary, fontWeight: '600' },
});
