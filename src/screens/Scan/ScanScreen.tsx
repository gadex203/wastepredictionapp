import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  PinchGestureHandler,
  State as GestureState,
  type PinchGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ScanStackParamList } from '../../navigation/types';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { DetectionOverlay } from '../../components/DetectionOverlay';
import { Screen } from '../../components/Screen';
import { colors, radii, spacing } from '../../theme/tokens';
import { LEARN_CARDS, type LearnCard } from '../../data/learnContent';
import {
  fetchAvailableModels,
  getApiConfigForPurpose,
  getInferenceMode,
  getInferenceStreamUrl,
  getMinConfidenceThreshold,
  runInference,
  type ModelOption,
} from '../../data/inference';
import { createId } from '../../utils/id';
import { impact } from '../../utils/haptics';
import type { WasteType } from '../../utils/types';
import { sleep } from '../../utils/sleep';
import { getBinInfo } from '../../utils/waste';
import { useAppDispatch, useAppState } from '../../state/AppStateProvider';

type Props = NativeStackScreenProps<ScanStackParamList, 'Scan'>;

export function ScanScreen({ navigation }: Props) {
  const { settings } = useAppState();
  const dispatch = useAppDispatch();
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [zoom, setZoom] = useState(0);
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveFrameSize, setLiveFrameSize] = useState<{ width: number; height: number } | null>(null);
  const [liveDetections, setLiveDetections] = useState<Awaited<ReturnType<typeof runInference>>['detections']>([]);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [loadingTip, setLoadingTip] = useState<LearnCard | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const liveTokenRef = useRef(0);
  const pinchStartZoomRef = useRef(0);
  const liveBusyRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const insets = useSafeAreaInsets();

  const inferenceMode = getInferenceMode();
  const streamUrl = getInferenceStreamUrl();
  const selectedModelId = settings.selectedModelId;
  const selectedModel =
    modelOptions.find((option) => option.id === selectedModelId) ?? modelOptions[0] ?? null;
  const modelLabel = (() => {
    if (inferenceMode === 'device') return 'Cihazda';
    if (inferenceMode === 'mock') return 'Simülasyon';
    if (modelsLoading) return 'Yükleniyor…';
    if (modelsError) return 'Kullanılamıyor';
    return selectedModel?.label ?? 'Varsayılan';
  })();
  const canSelectModel = inferenceMode === 'api' && modelOptions.length > 1;

  const setZoomClamped = (value: number) => setZoom(Math.max(0, Math.min(1, value)));

  const onPinchEvent = (e: PinchGestureHandlerGestureEvent) => {
    if (isAnalyzing) return;
    const scale = e.nativeEvent.scale;
    if (!Number.isFinite(scale) || scale <= 0) return;
    const delta = Math.log(scale) / Math.log(2); // scale 2x => +1
    const next = pinchStartZoomRef.current + delta * 0.35;
    setZoomClamped(next);
  };

  const onPinchStateChange = (e: PinchGestureHandlerGestureEvent) => {
    if (e.nativeEvent.state === GestureState.BEGAN) {
      pinchStartZoomRef.current = zoom;
    }
    if (
      e.nativeEvent.state === GestureState.END ||
      e.nativeEvent.state === GestureState.CANCELLED ||
      e.nativeEvent.state === GestureState.FAILED
    ) {
      pinchStartZoomRef.current = zoom;
    }
  };

  const toggleFacing = () => {
    setModelMenuOpen(false);
    if (liveEnabled) {
      setLiveEnabled(false);
      liveTokenRef.current += 1;
      setLiveDetections([]);
      setLiveFrameSize(null);
      setLiveError(null);
    }
    wsRef.current?.close();
    wsRef.current = null;
    liveBusyRef.current = false;
    setTorchEnabled(false);
    setIsCameraReady(false);
    setZoom(0);
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const toggleTorch = () => {
    if (facing !== 'back') {
      Alert.alert('Flaş kullanılamıyor', 'Flaşı kullanmak için arka kameraya geçin.');
      return;
    }
    setTorchEnabled((prev) => !prev);
  };

  const toggleModelMenu = () => {
    if (!canSelectModel || isAnalyzing) return;
    setModelMenuOpen((prev) => !prev);
  };

  const selectModel = async (modelId: string) => {
    if (isAnalyzing) return;
    if (liveEnabled) {
      setLiveEnabled(false);
      liveTokenRef.current += 1;
      setLiveDetections([]);
      setLiveFrameSize(null);
      setLiveError(null);
      wsRef.current?.close();
      wsRef.current = null;
      liveBusyRef.current = false;
      await sleep(80);
    }
    dispatch({ type: 'SET_SELECTED_MODEL', payload: { modelId } });
    setModelMenuOpen(false);
  };

  const resolveAssetSize = async (asset: ImagePicker.ImagePickerAsset) => {
    if (asset.width && asset.height) {
      return { width: asset.width, height: asset.height };
    }
    return await new Promise<{ width: number; height: number }>((resolve, reject) => {
      Image.getSize(
        asset.uri,
        (width, height) => resolve({ width, height }),
        (error) => reject(error),
      );
    });
  };

  const pickImage = async () => {
    if (isAnalyzing) return;
    setModelMenuOpen(false);

    if (liveEnabled) {
      setLiveEnabled(false);
      liveTokenRef.current += 1;
      setLiveDetections([]);
      setLiveFrameSize(null);
      setLiveError(null);
      wsRef.current?.close();
      wsRef.current = null;
      liveBusyRef.current = false;
      await sleep(80);
    }

    setTorchEnabled(false);

    let asset: ImagePicker.ImagePickerAsset | undefined;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (result.canceled || !result.assets?.length) return;
      asset = result.assets[0];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      Alert.alert('Fotoğraf seçme hatası', message);
      return;
    }

    if (!asset?.uri) return;

    setIsAnalyzing(true);
    await impact(settings.hapticsEnabled);

    try {
      const { width, height } = await resolveAssetSize(asset);
      const createdAt = new Date().toISOString();
      const modelResult = await runInference({
        photoUri: asset.uri,
        imageWidth: width,
        imageHeight: height,
        purpose: 'capture',
        modelId: selectedModelId,
      });

      navigation.navigate('Result', {
        scanId: createId('scan'),
        createdAt,
        photoUri: asset.uri,
        photoWidth: width,
        photoHeight: height,
        modelResult,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      Alert.alert(
        'Tahmin başarısız',
        message.includes('EXPO_PUBLIC_INFERENCE_URL')
          ? 'EXPO_PUBLIC_INFERENCE_URL eksik. .env.local dosyasını güncelleyin ve Expo’yu yeniden başlatın.'
          : `Tahmin sunucusuna ulaşılamadı. /health adresini kontrol edip tekrar deneyin.\n\n${message}`,
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const liveSummary = useMemo(() => {
    const unique = new Map<WasteType, number>();
    for (const d of liveDetections) {
      if (d.label === 'unknown') continue;
      unique.set(d.label, Math.max(unique.get(d.label) ?? 0, d.confidence));
    }
    const top = [...unique.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
    if (top.length === 0) return null;
    return top
      .map(([label, confidence]) => `${getBinInfo(label).wasteLabel} ${Math.round(confidence * 100)}%`)
      .join(' • ');
  }, [liveDetections]);

  useEffect(() => {
    if (!isAnalyzing) {
      setLoadingTip(null);
      return;
    }
    const tipCards = LEARN_CARDS.filter((card) => card.type === 'tip');
    if (tipCards.length === 0) {
      setLoadingTip(null);
      return;
    }
    const nextTip = tipCards[Math.floor(Math.random() * tipCards.length)];
    setLoadingTip(nextTip);
  }, [isAnalyzing]);

  useEffect(() => {
    if (inferenceMode !== 'api') {
      setModelOptions([]);
      setModelsError(null);
      setModelsLoading(false);
      setModelMenuOpen(false);
      return;
    }

    let active = true;
    setModelsLoading(true);
    setModelsError(null);

    fetchAvailableModels()
      .then(({ models, defaultId }) => {
        if (!active) return;
        setModelOptions(models);
        setModelsLoading(false);
        const hasSelected = selectedModelId && models.some((m) => m.id === selectedModelId);
        const nextId = hasSelected ? selectedModelId : defaultId ?? models[0]?.id ?? null;
        if (nextId !== selectedModelId) {
          dispatch({ type: 'SET_SELECTED_MODEL', payload: { modelId: nextId } });
        }
      })
      .catch((error) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Model listesi yüklenemedi';
        setModelsError(message);
        setModelsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [inferenceMode, streamUrl]);

  useEffect(() => {
    if (!liveEnabled) return;
    if (!isCameraReady) return;
    if (isAnalyzing) return;
    if (inferenceMode === 'mock') {
      setLiveEnabled(false);
      Alert.alert(
        'Canlı mod için tahmin gerekir',
        'EXPO_PUBLIC_INFERENCE_MODE=api veya device olarak ayarlayın ve Expo’yu yeniden başlatın.',
      );
      return;
    }

    const token = ++liveTokenRef.current;
    let cancelled = false;
    setLiveError(null);

    if (streamUrl) {
      const ws = new WebSocket(streamUrl);
      wsRef.current = ws;
      liveBusyRef.current = false;
      let frameId = 0;

      const sendFrame = async () => {
        if (cancelled || liveTokenRef.current !== token) return;
        if (liveBusyRef.current) return;
        const camera = cameraRef.current;
        if (!camera || ws.readyState !== 1) return;

        liveBusyRef.current = true;
        try {
          const frame = await camera.takePictureAsync({
            quality: 0.3,
            skipProcessing: true,
            shutterSound: false,
            base64: true,
          });

          if (!frame.base64) {
            liveBusyRef.current = false;
            return;
          }

          const api = getApiConfigForPurpose('live');
          frameId += 1;
          ws.send(
            JSON.stringify({
              id: frameId,
              image: frame.base64,
              width: frame.width,
              height: frame.height,
              model: selectedModelId ?? undefined,
              conf: api.conf,
              iou: api.iou,
              max_det: api.maxDet,
              imgsz: api.imgsz,
            }),
          );
        } catch (error) {
          liveBusyRef.current = false;
          if (cancelled || liveTokenRef.current !== token) return;
          const message = error instanceof Error ? error.message : 'Canlı çekim başarısız';
          setLiveError(message);
        }
      };

      const scheduleNext = () => {
        if (cancelled || liveTokenRef.current !== token) return;
        setTimeout(() => {
          void sendFrame();
        }, 250);
      };

      ws.onopen = () => {
        void sendFrame();
      };
      ws.onmessage = (event) => {
        if (cancelled || liveTokenRef.current !== token) return;
        liveBusyRef.current = false;
        try {
          const payload = JSON.parse(String(event.data));
          if (payload?.error) {
            setLiveError(String(payload.error));
            scheduleNext();
            return;
          }
          const detections = Array.isArray(payload?.detections) ? payload.detections : [];
          const minConfidence = getMinConfidenceThreshold();
          setLiveDetections(
            detections.filter((d: any) => Number(d?.confidence ?? 0) >= minConfidence),
          );
          const width = Number(payload?.image?.width ?? 0);
          const height = Number(payload?.image?.height ?? 0);
          if (width > 0 && height > 0) {
            setLiveFrameSize({ width, height });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Canlı yanıt alınamadı';
          setLiveError(message);
        }
        scheduleNext();
      };
      ws.onerror = () => {
        if (cancelled || liveTokenRef.current !== token) return;
        setLiveError('Canlı bağlantı kurulamadı.');
        setLiveEnabled(false);
      };
      ws.onclose = () => {
        liveBusyRef.current = false;
      };

      return () => {
        cancelled = true;
        try {
          ws.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
        liveBusyRef.current = false;
      };
    }

    const run = async () => {
      while (!cancelled && liveTokenRef.current === token) {
        const camera = cameraRef.current;
        if (!camera) break;
        if (isAnalyzing) break;

        try {
          const frame = await camera.takePictureAsync({
            quality: 0.15,
            skipProcessing: true,
            shutterSound: false,
          });

          const result = await runInference({
            photoUri: frame.uri,
            imageWidth: frame.width,
            imageHeight: frame.height,
            purpose: 'live',
            modelId: selectedModelId,
          });

          if (cancelled || liveTokenRef.current !== token) break;
          setLiveFrameSize({ width: frame.width, height: frame.height });
          const minConfidence = getMinConfidenceThreshold();
          setLiveDetections(result.detections.filter((d) => d.confidence >= minConfidence));
        } catch (error) {
          if (cancelled || liveTokenRef.current !== token) break;
          const message = error instanceof Error ? error.message : 'Canlı çekim başarısız';
          setLiveError(message);
        }

        await sleep(900);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [liveEnabled, isCameraReady, isAnalyzing, inferenceMode, streamUrl]);

  const toggleLive = () => {
    if (isAnalyzing) return;
    if (inferenceMode === 'mock') {
      Alert.alert(
        'Canlı mod için tahmin gerekir',
        'EXPO_PUBLIC_INFERENCE_MODE=api veya device olarak ayarlayın ve Expo’yu yeniden başlatın.',
      );
      return;
    }
    setModelMenuOpen(false);
    setLiveEnabled((prev) => {
      const next = !prev;
      if (!next) {
        setLiveDetections([]);
        setLiveFrameSize(null);
        setLiveError(null);
        wsRef.current?.close();
        wsRef.current = null;
        liveBusyRef.current = false;
      }
      return next;
    });
  };

  const takePicture = async () => {
    if (!isCameraReady || isAnalyzing) return;
    const camera = cameraRef.current;
    if (!camera) return;
    setModelMenuOpen(false);

    if (liveEnabled) {
      setLiveEnabled(false);
      liveTokenRef.current += 1;
      setLiveDetections([]);
      setLiveFrameSize(null);
      setLiveError(null);
      wsRef.current?.close();
      wsRef.current = null;
      liveBusyRef.current = false;
      await sleep(80);
    }

    setIsAnalyzing(true);
    await impact(settings.hapticsEnabled);

    try {
      const createdAt = new Date().toISOString();
      const picture = await camera.takePictureAsync({ quality: 0.9, shutterSound: false });
      setTorchEnabled(false);
      const modelResult = await runInference({
        photoUri: picture.uri,
        imageWidth: picture.width,
        imageHeight: picture.height,
        purpose: 'capture',
        modelId: selectedModelId,
      });

      navigation.navigate('Result', {
        scanId: createId('scan'),
        createdAt,
        photoUri: picture.uri,
        photoWidth: picture.width,
        photoHeight: picture.height,
        modelResult,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      Alert.alert(
        'Tahmin başarısız',
        message.includes('EXPO_PUBLIC_INFERENCE_URL')
          ? 'EXPO_PUBLIC_INFERENCE_URL eksik. .env.local dosyasını güncelleyin ve Expo’yu yeniden başlatın.'
          : `Tahmin sunucusuna ulaşılamadı. /health adresini kontrol edip tekrar deneyin.\n\n${message}`,
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!permission) {
    return (
      <Screen style={styles.center} padded={false}>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen style={styles.permissionScreen} padded={false}>
        <AppText variant="title">Tarama</AppText>
        <AppText tone="muted" style={styles.permissionText}>
          Atığınızın fotoğrafını çekebilmek için kamera izni gerekiyor.
        </AppText>

        <Card style={styles.permissionCard}>
          <AppText variant="subtitle">Kamera izni</AppText>
          <AppText tone="muted" style={styles.permissionText}>
            İzni reddettiyseniz Ayarlar’dan etkinleştirebilirsiniz.
          </AppText>
          <View style={styles.permissionActions}>
            <Button title="İzin ver" onPress={() => requestPermission()} />
            <Button title="Ayarları aç" variant="secondary" onPress={() => Linking.openSettings()} />
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mirror={facing === 'front'}
          zoom={zoom}
          enableTorch={torchEnabled && facing === 'back'}
          onCameraReady={() => setIsCameraReady(true)}
        />

        {liveEnabled && liveFrameSize ? (
          <DetectionOverlay
            imageSize={liveFrameSize}
            detections={liveDetections}
            mirrored={facing === 'front'}
          />
        ) : null}

        <View
          style={[styles.topOverlay, { paddingTop: insets.top + spacing.lg }]}
          pointerEvents="box-none"
        >
          <View style={styles.topRow}>
            <View style={styles.topText}>
              <AppText variant="subtitle" style={styles.overlayTitle}>
                Atığınızın fotoğrafını çekin
              </AppText>
              <AppText variant="caption" tone="muted">
                Sonuçlar yalnızca yönlendirme amaçlıdır—her zaman yerel kurallara uyun.
              </AppText>
              <View style={styles.modelRow}>
                <AppText variant="caption" tone="muted">
                  Model:
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Model seç"
                  onPress={toggleModelMenu}
                  disabled={!canSelectModel || isAnalyzing}
                  style={({ pressed }) => [
                    styles.modelButton,
                    pressed && !isAnalyzing && styles.modelButtonPressed,
                    (!canSelectModel || isAnalyzing) && styles.modelButtonDisabled,
                  ]}
                >
                  <AppText variant="caption" style={styles.modelButtonLabel}>
                    {modelLabel}
                  </AppText>
                  {canSelectModel ? (
                    <Ionicons
                      name={modelMenuOpen ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.muted}
                    />
                  ) : null}
                </Pressable>
              </View>
              {modelMenuOpen && canSelectModel ? (
                <View style={styles.modelMenu}>
                  {modelOptions.map((option) => {
                    const isActive = option.id === selectedModelId;
                    return (
                      <Pressable
                        key={option.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${option.label} modelini seç`}
                        onPress={() => void selectModel(option.id)}
                        style={({ pressed }) => [
                          styles.modelMenuItem,
                          isActive && styles.modelMenuItemActive,
                          pressed && styles.modelMenuItemPressed,
                        ]}
                      >
                        <AppText variant="caption" style={styles.modelMenuLabel}>
                          {option.label}
                        </AppText>
                        {isActive ? <Ionicons name="checkmark" size={16} color={colors.text} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
              {modelsError ? (
                <AppText variant="caption" tone="muted" style={styles.modelError}>
                  Model listesi alınamadı: {modelsError}
                </AppText>
              ) : null}
              {liveEnabled ? (
                <AppText variant="caption" tone="muted" style={styles.liveText}>
                  Canlı: {liveSummary ?? '…'}
                </AppText>
              ) : null}
              {liveError ? (
                <AppText variant="caption" tone="muted" style={styles.liveError}>
                  Canlı hata: {liveError}
                </AppText>
              ) : null}
            </View>

            <View style={styles.topActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={torchEnabled ? 'Flaşı kapat' : 'Flaşı aç'}
                onPress={toggleTorch}
                disabled={isAnalyzing}
                style={({ pressed }) => [
                  styles.flipButton,
                  torchEnabled && styles.torchButtonOn,
                  pressed && !isAnalyzing && styles.flipButtonPressed,
                  isAnalyzing && styles.flipButtonDisabled,
                ]}
              >
                <Ionicons
                  name={torchEnabled ? 'flashlight' : 'flashlight-outline'}
                  size={20}
                  color={torchEnabled ? '#0f172a' : colors.text}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Canlı algılamayı aç/kapat"
                onPress={toggleLive}
                disabled={isAnalyzing}
                style={({ pressed }) => [
                  styles.liveButton,
                  liveEnabled && styles.liveButtonOn,
                  pressed && !isAnalyzing && styles.flipButtonPressed,
                  isAnalyzing && styles.flipButtonDisabled,
                ]}
              >
                <AppText variant="caption" style={[styles.liveLabel, liveEnabled && styles.liveLabelOn]}>
                  CANLI
                </AppText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Kamerayı çevir"
                onPress={toggleFacing}
                disabled={isAnalyzing}
                style={({ pressed }) => [
                  styles.flipButton,
                  pressed && !isAnalyzing && styles.flipButtonPressed,
                  isAnalyzing && styles.flipButtonDisabled,
                ]}
              >
                <Ionicons name="camera-reverse-outline" size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={[styles.bottomOverlay, { bottom: insets.bottom + spacing.xl }]}>
          <View style={styles.captureRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Galeriden fotoğraf seç"
              onPress={pickImage}
              disabled={isAnalyzing}
              style={({ pressed }) => [
                styles.galleryButton,
                pressed && !isAnalyzing && styles.flipButtonPressed,
                isAnalyzing && styles.flipButtonDisabled,
              ]}
            >
              <Ionicons name="images-outline" size={20} color={colors.text} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fotoğraf çek"
              onPress={takePicture}
              disabled={isAnalyzing}
              style={({ pressed }) => [
                styles.captureOuter,
                pressed && !isAnalyzing && styles.capturePressed,
                isAnalyzing && styles.captureDisabled,
              ]}
            >
              <View style={styles.captureInner} />
            </Pressable>

            <View style={styles.actionPlaceholder} />
          </View>

          {zoom > 0 ? (
            <AppText variant="caption" style={styles.zoomText}>
              Yakınlaştırma %{Math.round(zoom * 100)}
            </AppText>
          ) : null}
        </View>

        {isAnalyzing && (
          <View style={styles.analyzingOverlay}>
            <View style={styles.analyzingCenter}>
              <ActivityIndicator color={colors.bg} />
              <AppText variant="label" style={styles.analyzingText}>
                Analiz ediliyor…
              </AppText>
            </View>
            {loadingTip ? (
              <View style={styles.analyzingTip}>
                <AppText variant="caption" style={styles.analyzingTipTitle}>
                  {loadingTip.title}
                </AppText>
                <AppText variant="caption" style={styles.analyzingTipBody}>
                  {loadingTip.body}
                </AppText>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </PinchGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permissionScreen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  permissionCard: { marginTop: spacing.xl },
  permissionText: { marginTop: spacing.sm },
  permissionActions: { marginTop: spacing.lg, gap: spacing.md },

  topOverlay: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  topText: { flex: 1 },
  overlayTitle: { marginBottom: spacing.xs },
  modelRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  modelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  modelButtonPressed: { transform: [{ scale: 0.98 }] },
  modelButtonDisabled: { opacity: 0.7 },
  modelButtonLabel: { color: colors.text },
  modelMenu: {
    marginTop: spacing.xs,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.98)',
  },
  modelMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  modelMenuItemActive: { backgroundColor: 'rgba(15, 23, 42, 0.08)' },
  modelMenuItemPressed: { backgroundColor: 'rgba(15, 23, 42, 0.12)' },
  modelMenuLabel: { color: colors.text },
  modelError: { marginTop: spacing.xs, color: '#ef4444' },
  liveText: { marginTop: spacing.xs },
  liveError: { marginTop: spacing.xs, color: '#ef4444' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveButton: {
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveButtonOn: {
    backgroundColor: 'rgba(239,68,68,0.95)',
    borderColor: 'rgba(239,68,68,0.95)',
  },
  liveLabel: { color: colors.text, fontWeight: '700', letterSpacing: 1 },
  liveLabelOn: { color: '#fff' },
  torchButtonOn: {
    backgroundColor: 'rgba(251,191,36,0.95)',
    borderColor: 'rgba(251,191,36,0.95)',
  },
  flipButtonPressed: { transform: [{ scale: 0.98 }] },
  flipButtonDisabled: { opacity: 0.7 },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  galleryButton: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPlaceholder: {
    width: 52,
    height: 52,
  },
  zoomText: {
    color: colors.bg,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  captureOuter: {
    width: 84,
    height: 84,
    borderRadius: radii.pill,
    borderWidth: 5,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  captureInner: {
    width: 62,
    height: 62,
    borderRadius: radii.pill,
    backgroundColor: colors.bg,
  },
  capturePressed: { transform: [{ scale: 0.98 }] },
  captureDisabled: { opacity: 0.7 },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingCenter: { alignItems: 'center', gap: spacing.md },
  analyzingText: { color: colors.bg },
  analyzingTip: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    gap: spacing.xs,
  },
  analyzingTipTitle: { color: colors.bg, textAlign: 'center' },
  analyzingTipBody: { color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
});
