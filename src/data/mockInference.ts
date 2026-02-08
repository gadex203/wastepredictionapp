import type { Detection, ModelResult } from '../utils/types';
import { sleep } from '../utils/sleep';

let runCount = 0;

function resultFor(imageWidth: number, imageHeight: number, detections: Detection[]): ModelResult {
  return {
    modelVersion: 'mock-v1',
    ranAt: new Date().toISOString(),
    image: { width: imageWidth, height: imageHeight },
    detections,
  };
}

export async function runMockInference(params: {
  imageWidth: number;
  imageHeight: number;
}): Promise<ModelResult> {
  runCount = (runCount + 1) % 5;
  await sleep(650);

  switch (runCount) {
    case 0:
      return resultFor(params.imageWidth, params.imageHeight, [
        {
          label: 'plastic',
          confidence: 0.92,
          box: { x: 0.18, y: 0.22, width: 0.46, height: 0.38 },
        },
      ]);
    case 1:
      return resultFor(params.imageWidth, params.imageHeight, [
        { label: 'paper', confidence: 0.86 },
      ]);
    case 2:
      return resultFor(params.imageWidth, params.imageHeight, [
        {
          label: 'metal',
          confidence: 0.84,
          box: { x: 0.22, y: 0.32, width: 0.36, height: 0.28 },
        },
        { label: 'plastic', confidence: 0.73 },
      ]);
    case 3:
      return resultFor(params.imageWidth, params.imageHeight, []);
    case 4:
      return resultFor(params.imageWidth, params.imageHeight, [
        { label: 'battery', confidence: 0.52, box: { x: 0.34, y: 0.44, width: 0.24, height: 0.18 } },
      ]);
    default:
      return resultFor(params.imageWidth, params.imageHeight, []);
  }
}

