import { evaluateCatalogEntry, MODEL_CATALOG } from './modelCatalog';
import { Diagnosis, EconomicAnalysis, HardwareProfile, ModelCatalogEntry, UsageProfile } from './types';
import { CLOUD_MODEL_PROFILES, CLOUD_PLAN_PROFILES, estimateApiCostMonthly, getActiveModelMix } from './calculations/apiCost';
import { estimateLocalCost, HARDWARE_PRESETS } from './calculations/hardwareCost';
import { bestLocalByGoal, estimateFrontierScore, getComparisonGoals } from './calculations/intelligence';
import { getSoftwareRecommendations } from './calculations/recommendations';

export { CLOUD_MODEL_PROFILES, CLOUD_PLAN_PROFILES, HARDWARE_PRESETS };

export function evaluateSystem(
  hardware: HardwareProfile,
  usage: UsageProfile,
  t: (key: string) => string,
  modelCatalog: ModelCatalogEntry[] = MODEL_CATALOG,
): Diagnosis {
  const localCost = estimateLocalCost(hardware, usage);
  const recommendedModels = modelCatalog.map((model) => evaluateCatalogEntry(model, localCost.effectiveVram, hardware.ramGB, t));
  const canRunLocal = localCost.effectiveVram >= 6 || hardware.ramGB >= 16;
  const usefulLocalModels = recommendedModels.filter((model) => model.canRun && model.speed !== 'unusable');
  const hasUsefulLocalOption = canRunLocal && usefulLocalModels.length > 0;

  const monthlyApiCost = estimateApiCostMonthly(usage);
  const activeModelMix = getActiveModelMix(usage);
  const frontierScore = estimateFrontierScore(usage);

  let breakevenMonths = -1;
  if (monthlyApiCost > localCost.electricityCostMonthly) {
    breakevenMonths = localCost.includesHardwarePurchase
      ? localCost.hardwarePurchaseCostUsd / (monthlyApiCost - localCost.electricityCostMonthly)
      : 0;
  }

  let verdict: EconomicAnalysis['verdict'] = 'api';
  let verdictMessage = '';
  const localIsCheaperMonthly = monthlyApiCost > localCost.totalLocalMonthly;
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

  const intelligenceComparison = getComparisonGoals(usage).map((goal) => {
    const bestLocal = bestLocalByGoal(goal, usefulLocalModels);
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
    localCost: localCost.hardwarePurchaseCostUsd + (localCost.electricityCostMonthly * (i + 1)),
  }));

  let mainLimitation = null;
  if (localCost.effectiveVram < 6 && hardware.ramGB < 16) {
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
      hardwareAmortizationMonthly: localCost.hardwareAmortizationMonthly,
      hardwarePurchaseCostUsd: localCost.hardwarePurchaseCostUsd,
      includesHardwarePurchase: localCost.includesHardwarePurchase,
      electricityCostMonthly: localCost.electricityCostMonthly,
      totalLocalMonthly: localCost.totalLocalMonthly,
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
      t(localCost.includesHardwarePurchase ? 'calc.assumption.hardware.planned' : 'calc.assumption.hardware.owned'),
      t('calc.assumption.energy'),
      t('calc.assumption.models'),
    ],
    intelligenceComparison,
    frontierScore: Math.round(frontierScore),
    bestLocalScore,
  };
}
