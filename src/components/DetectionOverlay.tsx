import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';

import type { Detection } from '../utils/types';
import { formatConfidence, getBinInfo } from '../utils/waste';

type Size = { width: number; height: number };

type Props = {
  imageSize: Size;
  detections: Detection[];
  mirrored?: boolean;
};

function mapBox(
  box: { x: number; y: number; width: number; height: number },
  imageSize: Size,
  container: Size,
  mirrored: boolean,
) {
  const originalAR = imageSize.width / imageSize.height;
  const containerAR = container.width / container.height;

  let renderedWidth = container.width;
  let renderedHeight = container.height;
  let offsetX = 0;
  let offsetY = 0;

  if (Number.isFinite(originalAR) && Number.isFinite(containerAR) && originalAR > 0 && containerAR > 0) {
    if (originalAR > containerAR) {
      renderedWidth = container.width;
      renderedHeight = container.width / originalAR;
      offsetY = (container.height - renderedHeight) / 2;
    } else {
      renderedHeight = container.height;
      renderedWidth = container.height * originalAR;
      offsetX = (container.width - renderedWidth) / 2;
    }
  }

  const xNorm = mirrored ? 1 - box.x - box.width : box.x;

  return {
    x: offsetX + xNorm * renderedWidth,
    y: offsetY + box.y * renderedHeight,
    width: box.width * renderedWidth,
    height: box.height * renderedHeight,
  };
}

export function DetectionOverlay({ imageSize, detections, mirrored }: Props) {
  const [container, setContainer] = useState<Size | null>(null);

  const boxes = useMemo(() => {
    if (!container) return [];
    return detections
      .filter((d) => d.box)
      .map((d) => {
        const b = mapBox(d.box!, imageSize, container, Boolean(mirrored));
        const labelText = `${getBinInfo(d.label).wasteLabel} ${formatConfidence(d.confidence)}`;
        const estWidth = Math.max(44, Math.min(container.width - 8, labelText.length * 7 + 16));

        let labelX = b.x + b.width + 6;
        if (labelX + estWidth > container.width - 4) {
          labelX = b.x - estWidth - 6;
        }
        labelX = Math.max(4, Math.min(container.width - estWidth - 4, labelX));
        const labelY = Math.max(4, Math.min(container.height - 22, b.y));

        return {
          ...b,
          stroke: getBinInfo(d.label).binColorHex,
          labelText,
          labelX,
          labelY,
          labelW: estWidth,
        };
      });
  }, [detections, imageSize, container, mirrored]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainer({ width, height });
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      {container && boxes.length > 0 ? (
        <Svg width={container.width} height={container.height} style={StyleSheet.absoluteFill}>
          {boxes.map((b, idx) => (
            <G key={`${idx}-${b.x}-${b.y}`}>
              <Rect
                x={b.x}
                y={b.y}
                width={b.width}
                height={b.height}
                fill="transparent"
                stroke={b.stroke}
                strokeWidth={3}
                rx={10}
                ry={10}
              />
              <Rect x={b.labelX} y={b.labelY} width={b.labelW} height={18} rx={7} ry={7} fill={b.stroke} />
              <SvgText
                x={b.labelX + 8}
                y={b.labelY + 13}
                fill="#fff"
                fontSize={12}
                fontWeight="700"
              >
                {b.labelText}
              </SvgText>
            </G>
          ))}
        </Svg>
      ) : null}
    </View>
  );
}
