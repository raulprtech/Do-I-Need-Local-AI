export type OS = 'Windows' | 'macOS' | 'Linux';
export type GPUMaker = 'NVIDIA' | 'AMD' | 'Apple' | 'Intel' | 'None';

export interface HardwareProfile {
  preset: string; // e.g. "custom", "rtx4090", "m3max", "nogpu"
  os: OS;
  gpuMaker: GPUMaker;
  gpuName: string;
  vramGB: number;
  ramGB: number;
  cpuName: string;
  devicePriceUsd: number;
}

export type UsageGoal = 'chat' | 'coding' | 'agents' | 'rag' | 'vision' | 'embedding';
export type UsageFrequency = 'occasional' | 'daily' | 'heavy' | 'production';

export interface UsageProfile {
  goal: UsageGoal;
  frequency: UsageFrequency;
  hoursPerDay: number;
  needsPrivacy: boolean;
  offlineRequired: boolean;
  modelSizePreference: 'small' | 'medium' | 'large' | 'any';
  electricityCostPerKwh: number;
}

export interface ModelCapability {
  name: string;
  parameters: string; // e.g. "7B", "70B"
  quantization: string; // e.g. "Q4_K_M", "Q8_0", "FP16"
  speed: 'fast' | 'acceptable' | 'slow' | 'unusable';
  canRun: boolean;
  notes: string;
}

export interface EconomicAnalysis {
  monthlyApiCost: number;
  hardwareAmortizationMonthly: number; // e.g. devicePriceUsd / 24
  electricityCostMonthly: number;
  totalLocalMonthly: number;
  breakevenMonths: number;
  verdict: 'local' | 'api' | 'hybrid';
  verdictMessage: string;
  costDataOverTime: { month: number; apiCost: number; localCost: number }[];
}

export interface SoftwareRecommendation {
  name: string;
  url: string;
  description: string;
}

export interface Diagnosis {
  canRunLocal: boolean;
  mainLimitation: string | null;
  recommendedModels: ModelCapability[];
  economics: EconomicAnalysis;
  overallSummary: string;
  softwareRecommendations: SoftwareRecommendation[];
}
