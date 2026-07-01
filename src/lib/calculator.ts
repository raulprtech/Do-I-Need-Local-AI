import { evaluateCatalogEntry, MODEL_CATALOG } from './modelCatalog';
import { HardwareProfile, UsageProfile, Diagnosis, EconomicAnalysis, SoftwareRecommendation } from './types';

export const HARDWARE_PRESETS: Record<string, Partial<HardwareProfile>> = {
  'custom': { preset: 'custom' },
  'rtx3060': { preset: 'rtx3060', gpuMaker: 'NVIDIA', gpuName: 'RTX 3060', vramGB: 12, ramGB: 16, devicePriceUsd: 850 },
  'rtx4070tisuper': { preset: 'rtx4070tisuper', gpuMaker: 'NVIDIA', gpuName: 'RTX 4070 Ti Super', vramGB: 16, ramGB: 32, devicePriceUsd: 1600 },
  'rtx4090': { preset: 'rtx4090', gpuMaker: 'NVIDIA', gpuName: 'RTX 4090', vramGB: 24, ramGB: 64, devicePriceUsd: 3200 },
  'macmini_m4_16gb': { preset: 'macmini_m4_16gb', os: 'macOS', gpuMaker: 'Apple', gpuName: 'M4', vramGB: 12, ramGB: 16, devicePriceUsd: 799 },
  'm3max_64gb': { preset: 'm3max_64gb', os: 'macOS', gpuMaker: 'Apple', gpuName: 'M3 Max', vramGB: 48, ramGB: 64, devicePriceUsd: 3999 },
  'no_gpu': { preset: 'no_gpu', gpuMaker: 'None', gpuName: 'Integrated', vramGB: 0, ramGB: 16, devicePriceUsd: 600 },
};

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
  const tokensPerRequest: Record<UsageProfile['goal'], number> = {
    chat: 1200,
    coding: 4000,
    agents: 6000,
    rag: 5000,
    vision: 2500,
    embedding: 800,
  };
  const ratePerMillion: Record<UsageProfile['modelSizePreference'], number> = {
    small: 0.25,
    medium: 0.75,
    large: 10,
    any: 1.5,
  };

  const requestsPerMonth =
    usage.hoursPerDay * requestsPerHour[usage.frequency] * activeDaysPerMonth[usage.frequency];
  const tokensPerMonth = requestsPerMonth * tokensPerRequest[usage.goal];

  return (tokensPerMonth / 1000000) * ratePerMillion[usage.modelSizePreference];
}

function getEffectiveVramGB(hardware: HardwareProfile): number {
  if (hardware.gpuMaker === 'Apple') {
    return hardware.ramGB * 0.75;
  }

  return hardware.vramGB;
}

function getSoftwareRecommendations(hardware: HardwareProfile, usage: UsageProfile): SoftwareRecommendation[] {
  if (hardware.os === 'macOS') {
    return [
      { name: 'Ollama', url: 'https://ollama.com', description: 'Forma simple de correr modelos desde terminal e integrarlos con otras apps.' },
    ];
  }

  if (hardware.os === 'Windows') {
    const recommendations: SoftwareRecommendation[] = [];

    if (hardware.gpuMaker === 'NVIDIA') {
      recommendations.push({ name: 'Ollama', url: 'https://ollama.com', description: 'Ideal para terminal, flujos locales y editores de codigo.' });
    }

    return recommendations;
  }

  const recommendations: SoftwareRecommendation[] = [
    { name: 'Ollama', url: 'https://ollama.com', description: 'Opcion simple y popular para Linux, desarrollo local y prototipos.' },
  ];

  if (usage.frequency === 'production' || usage.frequency === 'heavy') {
    recommendations.push({ name: 'vLLM', url: 'https://github.com/vllm-project/vllm', description: 'Motor de inferencia de alto rendimiento para servidores y cargas concurrentes.' });
  }

  return recommendations;
}

export function evaluateSystem(hardware: HardwareProfile, usage: UsageProfile, t: (key: string) => string): Diagnosis {
  const effectiveVram = getEffectiveVramGB(hardware);
  const recommendedModels = MODEL_CATALOG.map((model) => evaluateCatalogEntry(model, effectiveVram, hardware.ramGB, t));
  const canRunLocal = effectiveVram >= 6 || hardware.ramGB >= 16;
  const usefulLocalModels = recommendedModels.filter((model) => model.canRun && model.speed !== 'unusable');
  const hasUsefulLocalOption = canRunLocal && usefulLocalModels.length > 0;

  const monthlyApiCost = estimateApiCostMonthly(usage);
  const hardwareAmortizationMonthly = (hardware.devicePriceUsd || 0) / 24;
  const inferenceHoursPerDay = usage.hoursPerDay * 0.25;
  const kW = hardware.gpuMaker === 'NVIDIA' ? 0.3 : hardware.gpuMaker === 'Apple' ? 0.05 : 0.12;
  const electricityCostMonthly = inferenceHoursPerDay * kW * 30 * usage.electricityCostPerKwh;
  const totalLocalMonthly = hardwareAmortizationMonthly + electricityCostMonthly;

  let breakevenMonths = -1;
  if (monthlyApiCost > electricityCostMonthly) {
    breakevenMonths = hardware.devicePriceUsd / (monthlyApiCost - electricityCostMonthly);
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

  const costDataOverTime = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    apiCost: monthlyApiCost * (i + 1),
    localCost: hardware.devicePriceUsd + (electricityCostMonthly * (i + 1)),
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
      t('calc.assumption.tokens'),
      t('calc.assumption.hardware'),
      t('calc.assumption.energy'),
      t('calc.assumption.models'),
    ],
  };
}
