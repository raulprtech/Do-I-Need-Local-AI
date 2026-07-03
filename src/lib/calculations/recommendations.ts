import { HardwareProfile, SoftwareRecommendation, UsageProfile } from '../types';

export function getSoftwareRecommendations(hardware: HardwareProfile, usage: UsageProfile): SoftwareRecommendation[] {
  const recommendations: SoftwareRecommendation[] = [];
  const isServerLikeUsage = usage.frequency === 'production' || usage.frequency === 'heavy' || usage.goal === 'agents';
  const hasNvidiaServerGpu = hardware.gpuMaker === 'NVIDIA' && hardware.vramGB >= 16;

  if (isServerLikeUsage && hasNvidiaServerGpu) {
    recommendations.push({
      name: 'vLLM',
      url: 'https://github.com/vllm-project/vllm',
      description: 'Motor de inferencia de alto rendimiento para servidores, batches y cargas concurrentes en GPUs NVIDIA con memoria suficiente.',
    });
  }

  return recommendations;
}
