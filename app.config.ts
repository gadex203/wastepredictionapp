import fs from 'fs';
import path from 'path';

import type { ExpoConfig, ConfigContext } from 'expo/config';

import appJson from './app.json';

type DotEnvMap = Record<string, string>;

function parseDotEnv(contents: string): DotEnvMap {
  const out: DotEnvMap = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadDotEnvFile(filename: string): DotEnvMap {
  try {
    const filePath = path.resolve(__dirname, filename);
    if (!fs.existsSync(filePath)) return {};
    return parseDotEnv(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function applyDotEnvToProcessEnv(map: DotEnvMap) {
  for (const [key, value] of Object.entries(map)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export default ({ config }: ConfigContext): ExpoConfig => {
  // Ensure `.env` and `.env.local` are respected for config + runtime (Windows/PowerShell friendly).
  applyDotEnvToProcessEnv(loadDotEnvFile('.env'));
  applyDotEnvToProcessEnv(loadDotEnvFile('.env.local'));

  const base = (appJson as any).expo as ExpoConfig;
  const merged: ExpoConfig = {
    ...base,
    ...config,
    extra: {
      ...(base.extra ?? {}),
      ...(config.extra ?? {}),
      eas: {
        projectId: process.env.EAS_PROJECT_ID ?? '2d2e7c1b-fd0b-4b0a-8b8a-c6e0f02574f7',
      },
      EXPO_PUBLIC_INFERENCE_MODE: process.env.EXPO_PUBLIC_INFERENCE_MODE ?? 'mock',
      EXPO_PUBLIC_INFERENCE_URL: process.env.EXPO_PUBLIC_INFERENCE_URL ?? '',
      EXPO_PUBLIC_INFERENCE_WS_URL: process.env.EXPO_PUBLIC_INFERENCE_WS_URL ?? '',
      EXPO_PUBLIC_MIN_CONFIDENCE: process.env.EXPO_PUBLIC_MIN_CONFIDENCE ?? '',
      EXPO_PUBLIC_API_CONF: process.env.EXPO_PUBLIC_API_CONF ?? '',
      EXPO_PUBLIC_API_CONF_LIVE: process.env.EXPO_PUBLIC_API_CONF_LIVE ?? '',
      EXPO_PUBLIC_API_CONF_CAPTURE: process.env.EXPO_PUBLIC_API_CONF_CAPTURE ?? '',
      EXPO_PUBLIC_API_IOU: process.env.EXPO_PUBLIC_API_IOU ?? '',
      EXPO_PUBLIC_API_IOU_LIVE: process.env.EXPO_PUBLIC_API_IOU_LIVE ?? '',
      EXPO_PUBLIC_API_IOU_CAPTURE: process.env.EXPO_PUBLIC_API_IOU_CAPTURE ?? '',
      EXPO_PUBLIC_API_MAX_DET: process.env.EXPO_PUBLIC_API_MAX_DET ?? '',
      EXPO_PUBLIC_API_MAX_DET_LIVE: process.env.EXPO_PUBLIC_API_MAX_DET_LIVE ?? '',
      EXPO_PUBLIC_API_MAX_DET_CAPTURE: process.env.EXPO_PUBLIC_API_MAX_DET_CAPTURE ?? '',
      EXPO_PUBLIC_API_IMGSZ_LIVE: process.env.EXPO_PUBLIC_API_IMGSZ_LIVE ?? '',
      EXPO_PUBLIC_API_IMGSZ_CAPTURE: process.env.EXPO_PUBLIC_API_IMGSZ_CAPTURE ?? '',
      EXPO_PUBLIC_ONNX_MODEL_URL: process.env.EXPO_PUBLIC_ONNX_MODEL_URL ?? '',
      EXPO_PUBLIC_ONNX_MODEL_NAME: process.env.EXPO_PUBLIC_ONNX_MODEL_NAME ?? '',
    },
  };

  return merged;
};
