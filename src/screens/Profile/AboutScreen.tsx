import Constants from 'expo-constants';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ProfileStackParamList } from '../../navigation/types';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { NavHeader } from '../../components/NavHeader';
import { Screen } from '../../components/Screen';
import { spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<ProfileStackParamList, 'About'>;

export function AboutScreen({ navigation }: Props) {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <NavHeader title="Hakkında" onBack={() => navigation.goBack()} />

        <Card>
          <AppText variant="subtitle">Akıllı Geri Dönüşüm Asistanı</AppText>
          <AppText tone="muted" style={styles.topSpace}>
            Makine öğrenmesi çıktısını anlaşılır ve yardımcı yönlendirmeler olarak göstermeyi amaçlayan bir ders projesi.
          </AppText>
        </Card>

        <Card>
          <AppText variant="subtitle">Sürüm</AppText>
          <AppText tone="muted" style={styles.topSpace}>
            {version}
          </AppText>
        </Card>

        <Card>
          <AppText variant="subtitle">Gizlilik</AppText>
          <AppText tone="muted" style={styles.topSpace}>
            Tüm veriler bu cihazda kalır. Hesap yok, sunucu yok.
          </AppText>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  topSpace: { marginTop: spacing.sm },
});
