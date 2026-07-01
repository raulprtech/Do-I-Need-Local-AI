import { GPUMaker, HardwareProfile, OS } from './types';

interface GpuSpec {
  vramGB: number;
}

interface WebGpuInfo {
  label: string | null;
  maxBufferGB: number | null;
}

const GPU_SPECS: Record<string, GpuSpec> = {
  'RTX 4090': { vramGB: 24 },
  'RTX 4080 SUPER': { vramGB: 16 },
  'RTX 4080': { vramGB: 16 },
  'RTX 4070 TI SUPER': { vramGB: 16 },
  'RTX 4070 TI': { vramGB: 12 },
  'RTX 4070 SUPER': { vramGB: 12 },
  'RTX 4070': { vramGB: 12 },
  'RTX 4060 TI 16GB': { vramGB: 16 },
  'RTX 4060 TI': { vramGB: 8 },
  'RTX 4060': { vramGB: 8 },
  'RTX 3090 TI': { vramGB: 24 },
  'RTX 3090': { vramGB: 24 },
  'RTX 3080 TI': { vramGB: 12 },
  'RTX 3080 12GB': { vramGB: 12 },
  'RTX 3080': { vramGB: 10 },
  'RTX 3070 TI': { vramGB: 8 },
  'RTX 3070': { vramGB: 8 },
  'RTX 3060 TI': { vramGB: 8 },
  'RTX 3060 LAPTOP': { vramGB: 6 },
  'RTX 3060': { vramGB: 12 },
  'RTX 3050 TI': { vramGB: 4 },
  'RTX 3050': { vramGB: 8 },
  'RTX 2080 TI': { vramGB: 11 },
  'RTX 2080': { vramGB: 8 },
  'RTX 2070': { vramGB: 8 },
  'RTX 2060 12GB': { vramGB: 12 },
  'RTX 2060': { vramGB: 6 },
  'GTX 1660 TI': { vramGB: 6 },
  'GTX 1660 SUPER': { vramGB: 6 },
  'GTX 1660': { vramGB: 6 },
  'GTX 1650': { vramGB: 4 },
  'GTX 1080 TI': { vramGB: 11 },
  'GTX 1080': { vramGB: 8 },
  'GTX 1070': { vramGB: 8 },
  'GTX 1060 6GB': { vramGB: 6 },
  'GTX 1060': { vramGB: 6 },
  'RX 7900 XTX': { vramGB: 24 },
  'RX 7900 XT': { vramGB: 20 },
  'RX 7800 XT': { vramGB: 16 },
  'RX 7700 XT': { vramGB: 12 },
  'RX 7600 XT': { vramGB: 16 },
  'RX 7600': { vramGB: 8 },
  'RX 6900 XT': { vramGB: 16 },
  'RX 6800 XT': { vramGB: 16 },
  'RX 6800': { vramGB: 16 },
  'RX 6700 XT': { vramGB: 12 },
  'RX 6600 XT': { vramGB: 8 },
  'RX 6600': { vramGB: 8 },
  'ARC A770': { vramGB: 16 },
  'ARC A750': { vramGB: 8 },
  'ARC A580': { vramGB: 8 },
  'ARC A380': { vramGB: 6 },
};

const APPLE_UNIFIED_MEMORY_GB: Record<string, number> = {
  'M4 MAX': 36,
  'M4 PRO': 24,
  'M4': 16,
  'M3 MAX': 36,
  'M3 PRO': 18,
  'M3': 8,
  'M2 ULTRA': 64,
  'M2 MAX': 32,
  'M2 PRO': 16,
  'M2': 8,
  'M1 ULTRA': 64,
  'M1 MAX': 32,
  'M1 PRO': 16,
  'M1': 8,
};

function detectOs(): OS {
  const userAgentData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  const platform = `${userAgentData?.platform ?? navigator.platform ?? ''}`.toLowerCase();
  const ua = navigator.userAgent.toLowerCase();

  if (platform.includes('mac') || ua.includes('mac os')) return 'macOS';
  if (platform.includes('linux') || ua.includes('linux')) return 'Linux';
  return 'Windows';
}

function getDeviceMemoryGB(): number | null {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof memory === 'number' && Number.isFinite(memory) ? memory : null;
}

function cleanRendererLabel(label: string): string {
  return label
    .replace(/^ANGLE\s*\(/i, '')
    .replace(/\s*Direct3D.*$/i, '')
    .replace(/\s*D3D\d+.*$/i, '')
    .replace(/\s*OpenGL Engine.*$/i, '')
    .replace(/\s*Metal.*$/i, '')
    .replace(/\s*\(.*?\)/g, ' ')
    .replace(/NVIDIA\s+/i, '')
    .replace(/AMD\s+/i, '')
    .replace(/Radeon\s+Graphics/i, 'Radeon Graphics')
    .replace(/GeForce\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferGpuMaker(label: string, os: OS): GPUMaker {
  const value = label.toLowerCase();
  if (value.includes('nvidia') || value.includes('geforce') || value.includes('rtx') || value.includes('gtx')) return 'NVIDIA';
  if (value.includes('amd') || value.includes('radeon') || value.includes('rx ')) return 'AMD';
  if (value.includes('apple') || /\bm[1-5]\b/.test(value)) return 'Apple';
  if (value.includes('intel') || value.includes('arc') || value.includes('iris') || value.includes('uhd')) return 'Intel';
  return os === 'macOS' ? 'Apple' : 'None';
}

function findGpuSpec(label: string): { name: string; spec: GpuSpec } | null {
  const normalized = label.toUpperCase().replace(/GEFORCE\s+/g, '').replace(/AMD\s+/g, '').replace(/RADEON\s+/g, '').replace(/\s+/g, ' ');
  const keys = Object.keys(GPU_SPECS).sort((a, b) => b.length - a.length);
  const key = keys.find((candidate) => normalized.includes(candidate));
  return key ? { name: key, spec: GPU_SPECS[key] } : null;
}

function getAppleMemoryGB(label: string): number | null {
  const normalized = label.toUpperCase();
  const key = Object.keys(APPLE_UNIFIED_MEMORY_GB).sort((a, b) => b.length - a.length).find((candidate) => normalized.includes(candidate));
  return key ? APPLE_UNIFIED_MEMORY_GB[key] : null;
}

async function getWebGpuInfo(): Promise<WebGpuInfo> {
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter?: () => Promise<unknown> } }).gpu;
  const adapter = await gpu?.requestAdapter?.();
  if (!adapter) return { label: null, maxBufferGB: null };

  const maybeAdapter = adapter as {
    requestAdapterInfo?: () => Promise<{ vendor?: string; architecture?: string; device?: string; description?: string }>;
    info?: { vendor?: string; architecture?: string; device?: string; description?: string };
    limits?: { maxBufferSize?: number };
  };
  const info = maybeAdapter.info ?? await maybeAdapter.requestAdapterInfo?.();
  const label = [info?.vendor, info?.architecture, info?.device, info?.description].filter(Boolean).join(' ').trim() || null;
  const maxBufferSize = maybeAdapter.limits?.maxBufferSize;
  const maxBufferGB = typeof maxBufferSize === 'number' ? maxBufferSize / 1024 / 1024 / 1024 : null;

  return { label, maxBufferGB };
}

function getWebGlRenderer(): string | null {
  const canvas = document.createElement('canvas');
  const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
  if (!gl) return null;

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
  }

  const renderer = gl.getParameter(gl.RENDERER) as string;
  return renderer && renderer !== 'WebKit WebGL' ? renderer : null;
}

function estimateVramGB(label: string, maker: GPUMaker, os: OS, webGpu: WebGpuInfo, current: HardwareProfile): number {
  const explicitMemory = label.match(/(\d+)\s*gb/i);
  if (explicitMemory) return Number(explicitMemory[1]);

  const matched = findGpuSpec(label);
  if (matched) return matched.spec.vramGB;

  const deviceMemory = getDeviceMemoryGB();
  if (maker === 'Apple') {
    return Math.max(8, Math.round((deviceMemory ?? getAppleMemoryGB(label) ?? current.ramGB ?? 16) * 0.75));
  }

  if (webGpu.maxBufferGB && webGpu.maxBufferGB >= 2) {
    return Math.max(4, Math.round(webGpu.maxBufferGB));
  }

  if (maker === 'NVIDIA' || maker === 'AMD') return current.vramGB || 8;
  if (maker === 'Intel') return 0;
  return os === 'macOS' ? Math.max(6, Math.round((deviceMemory ?? current.ramGB ?? 8) * 0.5)) : 0;
}

function estimateRamGB(os: OS, label: string, current: HardwareProfile): number {
  const deviceMemory = getDeviceMemoryGB();
  const appleMemory = os === 'macOS' ? getAppleMemoryGB(label) : null;
  return Math.max(current.ramGB || 0, deviceMemory ?? 0, appleMemory ?? 0, os === 'macOS' ? 8 : 4);
}

export async function detectHardwareProfile(current: HardwareProfile): Promise<Partial<HardwareProfile>> {
  const os = detectOs();
  const webGpu = await getWebGpuInfo().catch(() => ({ label: null, maxBufferGB: null }));
  const webGlRenderer = getWebGlRenderer();
  const rawLabel = webGlRenderer ?? webGpu.label ?? current.gpuName;
  const cleanLabel = cleanRendererLabel(rawLabel);
  const maker = inferGpuMaker(`${rawLabel} ${cleanLabel} ${webGpu.label ?? ''}`, os);
  const matched = findGpuSpec(`${rawLabel} ${cleanLabel}`);
  const gpuName = matched?.name ? matched.name.replace(/\bTI\b/g, 'Ti') : cleanLabel;
  const ramGB = estimateRamGB(os, `${rawLabel} ${cleanLabel}`, current);
  const vramGB = estimateVramGB(`${rawLabel} ${cleanLabel}`, maker, os, webGpu, current);

  return {
    preset: 'custom',
    os,
    gpuMaker: maker,
    gpuName: gpuName || current.gpuName,
    vramGB,
    ramGB,
  };
}
