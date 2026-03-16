export interface Drill {
  id: string;
  title: string;
  desc: string;
  completed: boolean;
}

export interface StrengthLog {
  date: string;
  exercise: string;
  weight: number;
  reps: number;
}

export interface CampTask {
  id: string;
  title: string;
  description: string;
  type: 'drill' | 'conditioning' | 'recovery';
  verificationCriteria: string;
  completed: boolean;
  xpReward: number;
}

export interface FightCamp {
  id: string;
  title: string;
  description: string;
  durationWeeks: number;
  currentDay: number;
  tasks: CampTask[];
  progress: number;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  height?: string;
  weight?: number;
  gender?: 'Male' | 'Female';
  weightClass?: string;
  targetWeightClass?: string;
  competitionLevel?: 'Hobbyist' | 'Amateur' | 'Professional';
  baseStyle: string;
  stance: string;
  striking: number;
  grappling: number;
  clinch: number;
  archetype: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate?: string;
  activeDrills: Drill[];
  analysisHistory: string[];
  activeCamp?: FightCamp | null;
  badges?: string[];
  isPro?: boolean;
  coins?: number;
  dailyQuests?: { id: string; desc: string; completed: boolean; reward: number }[];
  unlockedModules?: string[];
  strengthLogs?: StrengthLog[];
}
