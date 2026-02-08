export type ChallengeId = 'scan_5_week' | 'scan_3_types_week' | 'quiz_2_week';

export type WeeklyChallengeDefinition = {
  id: ChallengeId;
  title: string;
  description: string;
  target: number;
  rewardPoints: number;
  kind: 'scan_count' | 'unique_types' | 'quiz_count';
};

export const WEEKLY_CHALLENGES: WeeklyChallengeDefinition[] = [
  {
    id: 'scan_5_week',
    title: '5 öğe tara',
    description: 'Bu hafta 5 öğeyi onayla.',
    target: 5,
    rewardPoints: 25,
    kind: 'scan_count',
  },
  {
    id: 'scan_3_types_week',
    title: '3 atık türü',
    description: 'Bu hafta 3 farklı atık türünü onayla.',
    target: 3,
    rewardPoints: 20,
    kind: 'unique_types',
  },
  {
    id: 'quiz_2_week',
    title: 'Quiz pratiği',
    description: 'Bu hafta 2 quiz oturumu tamamla.',
    target: 2,
    rewardPoints: 15,
    kind: 'quiz_count',
  },
];
