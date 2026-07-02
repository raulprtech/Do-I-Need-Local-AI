import { ModelCapability, UsageGoal } from './types';

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
}

export const MODEL_CATALOG: ModelCatalogEntry[] = [
  {
    name: 'Phi-3 Mini',
    parameters: '3.8B',
    quantization: '4-bit (Q4_K_M)',
    minFastVramGB: 4,
    minGpuVramGB: 4,
    minCpuRamGB: 8,
    noteKey: 'calc.models.phi3',
    idealUseCases: ['chat', 'embedding'],
    intelligenceScore: 45,
  },
  {
    name: 'Llama 3 8B / Mistral 7B',
    parameters: '8B',
    quantization: '4-bit (Q4_K_M)',
    minFastVramGB: 6,
    minGpuVramGB: 6,
    minCpuRamGB: 16,
    noteKey: 'calc.models.llama3_8b.cpu',
    noteGpuKey: 'calc.models.llama3_8b.gpu',
    noteCpuKey: 'calc.models.llama3_8b.cpu',
    idealUseCases: ['chat', 'rag'],
    intelligenceScore: 58,
  },
  {
    name: 'Gemma 2 9B',
    parameters: '9B',
    quantization: '4-bit (Q4_K_M)',
    minFastVramGB: 8,
    minGpuVramGB: 8,
    minCpuRamGB: 16,
    noteKey: 'calc.models.gemma2',
    idealUseCases: ['chat', 'rag'],
    intelligenceScore: 62,
  },
  {
    name: 'DeepSeek R1 (Distill 8B)',
    parameters: '8B',
    quantization: '4-bit (Q4_K_M)',
    minFastVramGB: 6,
    minGpuVramGB: 6,
    minCpuRamGB: 16,
    noteKey: 'calc.models.deepseek_r1',
    idealUseCases: ['coding', 'agents'],
    intelligenceScore: 64,
  },
  {
    name: 'Qwen 2.5 14B / DeepSeek Coder V2 Lite',
    parameters: '14B-16B',
    quantization: '4-bit (Q4_K_M)',
    minFastVramGB: 12,
    minGpuVramGB: 12,
    minCpuRamGB: 24,
    noteKey: 'calc.models.qwen.cpu',
    noteGpuKey: 'calc.models.qwen.gpu',
    noteCpuKey: 'calc.models.qwen.cpu',
    idealUseCases: ['coding', 'rag', 'agents'],
    intelligenceScore: 72,
  },
  {
    name: 'Llama 3.3 70B',
    parameters: '70B',
    quantization: '4-bit (Q4_K_M)',
    minFastVramGB: 40,
    minGpuVramGB: 24,
    minCpuRamGB: 64,
    noteKey: 'calc.models.llama3_70b.cpu',
    noteGpuKey: 'calc.models.llama3_70b.gpu',
    noteCpuKey: 'calc.models.llama3_70b.cpu',
    idealUseCases: ['chat', 'coding', 'rag', 'agents'],
    intelligenceScore: 84,
  },
];

export function evaluateCatalogEntry(
  model: ModelCatalogEntry,
  effectiveVramGB: number,
  ramGB: number,
  t: (key: string) => string,
): ModelCapability {
  const canRunOnGpu = effectiveVramGB >= model.minGpuVramGB;
  const canRunOnCpu = ramGB >= model.minCpuRamGB;
  const canRun = canRunOnGpu || canRunOnCpu;
  const speed = effectiveVramGB >= model.minFastVramGB
    ? 'fast'
    : canRun
      ? 'acceptable'
      : 'unusable';
  const noteKey = canRunOnGpu && model.noteGpuKey
    ? model.noteGpuKey
    : canRunOnCpu && model.noteCpuKey
      ? model.noteCpuKey
      : model.noteKey;

  return {
    name: model.name,
    parameters: model.parameters,
    quantization: model.quantization,
    speed,
    canRun,
    notes: t(noteKey),
    idealUseCases: model.idealUseCases,
    idealUseCaseLabels: model.idealUseCases.map((goal) => t(`input.usage.goal.${goal}`)).join(', '),
    intelligenceScore: model.intelligenceScore,
  };
}
