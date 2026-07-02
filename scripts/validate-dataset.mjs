import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const datasetFiles = [
  'dataset/api-pricing/providers.json',
  'dataset/api-pricing/api-models.json',
  'dataset/hardware/gpus.json',
  'dataset/models/local-models.json',
];

const confidenceLevels = new Set(['official', 'verified', 'community', 'estimated', 'deprecated']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateRecord(record, file, ids) {
  assert(typeof record.id === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(record.id), `${file}: invalid id`);
  assert(!ids.has(record.id), `${file}: duplicate id "${record.id}"`);
  ids.add(record.id);
  assert(typeof record.name === 'string' && record.name.length > 0, `${file}: "${record.id}" is missing name`);
  assert(confidenceLevels.has(record.confidence), `${file}: "${record.id}" has invalid confidence`);
  assert(typeof record.lastCheckedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(record.lastCheckedAt), `${file}: "${record.id}" needs ISO date`);
  assert(Array.isArray(record.sources) && record.sources.length > 0, `${file}: "${record.id}" needs at least one source`);
  for (const source of record.sources) {
    assert(typeof source.type === 'string' && source.type.length > 0, `${file}: "${record.id}" has source without type`);
    assert(typeof source.url === 'string' && /^https?:\/\//.test(source.url), `${file}: "${record.id}" has invalid source URL`);
  }
}

for (const file of datasetFiles) {
  const raw = await readFile(join(process.cwd(), file), 'utf8');
  const records = JSON.parse(raw);
  const ids = new Set();
  assert(Array.isArray(records), `${file}: root must be an array`);
  for (const record of records) validateRecord(record, file, ids);
}

console.log(`Dataset validation passed for ${datasetFiles.length} files.`);
