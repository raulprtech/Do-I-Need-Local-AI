import { HardwareProfile, UsageProfile } from '../types';

export const HARDWARE_PRESETS: Record<string, Partial<HardwareProfile>> = {
  custom: { preset: 'custom' },
  rtx3060: { preset: 'rtx3060', gpuMaker: 'NVIDIA', gpuName: 'RTX 3060', vramGB: 12, ramGB: 16, devicePriceUsd: 850 },
  rtx4070tisuper: { preset: 'rtx4070tisuper', gpuMaker: 'NVIDIA', gpuName: 'RTX 4070 Ti Super', vramGB: 16, ramGB: 32, devicePriceUsd: 1600 },
  rtx4090: { preset: 'rtx4090', gpuMaker: 'NVIDIA', gpuName: 'RTX 4090', vramGB: 24, ramGB: 64, devicePriceUsd: 3200 },
  macmini_m4_16gb: { preset: 'macmini_m4_16gb', os: 'macOS', gpuMaker: 'Apple', gpuName: 'M4', vramGB: 12, ramGB: 16, devicePriceUsd: 799 },
  m3max_64gb: { preset: 'm3max_64gb', os: 'macOS', gpuMaker: 'Apple', gpuName: 'M3 Max', vramGB: 48, ramGB: 64, devicePriceUsd: 3999 },
  no_gpu: { preset: 'no_gpu', gpuMaker: 'None', gpuName: 'Integrated', vramGB: 0, ramGB: 16, devicePriceUsd: 600 },
};

export interface LocalCostEstimate {
  effectiveVram: number;
  includesHardwarePurchase: boolean;
  hardwarePurchaseCostUsd: number;
  hardwareAmortizationMonthly: number;
  electricityCostMonthly: number;
  totalLocalMonthly: number;
}

export function getEffectiveVramGB(hardware: HardwareProfile): number {
  if (hardware.gpuMaker === 'Apple') {
    return hardware.ramGB * 0.75;
  }

  return hardware.vramGB;
}

export function estimateLocalCost(hardware: HardwareProfile, usage: UsageProfile): LocalCostEstimate {
  const effectiveVram = getEffectiveVramGB(hardware);
  const includesHardwarePurchase = hardware.purchaseStatus === 'planned';
  const hardwarePurchaseCostUsd = includesHardwarePurchase ? (hardware.devicePriceUsd || 0) : 0;
  const hardwareAmortizationMonthly = hardwarePurchaseCostUsd / 24;
  const inferenceHoursPerDay = usage.hoursPerDay * 0.25;
  const kW = hardware.gpuMaker === 'NVIDIA' ? 0.3 : hardware.gpuMaker === 'Apple' ? 0.05 : 0.12;
  const electricityCostMonthly = inferenceHoursPerDay * kW * 30 * usage.electricityCostPerKwh;
  const totalLocalMonthly = hardwareAmortizationMonthly + electricityCostMonthly;

  return {
    effectiveVram,
    includesHardwarePurchase,
    hardwarePurchaseCostUsd,
    hardwareAmortizationMonthly,
    electricityCostMonthly,
    totalLocalMonthly,
  };
}
