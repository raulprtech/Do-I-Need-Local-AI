import { GPUMaker, HardwareProfile, OS } from './types';

interface DetectedGpu {
  gpuMaker: GPUMaker;
  gpuName: string;
  vramGB: number;
  os: OS;
}

function detectOs(): OS {
  const platform = navigator.platform.toLowerCase();
  const ua = navigator.userAgent.toLowerCase();

  if (platform.includes('mac') || ua.includes('mac os')) return 'macOS';
  if (platform.includes('linux') || ua.includes('linux')) return 'Linux';
  return 'Windows';
}

function inferGpuMaker(label: string, os: OS): GPUMaker {
  const value = label.toLowerCase();
  if (value.includes('nvidia') || value.includes('geforce') || value.includes('rtx') || value.includes('gtx')) return 'NVIDIA';
  if (value.includes('amd') || value.includes('radeon')) return 'AMD';
  if (value.includes('apple') || value.includes('m1') || value.includes('m2') || value.includes('m3') || value.includes('m4')) return 'Apple';
  if (value.includes('intel')) return 'Intel';
  return os === 'macOS' ? 'Apple' : 'None';
}

function estimateVramGB(label: string, maker: GPUMaker, os: OS): number {
  const value = label.toLowerCase();
  const match = value.match(/(\d+)\s*gb/);
  if (match) return Number(match[1]);
  if (value.includes('4090')) return 24;
  if (value.includes('4080')) return 16;
  if (value.includes('4070')) return 12;
  if (value.includes('4060') || value.includes('3060')) return 8;
  if (value.includes('3090')) return 24;
  if (value.includes('3080')) return 10;
  if (maker === 'Apple') return 12;
  if (maker === 'NVIDIA' || maker === 'AMD') return 8;
  return os === 'macOS' ? 8 : 0;
}

async function getWebGpuLabel(): Promise<string | null> {
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter?: () => Promise<unknown> } }).gpu;
  const adapter = await gpu?.requestAdapter?.();
  if (!adapter) return null;

  const maybeAdapter = adapter as { requestAdapterInfo?: () => Promise<{ vendor?: string; architecture?: string; description?: string }>; info?: { vendor?: string; architecture?: string; description?: string } };
  const info = maybeAdapter.info ?? await maybeAdapter.requestAdapterInfo?.();
  return [info?.vendor, info?.architecture, info?.description].filter(Boolean).join(' ') || null;
}

function getWebGlLabel(): string | null {
  const canvas = document.createElement('canvas');
  const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
  if (!gl) return null;

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (!debugInfo) return null;

  return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
}

export async function detectHardwareProfile(current: HardwareProfile): Promise<Partial<HardwareProfile>> {
  const os = detectOs();
  const label = await getWebGpuLabel().catch(() => null) ?? getWebGlLabel() ?? current.gpuName;
  const gpuMaker = inferGpuMaker(label, os);
  const vramGB = estimateVramGB(label, gpuMaker, os);

  return {
    preset: 'custom',
    os,
    gpuMaker,
    gpuName: label || current.gpuName,
    vramGB,
    ramGB: current.ramGB || (os === 'macOS' ? 16 : 16),
  };
}