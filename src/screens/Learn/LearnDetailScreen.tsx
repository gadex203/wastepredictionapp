import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { LearnStackParamList } from '../../navigation/types';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { IconBadge } from '../../components/IconBadge';
import { NavHeader } from '../../components/NavHeader';
import { Screen } from '../../components/Screen';
import { WASTE_GUIDES } from '../../data/learnContent';
import { colors, spacing } from '../../theme/tokens';
import { useAppDispatch } from '../../state/AppStateProvider';
import { getBinInfo } from '../../utils/waste';

type Props = NativeStackScreenProps<LearnStackParamList, 'LearnDetail'>;

export function LearnDetailScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const { wasteType } = route.params;
  const guide = WASTE_GUIDES.find((g) => g.wasteType === wasteType);
  const bin = getBinInfo(wasteType);

  const splitGuideItem = (text: string) => {
    const separator = ' — ';
    if (text.includes(separator)) {
      const [title, ...rest] = text.split(separator);
      return { title: title.trim(), detail: rest.join(separator).trim() };
    }
    return { title: text.trim(), detail: '' };
  };

  useEffect(() => {
    if (wasteType === 'battery') dispatch({ type: 'MARK_BATTERY_CARD_READ' });
  }, [dispatch, wasteType]);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <NavHeader title="Daha fazla bilgi" onBack={() => navigation.goBack()} />

        <Card>
          <AppText variant="subtitle">{bin.wasteLabel}</AppText>
          <View style={styles.topSpace}>
            <IconBadge wasteType={wasteType} />
          </View>
          <View style={[styles.binRow, styles.topSpace]}>
            <View style={[styles.binDot, { backgroundColor: bin.binColorHex }]} />
            <View style={styles.binText}>
              <AppText variant="label">{bin.binLabel}</AppText>
              <AppText variant="caption" tone="muted">
                Bilgi: Bölgenizdeki belediye kuralları farklılık gösterebilir.
              </AppText>
            </View>
          </View>
        </Card>

        {!guide ? (
          <Card>
            <AppText variant="subtitle">Henüz rehber yok</AppText>
            <AppText tone="muted" style={styles.topSpace}>
              Bu kategori için ayrıntılı bir rehber henüz yok.
            </AppText>
          </Card>
        ) : (
          <>
            {guide.note ? (
              <Card style={styles.noteCard}>
                <AppText variant="subtitle">Güvenlik notu</AppText>
                <AppText style={styles.topSpace}>{guide.note}</AppText>
              </Card>
            ) : null}

            <Card>
              <AppText variant="subtitle">{guide.headline}</AppText>
              <View style={styles.topSpace}>
                <AppText variant="label">Yapılacaklar</AppText>
                <View style={styles.list}>
                  {guide.dos.map((t) => (
                    <View key={t} style={styles.listRow}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={styles.listIcon} />
                      <View style={styles.listText}>
                        <AppText variant="label">{splitGuideItem(t).title}</AppText>
                        {splitGuideItem(t).detail ? (
                          <AppText variant="caption" tone="muted" style={styles.listDetail}>
                            {splitGuideItem(t).detail}
                          </AppText>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.sectionSpace}>
                <AppText variant="label">Yapılmayacaklar</AppText>
                <View style={styles.list}>
                  {guide.donts.map((t) => (
                    <View key={t} style={styles.listRow}>
                      <Ionicons name="close-circle" size={18} color={colors.danger} style={styles.listIcon} />
                      <View style={styles.listText}>
                        <AppText variant="label">{splitGuideItem(t).title}</AppText>
                        {splitGuideItem(t).detail ? (
                          <AppText variant="caption" tone="muted" style={styles.listDetail}>
                            {splitGuideItem(t).detail}
                          </AppText>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  topSpace: { marginTop: spacing.sm },
  sectionSpace: { marginTop: spacing.lg },
  list: { marginTop: spacing.sm, gap: 6 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  listIcon: { marginTop: 2 },
  listText: { flex: 1, gap: 2 },
  listDetail: { marginTop: 2 },
  noteCard: { borderColor: colors.danger },
  binRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  binDot: { width: 16, height: 16, borderRadius: 999 },
  binText: { flex: 1, gap: 2 },
});
