import { colors } from '../theme/tokens';
import type { WasteType } from './types';

export const WASTE_TYPES: WasteType[] = [
  'plastic',
  'paper',
  'glass',
  'metal',
  'battery',
  'unknown',
];

export type BinInfo = {
  wasteType: WasteType;
  wasteLabel: string;
  binColorName: string;
  binColorHex: string;
  binLabel: string;
  icon: string;
};

const BIN_INFO: Record<WasteType, BinInfo> = {
  plastic: {
    wasteType: 'plastic',
    wasteLabel: 'Plastik',
    binColorName: 'Sarı',
    binColorHex: colors.yellow,
    binLabel: 'Plastik (Sarı Kutu)',
    icon: 'water-outline',
  },
  paper: {
    wasteType: 'paper',
    wasteLabel: 'Kağıt',
    binColorName: 'Mavi',
    binColorHex: colors.blue,
    binLabel: 'Kağıt (Mavi Kutu)',
    icon: 'document-text-outline',
  },
  glass: {
    wasteType: 'glass',
    wasteLabel: 'Cam',
    binColorName: 'Yeşil',
    binColorHex: colors.green,
    binLabel: 'Cam (Yeşil Kutu)',
    icon: 'wine-outline',
  },
  metal: {
    wasteType: 'metal',
    wasteLabel: 'Metal',
    binColorName: 'Gri',
    binColorHex: colors.gray,
    binLabel: 'Metal (Gri Kutu)',
    icon: 'hardware-chip-outline',
  },
  battery: {
    wasteType: 'battery',
    wasteLabel: 'Pil',
    binColorName: 'Kırmızı',
    binColorHex: colors.red,
    binLabel: 'Tehlikeli (Kırmızı Kutu)',
    icon: 'flash-outline',
  },
  unknown: {
    wasteType: 'unknown',
    wasteLabel: 'Bilinmiyor',
    binColorName: 'Nötr',
    binColorHex: colors.neutral,
    binLabel: 'Lütfen manuel onaylayın',
    icon: 'help-circle-outline',
  },
};

export function getBinInfo(wasteType: WasteType): BinInfo {
  return BIN_INFO[wasteType] ?? BIN_INFO.unknown;
}

export function formatConfidence(confidence: number) {
  const pct = Math.round(Math.max(0, Math.min(1, confidence)) * 100);
  return `${pct}%`;
}
