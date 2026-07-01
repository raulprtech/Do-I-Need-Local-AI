import assert from 'node:assert/strict';
import { evaluateSystem } from './calculator';
import { HardwareProfile, UsageProfile } from './types';

const t = (key: string) => key;

const baseHardware: HardwareProfile = {
  preset: 'custom',
  os: 'Windows',
  gpuMaker: 'NVIDIA',
  gpuName: 'RTX 3060',
  vramGB: 12,
  ramGB: 16,
  cpuName: '',
  devicePriceUsd: 850,
};

const baseUsage: UsageProfile = {
  goal: 'chat',
  frequency: 'daily',
  hoursPerDay: 4,
  needsPrivacy: false,
  offlineRequired: false,
  modelSizePreference: 'medium',
  electricityCostPerKwh: 0.2,
  currencyCode: 'USD',
  currencySymbol: '$',
  exchangeRateFromUsd: 1,
};

const noGpu = evaluateSystem(
  { ...baseHardware, gpuMaker: 'None', gpuName: 'Integrated', vramGB: 0, ramGB: 8 },
  { ...baseUsage, frequency: 'occasional', hoursPerDay: 1 },
  t,
);
assert.equal(noGpu.economics.verdict, 'api');
assert.equal(noGpu.canRunLocal, false);

const privateWork = evaluateSystem(
  baseHardware,
  { ...baseUsage, needsPrivacy: true },
  t,
);
assert.equal(privateWork.economics.verdict, 'local');
assert.ok(privateWork.assumptions.length >= 4);

const productionLarge = evaluateSystem(
  { ...baseHardware, vramGB: 24, ramGB: 64, devicePriceUsd: 3200 },
  { ...baseUsage, frequency: 'production', goal: 'agents', modelSizePreference: 'large', hoursPerDay: 8 },
  t,
);
assert.equal(productionLarge.economics.verdict, 'hybrid');
assert.ok(productionLarge.recommendedModels.some((model) => model.canRun));

console.log('calculator tests passed');