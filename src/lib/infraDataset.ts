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

const DATASET_BASE_URL = 'https://raw.githubusercontent.com/raulprtech/ai-infra-dataset/main';

export const FALLBACK_API_OPTIONS: ApiOption[] = [
  { id: 'openai-mini', kind: 'api', name: 'OpenAI mini', detail: 'balanced API', inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.6, quality: 72, confidence: 'estimated' },
  { id: 'gemini-flash', kind: 'api', name: 'Gemini Flash', detail: 'fast long context', inputUsdPerMillion: 0.3, outputUsdPerMillion: 2.5, quality: 76, confidence: 'estimated' },
  { id: 'deepseek-chat', kind: 'api', name: 'DeepSeek chat', detail: 'budget API', inputUsdPerMillion: 0.27, outputUsdPerMillion: 1.1, quality: 70, confidence: 'estimated' },
  { id: 'openai-frontier', kind: 'api', name: 'OpenAI frontier', detail: 'premium quality', inputUsdPerMillion: 2, outputUsdPerMillion: 8, quality: 88, confidence: 'estimated' },
  { id: 'claude-sonnet', kind: 'api', name: 'Claude Sonnet', detail: 'coding and reasoning', inputUsdPerMillion: 3, outputUsdPerMillion: 15, quality: 90, confidence: 'estimated' },
];

export const HARDWARE_OPTIONS: HardwareOption[] = [
  {
    id: 'rtx3060',
    kind: 'hardware',
    name: 'RTX 3060 12GB',
    detail: 'entry local GPU',
    profile: { preset: 'rtx3060', os: 'Windows', gpuMaker: 'NVIDIA', gpuName: 'RTX 3060', vramGB: 12, ramGB: 16, cpuName: '', devicePriceUsd: 850 },
  },
  {
    id: 'rtx4070ti',
    kind: 'hardware',
    name: 'RTX 4070 Ti Super',
    detail: '16GB local workstation',
    profile: { preset: 'rtx4070tisuper', os: 'Windows', gpuMaker: 'NVIDIA', gpuName: 'RTX 4070 Ti Super', vramGB: 16, ramGB: 32, cpuName: '', devicePriceUsd: 1600 },
  },
  {
    id: 'rtx4090',
    kind: 'hardware',
    name: 'RTX 4090 24GB',
    detail: 'high-end local GPU',
    profile: { preset: 'rtx4090', os: 'Windows', gpuMaker: 'NVIDIA', gpuName: 'RTX 4090', vramGB: 24, ramGB: 64, cpuName: '', devicePriceUsd: 3200 },
  },
  {
    id: 'macm4',
    kind: 'hardware',
    name: 'Mac mini M4',
    detail: 'efficient Apple Silicon',
    profile: { preset: 'macmini_m4_16gb', os: 'macOS', gpuMaker: 'Apple', gpuName: 'M4', vramGB: 12, ramGB: 16, cpuName: '', devicePriceUsd: 799 },
  },
  {
    id: 'm3max',
    kind: 'hardware',
    name: 'M3 Max 64GB',
    detail: 'portable high-memory local',
    profile: { preset: 'm3max_64gb', os: 'macOS', gpuMaker: 'Apple', gpuName: 'M3 Max', vramGB: 48, ramGB: 64, cpuName: '', devicePriceUsd: 3999 },
  },
];

function apiDetail(record: ApiPricingRecord) {
  return (record.category || 'api').replace(/_/g, ' ');
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

export async function loadApiOptions(): Promise<ApiOption[]> {
  const response = await fetch(`${DATASET_BASE_URL}/data/api-pricing/api-models.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Dataset request failed: ${response.status}`);
  const records = await response.json() as ApiPricingRecord[];
  return records
    .filter((record) => record.confidence !== 'deprecated')
    .map(mapApiPricingRecord);
}
