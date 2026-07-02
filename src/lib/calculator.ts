import { evaluateCatalogEntry, MODEL_CATALOG } from './modelCatalog';
import { HardwareProfile, UsageProfile, Diagnosis, EconomicAnalysis, SoftwareRecommendation, CloudModelId, UsageGoal } from './types';

export const HARDWARE_PRESETS: Record<string, Partial<HardwareProfile>> = {
  'custom': { preset: 'custom' },
  'rtx3060': { preset: 'rtx3060', gpuMaker: 'NVIDIA', gpuName: 'RTX 3060', vramGB: 12, ramGB: 16, devicePriceUsd: 850 },
  'rtx4070tisuper': { preset: 'rtx4070tisuper', gpuMaker: 'NVIDIA', gpuName: 'RTX 4070 Ti Super', vramGB: 16, ramGB: 32, devicePriceUsd: 1600 },
  'rtx4090': { preset: 'rtx4090', gpuMaker: 'NVIDIA', gpuName: 'RTX 4090', vramGB: 24, ramGB: 64, devicePriceUsd: 3200 },
  'macmini_m4_16gb': { preset: 'macmini_m4_16gb', os: 'macOS', gpuMaker: 'Apple', gpuName: 'M4', vramGB: 12, ramGB: 16, devicePriceUsd: 799 },
  'm3max_64gb': { preset: 'm3max_64gb', os: 'macOS', gpuMaker: 'Apple', gpuName: 'M3 Max', vramGB: 48, ramGB: 64, devicePriceUsd: 3999 },
  'no_gpu': { preset: 'no_gpu', gpuMaker: 'None', gpuName: 'Integrated', vramGB: 0, ramGB: 16, devicePriceUsd: 600 },
};

export const CLOUD_MODEL_PROFILES: Record<CloudModelId, { name: string; score: number; ratePerMillion: number }> = {
  'gpt-4o': { name: 'GPT-4o', score: 96, ratePerMillion: 7.5 },
  'claude-sonnet': { name: 'Claude Sonnet', score: 95, ratePerMillion: 9 },
  'gemini-pro': { name: 'Gemini Pro', score: 92, ratePerMillion: 5 },
  'deepseek-chat': { name: 'DeepSeek Chat', score: 86, ratePerMillion: 1.2 },
  'gpt-4o-mini': { name: 'GPT-4o mini', score: 72, ratePerMillion: 0.25 },
};

function getTokensPerRequest(goal: UsageGoal): number {
  const tokensPerRequest: Record<UsageGoal, number> = {
    chat: 1200,
    coding: 4000,
    agents: 6000,
    rag: 5000,
    vision: 2500,
    embedding: 800,
  };

  return tokensPerRequest[goal];
}

function estimateApiCostMonthly(usage: UsageProfile): number {
  const activeDaysPerMonth: Record<UsageProfile['frequency'], number> = {
    occasional: 8,
    daily: 30,
    heavy: 30,
    production: 30,
  };
  const requestsPerHour: Record<UsageProfile['frequency'], number> = {
    occasional: 2,
    daily: 8,
    heavy: 25,
    production: 120,
  };
  const ratePerMillion: Record<UsageProfile['modelSizePreference'], number> = {
    small: 0.25,
    medium: 0.75,
    large: 10,
    any: 1.5,
  };

  const activeModelMix = usage.modelMix?.filter((item) => item.hoursPerDay > 0) ?? [];
  if (activeModelMix.length > 0) {
    return activeModelMix.reduce((total, item) => {
      const profile = CLOUD_MODEL_PROFILES[item.modelId] ?? CLOUD_MODEL_PROFILES['gpt-4o-mini'];
      const requestsPerMonth = item.hoursPerDay * requestsPerHour[usage.frequency] * activeDaysPerMonth[usage.frequency];
      const tokensPerMonth = requestsPerMonth * getTokensPerRequest(item.goal);
      return total + ((tokensPerMonth / 1000000) * profile.ratePerMillion);
    }, 0);
  }

  const requestsPerMonth =
    usage.hoursPerDay * requestsPerHour[usage.frequency] * activeDaysPerMonth[usage.frequency];
  const tokensPerMonth = requestsPerMonth * getTokensPerRequest(usage.goal);

  return (tokensPerMonth / 1000000) * ratePerMillion[usage.modelSizePreference];
}

function getEffectiveVramGB(hardware: HardwareProfile): number {
  if (hardware.gpuMaker === 'Apple') {
    return hardware.ramGB * 0.75;
  }

  return hardware.vramGB;
}

function getSoftwareRecommendations(_hardware: HardwareProfile, usage: UsageProfile): SoftwareRecommendation[] {
  if (usage.frequency === 'production' || usage.frequency === 'heavy') {
    return [
      { name: 'vLLM', url: 'https://github.com/vllm-project/vllm', description: 'Motor de inferencia de alto rendimiento para servidores y cargas concurrentes.' },
    ];
  }

  return [];
}

export function evaluateSystem(hardware: HardwareProfile, usage: UsageProfile, t: (key: string) => string): Diagnosis {
  const effectiveVram = getEffectiveVramGB(hardware);
  const recommendedModels = MODEL_CATALOG.map((model) => evaluateCatalogEntry(model, effectiveVram, hardware.ramGB, t));
  const canRunLocal = effectiveVram >= 6 || hardware.ramGB >= 16;
  const usefulLocalModels = recommendedModels.filter((model) => model.canRun && model.speed !== 'unusable');
  const hasUsefulLocalOption = canRunLocal && usefulLocalModels.length > 0;

  const monthlyApiCost = estimateApiCostMonthly(usage);
  const activeModelMix = usage.modelMix?.filter((item) => item.hoursPerDay > 0) ?? [];
  const frontierScore = activeModelMix.length > 0
    ? activeModelMix.reduce((total, item) => total + ((CLOUD_MODEL_PROFILES[item.modelId]?.score ?? 72) * item.hoursPerDay), 0) /
      activeModelMix.reduce((total, item) => total + item.hoursPerDay, 0)
    : usage.modelSizePreference === 'large'
      ? 95
      : usage.modelSizePreference === 'small'
        ? 72
        : 88;
  const includesHardwarePurchase = hardware.purchaseStatus === 'planned';
  const hardwarePurchaseCostUsd = includesHardwarePurchase ? (hardware.devicePriceUsd || 0) : 0;
  const hardwareAmortizationMonthly = hardwarePurchaseCostUsd / 24;
  const inferenceHoursPerDay = usage.hoursPerDay * 0.25;
  const kW = hardware.gpuMaker === 'NVIDIA' ? 0.3 : hardware.gpuMaker === 'Apple' ? 0.05 : 0.12;
  const electricityCostMonthly = inferenceHoursPerDay * kW * 30 * usage.electricityCostPerKwh;
  const totalLocalMonthly = hardwareAmortizationMonthly + electricityCostMonthly;

  let breakevenMonths = -1;
  if (monthlyApiCost > electricityCostMonthly) {
    breakevenMonths = includesHardwarePurchase ? hardwarePurchaseCostUsd / (monthlyApiCost - electricityCostMonthly) : 0;
  }

  let verdict: EconomicAnalysis['verdict'] = 'api';
  let verdictMessage = '';
  const localIsCheaperMonthly = monthlyApiCost > totalLocalMonthly;
  const quickBreakeven = breakevenMonths > 0 && breakevenMonths <= 12;
  const mediumBreakeven = breakevenMonths > 12 && breakevenMonths <= 24;
  const likelyNeedsCloudToo = usage.frequency === 'production' || usage.modelSizePreference === 'large' || usage.goal === 'agents';

  if (usage.needsPrivacy || usage.offlineRequired) {
    verdict = 'local';
    verdictMessage = t('calc.verdict.mandatory');
  } else if (!hasUsefulLocalOption) {
    verdict = 'api';
    verdictMessage = t('calc.verdict.api_hardware_limit');
  } else if (localIsCheaperMonthly || quickBreakeven) {
    verdict = likelyNeedsCloudToo ? 'hybrid' : 'local';
    verdictMessage = verdict === 'hybrid'
      ? t('calc.verdict.hybrid_scale')
      : localIsCheaperMonthly
        ? t('calc.verdict.local_hours')
        : `${t('calc.verdict.local_breakeven')}${Math.ceil(breakevenMonths)}${t('calc.verdict.local_breakeven_months')}`;
  } else if (mediumBreakeven || likelyNeedsCloudToo || usage.frequency === 'daily') {
    verdict = 'hybrid';
    verdictMessage = t('calc.verdict.hybrid_balanced');
  } else {
    verdict = 'api';
    verdictMessage = t('calc.verdict.api_cheaper');
  }

  const bestLocalByGoal = (goal: UsageGoal) => usefulLocalModels
    .filter((model) => model.idealUseCases.includes(goal))
    .sort((a, b) => b.intelligenceScore - a.intelligenceScore)[0] ??
    usefulLocalModels.sort((a, b) => b.intelligenceScore - a.intelligenceScore)[0];
  const comparisonGoals = activeModelMix.length > 0
    ? activeModelMix.map((item) => item.goal)
    : [usage.goal];
  const uniqueComparisonGoals = Array.from(new Set(comparisonGoals));
  const intelligenceComparison = uniqueComparisonGoals.map((goal) => {
    const bestLocal = bestLocalByGoal(goal);
    const localScore = bestLocal?.intelligenceScore ?? 0;
    return {
      name: t(`input.usage.goal.${goal}`),
      localScore,
      frontierScore: Math.round(frontierScore),
      gap: Math.max(0, Math.round(frontierScore - localScore)),
    };
  });
  const bestLocalScore = intelligenceComparison.reduce((best, point) => Math.max(best, point.localScore), 0);

  const costDataOverTime = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    apiCost: monthlyApiCost * (i + 1),
    localCost: hardwarePurchaseCostUsd + (electricityCostMonthly * (i + 1)),
  }));

  let mainLimitation = null;
  if (effectiveVram < 6 && hardware.ramGB < 16) {
    mainLimitation = t('calc.limit.memory');
  } else if (hardware.gpuMaker === 'None' || hardware.gpuMaker === 'Intel') {
    mainLimitation = t('calc.limit.nogpu');
  }

  return {
    canRunLocal,
    mainLimitation,
    recommendedModels,
    economics: {
      monthlyApiCost,
      hardwareAmortizationMonthly,
      hardwarePurchaseCostUsd,
      includesHardwarePurchase,
      electricityCostMonthly,
      totalLocalMonthly,
      breakevenMonths,
      verdict,
      verdictMessage,
      costDataOverTime,
      currencyCode: usage.currencyCode,
      currencySymbol: usage.currencySymbol,
      exchangeRateFromUsd: usage.exchangeRateFromUsd,
    },
    overallSummary: verdict === 'local'
      ? t('results.verdict.local')
      : verdict === 'hybrid'
        ? t('results.verdict.hybrid')
        : t('results.verdict.api'),
    softwareRecommendations: getSoftwareRecommendations(hardware, usage),
    assumptions: [
      activeModelMix.length > 0 ? t('calc.assumption.modelMix') : t('calc.assumption.tokens'),
      t(includesHardwarePurchase ? 'calc.assumption.hardware.planned' : 'calc.assumption.hardware.owned'),
      t('calc.assumption.energy'),
      t('calc.assumption.models'),
    ],
    intelligenceComparison,
    frontierScore: Math.round(frontierScore),
    bestLocalScore,
  };
}

