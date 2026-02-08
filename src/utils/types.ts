export type WasteType =
  | 'plastic'
  | 'paper'
  | 'glass'
  | 'metal'
  | 'battery'
  | 'unknown';

export type NormalizedBoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Detection = {
  label: WasteType;
  confidence: number;
  box?: NormalizedBoundingBox;
};

export type ModelResult = {
  modelVersion: string;
  modelId?: string;
  ranAt: string;
  image: { width: number; height: number };
  detections: Detection[];
};

export type ScanConfirmation = {
  selectedWasteType: WasteType;
  confirmedAt: string;
  awardedPoints: number;
};

export type ScanHistoryItem = {
  id: string;
  createdAt: string;
  photoUri: string;
  modelResult: ModelResult;
  confirmation: ScanConfirmation;
};
