import { ModelCapability, ModelCatalogEntry } from './types';

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
    description: 'Modelo pequeno y eficiente para asistentes locales, extraccion ligera y flujos donde importa mas la latencia que la maxima calidad.',
    license: 'MIT / terminos Microsoft Phi; verificar el checkpoint exacto antes de uso comercial.',
    links: [
      { label: 'Hugging Face', url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct' },
      { label: 'Ollama', url: 'https://ollama.com/library/phi3' },
      { label: 'LM Studio', url: 'https://lmstudio.ai/models?search=phi-3' },
    ],
    quantizationOptions: ['Q4_K_M', 'Q5_K_M', 'Q8_0', 'FP16'],
    installCommands: [
      { label: 'Ollama', command: 'ollama run phi3' },
    ],
    specs: [
      { label: 'Contexto', value: '4K tokens' },
      { label: 'VRAM util', value: '4 GB+' },
      { label: 'RAM CPU', value: '8 GB+' },
      { label: 'Formato local', value: 'GGUF / Ollama' },
    ],
    benchmarkSummary: [
      { label: 'Calidad relativa', value: '45/100', note: 'Orientado a tareas simples; queda lejos de modelos frontera.' },
      { label: 'Mejor escenario', value: 'Chat ligero', note: 'Buena respuesta en equipos modestos y notebooks.' },
    ],
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
    description: 'Punto medio popular para chat general, RAG pequeno y prototipos. Suele funcionar bien en GPUs de consumo con 6-8 GB de VRAM.',
    license: 'Llama Community License / Apache 2.0 segun el checkpoint elegido.',
    links: [
      { label: 'Llama HF', url: 'https://huggingface.co/meta-llama' },
      { label: 'Mistral HF', url: 'https://huggingface.co/mistralai' },
      { label: 'Ollama Llama 3', url: 'https://ollama.com/library/llama3' },
      { label: 'Ollama Mistral', url: 'https://ollama.com/library/mistral' },
      { label: 'LM Studio', url: 'https://lmstudio.ai/models?search=llama%203%208b' },
    ],
    quantizationOptions: ['Q4_K_M', 'Q5_K_M', 'Q6_K', 'Q8_0', 'FP16'],
    installCommands: [
      { label: 'Ollama Llama 3', command: 'ollama run llama3' },
      { label: 'Ollama Mistral', command: 'ollama run mistral' },
    ],
    specs: [
      { label: 'Contexto', value: '8K-32K segun variante' },
      { label: 'VRAM util', value: '6 GB+' },
      { label: 'RAM CPU', value: '16 GB+' },
      { label: 'Formato local', value: 'GGUF / Ollama / MLX' },
    ],
    benchmarkSummary: [
      { label: 'Calidad relativa', value: '58/100', note: 'Adecuado para asistencia general, menos fiable para razonamiento profundo.' },
      { label: 'Mejor escenario', value: 'RAG pequeno', note: 'Buen balance entre costo, latencia y privacidad.' },
    ],
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
    description: 'Modelo compacto con buena calidad conversacional. Requiere un poco mas de memoria que opciones 7B/8B, pero mejora consistencia.',
    license: 'Gemma Terms of Use; revisar restricciones del checkpoint.',
    links: [
      { label: 'Hugging Face', url: 'https://huggingface.co/google/gemma-2-9b-it' },
      { label: 'Ollama', url: 'https://ollama.com/library/gemma2' },
      { label: 'LM Studio', url: 'https://lmstudio.ai/models?search=gemma%202%209b' },
    ],
    quantizationOptions: ['Q4_K_M', 'Q5_K_M', 'Q8_0', 'BF16'],
    installCommands: [
      { label: 'Ollama', command: 'ollama run gemma2' },
    ],
    specs: [
      { label: 'Contexto', value: '8K tokens' },
      { label: 'VRAM util', value: '8 GB+' },
      { label: 'RAM CPU', value: '16 GB+' },
      { label: 'Formato local', value: 'GGUF / Ollama' },
    ],
    benchmarkSummary: [
      { label: 'Calidad relativa', value: '62/100', note: 'Mejor respuesta que modelos pequenos, con costo de memoria moderado.' },
      { label: 'Mejor escenario', value: 'Asistente local', note: 'Buen candidato para chat privado y resumen de documentos.' },
    ],
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
    description: 'Variante destilada enfocada en razonamiento. Es atractiva para codigo, explicaciones paso a paso y agentes locales pequenos.',
    license: 'MIT / terminos DeepSeek segun distill y base model; verificar checkpoint exacto.',
    links: [
      { label: 'Hugging Face', url: 'https://huggingface.co/deepseek-ai' },
      { label: 'Ollama', url: 'https://ollama.com/library/deepseek-r1' },
      { label: 'LM Studio', url: 'https://lmstudio.ai/models?search=deepseek%20r1%208b' },
    ],
    quantizationOptions: ['Q4_K_M', 'Q5_K_M', 'Q8_0', 'FP16'],
    installCommands: [
      { label: 'Ollama', command: 'ollama run deepseek-r1' },
    ],
    specs: [
      { label: 'Contexto', value: 'Depende del distill' },
      { label: 'VRAM util', value: '6 GB+' },
      { label: 'RAM CPU', value: '16 GB+' },
      { label: 'Formato local', value: 'GGUF / Ollama' },
    ],
    benchmarkSummary: [
      { label: 'Calidad relativa', value: '64/100', note: 'Fuerte para razonamiento ligero; revisar latencia por tokens de razonamiento.' },
      { label: 'Mejor escenario', value: 'Codigo y agentes', note: 'Util cuando quieres trazas de razonamiento locales.' },
    ],
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
    description: 'Clase media-alta local para programacion, RAG y automatizaciones. Requiere mas memoria, pero mejora bastante la calidad util.',
    license: 'Apache 2.0 para Qwen 2.5 14B; terminos DeepSeek variables para Coder V2 Lite.',
    links: [
      { label: 'Qwen HF', url: 'https://huggingface.co/Qwen/Qwen2.5-14B-Instruct' },
      { label: 'DeepSeek HF', url: 'https://huggingface.co/deepseek-ai' },
      { label: 'Ollama Qwen', url: 'https://ollama.com/library/qwen2.5' },
      { label: 'Ollama DeepSeek Coder', url: 'https://ollama.com/library/deepseek-coder-v2' },
      { label: 'LM Studio', url: 'https://lmstudio.ai/models?search=qwen%202.5%2014b' },
    ],
    quantizationOptions: ['Q4_K_M', 'Q5_K_M', 'Q6_K', 'Q8_0', 'AWQ/GPTQ', 'BF16'],
    installCommands: [
      { label: 'Ollama Qwen', command: 'ollama run qwen2.5:14b' },
      { label: 'Ollama DeepSeek Coder', command: 'ollama run deepseek-coder-v2' },
      { label: 'vLLM Qwen', command: 'vllm serve Qwen/Qwen2.5-14B-Instruct' },
    ],
    specs: [
      { label: 'Contexto', value: '32K+ segun variante' },
      { label: 'VRAM util', value: '12 GB+' },
      { label: 'RAM CPU', value: '24 GB+' },
      { label: 'Formato local', value: 'GGUF / AWQ / GPTQ / BF16' },
    ],
    benchmarkSummary: [
      { label: 'Calidad relativa', value: '72/100', note: 'Buen salto frente a 7B/8B, especialmente en codigo y RAG.' },
      { label: 'Mejor escenario', value: 'Coding y RAG', note: 'Buena base para equipos con 12-16 GB de VRAM.' },
    ],
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
    description: 'Modelo local grande para escenarios donde se busca calidad cercana a modelos cloud medianos/altos, con costo de hardware importante.',
    license: 'Llama 3.3 Community License; revisar restricciones de uso comercial y escala.',
    links: [
      { label: 'Hugging Face', url: 'https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct' },
      { label: 'Ollama', url: 'https://ollama.com/library/llama3.3' },
      { label: 'LM Studio', url: 'https://lmstudio.ai/models?search=llama%203.3%2070b' },
    ],
    quantizationOptions: ['Q3_K_M', 'Q4_K_M', 'Q5_K_M', 'Q8_0', 'AWQ/GPTQ', 'BF16'],
    installCommands: [
      { label: 'Ollama', command: 'ollama run llama3.3' },
      { label: 'vLLM', command: 'vllm serve meta-llama/Llama-3.3-70B-Instruct' },
    ],
    specs: [
      { label: 'Contexto', value: '128K tokens' },
      { label: 'VRAM minima', value: '24 GB con offload/quant' },
      { label: 'VRAM fluida', value: '40 GB+' },
      { label: 'RAM CPU', value: '64 GB+' },
    ],
    benchmarkSummary: [
      { label: 'Calidad relativa', value: '84/100', note: 'El mejor candidato local del catalogo actual para tareas generales complejas.' },
      { label: 'Mejor escenario', value: 'Workstation / servidor', note: 'Recomendable con GPU grande o despliegue multi-GPU.' },
    ],
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
    description: model.description,
    license: model.license,
    links: model.links,
    quantizationOptions: model.quantizationOptions,
    installCommands: model.installCommands,
    specs: model.specs,
    benchmarkSummary: model.benchmarkSummary,
  };
}
