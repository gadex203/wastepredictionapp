import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ScanStackParamList } from '../../navigation/types';
import type { WasteType } from '../../utils/types';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { IconBadge } from '../../components/IconBadge';
import { DetectionImage } from '../../components/DetectionImage';
import { colors, spacing } from '../../theme/tokens';
import { formatConfidence, getBinInfo } from '../../utils/waste';
import { useAppDispatch, useAppState } from '../../state/AppStateProvider';
import { notify } from '../../utils/haptics';
import { getMinConfidenceThreshold } from '../../data/inference';

type Props = NativeStackScreenProps<ScanStackParamList, 'Result'>;

const MANUAL_TYPES: WasteType[] = ['plastic', 'paper', 'glass', 'metal', 'battery'];

export function ResultScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const { settings } = useAppState();

  const { scanId, createdAt, photoUri, photoWidth, photoHeight, modelResult } = route.params;
  const minConfidence = getMinConfidenceThreshold();
  const detections = useMemo(() => {
    return [...modelResult.detections]
      .filter((d) => d.confidence >= minConfidence)
      .sort((a, b) => b.confidence - a.confidence);
  }, [modelResult.detections, minConfidence]);
  const primary = detections[0];
  const detectedTypes = useMemo(() => {
    const unique = new Map<WasteType, number>();
    for (const d of detections) {
      if (d.label === 'unknown') continue;
      const prev = unique.get(d.label) ?? 0;
      unique.set(d.label, Math.max(prev, d.confidence));
    }
    return [...unique.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label]) => label);
  }, [detections]);

  const [confirmed, setConfirmed] = useState(false);
  const [showAnalyzing, setShowAnalyzing] = useState(true);
  const [selectedWasteType, setSelectedWasteType] = useState<WasteType>(() => {
    if (!primary) return 'unknown';
    return primary.label;
  });

  const bin = getBinInfo(selectedWasteType);
  const isSelectionRequired = selectedWasteType === 'unknown';

  useEffect(() => {
    if (settings.reduceMotion) {
      setShowAnalyzing(false);
      return;
    }
    const handle = setTimeout(() => setShowAnalyzing(false), 650);
    return () => clearTimeout(handle);
  }, [settings.reduceMotion]);

  const confirm = async () => {
    if (confirmed) return;
    if (isSelectionRequired) {
      Alert.alert('Kategori seçin', 'Ayırmayı onaylamak için bir atık türü seçin.');
      return;
    }

    const confirmedAt = new Date().toISOString();
    dispatch({
      type: 'CONFIRM_SCAN',
      payload: {
        scan: { id: scanId, createdAt, photoUri, modelResult },
        selectedWasteType,
        confirmedAt,
      },
    });
    setConfirmed(true);
    await notify(settings.hapticsEnabled);
  };

  const retake = () => navigation.goBack();

  const learnMore = () => {
    if (isSelectionRequired) {
      Alert.alert('Kategori seçin', 'Önce bir atık türü seçin, sonra Daha fazla bilgi’ye dokunun.');
      return;
    }
    const parent = navigation.getParent();
    parent?.navigate('LearnTab', {
      screen: 'LearnDetail',
      params: { wasteType: selectedWasteType, source: 'result' },
    });
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <AppText variant="title">Sonuçlar</AppText>
            <AppText variant="caption" tone="muted">
              Model: {modelResult.modelVersion}
            </AppText>
          </View>
          {confirmed ? <AppText variant="label">Kaydedildi</AppText> : null}
        </View>

        <Card style={styles.card} padded={false}>
          <View style={styles.imageWrap}>
            <DetectionImage
              uri={photoUri}
              imageSize={{ width: photoWidth, height: photoHeight }}
              detections={detections}
            />
          </View>
        </Card>

        {showAnalyzing ? (
          <Card style={styles.card}>
            <AppText variant="subtitle">Analiz ediliyor…</AppText>
            <AppText tone="muted" style={styles.topSpace}>
              Model çıktısı ve kutu yönlendirmesi yorumlanıyor.
            </AppText>
          </Card>
        ) : (
          <>
            <Card style={styles.card}>
              <AppText variant="subtitle">Hedef Atık Kutusu</AppText>
              {detectedTypes.length > 1 ? (
                <View style={[styles.topSpace, styles.bins]}>
                  {detectedTypes.map((t) => {
                    const info = getBinInfo(t);
                    return (
                      <View key={t} style={styles.binRow}>
                        <View style={[styles.binDot, { backgroundColor: info.binColorHex }]} />
                        <View style={styles.binText}>
                          <AppText variant="label">{info.binLabel}</AppText>
                          <AppText variant="caption" tone="muted">
                            {info.wasteLabel} Atık ({info.binColorName} Kutu). Not: Yerel belediye kurallarını
                            öncelikli olarak dikkate alınız.
                          </AppText>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={[styles.binRow, styles.topSpace]}>
                  <View style={[styles.binDot, { backgroundColor: bin.binColorHex }]} />
                  <View style={styles.binText}>
                    <AppText variant="label">{bin.binLabel}</AppText>
                    <AppText variant="caption" tone="muted">
                      {bin.wasteLabel} Atık ({bin.binColorName} Kutu). Not: Yerel belediye kurallarını öncelikli
                      olarak dikkate alınız.
                    </AppText>
                  </View>
                </View>
              )}
            </Card>

            <Card style={styles.card}>
              <AppText variant="subtitle">Tarama Sonucu</AppText>
              {modelResult.detections.length === 0 ? (
                <AppText tone="muted" style={styles.topSpace}>
                  Bu öğeyi tanımlayamadık. Daha iyi ışıkta deneyin veya aşağıdan kategori seçin.
                </AppText>
              ) : detections.length === 0 ? (
                <AppText tone="muted" style={styles.topSpace}>
                  Tespitler %{Math.round(minConfidence * 100)} güvenin altındaydı. Lütfen manuel onaylayın.
                </AppText>
              ) : (
                <View style={[styles.topSpace, styles.detections]}>
                  {detections.map((d, idx) => (
                    <View key={`${d.label}-${idx}`} style={styles.detectionRow}>
                      <IconBadge wasteType={d.label} size="sm" />
                      <AppText variant="caption" tone="muted" style={styles.detectionLabel}>
                        {getBinInfo(d.label).wasteLabel} ({formatConfidence(d.confidence)} Eşleşme)
                      </AppText>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            <Card style={styles.card}>
              <AppText variant="subtitle">Sınıflandırmayı Doğrula</AppText>
              <AppText variant="caption" tone="muted" style={styles.topSpace}>
                Puan kazanmak ve veri kalitesini artırmak için uygun kategoriyi seçin.
              </AppText>
              <View style={styles.chips}>
                {MANUAL_TYPES.map((t) => (
                  <Chip
                    key={t}
                    label={getBinInfo(t).wasteLabel}
                    selected={selectedWasteType === t}
                    onPress={() => setSelectedWasteType(t)}
                  />
                ))}
              </View>
            </Card>
          </>
        )}

        <View style={styles.actions}>
          <Button
            title={confirmed ? 'Onaylandı' : 'Ayırmayı Onayla (+10 Puan)'}
            onPress={confirm}
            disabled={confirmed || showAnalyzing}
          />
          <View style={styles.row}>
            <Button title="Yeniden çek" variant="secondary" onPress={retake} />
            <Button
              title="Daha fazla bilgi"
              variant="secondary"
              onPress={learnMore}
              disabled={showAnalyzing || isSelectionRequired}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { gap: 2 },
  card: {},
  imageWrap: { padding: spacing.md },
  topSpace: { marginTop: spacing.sm },
  bins: { gap: spacing.md },
  binRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  binDot: { width: 16, height: 16, borderRadius: 999 },
  binText: { flex: 1, gap: 2 },
  detections: { gap: spacing.sm },
  detectionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  detectionLabel: { flex: 1 },
  detectionConfidence: { minWidth: 48, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  actions: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
});
