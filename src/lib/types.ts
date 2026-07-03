export type OS = 'Windows' | 'macOS' | 'Linux';
export type GPUMaker = 'NVIDIA' | 'AMD' | 'Apple' | 'Intel' | 'None';
export type HardwarePurchaseStatus = 'owned' | 'planned';
export type DataConfidence = 'official' | 'verified' | 'community' | 'estimated' | 'deprecated';

export interface HardwareProfile {
  preset: string; // e.g. "custom", "rtx4090", "m3max", "nogpu"
  os: OS;
  gpuMaker: GPUMaker;
  gpuName: string;
  vramGB: number;
  ramGB: number;
  cpuName: string;
  devicePriceUsd: number;
  purchaseStatus: HardwarePurchaseStatus;
}

export type UsageGoal = 'chat' | 'coding' | 'agents' | 'rag' | 'vision' | 'embedding';
export type UsageFrequency = 'occasional' | 'daily' | 'heavy' | 'production';
export type CloudModelId = 'gpt-4o' | 'claude-sonnet' | 'gemini-pro' | 'deepseek-chat' | 'gpt-4o-mini';
export type ApiBillingMode = 'usage' | 'plan';
export type CloudPlanId = 'chatgpt-plus' | 'chatgpt-pro' | 'claude-pro' | 'claude-max' | 'gemini-advanced' | 'cursor-pro' | 'custom';

export interface UsageModelSelection {
  id: string;
  modelId: CloudModelId;
  goal: UsageGoal;
  hoursPerDay: number;
  billingMode: ApiBillingMode;
  planId: CloudPlanId;
  monthlyPlanUsd: number;
}

export interface UsageProfile {
  goal: UsageGoal;
  frequency: UsageFrequency;
  hoursPerDay: number;
  needsPrivacy: boolean;
  offlineRequired: boolean;
  modelSizePreference: 'small' | 'medium' | 'large' | 'any';
  electricityCostPerKwh: number;
  currencyCode: string;
  currencySymbol: string;
  exchangeRateFromUsd: number;
  modelMix: UsageModelSelection[];
}

export interface ModelLink {
  label: string;
  url: string;
  runtime?: string;
}

export interface ModelSource {
  type: string;
  url: string;
}

export type ModelRuntime = 'ollama' | 'lm-studio' | 'vllm' | 'llama-cpp' | 'mlx' | 'transformers' | string;

export interface ModelDataQuality {
  requirements?: DataConfidence;
  quality?: DataConfidence;
  useCases?: DataConfidence;
}

export interface ModelInstallCommand {
  label: string;
  command: string;
  runtime?: string;
}

export interface ModelSpec {
  label: string;
  value: string;
}

export interface ModelBenchmarkSummary {
  label: string;
  value: string;
  note?: string;
  sourceUrl?: string;
}

export interface ModelCatalogEntry {
  name: string;
  parameters: string;
  quantization: string;
  minFastVramGB: number;
  minGpuVramGB: number;
  minCpuRamGB: number;
  noteKey: string;
  noteGpuKey?: string;
  noteCpuKey?: string;
  idealUseCases: UsageGoal[];
  intelligenceScore: number;
  description: string;
  license: string;
  links: ModelLink[];
  quantizationOptions: string[];
  installCommands: ModelInstallCommand[];
  specs: ModelSpec[];
  benchmarkSummary: ModelBenchmarkSummary[];
  sources?: ModelSource[];
  benchmarkRefs?: ModelSource[];
  deploymentOptions?: ModelRuntime[];
  dataQuality?: ModelDataQuality;
  confidence?: DataConfidence;
  lastCheckedAt?: string;
}

export interface ModelCapability {
  name: string;
  parameters: string; // e.g. "7B", "70B"
  quantization: string; // e.g. "Q4_K_M", "Q8_0", "FP16"
  speed: 'fast' | 'acceptable' | 'slow' | 'unusable';
  canRun: boolean;
  notes: string;
  idealUseCases: UsageGoal[];
  idealUseCaseLabels: string;
  intelligenceScore: number;
  description: string;
  license: string;
  links: ModelLink[];
  quantizationOptions: string[];
  installCommands: ModelInstallCommand[];
  specs: ModelSpec[];
  benchmarkSummary: ModelBenchmarkSummary[];
  sources?: ModelSource[];
  benchmarkRefs?: ModelSource[];
  deploymentOptions?: ModelRuntime[];
  dataQuality?: ModelDataQuality;
  confidence?: DataConfidence;
  lastCheckedAt?: string;
}

export interface EconomicAnalysis {
  monthlyApiCost: number;
  hardwareAmortizationMonthly: number; // e.g. devicePriceUsd / 24 when purchase is planned
  hardwarePurchaseCostUsd: number;
  includesHardwarePurchase: boolean;
  electricityCostMonthly: number;
  totalLocalMonthly: number;
  breakevenMonths: number;
  verdict: 'local' | 'api' | 'hybrid';
  verdictMessage: string;
  costDataOverTime: { month: number; apiCost: number; localCost: number }[];
  currencyCode: string;
  currencySymbol: string;
  exchangeRateFromUsd: number;
}

export interface SoftwareRecommendation {
  name: string;
  url: string;
  description: string;
}

export interface IntelligenceComparisonPoint {
  name: string;
  localScore: number;
  frontierScore: number;
  gap: number;
}

export interface Diagnosis {
  canRunLocal: boolean;
  mainLimitation: string | null;
  recommendedModels: ModelCapability[];
  economics: EconomicAnalysis;
  overallSummary: string;
  softwareRecommendations: SoftwareRecommendation[];
  assumptions: string[];
  intelligenceComparison: IntelligenceComparisonPoint[];
  frontierScore: number;
  bestLocalScore: number;
}
