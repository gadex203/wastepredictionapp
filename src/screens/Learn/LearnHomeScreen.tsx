import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { LearnStackParamList } from '../../navigation/types';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { IconBadge } from '../../components/IconBadge';
import { Screen } from '../../components/Screen';
import { LEARN_CARDS, type LearnCardType, WASTE_GUIDES } from '../../data/learnContent';
import { spacing } from '../../theme/tokens';
import { getBinInfo } from '../../utils/waste';

type Props = NativeStackScreenProps<LearnStackParamList, 'LearnHome'>;

const FILTERS: { label: string; value: LearnCardType | 'all' }[] = [
  { label: 'Tümü', value: 'all' },
  { label: 'İpuçları', value: 'tip' },
  { label: 'Mitler', value: 'myth' },
  { label: 'Etki', value: 'impact' },
];

export function LearnHomeScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<LearnCardType | 'all'>('all');
  const cards = filter === 'all' ? LEARN_CARDS : LEARN_CARDS.filter((c) => c.type === filter);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AppText variant="title">Öğren</AppText>
          <AppText tone="muted" style={styles.topSpace}>
            Hızlı rehberler, mitler ve kısa bir quiz.
          </AppText>
        </View>

        <Card>
          <AppText variant="subtitle">Geri Dönüşüm Quiz’i</AppText>
          <AppText tone="muted" style={styles.topSpace}>
            Ayırma pratiği için 5 kısa soru.
          </AppText>
          <View style={styles.topSpace}>
            <Button title="Quiz’e Başla" onPress={() => navigation.navigate('Quiz')} />
          </View>
        </Card>

        <Card>
          <AppText variant="subtitle">Ayırma rehberleri</AppText>
          <AppText variant="caption" tone="muted" style={styles.topSpace}>
            Doğru geri dönüşüm için bir kategori seçin.
          </AppText>
          <View style={styles.guides}>
            {WASTE_GUIDES.map((g) => (
              <Pressable
                key={g.wasteType}
                accessibilityRole="button"
                onPress={() => navigation.navigate('LearnDetail', { wasteType: g.wasteType, source: 'learn' })}
                style={({ pressed }) => [styles.guidePressable, pressed && styles.pressed]}
              >
                <Card padded={false} style={styles.guideCard}>
                  <View style={styles.guideInner}>
                    <IconBadge wasteType={g.wasteType} size="sm" />
                    <AppText variant="caption" tone="muted">
                      {getBinInfo(g.wasteType).binColorName} Kutu
                    </AppText>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        </Card>

        <View>
          <AppText variant="subtitle">Kartlar</AppText>
          <View style={[styles.filters, styles.topSpace]}>
            {FILTERS.map((f) => (
              <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
            ))}
          </View>
        </View>

        {cards.map((c) => (
          <Card key={c.id}>
            <AppText variant="subtitle">{c.title}</AppText>
            <AppText tone="muted" style={styles.topSpace}>
              {c.body}
            </AppText>
            {c.wasteType ? (
              <View style={styles.topSpace}>
                <IconBadge wasteType={c.wasteType} size="sm" />
              </View>
            ) : null}
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: {},
  topSpace: { marginTop: spacing.sm },
  guides: { gap: spacing.md, marginTop: spacing.lg },
  guidePressable: { alignSelf: 'stretch' },
  guideCard: { alignSelf: 'stretch' },
  guideInner: { padding: spacing.lg, gap: spacing.sm },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pressed: { opacity: 0.85 },
});
