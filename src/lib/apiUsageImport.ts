export interface ApiUsageRecord {
  provider: string;
  model: string;
  date?: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
}

export interface ApiUsageGroup {
  key: string;
  requests: number;
  totalTokens: number;
  costUsd: number;
}

export interface ApiUsageSummary {
  records: ApiUsageRecord[];
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  localizableCostUsd: number;
  estimatedMonthlySavingsUsd: number;
  localizableShare: number;
  byProvider: ApiUsageGroup[];
  byModel: ApiUsageGroup[];
}

const HEADER_ALIASES: Record<string, keyof ApiUsageRecord> = {
  provider: 'provider',
  vendor: 'provider',
  service: 'provider',
  model: 'model',
  model_name: 'model',
  date: 'date',
  timestamp: 'date',
  requests: 'requests',
  request_count: 'requests',
  calls: 'requests',
  input_tokens: 'inputTokens',
  prompt_tokens: 'inputTokens',
  inputtokens: 'inputTokens',
  output_tokens: 'outputTokens',
  completion_tokens: 'outputTokens',
  outputtokens: 'outputTokens',
  total_tokens: 'totalTokens',
  tokens: 'totalTokens',
  totaltokens: 'totalTokens',
  cost_usd: 'costUsd',
  cost: 'costUsd',
  usd: 'costUsd',
  amount_usd: 'costUsd',
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return 0;
  const normalized = value.replace(/[$,]/g, '').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toStringValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function recordFromObject(raw: Record<string, unknown>): ApiUsageRecord {
  const normalized: Partial<ApiUsageRecord> = {};

  for (const [key, value] of Object.entries(raw)) {
    const mappedKey = HEADER_ALIASES[normalizeHeader(key)];
    if (!mappedKey) continue;
    if (mappedKey === 'provider' || mappedKey === 'model' || mappedKey === 'date') {
      normalized[mappedKey] = toStringValue(value, '') as never;
    } else {
      normalized[mappedKey] = toNumber(value) as never;
    }
  }

  const inputTokens = normalized.inputTokens ?? 0;
  const outputTokens = normalized.outputTokens ?? 0;
  const totalTokens = normalized.totalTokens && normalized.totalTokens > 0
    ? normalized.totalTokens
    : inputTokens + outputTokens;

  return {
    provider: normalized.provider || 'Unknown',
    model: normalized.model || 'Unknown model',
    date: normalized.date || undefined,
    requests: Math.max(0, normalized.requests ?? 1),
    inputTokens: Math.max(0, inputTokens),
    outputTokens: Math.max(0, outputTokens),
    totalTokens: Math.max(0, totalTokens),
    costUsd: Math.max(0, normalized.costUsd ?? 0),
  };
}

function parseCsv(input: string): ApiUsageRecord[] {
  const rows = parseCsvRows(input);
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const raw: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      raw[header] = row[index] ?? '';
    });
    return recordFromObject(raw);
  });
}

function parseJson(input: string): ApiUsageRecord[] {
  const parsed = JSON.parse(input);
  const records = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.records)
      ? parsed.records
      : Array.isArray(parsed.data)
        ? parsed.data
        : [];

  return records
    .filter((record): record is Record<string, unknown> => record && typeof record === 'object' && !Array.isArray(record))
    .map(recordFromObject);
}

export function parseApiUsage(input: string): ApiUsageRecord[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const records = trimmed.startsWith('{') || trimmed.startsWith('[') ? parseJson(trimmed) : parseCsv(trimmed);
  return records.filter((record) => record.totalTokens > 0 || record.costUsd > 0 || record.requests > 0);
}

function groupBy(records: ApiUsageRecord[], key: 'provider' | 'model'): ApiUsageGroup[] {
  const groups = new Map<string, ApiUsageGroup>();

  for (const record of records) {
    const groupKey = record[key] || 'Unknown';
    const current = groups.get(groupKey) ?? { key: groupKey, requests: 0, totalTokens: 0, costUsd: 0 };
    current.requests += record.requests;
    current.totalTokens += record.totalTokens;
    current.costUsd += record.costUsd;
    groups.set(groupKey, current);
  }

  return [...groups.values()].sort((left, right) => right.costUsd - left.costUsd);
}

function isLikelyLocalizable(record: ApiUsageRecord) {
  const value = `${record.provider} ${record.model}`.toLowerCase();
  return value.includes('mini')
    || value.includes('flash')
    || value.includes('haiku')
    || value.includes('deepseek')
    || value.includes('llama')
    || value.includes('mistral')
    || value.includes('qwen')
    || value.includes('embedding')
    || value.includes('unknown');
}

export function summarizeApiUsage(records: ApiUsageRecord[]): ApiUsageSummary {
  const totalRequests = records.reduce((sum, record) => sum + record.requests, 0);
  const totalTokens = records.reduce((sum, record) => sum + record.totalTokens, 0);
  const totalCostUsd = records.reduce((sum, record) => sum + record.costUsd, 0);
  const localizableCostUsd = records
    .filter(isLikelyLocalizable)
    .reduce((sum, record) => sum + record.costUsd, 0);
  const estimatedMonthlySavingsUsd = localizableCostUsd * 0.55;

  return {
    records,
    totalRequests,
    totalTokens,
    totalCostUsd,
    localizableCostUsd,
    estimatedMonthlySavingsUsd,
    localizableShare: totalCostUsd > 0 ? localizableCostUsd / totalCostUsd : 0,
    byProvider: groupBy(records, 'provider'),
    byModel: groupBy(records, 'model'),
  };
}
