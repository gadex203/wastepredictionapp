import type { Detection, ModelResult, WasteType } from '../utils/types';
import Constants from 'expo-constants';

export type InferenceMode = 'mock' | 'api' | 'device';
export type ModelOption = { id: string; label: string; version: string; kind?: string };

function readExtra(key: string): string | undefined {
  const extra: any =
    (Constants.expoConfig as any)?.extra ??
    (Constants as any).manifest?.extra ??
    (Constants as any).manifest2?.extra;
  const value = extra?.[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

function readInferenceMode(): InferenceMode {
  const raw = String(readExtra('EXPO_PUBLIC_INFERENCE_MODE') ?? process.env.EXPO_PUBLIC_INFERENCE_MODE ?? '')
    .trim()
    .toLowerCase();
  if (raw === 'api') return 'api';
  if (raw === 'device' || raw === 'onnx') return 'device';
  return 'mock';
}

function readInferenceBaseUrl(): string | null {
  const raw = String(readExtra('EXPO_PUBLIC_INFERENCE_URL') ?? process.env.EXPO_PUBLIC_INFERENCE_URL ?? '').trim();
  if (!raw) return null;
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function coerceModelOption(raw: any): ModelOption | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id ?? '').trim();
  const label = String(raw.label ?? '').trim();
  const version = String(raw.version ?? '').trim();
  if (!id || !label) return null;
  const kind = typeof raw.kind === 'string' ? raw.kind : undefined;
  return { id, label, version: version || id, ...(kind ? { kind } : null) };
}

export async function fetchAvailableModels(): Promise<{ models: ModelOption[]; defaultId?: string }> {
  const baseUrl = readInferenceBaseUrl();
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_INFERENCE_URL eksik');
  }

  try {
    const res = await fetch(`${baseUrl}/models`, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const json = (await res.json()) as any;
      const models = Array.isArray(json?.models)
        ? json.models.map(coerceModelOption).filter(Boolean)
        : [];
      const defaultId = typeof json?.default === 'string' ? json.default : undefined;
      if (models.length > 0) {
        return { models: models as ModelOption[], defaultId };
      }
    }
  } catch {
    // fall through to /health
  }

  const fallback = await fetch(`${baseUrl}/health`, { headers: { Accept: 'application/json' } });
  if (!fallback.ok) {
    throw new Error(`Modeller yüklenemedi (${fallback.status})`);
  }
  const health = (await fallback.json()) as any;
  const label = String(health?.modelVersion ?? 'api');
  return {
    models: [{ id: String(health?.modelId ?? 'default'), label, version: label }],
    defaultId: typeof health?.modelId === 'string' ? health.modelId : undefined,
  };
}

export function getInferenceStreamUrl(): string | null {
  const explicit = String(
    readExtra('EXPO_PUBLIC_INFERENCE_WS_URL') ?? process.env.EXPO_PUBLIC_INFERENCE_WS_URL ?? '',
  ).trim();
  if (explicit) return explicit;

  const baseUrl = readInferenceBaseUrl();
  if (!baseUrl) return null;
  const wsBase = baseUrl.replace(/^http/i, 'ws');
  return `${wsBase}/stream`;
}

export function getInferenceMode(): InferenceMode {
  return readInferenceMode();
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function getMinConfidenceThreshold(): number {
  const raw = readExtra('EXPO_PUBLIC_MIN_CONFIDENCE') ?? process.env.EXPO_PUBLIC_MIN_CONFIDENCE;
  const value = Number(raw);
  if (!Number.isFinite(value)) return 0.35;
  return clamp01(value > 1 ? value / 100 : value);
}

function readNumber(key: string): number | null {
  const raw = readExtra(key) ?? (process.env as Record<string, string | undefined>)[key];
  if (raw === undefined || raw === null || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function readClamped(key: string, fallback: number, min: number, max: number) {
  const value = readNumber(key);
  if (value === null) return fallback;
  return Math.min(max, Math.max(min, value));
}

function readInt(key: string, fallback: number, min: number, max: number) {
  const value = readNumber(key);
  if (value === null) return fallback;
  const rounded = Math.round(value);
  return Math.min(max, Math.max(min, rounded));
}

const DEFAULTS = {
  live: {
    imgsz: 320,
    conf: 0.25,
    iou: 0.7,
    maxDet: 200,
  },
  capture: {
    imgsz: 960,
    conf: 0.1,
    iou: 0.85,
    maxDet: 500,
  },
};

export type ApiConfig = { conf: number; iou: number; imgsz: number; maxDet: number };

export function getApiConfigForPurpose(purpose: 'live' | 'capture'): ApiConfig {
  const confBase = readNumber('EXPO_PUBLIC_API_CONF');
  const iouBase = readNumber('EXPO_PUBLIC_API_IOU');
  const maxDetBase = readNumber('EXPO_PUBLIC_API_MAX_DET');

  const conf =
    readClamped(`EXPO_PUBLIC_API_CONF_${purpose.toUpperCase()}`, confBase ?? DEFAULTS[purpose].conf, 0, 1);
  const iou =
    readClamped(`EXPO_PUBLIC_API_IOU_${purpose.toUpperCase()}`, iouBase ?? DEFAULTS[purpose].iou, 0.1, 0.99);
  const imgsz = readInt(
    `EXPO_PUBLIC_API_IMGSZ_${purpose.toUpperCase()}`,
    DEFAULTS[purpose].imgsz,
    160,
    1536,
  );
  const maxDet = readInt(
    `EXPO_PUBLIC_API_MAX_DET_${purpose.toUpperCase()}`,
    (maxDetBase ?? DEFAULTS[purpose].maxDet) as number,
    10,
    2000,
  );

  return { conf, iou, imgsz, maxDet };
}

const WASTE_TYPE_SET: ReadonlySet<WasteType> = new Set([
  'plastic',
  'paper',
  'glass',
  'metal',
  'battery',
  'unknown',
]);

function normalizeLabel(raw: unknown): WasteType {
  const label = String(raw ?? '').trim().toLowerCase();
  if (WASTE_TYPE_SET.has(label as WasteType)) return label as WasteType;

  // Common dataset/model variants → app categories
  if (label === 'cardboard') return 'paper';
  if (label === 'can' || label === 'aluminium' || label === 'aluminum' || label === 'tin') return 'metal';
  if (label === 'compost' || label === 'food' || label === 'food_waste' || label === 'organic') return 'unknown';

  return 'unknown';
}

function coerceDetections(raw: unknown): Detection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((d) => {
      if (!d || typeof d !== 'object') return null;
      const anyD = d as any;
      const confidence = Number(anyD.confidence);
      const boxRaw = anyD.box;
      const box =
        boxRaw && typeof boxRaw === 'object'
          ? {
              x: clamp01(Number((boxRaw as any).x)),
              y: clamp01(Number((boxRaw as any).y)),
              width: clamp01(Number((boxRaw as any).width)),
              height: clamp01(Number((boxRaw as any).height)),
            }
          : undefined;

      return {
        label: normalizeLabel(anyD.label),
        confidence: clamp01(confidence),
        ...(box ? { box } : null),
      } satisfies Detection;
    })
    .filter(Boolean) as Detection[];
}

async function runRemoteInference(params: {
  photoUri: string;
  imageWidth: number;
  imageHeight: number;
  timeoutMs?: number;
  query?: Record<string, string | number | boolean | undefined>;
  modelId?: string | null;
}): Promise<ModelResult> {
  const baseUrl = readInferenceBaseUrl();
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_INFERENCE_URL eksik');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.timeoutMs ?? 25_000);

  try {
    const formData = new FormData();
    formData.append(
      'file',
      {
        uri: params.photoUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any,
    );

    const queryPairs = Object.entries(params.query ?? {}).filter(([, v]) => v !== undefined) as Array<
      [string, string | number | boolean]
    >;
    const qs =
      queryPairs.length > 0
        ? queryPairs
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
            .join('&')
        : '';
    const url = qs ? `${baseUrl}/predict?${qs}` : `${baseUrl}/predict`;

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Inference API failed (${res.status}): ${text || res.statusText}`);
    }

    const json = (await res.json()) as any;
    return {
      modelVersion: String(json?.modelVersion ?? 'api'),
      modelId: typeof json?.modelId === 'string' ? json.modelId : undefined,
      ranAt: String(json?.ranAt ?? new Date().toISOString()),
      image: {
        width: Number(json?.image?.width ?? params.imageWidth),
        height: Number(json?.image?.height ?? params.imageHeight),
      },
      detections: coerceDetections(json?.detections),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runInference(params: {
  photoUri: string;
  imageWidth: number;
  imageHeight: number;
  purpose?: 'live' | 'capture';
  modelId?: string | null;
}): Promise<ModelResult> {
  const mode = readInferenceMode();
  if (mode === 'api') {
    const purpose = params.purpose ?? 'capture';
    const api = getApiConfigForPurpose(purpose);
    const query = {
      imgsz: api.imgsz,
      conf: api.conf,
      iou: api.iou,
      max_det: api.maxDet,
      model: params.modelId ?? undefined,
    };

    return await runRemoteInference({
      ...params,
      timeoutMs: purpose === 'live' ? 6_000 : 35_000,
      query,
    });
  }

  if (mode === 'device') {
    try {
      const { runDeviceInference } = await import('./deviceInference');
      return await runDeviceInference(params);
    } catch (error) {
      console.warn('[inference] Device inference failed; trying API.', error);
      return await runRemoteInference({ ...params });
    }
  }

  throw new Error('Mock tahmin devre dışı. EXPO_PUBLIC_INFERENCE_MODE=api veya device olarak ayarlayın.');
}
