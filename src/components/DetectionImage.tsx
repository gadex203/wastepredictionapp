import { useMemo, useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';

import type { Detection } from '../utils/types';
import { formatConfidence, getBinInfo } from '../utils/waste';
import { radii } from '../theme/tokens';

type Size = { width: number; height: number };

type Props = {
  uri: string;
  imageSize: Size;
  detections: Detection[];
};

function mapBox(
  box: { x: number; y: number; width: number; height: number },
  imageSize: Size,
  container: Size,
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

  return {
    x: offsetX + box.x * renderedWidth,
    y: offsetY + box.y * renderedHeight,
    width: box.width * renderedWidth,
    height: box.height * renderedHeight,
  };
}

export function DetectionImage({ uri, imageSize, detections }: Props) {
  const [container, setContainer] = useState<Size | null>(null);

  const boxes = useMemo(() => {
    if (!container) return [];
    return detections
      .filter((d) => d.box)
      .map((d) => {
        const box = mapBox(d.box!, imageSize, container);
        const labelText = `${getBinInfo(d.label).wasteLabel} ${formatConfidence(d.confidence)}`;
        const estWidth = Math.max(44, Math.min(container.width - 8, labelText.length * 7 + 16));

        let labelX = box.x + box.width + 6;
        if (labelX + estWidth > container.width - 4) {
          labelX = box.x - estWidth - 6;
        }
        labelX = Math.max(4, Math.min(container.width - estWidth - 4, labelX));
        const labelY = Math.max(4, Math.min(container.height - 22, box.y));

        return {
          ...box,
          stroke: getBinInfo(d.label).binColorHex,
          labelText,
          labelX,
          labelY,
          labelW: estWidth,
        };
      });
  }, [detections, imageSize, container]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainer({ width, height });
  };

  return (
    <View style={[styles.container, { aspectRatio: imageSize.width / imageSize.height }]} onLayout={onLayout}>
      <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      {container && boxes.length > 0 && (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', borderRadius: radii.card, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
});
