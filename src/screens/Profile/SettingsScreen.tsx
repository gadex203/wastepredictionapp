import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ProfileStackParamList } from '../../navigation/types';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { NavHeader } from '../../components/NavHeader';
import { Screen } from '../../components/Screen';
import { useAppDispatch, useAppState, useResetAppData } from '../../state/AppStateProvider';
import { colors, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const resetAppData = useResetAppData();

  const toggle = (key: keyof typeof state.settings) => dispatch({ type: 'TOGGLE_SETTING', payload: key });

  const confirmReset = () => {
    Alert.alert('Demo verilerini sıfırla?', 'Bu işlem puanları, geçmişi, rozetleri ve ayarları temizler.', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sıfırla', style: 'destructive', onPress: () => resetAppData() },
    ]);
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <NavHeader title="Ayarlar" onBack={() => navigation.goBack()} />

        <Card>
          <View style={styles.row}>
              <View style={styles.left}>
              <AppText variant="label">Dokunsal geri bildirim</AppText>
              <AppText variant="caption" tone="muted">
                Önemli işlemlerde titreşimli geri bildirim.
              </AppText>
            </View>
            <Switch value={state.settings.hapticsEnabled} onValueChange={() => toggle('hapticsEnabled')} />
          </View>
        </Card>

        <Card>
          <View style={styles.row}>
            <View style={styles.left}>
              <AppText variant="label">Hareketi azalt</AppText>
              <AppText variant="caption" tone="muted">
                Gereksiz animasyonları kısaltır veya devre dışı bırakır.
              </AppText>
            </View>
            <Switch value={state.settings.reduceMotion} onValueChange={() => toggle('reduceMotion')} />
          </View>
        </Card>

        <Card>
          <View style={styles.row}>
            <View style={styles.left}>
              <AppText variant="label">Demo sıralamayı göster</AppText>
              <AppText variant="caption" tone="muted">
                Yalnızca yerel örnek sıralama.
              </AppText>
            </View>
            <Switch
              value={state.settings.showDemoLeaderboard}
              onValueChange={() => toggle('showDemoLeaderboard')}
            />
          </View>
        </Card>

        <Card style={styles.dangerCard}>
          <AppText variant="subtitle">Sıfırla</AppText>
          <AppText tone="muted" style={styles.topSpace}>
            Tüm yerel verileri temizler ve varsayılanları geri yükler.
          </AppText>
          <View style={styles.topSpace}>
            <View style={styles.resetRow}>
              <View style={styles.resetLeft}>
                <AppText variant="label" style={styles.dangerText}>
                  Demo verilerini sıfırla
                </AppText>
              </View>
              <View style={styles.resetButtonWrap}>
                <AppText
                  variant="label"
                  style={styles.resetButton}
                  onPress={confirmReset}
                  accessibilityRole="button"
                >
                  Sıfırla
                </AppText>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg },
  left: { flex: 1, gap: 2 },
  dangerCard: { borderColor: colors.danger },
  topSpace: { marginTop: spacing.sm },
  resetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resetLeft: { flex: 1 },
  resetButtonWrap: {},
  resetButton: { color: colors.danger, fontWeight: '600' },
  dangerText: { color: colors.danger },
});
