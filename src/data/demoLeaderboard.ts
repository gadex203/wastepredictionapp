export type LeaderboardEntry = {
  id: string;
  name: string;
  points: number;
};

export const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'u1', name: 'Maya', points: 240 },
  { id: 'u2', name: 'Omar', points: 210 },
  { id: 'u3', name: 'Sara', points: 180 },
  { id: 'u4', name: 'Lina', points: 150 },
  { id: 'u5', name: 'Sen', points: 0 },
];
