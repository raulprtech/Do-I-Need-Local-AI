import { GPUMaker, HardwareProfile, OS } from './types';

interface GpuSpec {
  vramGB: number;
}

export interface HardwareDetectionDiagnostic {
  os: OS;
  userAgent: string;
  platform: string;
  deviceMemoryGB: number | null;
  webglPrimary: WebGlInfo;
  webgpu: WebGpuInfo[];
  candidates: Array<{
    source: GpuCandidate['source'];
    label: string;
    cleanLabel: string;
    maker: GPUMaker;
    integrated: boolean;
    dedicatedSignal: boolean;
    matchedSpec: string | null;
    score: number;
  }>;
}

interface WebGpuInfo {
  label: string | null;
  vendor: string | null;
  architecture: string | null;
  device: string | null;
  description: string | null;
  maxBufferGB: number | null;
  powerPreference: 'high-performance' | 'default';
}

interface GpuCandidate {
  label: string;
  source: 'webgl-primary' | 'webgl-vendor' | 'webgl-high' | 'webgl-default' | 'webgl2-high' | 'webgl2-default' | 'webgpu-high' | 'webgpu-default';
}

interface WebGlInfo {
  renderer: string | null;
  vendor: string | null;
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
  'RTX 4090 LAPTOP': { vramGB: 16 },
  'RTX 4080 LAPTOP': { vramGB: 12 },
  'RTX 4070 LAPTOP': { vramGB: 8 },
  'RTX 4060 LAPTOP': { vramGB: 8 },
  'RTX 4050 LAPTOP': { vramGB: 6 },
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
  'RTX 3050 LAPTOP': { vramGB: 4 },
  'RTX 3050 TI LAPTOP': { vramGB: 4 },
  'RTX 3080 TI LAPTOP': { vramGB: 16 },
  'RTX 3080 LAPTOP': { vramGB: 16 },
  'RTX 3070 TI LAPTOP': { vramGB: 8 },
  'RTX 3070 LAPTOP': { vramGB: 8 },
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
    .replace(/^ANGLE\s*\(\s*/i, '')
    .replace(/,\s*Direct3D.*$/i, '')
    .replace(/\s*Direct3D.*$/i, '')
    .replace(/\s*D3D\d+.*$/i, '')
    .replace(/\s*OpenGL Engine.*$/i, '')
    .replace(/,\s*Metal.*$/i, '')
    .replace(/\s*Metal.*$/i, '')
    .replace(/\)\s*$/g, '')
    .replace(/\s*\(0x[0-9a-f]+\)/gi, ' ')
    .replace(/NVIDIA\s+/i, '')
    .replace(/AMD\s+/i, '')
    .replace(/Radeon\s+Graphics/i, 'Radeon Graphics')
    .replace(/GeForce\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferGpuMaker(label: string, os: OS): GPUMaker {
  const value = label.toLowerCase();
  if (value.includes('nvidia') || value.includes('geforce') || value.includes('rtx') || value.includes('gtx') || value.includes('0x10de') || /\b10de\b/.test(value) || /\b4318\b/.test(value)) return 'NVIDIA';
  if (value.includes('amd') || value.includes('radeon') || value.includes('rx ') || value.includes('0x1002') || /\b1002\b/.test(value) || /\b4098\b/.test(value)) return 'AMD';
  if (value.includes('apple') || value.includes('0x106b') || /\b106b\b/.test(value) || /\bm[1-5]\b/.test(value)) return 'Apple';
  if (value.includes('intel') || value.includes('arc') || value.includes('iris') || value.includes('uhd') || value.includes('0x8086') || /\b8086\b/.test(value) || /\b32902\b/.test(value)) return 'Intel';
  return os === 'macOS' ? 'Apple' : 'None';
}

function fallbackGpuName(maker: GPUMaker, label: string): string {
  const cleaned = cleanRendererLabel(label);
  if (cleaned && !/^0x[0-9a-f]+$/i.test(cleaned) && !/^\d+$/.test(cleaned)) return cleaned;
  if (maker === 'NVIDIA') return 'NVIDIA discrete GPU';
  if (maker === 'AMD') return 'AMD discrete GPU';
  if (maker === 'Apple') return 'Apple Silicon GPU';
  if (maker === 'Intel') return 'Intel integrated GPU';
  return cleaned || 'Unknown GPU';
}

function findGpuSpec(label: string): { name: string; spec: GpuSpec } | null {
  const normalized = label.toUpperCase().replace(/GEFORCE\s+/g, '').replace(/AMD\s+/g, '').replace(/RADEON\s+/g, '').replace(/LAPTOP GPU/g, 'LAPTOP').replace(/MOBILE GPU/g, 'LAPTOP').replace(/\s+/g, ' ');
  const keys = Object.keys(GPU_SPECS).sort((a, b) => b.length - a.length);
  const key = keys.find((candidate) => normalized.includes(candidate));
  return key ? { name: key, spec: GPU_SPECS[key] } : null;
}

function getAppleMemoryGB(label: string): number | null {
  const normalized = label.toUpperCase();
  const key = Object.keys(APPLE_UNIFIED_MEMORY_GB).sort((a, b) => b.length - a.length).find((candidate) => normalized.includes(candidate));
  return key ? APPLE_UNIFIED_MEMORY_GB[key] : null;
}


function getPrimaryWebGlInfo(): WebGlInfo {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return { renderer: null, vendor: null };

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return {
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string,
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string,
      };
    }

    return {
      renderer: gl.getParameter(gl.RENDERER) as string,
      vendor: gl.getParameter(gl.VENDOR) as string,
    };
  } catch {
    return { renderer: null, vendor: null };
  }
}

async function getWebGpuInfo(powerPreference: 'high-performance' | 'default'): Promise<WebGpuInfo> {
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter?: (options?: { powerPreference?: 'high-performance' | 'low-power' }) => Promise<unknown> } }).gpu;
  const adapter = await gpu?.requestAdapter?.(powerPreference === 'high-performance' ? { powerPreference } : undefined);
  if (!adapter) return { label: null, vendor: null, architecture: null, device: null, description: null, maxBufferGB: null, powerPreference };

  const maybeAdapter = adapter as {
    requestAdapterInfo?: (hints?: string[]) => Promise<{ vendor?: string | number; architecture?: string; device?: string | number; description?: string }>;
    requestDevice?: () => Promise<{ destroy?: () => void }>;
    info?: { vendor?: string | number; architecture?: string; device?: string | number; description?: string };
    limits?: { maxBufferSize?: number };
  };

  if (powerPreference === 'high-performance') {
    await maybeAdapter.requestDevice?.().then((device) => device.destroy?.()).catch(() => undefined);
  }

  const info = maybeAdapter.info ?? await maybeAdapter.requestAdapterInfo?.(['vendor', 'architecture', 'device', 'description']);
  const vendor = info?.vendor != null ? String(info.vendor) : null;
  const architecture = info?.architecture != null ? String(info.architecture) : null;
  const device = info?.device != null ? String(info.device) : null;
  const description = info?.description != null ? String(info.description) : null;
  const label = [vendor, architecture, device, description].filter(Boolean).join(' ').trim() || null;
  const maxBufferSize = maybeAdapter.limits?.maxBufferSize;
  const maxBufferGB = typeof maxBufferSize === 'number' ? maxBufferSize / 1024 / 1024 / 1024 : null;

  return { label, vendor, architecture, device, description, maxBufferGB, powerPreference };
}

function getWebGlRenderer(powerPreference: 'high-performance' | 'default', version: 'webgl' | 'webgl2' = 'webgl2'): string | null {
  const canvas = document.createElement('canvas');
  const attributes: WebGLContextAttributes = {
    powerPreference: powerPreference === 'high-performance' ? 'high-performance' : 'default',
    failIfMajorPerformanceCaveat: false,
    antialias: false,
  };
  const gl = (version === 'webgl2'
    ? canvas.getContext('webgl2', attributes)
    : canvas.getContext('webgl', attributes) || canvas.getContext('experimental-webgl', attributes)) as WebGLRenderingContext | null;
  if (!gl) return null;

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.finish();

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
  }

  const renderer = gl.getParameter(gl.RENDERER) as string;
  return renderer && renderer !== 'WebKit WebGL' ? renderer : null;
}

function estimateVRAMFromWebGPU(maxBufferGB: number | null): number | null {
  if (!maxBufferGB || maxBufferGB < 0.5) return null;
  const rawEstimate = maxBufferGB * 2;
  const commonSizes = [2, 3, 4, 6, 8, 10, 11, 12, 16, 20, 24, 32, 48, 64, 80, 128, 192];
  return commonSizes.reduce((closest, size) => (
    Math.abs(size - rawEstimate) < Math.abs(closest - rawEstimate) ? size : closest
  ), commonSizes[0]);
}

function estimateVramGB(label: string, maker: GPUMaker, os: OS, webGpu: WebGpuInfo, current: HardwareProfile): number {
  if (isIntegratedGpu(label, maker)) return maker === 'Apple' ? Math.max(8, Math.round((getDeviceMemoryGB() ?? current.ramGB ?? 16) * 0.75)) : 0;

  const explicitMemory = label.match(/(\d+)\s*gb/i);
  if (explicitMemory) return Number(explicitMemory[1]);

  const matched = findGpuSpec(label);
  if (matched) return matched.spec.vramGB;

  const deviceMemory = getDeviceMemoryGB();
  if (maker === 'Apple') {
    return Math.max(8, Math.round((deviceMemory ?? getAppleMemoryGB(label) ?? current.ramGB ?? 16) * 0.75));
  }

  const webGpuVRAM = estimateVRAMFromWebGPU(webGpu.maxBufferGB);
  if (webGpuVRAM && (maker === 'NVIDIA' || maker === 'AMD' || maker === 'Intel')) {
    return webGpuVRAM;
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

function isIntegratedGpu(label: string, maker: GPUMaker): boolean {
  const value = label.toLowerCase();
  return maker === 'Intel'
    || value.includes('iris')
    || value.includes('uhd')
    || value.includes('integrated')
    || value.includes('radeon graphics')
    || value.includes('radeon(tm) graphics')
    || value.includes('0x00001638')
    || value.includes('0x1638');
}

function hasDedicatedAmdModelSignal(label: string): boolean {
  const value = label.toLowerCase();
  return /\bradeon\s+rx\b/i.test(label)
    || /\brx\s+\d{3,4}/i.test(label)
    || value.includes('radeon pro')
    || value.includes('radeon vii')
    || Boolean(findGpuSpec(label));
}

function isGenericGpuVendorLabel(label: string): boolean {
  const value = label.toLowerCase().trim();
  return value === 'amd'
    || value === 'google inc. (amd)'
    || value === 'google inc. (nvidia)'
    || value === 'google inc. (intel)'
    || /^amd\s+gcn-\d+/.test(value);
}

function isDedicatedGpuSignal(label: string, os: OS): boolean {
  const maker = inferGpuMaker(label, os);
  if (isIntegratedGpu(label, maker) || isGenericGpuVendorLabel(label)) return false;
  if (maker === 'NVIDIA') return true;
  if (maker === 'AMD') return hasDedicatedAmdModelSignal(label);
  return Boolean(findGpuSpec(label));
}

function candidateScore(candidate: GpuCandidate, os: OS): number {
  const label = `${candidate.label} ${cleanRendererLabel(candidate.label)}`;
  const maker = inferGpuMaker(label, os);
  const matched = findGpuSpec(label);
  let score = 0;

  if (candidate.source === 'webgl-primary') score += 50;
  if (candidate.source === 'webgl-vendor') score -= 20;
  if (candidate.source === 'webgl-high' || candidate.source === 'webgl2-high' || candidate.source === 'webgpu-high') score += 25;
  if (matched) score += 100;
  if (isDedicatedGpuSignal(label, os)) score += 65;
  if (maker === 'Apple') score += 30;
  if (maker === 'Intel') score -= 30;
  if (isIntegratedGpu(label, maker)) score -= 35;
  if (isGenericGpuVendorLabel(candidate.label)) score -= 45;

  return score;
}

function hasDedicatedSignal(candidates: GpuCandidate[], os: OS): boolean {
  return candidates.some((candidate) => isDedicatedGpuSignal(candidate.label, os));
}

function isLowConfidenceIntegratedOnly(candidates: GpuCandidate[], maker: GPUMaker, os: OS): boolean {
  if (os !== 'Windows' || (maker !== 'Intel' && maker !== 'AMD')) return false;
  return candidates.length > 0 && !hasDedicatedSignal(candidates, os);
}

function shouldRejectIntegratedOnlyDetection(candidates: GpuCandidate[], combinedLabel: string, maker: GPUMaker, os: OS): boolean {
  return os === 'Windows'
    && !hasDedicatedSignal(candidates, os)
    && (isIntegratedGpu(combinedLabel, maker) || isGenericGpuVendorLabel(combinedLabel));
}

function buildGpuCandidates(primaryWebGl: WebGlInfo, webGpuHigh: WebGpuInfo, webGpuDefault: WebGpuInfo): GpuCandidate[] {
  return [
    { label: primaryWebGl.renderer ?? '', source: 'webgl-primary' as const },
    { label: primaryWebGl.vendor ?? '', source: 'webgl-vendor' as const },
    { label: webGpuHigh.label ?? '', source: 'webgpu-high' as const },
    { label: getWebGlRenderer('high-performance', 'webgl2') ?? '', source: 'webgl2-high' as const },
    { label: getWebGlRenderer('high-performance', 'webgl') ?? '', source: 'webgl-high' as const },
    { label: getWebGlRenderer('default', 'webgl2') ?? '', source: 'webgl2-default' as const },
    { label: getWebGlRenderer('default', 'webgl') ?? '', source: 'webgl-default' as const },
    { label: webGpuDefault.label ?? '', source: 'webgpu-default' as const },
  ].filter((candidate) => candidate.label.trim());
}

async function collectGpuSignals() {
  const emptyWebGpu = (powerPreference: 'high-performance' | 'default'): WebGpuInfo => ({
    label: null,
    vendor: null,
    architecture: null,
    device: null,
    description: null,
    maxBufferGB: null,
    powerPreference,
  });
  const primaryWebGl = getPrimaryWebGlInfo();
  const [webGpuHigh, webGpuDefault] = await Promise.all([
    getWebGpuInfo('high-performance').catch(() => emptyWebGpu('high-performance')),
    getWebGpuInfo('default').catch(() => emptyWebGpu('default')),
  ]);

  return {
    primaryWebGl,
    webGpuHigh,
    webGpuDefault,
    candidates: buildGpuCandidates(primaryWebGl, webGpuHigh, webGpuDefault),
  };
}

function pickBestCandidate(candidates: GpuCandidate[], os: OS): GpuCandidate | null {
  const unique = candidates.filter((candidate, index, all) => (
    candidate.label.trim()
    && all.findIndex((item) => item.label.trim() === candidate.label.trim()) === index
  ));

  return unique.sort((a, b) => candidateScore(b, os) - candidateScore(a, os))[0] ?? null;
}

export async function getHardwareDetectionDiagnostics(): Promise<HardwareDetectionDiagnostic> {
  const os = detectOs();
  const { primaryWebGl, webGpuHigh, webGpuDefault, candidates } = await collectGpuSignals();
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };

  return {
    os,
    userAgent: navigator.userAgent,
    platform: `${nav.userAgentData?.platform ?? navigator.platform ?? ''}`,
    deviceMemoryGB: getDeviceMemoryGB(),
    webglPrimary: primaryWebGl,
    webgpu: [webGpuHigh, webGpuDefault],
    candidates: candidates.map((candidate) => {
      const cleanLabel = cleanRendererLabel(candidate.label);
      const maker = inferGpuMaker(`${candidate.label} ${cleanLabel}`, os);
      const matched = findGpuSpec(candidate.label);
      return {
        source: candidate.source,
        label: candidate.label,
        cleanLabel,
        maker,
        integrated: isIntegratedGpu(candidate.label, maker),
        dedicatedSignal: isDedicatedGpuSignal(candidate.label, os),
        matchedSpec: matched?.name ?? null,
        score: candidateScore(candidate, os),
      };
    }).sort((a, b) => b.score - a.score),
  };
}

export async function detectHardwareProfile(current: HardwareProfile): Promise<Partial<HardwareProfile>> {
  const os = detectOs();
  const { primaryWebGl, webGpuHigh, webGpuDefault, candidates } = await collectGpuSignals();
  const bestCandidate = pickBestCandidate(candidates, os);
  const rawLabel = bestCandidate?.label ?? current.gpuName;
  const cleanLabel = cleanRendererLabel(rawLabel);
  const combinedLabel = `${rawLabel} ${cleanLabel} ${primaryWebGl.renderer ?? ''} ${primaryWebGl.vendor ?? ''} ${webGpuHigh.label ?? ''} ${webGpuDefault.label ?? ''}`;
  const maker = inferGpuMaker(combinedLabel, os);
  const matched = findGpuSpec(combinedLabel);
  const gpuName = matched?.name ? matched.name.replace(/\bTI\b/g, 'Ti') : fallbackGpuName(maker, cleanLabel || rawLabel);
  const ramGB = estimateRamGB(os, combinedLabel, current);

  if (shouldRejectIntegratedOnlyDetection(candidates, combinedLabel, maker, os)) {
    throw new Error('Only integrated GPU signals were exposed by the browser.');
  }

  const vramGB = estimateVramGB(combinedLabel, maker, os, webGpuHigh.maxBufferGB ? webGpuHigh : webGpuDefault, current);

  if ((isIntegratedGpu(combinedLabel, maker) || isLowConfidenceIntegratedOnly(candidates, maker, os)) && current.gpuMaker !== 'None' && current.gpuMaker !== 'Intel' && current.vramGB > 0) {
    return {
      preset: current.preset || 'custom',
      os,
      gpuMaker: current.gpuMaker,
      gpuName: current.gpuName,
      vramGB: current.vramGB,
      ramGB,
    };
  }

  if (isLowConfidenceIntegratedOnly(candidates, maker, os)) {
    return {
      preset: current.preset || 'custom',
      os,
      gpuMaker: current.gpuMaker,
      gpuName: current.gpuName,
      vramGB: current.vramGB,
      ramGB,
    };
  }

  return {
    preset: 'custom',
    os,
    gpuMaker: maker,
    gpuName: gpuName || current.gpuName,
    vramGB,
    ramGB,
  };
}
