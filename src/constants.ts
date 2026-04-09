export const AI_COSTS = {
  VIDEO_ANALYSIS: 10, // Increased from 8 to 10
  SNC_VIDEO_ANALYSIS: 10, // Increased from 8 to 10
  LIVE_COACH: 5, // Increased from 2 to 5
  STRATEGY_ADVISOR: 5, // Increased from 2 to 5
  CAMP_VERIFICATION: 20, // Increased from 12 to 20
  PROFILE_UPDATE: 5, // Increased from 4 to 5
  STRENGTH_LAYER_LOG: 10, // Increased from 6 to 10
  KNOWLEDGE_BASE_UPLOAD: 5, // Increased from 2 to 5
  DAILY_REGEN: 2,
  WATCH_AD: 2,
};

export const XP_REWARDS = {
  VIDEO_ANALYSIS_BASE: 50,
  DAILY_QUEST: 100,
  CAMP_TASK: 150,
  DAILY_CHECK_IN: 250,
  STRENGTH_SESSION: 300,
};

export const COIN_REWARDS = {
  STRENGTH_SESSION: 150,
};

export const MODULE_COSTS = {
  FUNDAMENTALS: 0,
  ADVANCED_STRIKING: 300,
  WRESTLING_CHAIN: 500,
  SUBMISSION_ESCAPES: 800,
  CLINCH_MASTERY: 1200,
  CHAMP_MENTALITY: 2000,
};

export const SUBSCRIPTION_PRICES = {
  PRO_MONTHLY: 14.99,
};

export const COIN_PACKAGES = [
  { id: 'small', credits: 50, price: 15, title: 'Small Bundle', description: 'Quick boost for 5-10 analyses' },
  { id: 'medium', credits: 100, price: 25, title: 'Medium Bundle', description: 'Core bundle for ~2 weeks heavy use', popular: true },
  { id: 'large', credits: 250, price: 50, title: 'Large Bundle', description: 'Whale tier for monthly max' },
];

export const QUEST_REWARDS = {
  VIDEO_ANALYSIS: 100,
  LIVE_COACH: 150,
  STREAK_3_DAY: 300,
  STRENGTH_SESSION: 50,
  MOBILITY_SESSION: 30,
  NEW_PR: 100,
};

export const CAMP_XP_REWARDS = {
  DRILL_HIGH: 150,
  CONDITIONING_MEDIUM: 100,
  RECOVERY_LOW: 50,
  CONDITIONING_HIGH: 200,
};

export const INITIAL_USER_STATS = {
  AI_CREDITS: 0, // No free trial credits
  XP: 100,
  LEVEL: 1,
  COINS: 500,
};

export const PRO_USER_STATS = {
  AI_CREDITS: 1000, // Pro user gets 1,000 V-Coins monthly (refreshed)
};

export const LEVEL_XP_THRESHOLD = 1000;
