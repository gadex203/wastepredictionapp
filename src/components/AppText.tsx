import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors } from '../theme/tokens';

type Variant = 'title' | 'subtitle' | 'body' | 'caption' | 'label';

type Props = TextProps & {
  variant?: Variant;
  tone?: 'default' | 'muted';
};

export function AppText({ variant = 'body', tone = 'default', style, ...props }: Props) {
  return (
    <Text
      {...props}
      style={[
        styles.base,
        variant === 'title' && styles.title,
        variant === 'subtitle' && styles.subtitle,
        variant === 'caption' && styles.caption,
        variant === 'label' && styles.label,
        tone === 'muted' && styles.muted,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { color: colors.text, fontSize: 16, lineHeight: 22 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '600' },
  subtitle: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18 },
  muted: { color: colors.muted },
});

