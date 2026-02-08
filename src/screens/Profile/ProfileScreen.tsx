import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ProfileStackParamList } from '../../navigation/types';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { NavHeader } from '../../components/NavHeader';
import { Screen } from '../../components/Screen';
import { StatTile } from '../../components/StatTile';
import { BADGES } from '../../data/badges';
import { DEMO_LEADERBOARD } from '../../data/demoLeaderboard';
import { useAppDispatch, useAppState } from '../../state/AppStateProvider';
import { spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [nameDraft, setNameDraft] = useState(state.displayName);

  const unlocked = useMemo(() => new Set(state.badges.map((b) => b.id)), [state.badges]);

  const leaderboard = useMemo(() => {
    const replaced = DEMO_LEADERBOARD.map((e) =>
      e.id === 'u5' ? { ...e, name: state.displayName, points: state.totalPoints } : e,
    );
    return [...replaced].sort((a, b) => b.points - a.points);
  }, [state.displayName, state.totalPoints]);

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      Alert.alert('İsim gerekli', 'Lütfen bir görünen ad girin.');
      setNameDraft(state.displayName);
      return;
    }
    dispatch({ type: 'SET_DISPLAY_NAME', payload: { displayName: trimmed } });
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <NavHeader title="Profil" />

        <Card>
          <AppText variant="subtitle">Görünen ad</AppText>
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            onBlur={saveName}
            style={styles.input}
            placeholder="Adınız"
            autoCapitalize="words"
            returnKeyType="done"
          />
          <AppText variant="caption" tone="muted">
            Yalnızca yerel (hesap yok).
          </AppText>
        </Card>

        <View style={styles.grid}>
          <StatTile label="Toplam puan" value={state.totalPoints} />
          <StatTile label="Günlük seri" value={state.streak.current} />
        </View>

        <Card>
          <AppText variant="subtitle">Rozetler</AppText>
          <View style={styles.badges}>
            {BADGES.map((b) => {
              const isUnlocked = unlocked.has(b.id);
              return (
                <View key={b.id} style={[styles.badgeRow, !isUnlocked && styles.badgeLocked]}>
                  <Ionicons
                    name={isUnlocked ? 'checkmark-circle' : 'lock-closed'}
                    size={20}
                    color={isUnlocked ? '#22C55E' : '#94A3B8'}
                  />
                  <View style={styles.badgeText}>
                    <AppText variant="label">{b.title}</AppText>
                    <AppText variant="caption" tone="muted">
                      {b.description}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {state.settings.showDemoLeaderboard ? (
          <Card>
            <AppText variant="subtitle">Demo sıralama (yalnızca yerel)</AppText>
            <View style={styles.topSpace}>
              {leaderboard.map((e, idx) => (
                <View key={e.id} style={styles.leaderRow}>
                  <AppText variant="label">#{idx + 1}</AppText>
                  <AppText style={styles.leaderName}>{e.name}</AppText>
                  <AppText variant="label">{e.points}</AppText>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button title="Ayarlar" variant="secondary" onPress={() => navigation.navigate('Settings')} />
          <Button title="Hakkında" variant="secondary" onPress={() => navigation.navigate('About')} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  input: {
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  grid: { flexDirection: 'row', gap: spacing.md },
  badges: { marginTop: spacing.lg, gap: spacing.md },
  badgeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  badgeText: { flex: 1, gap: 2 },
  badgeLocked: { opacity: 0.6 },
  topSpace: { marginTop: spacing.sm, gap: spacing.sm },
  leaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  leaderName: { flex: 1, textAlign: 'center' },
  actions: { gap: spacing.md },
});
