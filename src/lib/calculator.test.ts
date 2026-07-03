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
  purchaseStatus: 'owned',
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
  modelMix: [],
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
assert.ok(privateWork.recommendedModels.every((model) => model.idealUseCases.length > 0));
assert.ok(privateWork.intelligenceComparison.length > 0);

const ownedHardwareCost = evaluateSystem(baseHardware, baseUsage, t);
assert.equal(ownedHardwareCost.economics.hardwareAmortizationMonthly, 0);
assert.equal(ownedHardwareCost.economics.hardwarePurchaseCostUsd, 0);

const plannedHardwareCost = evaluateSystem({ ...baseHardware, purchaseStatus: 'planned' }, baseUsage, t);
assert.equal(plannedHardwareCost.economics.hardwareAmortizationMonthly, baseHardware.devicePriceUsd / 24);
assert.equal(plannedHardwareCost.economics.hardwarePurchaseCostUsd, baseHardware.devicePriceUsd);

const productionLarge = evaluateSystem(
  { ...baseHardware, vramGB: 24, ramGB: 64, devicePriceUsd: 3200 },
  { ...baseUsage, frequency: 'production', goal: 'agents', modelSizePreference: 'large', hoursPerDay: 8 },
  t,
);
assert.equal(productionLarge.economics.verdict, 'hybrid');
assert.ok(productionLarge.recommendedModels.some((model) => model.canRun));
assert.ok(productionLarge.softwareRecommendations.some((software) => software.name === 'vLLM'));

const heavyIntegrated = evaluateSystem(
  { ...baseHardware, gpuMaker: 'Intel', gpuName: 'Integrated', vramGB: 0, ramGB: 16 },
  { ...baseUsage, frequency: 'heavy', goal: 'agents', hoursPerDay: 6 },
  t,
);
assert.ok(!heavyIntegrated.softwareRecommendations.some((software) => software.name === 'vLLM'));


const advancedMix = evaluateSystem(
  baseHardware,
  { ...baseUsage, modelMix: [{ id: 'primary', modelId: 'claude-sonnet', goal: 'coding', hoursPerDay: 3, billingMode: 'usage', planId: 'claude-pro', monthlyPlanUsd: 20 }] },
  t,
);
assert.ok(advancedMix.economics.monthlyApiCost > ownedHardwareCost.economics.monthlyApiCost);
assert.equal(advancedMix.intelligenceComparison[0].name, 'input.usage.goal.coding');

const planMix = evaluateSystem(
  baseHardware,
  { ...baseUsage, modelMix: [{ id: 'plan', modelId: 'gpt-4o', goal: 'chat', hoursPerDay: 1, billingMode: 'plan', planId: 'chatgpt-plus', monthlyPlanUsd: 20 }] },
  t,
);
assert.equal(planMix.economics.monthlyApiCost, 20);

console.log('calculator tests passed');
