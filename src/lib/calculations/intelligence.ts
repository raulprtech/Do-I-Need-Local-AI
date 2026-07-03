import { ModelCapability, UsageGoal, UsageModelSelection, UsageProfile } from '../types';
import { CLOUD_MODEL_PROFILES, getActiveModelMix } from './apiCost';

export function estimateFrontierScore(usage: UsageProfile): number {
  const activeModelMix = getActiveModelMix(usage);
  if (activeModelMix.length > 0) {
    return activeModelMix.reduce((total, item) => total + ((CLOUD_MODEL_PROFILES[item.modelId]?.score ?? 72) * Math.max(item.hoursPerDay, 1)), 0) /
      activeModelMix.reduce((total, item) => total + Math.max(item.hoursPerDay, 1), 0);
  }

  return usage.modelSizePreference === 'large'
    ? 95
    : usage.modelSizePreference === 'small'
      ? 72
      : 88;
}

export function bestLocalByGoal(goal: UsageGoal, usefulLocalModels: ModelCapability[]): ModelCapability | undefined {
  return usefulLocalModels
    .filter((model) => model.idealUseCases.includes(goal))
    .sort((a, b) => b.intelligenceScore - a.intelligenceScore)[0] ??
    usefulLocalModels.sort((a, b) => b.intelligenceScore - a.intelligenceScore)[0];
}

export function getComparisonGoals(usage: UsageProfile): UsageGoal[] {
  const activeModelMix: UsageModelSelection[] = getActiveModelMix(usage);
  const comparisonGoals = activeModelMix.length > 0
    ? activeModelMix.map((item) => item.goal)
    : [usage.goal];

  return Array.from(new Set(comparisonGoals));
}
