import * as Haptics from 'expo-haptics';

export async function impact(enabled: boolean, style = Haptics.ImpactFeedbackStyle.Light) {
  if (!enabled) return;
  try {
    await Haptics.impactAsync(style);
  } catch {}
}

export async function notify(
  enabled: boolean,
  type = Haptics.NotificationFeedbackType.Success,
) {
  if (!enabled) return;
  try {
    await Haptics.notificationAsync(type);
  } catch {}
}

