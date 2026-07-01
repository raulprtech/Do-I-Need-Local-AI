import { HardwareProfile, UsageProfile, Diagnosis, ModelCapability, EconomicAnalysis, SoftwareRecommendation } from './types';

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

export function evaluateSystem(hardware: HardwareProfile, usage: UsageProfile, t: (key: string) => string): Diagnosis {
  let effectiveVram = hardware.vramGB;
  
  // Apple Silicon shares RAM and VRAM. Typically up to ~75% of RAM can be used as VRAM.
  if (hardware.gpuMaker === 'Apple') {
    effectiveVram = hardware.ramGB * 0.75;
  }

  const models: ModelCapability[] = [];

  // Rules of thumb for GGUF/llama.cpp
  // 7B-8B Q4: ~5-6 GB VRAM
  // 14B Q4: ~10 GB VRAM
  // 32B Q4: ~20 GB VRAM
  // 70B Q4: ~40 GB VRAM

  models.push({
    name: 'Phi-3 Mini',
    parameters: '3.8B',
    quantization: '4-bit (Q4_K_M)',
    speed: effectiveVram >= 4 ? 'fast' : (hardware.ramGB >= 8 ? 'acceptable' : 'slow'),
    canRun: effectiveVram >= 4 || hardware.ramGB >= 8,
    notes: t('calc.models.phi3'),
  });

  models.push({
    name: 'Llama 3 8B / Mistral 7B',
    parameters: '8B',
    quantization: '4-bit (Q4_K_M)',
    speed: effectiveVram >= 6 ? 'fast' : (hardware.ramGB >= 16 ? 'acceptable' : 'slow'),
    canRun: effectiveVram >= 6 || hardware.ramGB >= 16,
    notes: effectiveVram >= 6 ? t('calc.models.llama3_8b.gpu') : t('calc.models.llama3_8b.cpu'),
  });

  models.push({
    name: 'Gemma 2 9B',
    parameters: '9B',
    quantization: '4-bit (Q4_K_M)',
    speed: effectiveVram >= 8 ? 'fast' : (hardware.ramGB >= 16 ? 'acceptable' : 'slow'),
    canRun: effectiveVram >= 8 || hardware.ramGB >= 16,
    notes: t('calc.models.gemma2'),
  });

  models.push({
    name: 'DeepSeek R1 (Distill 8B)',
    parameters: '8B',
    quantization: '4-bit (Q4_K_M)',
    speed: effectiveVram >= 6 ? 'fast' : (hardware.ramGB >= 16 ? 'acceptable' : 'slow'),
    canRun: effectiveVram >= 6 || hardware.ramGB >= 16,
    notes: t('calc.models.deepseek_r1'),
  });

  models.push({
    name: 'Qwen 2.5 14B / DeepSeek Coder V2 Lite',
    parameters: '14B-16B',
    quantization: '4-bit (Q4_K_M)',
    speed: effectiveVram >= 12 ? 'fast' : (hardware.ramGB >= 16 ? 'acceptable' : 'unusable'),
    canRun: effectiveVram >= 12 || hardware.ramGB >= 24,
    notes: effectiveVram >= 12 ? t('calc.models.qwen.gpu') : t('calc.models.qwen.cpu'),
  });

  models.push({
    name: 'Llama 3.3 70B',
    parameters: '70B',
    quantization: '4-bit (Q4_K_M)',
    speed: effectiveVram >= 40 ? 'fast' : (effectiveVram >= 24 ? 'acceptable' : 'unusable'),
    canRun: effectiveVram >= 24 || hardware.ramGB >= 64,
    notes: effectiveVram >= 40 ? t('calc.models.llama3_70b.gpu') : t('calc.models.llama3_70b.cpu'),
  });

  // Software Recommendations
  const softwareRecommendations: SoftwareRecommendation[] = [];
  if (hardware.os === 'macOS') {
     softwareRecommendations.push({ name: 'LM Studio', url: 'https://lmstudio.ai', description: 'Excelente interfaz gráfica, muy optimizada para Apple Silicon (Metal).' });
     softwareRecommendations.push({ name: 'Ollama', url: 'https://ollama.com', description: 'La forma más fácil de correr modelos desde la terminal o integrar con otras apps.' });
  } else if (hardware.os === 'Windows') {
     softwareRecommendations.push({ name: 'LM Studio', url: 'https://lmstudio.ai', description: 'Interfaz gráfica fácil de usar, permite descargar modelos GGUF directamente.' });
     if (hardware.gpuMaker === 'NVIDIA') {
         softwareRecommendations.push({ name: 'Ollama', url: 'https://ollama.com', description: 'Ideal para terminal y conectar con editores de código.' });
     }
  } else {
     softwareRecommendations.push({ name: 'Ollama', url: 'https://ollama.com', description: 'El estándar de facto para Linux. Fácil instalación por script.' });
     if (usage.frequency === 'production' || usage.frequency === 'heavy') {
         softwareRecommendations.push({ name: 'vLLM', url: 'https://github.com/vllm-project/vllm', description: 'Motor de inferencia de alto rendimiento, ideal para servidores.' });
     }
  }

  // Economics
  const monthlyApiCost = estimateApiCostMonthly(usage);
  const hardwareAmortizationMonthly = (hardware.devicePriceUsd || 0) / 24; // spread over 2 years
  
  // Electricity: based on user config per kWh
  // Desktop GPU might draw 300W during inference. 
  // Let's assume active inference is 1/4 of usage hours.
  const inferenceHoursPerDay = usage.hoursPerDay * 0.25; 
  const kW = hardware.gpuMaker === 'NVIDIA' ? 0.3 : 0.05; // Mac is very efficient
  const electricityCostMonthly = inferenceHoursPerDay * kW * 30 * usage.electricityCostPerKwh;

  const totalLocalMonthly = hardwareAmortizationMonthly + electricityCostMonthly;

  let breakevenMonths = -1;
  if (monthlyApiCost > electricityCostMonthly) {
     breakevenMonths = hardware.devicePriceUsd / (monthlyApiCost - electricityCostMonthly);
  }

  let verdict: EconomicAnalysis['verdict'] = 'api';
  let verdictMessage = '';

  if (usage.needsPrivacy || usage.offlineRequired) {
    verdict = 'local';
    verdictMessage = t('calc.verdict.mandatory');
  } else if (monthlyApiCost > totalLocalMonthly) {
    verdict = 'local';
    verdictMessage = t('calc.verdict.local_hours');
  } else if (breakevenMonths > 0 && breakevenMonths <= 12) {
    verdict = 'local';
    verdictMessage = `${t('calc.verdict.local_breakeven')}${Math.ceil(breakevenMonths)}${t('calc.verdict.local_breakeven_months')}`;
  } else {
    verdict = 'api';
    verdictMessage = t('calc.verdict.api_cheaper');
  }

  const costDataOverTime = Array.from({length: 12}, (_, i) => ({
    month: i + 1,
    apiCost: monthlyApiCost * (i + 1),
    localCost: hardware.devicePriceUsd + (electricityCostMonthly * (i + 1))
  }));

  let mainLimitation = null;
  if (effectiveVram < 6 && hardware.ramGB < 16) {
    mainLimitation = t('calc.limit.memory');
  } else if (hardware.gpuMaker === 'None' || hardware.gpuMaker === 'Intel') {
    mainLimitation = t('calc.limit.nogpu');
  }

  return {
    canRunLocal: effectiveVram >= 6 || hardware.ramGB >= 16,
    mainLimitation,
    recommendedModels: models,
    economics: {
      monthlyApiCost,
      hardwareAmortizationMonthly,
      electricityCostMonthly,
      totalLocalMonthly,
      breakevenMonths,
      verdict,
      verdictMessage,
      costDataOverTime,
    },
    overallSummary: verdict === 'local' ? t('results.verdict.local') : t('results.verdict.api'),
    softwareRecommendations,
  };
}
