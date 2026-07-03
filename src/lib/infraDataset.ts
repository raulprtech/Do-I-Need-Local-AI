import { HardwareProfile, ModelBenchmarkSummary, ModelCatalogEntry, ModelInstallCommand, ModelLink, ModelSpec, UsageGoal } from './types';

export type DataConfidence = 'official' | 'verified' | 'community' | 'estimated' | 'deprecated';

export interface ApiPricingRecord {
  id: string;
  providerId: string;
  name: string;
  category?: string;
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
  qualityScore: number;
  confidence: DataConfidence;
  lastCheckedAt: string;
  sources: Array<{ type: string; url: string }>;
  notes?: string;
  pricingUnit?: string;
  priceRegion?: string;
  priceLastVerifiedAt?: string;
}

export interface ApiOption {
  id: string;
  kind: 'api';
  name: string;
  detail: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  quality: number;
  confidence: DataConfidence;
  priceRegion?: string;
  priceLastVerifiedAt?: string;
}

export interface HardwareOption {
  id: string;
  kind: 'hardware';
  name: string;
  detail: string;
  profile: HardwareProfile;
}

export interface LocalModelRecord {
  id: string;
  name: string;
  parameters: string;
  quantization: string;
  minFastVramGB: number;
  minGpuVramGB: number;
  minCpuRamGB: number;
  confidence: DataConfidence;
  lastCheckedAt: string;
  sources: Array<{ type: string; url: string }>;
  notes?: string;
  description?: string;
  idealUseCases?: string[];
  qualityScore?: number;
  license?: string;
  contextWindowTokens?: number;
  links?: Array<ModelLink & { runtime?: string }>;
  quantizationOptions?: string[];
  installCommands?: Array<ModelInstallCommand & { runtime?: string }>;
  benchmarkSummary?: ModelBenchmarkSummary[];
}

export interface CloudComputeRecord {
  id: string;
  providerId: string;
  providerName: string;
  name: string;
  category: 'vps' | 'gpu-cloud' | 'hyperscaler' | 'serverless-ai' | 'edge-ai';
  gpuMaker: HardwareProfile['gpuMaker'];
  gpuName: string;
  vramGB: number;
  ramGB: number;
  hourlyUsd: number;
  monthlyUsd?: number;
  storageMonthlyUsd?: number;
  networkMonthlyUsd?: number;
  operationalScore: number;
  confidence: DataConfidence;
  lastCheckedAt: string;
  sources: Array<{ type: string; url: string }>;
  notes?: string;
  priceRegion?: string;
  priceUnit?: 'hour' | 'month' | 'request' | 'token' | 'serverless';
  priceLastVerifiedAt?: string;
}

export interface CloudRentalOption {
  id: string;
  kind: 'cloud-rental';
  name: string;
  detail: string;
  providerName: string;
  hourlyUsd: number;
  monthlyUsd?: number;
  storageMonthlyUsd: number;
  networkMonthlyUsd: number;
  operationalScore: number;
  profile: HardwareProfile;
  confidence: DataConfidence;
  priceRegion?: string;
  priceUnit?: string;
  priceLastVerifiedAt?: string;
}

const DATASET_BASE_URL = 'https://raw.githubusercontent.com/raulprtech/ai-infra-dataset/main';

export const FALLBACK_API_OPTIONS: ApiOption[] = [
  { id: 'openai-mini', kind: 'api', name: 'OpenAI mini', detail: 'balanced API', inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.6, quality: 72, confidence: 'estimated' },
  { id: 'gemini-flash', kind: 'api', name: 'Gemini Flash', detail: 'fast long context', inputUsdPerMillion: 0.3, outputUsdPerMillion: 2.5, quality: 76, confidence: 'estimated' },
  { id: 'deepseek-chat', kind: 'api', name: 'DeepSeek chat', detail: 'budget API', inputUsdPerMillion: 0.27, outputUsdPerMillion: 1.1, quality: 70, confidence: 'estimated' },
  { id: 'openai-frontier', kind: 'api', name: 'OpenAI frontier', detail: 'premium quality', inputUsdPerMillion: 2, outputUsdPerMillion: 8, quality: 88, confidence: 'estimated' },
  { id: 'claude-sonnet', kind: 'api', name: 'Claude Sonnet', detail: 'coding and reasoning', inputUsdPerMillion: 3, outputUsdPerMillion: 15, quality: 90, confidence: 'estimated' },
];

export const CLOUD_RENTAL_OPTIONS: CloudRentalOption[] = [
  {
    id: 'runpod-rtx-4090',
    kind: 'cloud-rental',
    name: 'RunPod RTX 4090',
    detail: '24GB GPU cloud - on demand',
    providerName: 'RunPod',
    hourlyUsd: 0.69,
    storageMonthlyUsd: 8,
    networkMonthlyUsd: 0,
    operationalScore: 72,
    confidence: 'estimated',
    priceUnit: 'hour',
    profile: { preset: 'cloud-runpod-4090', os: 'Linux', gpuMaker: 'NVIDIA', gpuName: 'RTX 4090', vramGB: 24, ramGB: 64, cpuName: '', devicePriceUsd: 0, purchaseStatus: 'owned' },
  },
  {
    id: 'lambda-a10',
    kind: 'cloud-rental',
    name: 'Lambda A10',
    detail: '24GB GPU cloud - stable VM',
    providerName: 'Lambda',
    hourlyUsd: 0.75,
    storageMonthlyUsd: 10,
    networkMonthlyUsd: 0,
    operationalScore: 78,
    confidence: 'estimated',
    priceUnit: 'hour',
    profile: { preset: 'cloud-lambda-a10', os: 'Linux', gpuMaker: 'NVIDIA', gpuName: 'A10', vramGB: 24, ramGB: 64, cpuName: '', devicePriceUsd: 0, purchaseStatus: 'owned' },
  },
  {
    id: 'aws-g5-xlarge',
    kind: 'cloud-rental',
    name: 'AWS g5.xlarge',
    detail: 'A10G 24GB - hyperscaler',
    providerName: 'AWS',
    hourlyUsd: 1.01,
    storageMonthlyUsd: 15,
    networkMonthlyUsd: 10,
    operationalScore: 86,
    confidence: 'estimated',
    priceRegion: 'us-east-1 reference',
    priceUnit: 'hour',
    profile: { preset: 'cloud-aws-g5', os: 'Linux', gpuMaker: 'NVIDIA', gpuName: 'A10G', vramGB: 24, ramGB: 16, cpuName: '', devicePriceUsd: 0, purchaseStatus: 'owned' },
  },
  {
    id: 'cloudflare-workers-ai',
    kind: 'cloud-rental',
    name: 'Cloudflare Workers AI',
    detail: 'serverless AI / edge',
    providerName: 'Cloudflare',
    hourlyUsd: 0,
    monthlyUsd: 5,
    storageMonthlyUsd: 0,
    networkMonthlyUsd: 0,
    operationalScore: 88,
    confidence: 'estimated',
    priceUnit: 'serverless',
    profile: { preset: 'cloudflare-workers-ai', os: 'Linux', gpuMaker: 'NVIDIA', gpuName: 'Managed serverless GPU', vramGB: 16, ramGB: 32, cpuName: '', devicePriceUsd: 0, purchaseStatus: 'owned' },
  },
];

export const HARDWARE_OPTIONS: HardwareOption[] = [
  {
    id: 'rtx3060',
    kind: 'hardware',
    name: 'RTX 3060 12GB',
    detail: 'entry local GPU',
    profile: { preset: 'rtx3060', os: 'Windows', gpuMaker: 'NVIDIA', gpuName: 'RTX 3060', vramGB: 12, ramGB: 16, cpuName: '', devicePriceUsd: 850, purchaseStatus: 'planned' },
  },
  {
    id: 'rtx4070ti',
    kind: 'hardware',
    name: 'RTX 4070 Ti Super',
    detail: '16GB local workstation',
    profile: { preset: 'rtx4070tisuper', os: 'Windows', gpuMaker: 'NVIDIA', gpuName: 'RTX 4070 Ti Super', vramGB: 16, ramGB: 32, cpuName: '', devicePriceUsd: 1600, purchaseStatus: 'planned' },
  },
  {
    id: 'rtx4090',
    kind: 'hardware',
    name: 'RTX 4090 24GB',
    detail: 'high-end local GPU',
    profile: { preset: 'rtx4090', os: 'Windows', gpuMaker: 'NVIDIA', gpuName: 'RTX 4090', vramGB: 24, ramGB: 64, cpuName: '', devicePriceUsd: 3200, purchaseStatus: 'planned' },
  },
  {
    id: 'macm4',
    kind: 'hardware',
    name: 'Mac mini M4',
    detail: 'efficient Apple Silicon',
    profile: { preset: 'macmini_m4_16gb', os: 'macOS', gpuMaker: 'Apple', gpuName: 'M4', vramGB: 12, ramGB: 16, cpuName: '', devicePriceUsd: 799, purchaseStatus: 'planned' },
  },
  {
    id: 'm3max',
    kind: 'hardware',
    name: 'M3 Max 64GB',
    detail: 'portable high-memory local',
    profile: { preset: 'm3max_64gb', os: 'macOS', gpuMaker: 'Apple', gpuName: 'M3 Max', vramGB: 48, ramGB: 64, cpuName: '', devicePriceUsd: 3999, purchaseStatus: 'planned' },
  },
];

function apiDetail(record: ApiPricingRecord) {
  const confidence = record.confidence === 'estimated' ? 'estimated' : record.confidence;
  return `${(record.category || 'api').replace(/_/g, ' ')} - ${record.pricingUnit ?? 'tokens'} - ${confidence}`;
}

function cloudDetail(record: CloudComputeRecord) {
  const price = record.monthlyUsd ? `$${record.monthlyUsd}/mo` : `$${record.hourlyUsd}/hr`;
  const region = record.priceRegion ? ` - ${record.priceRegion}` : '';
  return `${record.category.replace(/-/g, ' ')} - ${record.vramGB}GB VRAM - ${price}${region}`;
}

function isUsageGoal(value: string): value is UsageGoal {
  return ['chat', 'coding', 'agents', 'rag', 'vision', 'embedding'].includes(value);
}

function localModelSpecs(record: LocalModelRecord): ModelSpec[] {
  const specs: ModelSpec[] = [
    { label: 'VRAM util', value: `${record.minGpuVramGB} GB+` },
    { label: 'VRAM fluida', value: `${record.minFastVramGB} GB+` },
    { label: 'RAM CPU', value: `${record.minCpuRamGB} GB+` },
  ];
  if (record.contextWindowTokens) {
    specs.unshift({ label: 'Contexto', value: `${record.contextWindowTokens.toLocaleString()} tokens` });
  }
  return specs;
}

export function mapApiPricingRecord(record: ApiPricingRecord): ApiOption {
  return {
    id: record.id,
    kind: 'api',
    name: record.name,
    detail: apiDetail(record),
    inputUsdPerMillion: record.inputUsdPerMillionTokens,
    outputUsdPerMillion: record.outputUsdPerMillionTokens,
    quality: record.qualityScore,
    confidence: record.confidence,
    priceRegion: record.priceRegion,
    priceLastVerifiedAt: record.priceLastVerifiedAt,
  };
}

export function mapLocalModelRecord(record: LocalModelRecord): ModelCatalogEntry {
  const idealUseCases = (record.idealUseCases ?? ['chat']).filter(isUsageGoal);
  return {
    name: record.name,
    parameters: record.parameters,
    quantization: record.quantization,
    minFastVramGB: record.minFastVramGB,
    minGpuVramGB: record.minGpuVramGB,
    minCpuRamGB: record.minCpuRamGB,
    noteKey: 'calc.models.dataset',
    idealUseCases: idealUseCases.length > 0 ? idealUseCases : ['chat'],
    intelligenceScore: record.qualityScore ?? 50,
    description: record.description ?? record.notes ?? 'Modelo local importado desde ai-infra-dataset.',
    license: record.license ?? 'Licencia pendiente de revision.',
    links: record.links ?? record.sources.map((source) => ({ label: source.type, url: source.url })),
    quantizationOptions: record.quantizationOptions ?? [record.quantization],
    installCommands: record.installCommands ?? [],
    specs: localModelSpecs(record),
    benchmarkSummary: record.benchmarkSummary ?? [
      { label: 'Calidad relativa', value: `${record.qualityScore ?? 50}/100`, note: `Confianza del dato: ${record.confidence}` },
    ],
    confidence: record.confidence,
    lastCheckedAt: record.lastCheckedAt,
  };
}

export function mapCloudComputeRecord(record: CloudComputeRecord): CloudRentalOption {
  return {
    id: record.id,
    kind: 'cloud-rental',
    name: record.name,
    detail: cloudDetail(record),
    providerName: record.providerName,
    hourlyUsd: record.hourlyUsd,
    monthlyUsd: record.monthlyUsd,
    storageMonthlyUsd: record.storageMonthlyUsd ?? 0,
    networkMonthlyUsd: record.networkMonthlyUsd ?? 0,
    operationalScore: record.operationalScore,
    confidence: record.confidence,
    priceRegion: record.priceRegion,
    priceUnit: record.priceUnit,
    priceLastVerifiedAt: record.priceLastVerifiedAt,
    profile: {
      preset: `cloud-${record.id}`,
      os: 'Linux',
      gpuMaker: record.gpuMaker,
      gpuName: record.gpuName,
      vramGB: record.vramGB,
      ramGB: record.ramGB,
      cpuName: '',
      devicePriceUsd: 0,
      purchaseStatus: 'owned',
    },
  };
}

export async function loadLocalModelCatalog(): Promise<ModelCatalogEntry[]> {
  const response = await fetch(`${DATASET_BASE_URL}/data/models/local-models.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Dataset request failed: ${response.status}`);
  const records = await response.json() as LocalModelRecord[];
  return records
    .filter((record) => record.confidence !== 'deprecated')
    .map(mapLocalModelRecord);
}

export async function loadApiOptions(): Promise<ApiOption[]> {
  const response = await fetch(`${DATASET_BASE_URL}/data/api-pricing/api-models.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Dataset request failed: ${response.status}`);
  const records = await response.json() as ApiPricingRecord[];
  return records
    .filter((record) => record.confidence !== 'deprecated')
    .map(mapApiPricingRecord);
}

export async function loadCloudRentalOptions(): Promise<CloudRentalOption[]> {
  const response = await fetch(`${DATASET_BASE_URL}/data/cloud-compute/instances.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Dataset request failed: ${response.status}`);
  const records = await response.json() as CloudComputeRecord[];
  return records
    .filter((record) => record.confidence !== 'deprecated')
    .map(mapCloudComputeRecord);
}
