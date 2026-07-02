import { parseApiUsage, summarizeApiUsage } from './apiUsageImport';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const csv = `provider,model,input_tokens,output_tokens,cost_usd,requests
OpenAI,gpt-4o-mini,1000,500,0.01,2
Anthropic,claude-sonnet,2000,1000,0.09,1`;

const csvRecords = parseApiUsage(csv);
assert(csvRecords.length === 2, 'CSV should parse two records');
assert(csvRecords[0].totalTokens === 1500, 'CSV should infer total tokens');
assert(csvRecords[1].costUsd === 0.09, 'CSV should parse USD cost');

const jsonRecords = parseApiUsage(JSON.stringify({
  records: [
    { provider: 'Google', model: 'gemini-flash', total_tokens: 3000, cost_usd: 0.02, calls: 3 },
  ],
}));
assert(jsonRecords.length === 1, 'JSON wrapper should parse records');
assert(jsonRecords[0].requests === 3, 'JSON aliases should map request count');

const summary = summarizeApiUsage([...csvRecords, ...jsonRecords]);
assert(summary.totalRequests === 6, 'Summary should add requests');
assert(summary.totalTokens === 7500, 'Summary should add tokens');
assert(summary.byProvider[0].key === 'Anthropic', 'Provider groups should sort by cost');
assert(summary.localizableCostUsd > 0, 'Summary should detect localizable spend');

console.log('api usage import tests passed');
