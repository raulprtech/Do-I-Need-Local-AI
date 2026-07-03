import { CloudModelId, CloudPlanId, UsageModelSelection, UsageProfile } from '../types';

export const CLOUD_MODEL_PROFILES: Record<CloudModelId, { name: string; score: number; ratePerMillion: number }> = {
  'gpt-4o': { name: 'GPT-4o', score: 96, ratePerMillion: 7.5 },
  'claude-sonnet': { name: 'Claude Sonnet', score: 95, ratePerMillion: 9 },
  'gemini-pro': { name: 'Gemini Pro', score: 92, ratePerMillion: 5 },
  'deepseek-chat': { name: 'DeepSeek Chat', score: 86, ratePerMillion: 1.2 },
  'gpt-4o-mini': { name: 'GPT-4o mini', score: 72, ratePerMillion: 0.25 },
};

export const CLOUD_PLAN_PROFILES: Record<CloudPlanId, { name: string; monthlyUsd: number }> = {
  'chatgpt-plus': { name: 'ChatGPT Plus', monthlyUsd: 20 },
  'chatgpt-pro': { name: 'ChatGPT Pro', monthlyUsd: 200 },
  'claude-pro': { name: 'Claude Pro', monthlyUsd: 20 },
  'claude-max': { name: 'Claude Max', monthlyUsd: 100 },
  'gemini-advanced': { name: 'Gemini Advanced', monthlyUsd: 20 },
  'cursor-pro': { name: 'Cursor Pro', monthlyUsd: 20 },
  'custom': { name: 'Custom plan', monthlyUsd: 0 },
};

export const ACTIVE_DAYS_PER_MONTH: Record<UsageProfile['frequency'], number> = {
  occasional: 8,
  daily: 30,
  heavy: 30,
  production: 30,
};

export const REQUESTS_PER_HOUR: Record<UsageProfile['frequency'], number> = {
  occasional: 2,
  daily: 8,
  heavy: 25,
  production: 120,
};

const fallbackRatePerMillion: Record<UsageProfile['modelSizePreference'], number> = {
  small: 0.25,
  medium: 0.75,
  large: 10,
  any: 1.5,
};

export function getTokensPerRequest(goal: UsageProfile['goal']): number {
  const tokensPerRequest: Record<UsageProfile['goal'], number> = {
    chat: 1200,
    coding: 4000,
    agents: 6000,
    rag: 5000,
    vision: 2500,
    embedding: 800,
  };

  return tokensPerRequest[goal];
}

export function getActiveModelMix(usage: UsageProfile): UsageModelSelection[] {
  return usage.modelMix?.filter((item) => item.hoursPerDay > 0 || (item.billingMode === 'plan' && item.monthlyPlanUsd > 0)) ?? [];
}

export function getModelMixItemCost(item: UsageModelSelection, usage: UsageProfile): number {
  if (item.billingMode === 'plan') {
    const planPrice = item.monthlyPlanUsd || CLOUD_PLAN_PROFILES[item.planId]?.monthlyUsd || 0;
    return Math.max(0, planPrice);
  }

  const profile = CLOUD_MODEL_PROFILES[item.modelId] ?? CLOUD_MODEL_PROFILES['gpt-4o-mini'];
  const requestsPerMonth = item.hoursPerDay * REQUESTS_PER_HOUR[usage.frequency] * ACTIVE_DAYS_PER_MONTH[usage.frequency];
  const tokensPerMonth = requestsPerMonth * getTokensPerRequest(item.goal);
  return (tokensPerMonth / 1000000) * profile.ratePerMillion;
}

export function estimateApiCostMonthly(usage: UsageProfile): number {
  const activeModelMix = getActiveModelMix(usage);
  if (activeModelMix.length > 0) {
    return activeModelMix.reduce((total, item) => total + getModelMixItemCost(item, usage), 0);
  }

  const requestsPerMonth = usage.hoursPerDay * REQUESTS_PER_HOUR[usage.frequency] * ACTIVE_DAYS_PER_MONTH[usage.frequency];
  const tokensPerMonth = requestsPerMonth * getTokensPerRequest(usage.goal);
  return (tokensPerMonth / 1000000) * fallbackRatePerMillion[usage.modelSizePreference];
}
