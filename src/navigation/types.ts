import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ModelResult, WasteType } from '../utils/types';

export type ScanStackParamList = {
  Scan: undefined;
  Result: {
    scanId: string;
    createdAt: string;
    photoUri: string;
    photoWidth: number;
    photoHeight: number;
    modelResult: ModelResult;
  };
};

export type LearnStackParamList = {
  LearnHome: undefined;
  LearnDetail: { wasteType: WasteType; source?: 'result' | 'learn' };
  Quiz: undefined;
};

export type StatsStackParamList = {
  Stats: undefined;
  History: undefined;
};

export type ChallengesStackParamList = {
  Challenges: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  About: undefined;
};

export type RootTabParamList = {
  ScanTab: NavigatorScreenParams<ScanStackParamList>;
  LearnTab: NavigatorScreenParams<LearnStackParamList>;
  StatsTab: NavigatorScreenParams<StatsStackParamList>;
  ChallengesTab: NavigatorScreenParams<ChallengesStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};
