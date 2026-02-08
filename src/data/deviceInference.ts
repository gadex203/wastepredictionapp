import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { toByteArray } from 'base64-js';
import jpeg from 'jpeg-js';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

import type { Detection, ModelResult, WasteType } from '../utils/types';
import { getMinConfidenceThreshold } from './inference';

type Purpose = 'live' | 'capture';

type LetterboxInfo = {
  imgsz: number;
  scale: number;
  padX: number;
  padY: number;
  resizedWidth: number;
  resizedHeight: number;
};

const DEFAULT_IMGSZ_CAPTURE = 960;
const DEFAULT_IMGSZ_LIVE = 320;
const DEFAULT_NMS_IOU = 0.7;
const DEFAULT_DEDUPE_IOU = 0.85;
const DEFAULT_DEDUPE_MIN_AREA_RATIO = 0.85;
const DEFAULT_PAD_VALUE = 114 / 255; // YOLO letterbox default

const CLASS_TO_WASTE: Record<number, WasteType> = {
  0: 'glass', // cam
  1: 'paper', // kagit
  2: 'metal', // metal
  3: 'battery', // pil
  4: 'plastic', // plastik
};

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

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function nowIso() {
  return new Date().toISOString();
}

function getModelUrl(): string | null {
  const raw = String(readExtra('EXPO_PUBLIC_ONNX_MODEL_URL') ?? process.env.EXPO_PUBLIC_ONNX_MODEL_URL ?? '').trim();
  return raw ? raw : null;
}

function getModelLocalUri(): string {
  const name = String(readExtra('EXPO_PUBLIC_ONNX_MODEL_NAME') ?? process.env.EXPO_PUBLIC_ONNX_MODEL_NAME ?? '').trim();
  const filename = name || 'waste-best.onnx';
  if (!FileSystem.documentDirectory) {
    throw new Error('expo-file-system documentDirectory kullanılamıyor');
  }
  return `${FileSystem.documentDirectory}${filename}`;
}

async function ensureModelFile(): Promise<string> {
  const modelUrl = getModelUrl();
  if (!modelUrl) {
    throw new Error('EXPO_PUBLIC_ONNX_MODEL_URL eksik (.onnx dosyanızı barındırıp bu değişkeni ayarlayın)');
  }

  const localUri = getModelLocalUri();
  const info = await FileSystem.getInfoAsync(localUri);
  if (info.exists && typeof info.size === 'number' && info.size > 1024 * 1024) {
    return localUri;
  }

  const res = await FileSystem.downloadAsync(modelUrl, localUri);
  if (res.status !== 200) {
    throw new Error(`ONNX model indirilemedi (${res.status})`);
  }
  return res.uri;
}

let sessionPromise: Promise<InferenceSession> | null = null;
let sessionModelUri: string | null = null;

async function getSession(modelUri: string): Promise<InferenceSession> {
  if (sessionPromise && sessionModelUri === modelUri) return sessionPromise;
  sessionModelUri = modelUri;
  sessionPromise = InferenceSession.create(modelUri);
  return sessionPromise;
}

function computeLetterbox(imageWidth: number, imageHeight: number, imgsz: number): LetterboxInfo {
  const scale = Math.min(imgsz / imageWidth, imgsz / imageHeight);
  const resizedWidth = Math.max(1, Math.round(imageWidth * scale));
  const resizedHeight = Math.max(1, Math.round(imageHeight * scale));
  const padX = Math.floor((imgsz - resizedWidth) / 2);
  const padY = Math.floor((imgsz - resizedHeight) / 2);
  return { imgsz, scale, padX, padY, resizedWidth, resizedHeight };
}

async function makeInputTensor(params: {
  photoUri: string;
  imageWidth: number;
  imageHeight: number;
  imgsz: number;
}): Promise<{ tensor: Tensor; letterbox: LetterboxInfo }> {
  const letterbox = computeLetterbox(params.imageWidth, params.imageHeight, params.imgsz);

  const resized = await ImageManipulator.manipulateAsync(
    params.photoUri,
    [{ resize: { width: letterbox.resizedWidth, height: letterbox.resizedHeight } }],
    { base64: true, compress: 1, format: ImageManipulator.SaveFormat.JPEG },
  );

  if (!resized.base64) {
    throw new Error('Cihazda tahmin için görsel base64 olarak yüklenemedi');
  }

  const bytes = toByteArray(resized.base64);
  const decoded = jpeg.decode(bytes, { useTArray: true });
  const { width, height, data } = decoded;
  if (width !== letterbox.resizedWidth || height !== letterbox.resizedHeight) {
    // Defensive: if the platform returned different dimensions, recompute mapping.
    const next = computeLetterbox(params.imageWidth, params.imageHeight, params.imgsz);
    next.resizedWidth = width;
    next.resizedHeight = height;
    (letterbox as any).resizedWidth = width;
    (letterbox as any).resizedHeight = height;
    (letterbox as any).padX = next.padX;
    (letterbox as any).padY = next.padY;
    (letterbox as any).scale = next.scale;
  }

  const hw = params.imgsz * params.imgsz;
  const input = new Float32Array(3 * hw);
  input.fill(DEFAULT_PAD_VALUE);

  for (let y = 0; y < height; y++) {
    const dstY = y + letterbox.padY;
    if (dstY < 0 || dstY >= params.imgsz) continue;
    for (let x = 0; x < width; x++) {
      const dstX = x + letterbox.padX;
      if (dstX < 0 || dstX >= params.imgsz) continue;

      const srcIdx = (y * width + x) * 4;
      const r = data[srcIdx] / 255;
      const g = data[srcIdx + 1] / 255;
      const b = data[srcIdx + 2] / 255;
      const dstIdx = dstY * params.imgsz + dstX;

      input[dstIdx] = r;
      input[hw + dstIdx] = g;
      input[2 * hw + dstIdx] = b;
    }
  }

  const tensor = new Tensor('float32', input, [1, 3, params.imgsz, params.imgsz]);
  return { tensor, letterbox };
}

type XYXY = { x1: number; y1: number; x2: number; y2: number };

function iou(a: XYXY, b: XYXY) {
  const x1 = Math.max(a.x1, b.x1);
  const y1 = Math.max(a.y1, b.y1);
  const x2 = Math.min(a.x2, b.x2);
  const y2 = Math.min(a.y2, b.y2);
  const interW = Math.max(0, x2 - x1);
  const interH = Math.max(0, y2 - y1);
  const inter = interW * interH;
  const areaA = Math.max(0, a.x2 - a.x1) * Math.max(0, a.y2 - a.y1);
  const areaB = Math.max(0, b.x2 - b.x1) * Math.max(0, b.y2 - b.y1);
  const union = areaA + areaB - inter;
  if (union <= 0) return 0;
  return inter / union;
}

function nmsClassAware(items: Array<{ label: WasteType; confidence: number; box: XYXY }>, iouThreshold: number) {
  const sorted = [...items].sort((a, b) => b.confidence - a.confidence);
  const kept: typeof sorted = [];
  for (const cand of sorted) {
    let suppressed = false;
    for (const prev of kept) {
      if (prev.label !== cand.label) continue;
      if (iou(prev.box, cand.box) > iouThreshold) {
        suppressed = true;
        break;
      }
    }
    if (!suppressed) kept.push(cand);
  }
  return kept;
}

function dedupeOverlaps(
  items: Array<{ label: WasteType; confidence: number; box: XYXY }>,
  iouThreshold: number,
  minAreaRatio: number,
) {
  const sorted = [...items].sort((a, b) => b.confidence - a.confidence);
  const kept: typeof sorted = [];
  for (const cand of sorted) {
    let suppressed = false;
    const candArea = Math.max(0, cand.box.x2 - cand.box.x1) * Math.max(0, cand.box.y2 - cand.box.y1);
    for (const prev of kept) {
      if (prev.label === cand.label) continue;
      const overlap = iou(prev.box, cand.box);
      if (overlap < iouThreshold) continue;
      const prevArea =
        Math.max(0, prev.box.x2 - prev.box.x1) * Math.max(0, prev.box.y2 - prev.box.y1);
      const ratio = prevArea > 0 ? Math.min(candArea, prevArea) / Math.max(candArea, prevArea) : 0;
      if (ratio >= minAreaRatio) {
        suppressed = true;
        break;
      }
    }
    if (!suppressed) kept.push(cand);
  }
  return kept;
}

function parseYoloV8Output(output: Tensor, params: { nc: number; minConfidence: number }) {
  const data = output.data as Float32Array;
  const dims = output.dims;
  if (!Array.isArray(dims) || dims.length < 2) return [];

  const detections: Array<{ cls: number; score: number; box: XYXY }> = [];
  const nc = params.nc;
  const attrs = 4 + nc;

  const addCandidate = (x: number, y: number, w: number, h: number, scores: number[]) => {
    let bestCls = 0;
    let bestScore = 0;
    for (let i = 0; i < scores.length; i++) {
      if (scores[i] > bestScore) {
        bestScore = scores[i];
        bestCls = i;
      }
    }
    if (bestScore < params.minConfidence) return;
    const x1 = x - w / 2;
    const y1 = y - h / 2;
    detections.push({ cls: bestCls, score: bestScore, box: { x1, y1, x2: x1 + w, y2: y1 + h } });
  };

  if (dims.length === 3 && dims[0] === 1) {
    const d1 = dims[1];
    const d2 = dims[2];

    if (d1 === attrs) {
      // [1, attrs, n]
      const n = d2;
      for (let i = 0; i < n; i++) {
        const x = data[i];
        const y = data[n + i];
        const w = data[2 * n + i];
        const h = data[3 * n + i];
        const scores: number[] = [];
        for (let c = 0; c < nc; c++) scores.push(data[(4 + c) * n + i]);
        addCandidate(x, y, w, h, scores);
      }
      return detections;
    }

    if (d2 === attrs) {
      // [1, n, attrs]
      const n = d1;
      for (let i = 0; i < n; i++) {
        const base = i * attrs;
        const x = data[base + 0];
        const y = data[base + 1];
        const w = data[base + 2];
        const h = data[base + 3];
        const scores: number[] = [];
        for (let c = 0; c < nc; c++) scores.push(data[base + 4 + c]);
        addCandidate(x, y, w, h, scores);
      }
      return detections;
    }
  }

  if (dims.length === 2) {
    // [n, attrs]
    const n = dims[0];
    const cols = dims[1];
    if (cols >= attrs) {
      for (let i = 0; i < n; i++) {
        const base = i * cols;
        const x = data[base + 0];
        const y = data[base + 1];
        const w = data[base + 2];
        const h = data[base + 3];
        const scores: number[] = [];
        for (let c = 0; c < nc; c++) scores.push(data[base + 4 + c]);
        addCandidate(x, y, w, h, scores);
      }
      return detections;
    }
  }

  return detections;
}

function toAppDetections(params: {
  candidates: Array<{ cls: number; score: number; box: XYXY }>;
  letterbox: LetterboxInfo;
  originalWidth: number;
  originalHeight: number;
}) : Detection[] {
  const mapped = params.candidates
    .map((c) => {
      const label = CLASS_TO_WASTE[c.cls] ?? 'unknown';
      return { label, confidence: clamp01(c.score), box: c.box };
    })
    .filter((d) => d.label !== 'unknown');

  const nms = nmsClassAware(mapped, DEFAULT_NMS_IOU);
  const deduped = dedupeOverlaps(nms, DEFAULT_DEDUPE_IOU, DEFAULT_DEDUPE_MIN_AREA_RATIO);

  return deduped.map((d) => {
    // Undo letterbox padding and scaling.
    const x1 = (d.box.x1 - params.letterbox.padX) / params.letterbox.scale;
    const y1 = (d.box.y1 - params.letterbox.padY) / params.letterbox.scale;
    const x2 = (d.box.x2 - params.letterbox.padX) / params.letterbox.scale;
    const y2 = (d.box.y2 - params.letterbox.padY) / params.letterbox.scale;

    const clampedX1 = Math.max(0, Math.min(params.originalWidth, x1));
    const clampedY1 = Math.max(0, Math.min(params.originalHeight, y1));
    const clampedX2 = Math.max(0, Math.min(params.originalWidth, x2));
    const clampedY2 = Math.max(0, Math.min(params.originalHeight, y2));

    const boxW = Math.max(0, clampedX2 - clampedX1);
    const boxH = Math.max(0, clampedY2 - clampedY1);

    return {
      label: d.label,
      confidence: d.confidence,
      box: {
        x: clamp01(clampedX1 / params.originalWidth),
        y: clamp01(clampedY1 / params.originalHeight),
        width: clamp01(boxW / params.originalWidth),
        height: clamp01(boxH / params.originalHeight),
      },
    };
  });
}

export async function runDeviceInference(params: {
  photoUri: string;
  imageWidth: number;
  imageHeight: number;
  purpose?: Purpose;
  modelId?: string | null;
}): Promise<ModelResult> {
  const purpose: Purpose = params.purpose ?? 'capture';
  const imgsz = purpose === 'live' ? DEFAULT_IMGSZ_LIVE : DEFAULT_IMGSZ_CAPTURE;

  const modelUri = await ensureModelFile();
  const session = await getSession(modelUri);

  const { tensor, letterbox } = await makeInputTensor({
    photoUri: params.photoUri,
    imageWidth: params.imageWidth,
    imageHeight: params.imageHeight,
    imgsz,
  });

  const inputName = session.inputNames[0];
  if (!inputName) throw new Error('ONNX oturumunda giriş yok');
  const outputName = session.outputNames[0];
  if (!outputName) throw new Error('ONNX oturumunda çıkış yok');

  const outputs = await session.run({ [inputName]: tensor });
  const output = outputs[outputName] as Tensor | undefined;
  if (!output) throw new Error('ONNX inference returned no output');

  const minConfidence = getMinConfidenceThreshold();
  const candidates = parseYoloV8Output(output, { nc: 5, minConfidence });
  const detections = toAppDetections({
    candidates,
    letterbox,
    originalWidth: params.imageWidth,
    originalHeight: params.imageHeight,
  });

  return {
    modelVersion: `device:onnx`,
    modelId: 'device',
    ranAt: nowIso(),
    image: { width: params.imageWidth, height: params.imageHeight },
    detections,
  };
}
