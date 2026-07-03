import { HardwareProfile } from './types';

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
}

export interface HardwareOption {
  id: string;
  kind: 'hardware';
  name: string;
  detail: string;
  profile: HardwareProfile;
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
  return (record.category || 'api').replace(/_/g, ' ');
}

function cloudDetail(record: CloudComputeRecord) {
  const price = record.monthlyUsd ? `$${record.monthlyUsd}/mo` : `$${record.hourlyUsd}/hr`;
  return `${record.category.replace(/-/g, ' ')} - ${record.vramGB}GB VRAM - ${price}`;
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
