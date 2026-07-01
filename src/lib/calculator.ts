import { HardwareProfile, UsageProfile, Diagnosis, ModelCapability, EconomicAnalysis } from './types';

export const HARDWARE_PRESETS: Record<string, Partial<HardwareProfile>> = {
  'custom': { preset: 'custom' },
  'rtx3060': { preset: 'rtx3060', gpuMaker: 'NVIDIA', gpuName: 'RTX 3060', vramGB: 12, ramGB: 16, devicePriceUsd: 1000 },
  'rtx4090': { preset: 'rtx4090', gpuMaker: 'NVIDIA', gpuName: 'RTX 4090', vramGB: 24, ramGB: 32, devicePriceUsd: 3000 },
  'm2_16gb': { preset: 'm2_16gb', os: 'macOS', gpuMaker: 'Apple', gpuName: 'M2', vramGB: 12, ramGB: 16, devicePriceUsd: 1200 },
  'm3max_64gb': { preset: 'm3max_64gb', os: 'macOS', gpuMaker: 'Apple', gpuName: 'M3 Max', vramGB: 48, ramGB: 64, devicePriceUsd: 4000 },
  'no_gpu': { preset: 'no_gpu', gpuMaker: 'None', gpuName: 'Integrated', vramGB: 0, ramGB: 16, devicePriceUsd: 800 },
};

function estimateApiCostMonthly(usage: UsageProfile): number {
  // Rough estimations
  // A typical prompt + response = 2k tokens. 
  // Medium usage = 100 requests/day = 200k tokens/day = 6M tokens/month.
  // Pricing: approx $0.50 per 1M tokens (average of input/output for cheap models)
  // Large models (GPT-4 class) = $10 per 1M tokens.

  let requestsPerDay = 10;
  if (usage.frequency === 'daily') requestsPerDay = 50;
  if (usage.frequency === 'heavy') requestsPerDay = 200;
  if (usage.frequency === 'production') requestsPerDay = 2000;

  const tokensPerRequest = usage.goal === 'coding' || usage.goal === 'rag' ? 4000 : 1000;
  const tokensPerMonth = requestsPerDay * tokensPerRequest * 30;

  const ratePerMillion = usage.modelSizePreference === 'large' ? 10 : 0.5;
  
  return (tokensPerMonth / 1000000) * ratePerMillion;
}

export function evaluateSystem(hardware: HardwareProfile, usage: UsageProfile): Diagnosis {
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
    name: 'Llama 3 8B / Mistral 7B',
    parameters: '8B',
    quantization: '4-bit (Q4_K_M)',
    speed: effectiveVram >= 6 ? 'fast' : (hardware.ramGB >= 16 ? 'acceptable' : 'slow'),
    canRun: effectiveVram >= 6 || hardware.ramGB >= 16,
    notes: effectiveVram >= 6 ? 'Corre 100% en GPU, muy rápido.' : 'Correrá usando RAM (CPU), será más lento.',
  });

  models.push({
    name: 'Qwen 2.5 14B',
    parameters: '14B',
    quantization: '4-bit (Q4_K_M)',
    speed: effectiveVram >= 10 ? 'fast' : (hardware.ramGB >= 16 ? 'acceptable' : 'unusable'),
    canRun: effectiveVram >= 10 || hardware.ramGB >= 24,
    notes: effectiveVram >= 10 ? 'Excelente rendimiento en GPU.' : 'Requiere offload parcial a RAM.',
  });

  models.push({
    name: 'Llama 3 70B',
    parameters: '70B',
    quantization: '4-bit (Q4_K_M)',
    speed: effectiveVram >= 40 ? 'fast' : (effectiveVram >= 24 ? 'acceptable' : 'unusable'),
    canRun: effectiveVram >= 24 || hardware.ramGB >= 64,
    notes: effectiveVram >= 40 ? 'Corre completo en VRAM.' : 'Correrá pero muy lento y con contexto limitado.',
  });

  // Economics
  const monthlyApiCost = estimateApiCostMonthly(usage);
  const hardwareAmortizationMonthly = (hardware.devicePriceUsd || 0) / 24; // spread over 2 years
  
  // Electricity: assuming 0.20 USD per kWh
  // Desktop GPU might draw 300W during inference. 
  // Let's assume active inference is 1/4 of usage hours.
  const inferenceHoursPerDay = usage.hoursPerDay * 0.25; 
  const kW = hardware.gpuMaker === 'NVIDIA' ? 0.3 : 0.05; // Mac is very efficient
  const electricityCostMonthly = inferenceHoursPerDay * kW * 30 * 0.20;

  const totalLocalMonthly = hardwareAmortizationMonthly + electricityCostMonthly;

  let breakevenMonths = -1;
  if (monthlyApiCost > electricityCostMonthly) {
     breakevenMonths = hardware.devicePriceUsd / (monthlyApiCost - electricityCostMonthly);
  }

  let verdict: EconomicAnalysis['verdict'] = 'api';
  let verdictMessage = '';

  const hoursPerMonth = usage.hoursPerDay * 30;

  if (usage.needsPrivacy || usage.offlineRequired) {
    verdict = 'local';
    verdictMessage = 'Debido a la necesidad estricta de privacidad u offline, la vía local es mandatoria, independientemente del costo.';
  } else if (monthlyApiCost > totalLocalMonthly) {
    verdict = 'local';
    verdictMessage = `Local te conviene porque usas IA ~${hoursPerMonth} horas al mes, y el gasto en API supera la amortización del hardware.`;
  } else if (breakevenMonths > 0 && breakevenMonths <= 12) {
    verdict = 'local';
    verdictMessage = `Con este perfil de uso, recuperarás la inversión en hardware en ${Math.ceil(breakevenMonths)} meses. Local te conviene a medio plazo.`;
  } else {
    verdict = 'api';
    verdictMessage = 'Para este perfil, pagar API sigue siendo más barato durante los próximos 12 meses frente a comprar o mantener hardware.';
  }

  const costDataOverTime = Array.from({length: 12}, (_, i) => ({
    month: i + 1,
    apiCost: monthlyApiCost * (i + 1),
    localCost: hardware.devicePriceUsd + (electricityCostMonthly * (i + 1))
  }));

  let mainLimitation = null;
  if (effectiveVram < 6 && hardware.ramGB < 16) {
    mainLimitation = 'Poca memoria (VRAM/RAM) limita gravemente el uso de IA local.';
  } else if (hardware.gpuMaker === 'None' || hardware.gpuMaker === 'Intel') {
    mainLimitation = 'Falta GPU dedicada (NVIDIA o Apple Silicon) afectará la velocidad.';
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
    overallSummary: verdict === 'local' ? 'Local te conviene' : 'Pagar API sigue siendo más barato',
  };
}
