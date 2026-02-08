export type BadgeId = 'first_scan' | 'plastic_hero' | 'battery_aware' | 'streak_7';

export type BadgeDefinition = {
  id: BadgeId;
  title: string;
  description: string;
};

export const BADGES: BadgeDefinition[] = [
  { id: 'first_scan', title: 'İlk Tarama', description: 'İlk ayırma sonucunu onayla.' },
  { id: 'plastic_hero', title: 'Plastik Kahramanı', description: '10 plastik öğeyi onayla.' },
  {
    id: 'battery_aware',
    title: 'Pil Bilinçli',
    description: 'Pil güvenliği rehberini oku ve bir pil öğesini onayla.',
  },
  { id: 'streak_7', title: '7 Günlük Seri', description: '7 gün aktif kal.' },
];
