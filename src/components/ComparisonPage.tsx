import { useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, Cloud, Cpu, Gauge, XCircle } from 'lucide-react';
import { evaluateSystem } from '../lib/calculator';
import { HardwareProfile, UsageProfile } from '../lib/types';
import { useLanguage } from '../lib/i18n';

interface Props {
  hardware: HardwareProfile;
  usage: UsageProfile;
}

type WorkloadKey = 'current' | 'startup' | 'coding' | 'agents' | 'production';

interface ApiOption {
  name: string;
  tier: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  context: string;
  bestFor: string;
}

interface HardwareOption {
  key: string;
  label: string;
  profile: HardwareProfile;
  note: string;
}

const API_OPTIONS: ApiOption[] = [
  { name: 'OpenAI mini', tier: 'Balanced', inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.6, context: '128K+', bestFor: 'Chat, apps, low-cost agents' },
  { name: 'Gemini Flash', tier: 'Fast', inputUsdPerMillion: 0.3, outputUsdPerMillion: 2.5, context: '1M', bestFor: 'Long context and fast iteration' },
  { name: 'Claude Sonnet', tier: 'Premium', inputUsdPerMillion: 3, outputUsdPerMillion: 15, context: '200K', bestFor: 'Coding, writing, complex reasoning' },
  { name: 'OpenAI frontier', tier: 'Frontier', inputUsdPerMillion: 2, outputUsdPerMillion: 8, context: '128K+', bestFor: 'High quality product workflows' },
  { name: 'DeepSeek chat', tier: 'Budget', inputUsdPerMillion: 0.27, outputUsdPerMillion: 1.1, context: '64K+', bestFor: 'Cost-sensitive automation' },
];

const HARDWARE_OPTIONS: HardwareOption[] = [
  {
    key: 'rtx3060',
    label: 'RTX 3060 12GB',
    note: 'Good entry point for 7B/8B models.',
    profile: { preset: 'rtx3060', os: 'Windows', gpuMaker: 'NVIDIA', gpuName: 'RTX 3060', vramGB: 12, ramGB: 16, cpuName: '', devicePriceUsd: 850 },
  },
  {
    key: 'rtx4070ti',
    label: 'RTX 4070 Ti Super 16GB',
    note: 'Comfortable local workstation for medium models.',
    profile: { preset: 'rtx4070tisuper', os: 'Windows', gpuMaker: 'NVIDIA', gpuName: 'RTX 4070 Ti Super', vramGB: 16, ramGB: 32, cpuName: '', devicePriceUsd: 1600 },
  },
  {
    key: 'rtx4090',
    label: 'RTX 4090 24GB',
    note: 'Strong local option for heavier quantized models.',
    profile: { preset: 'rtx4090', os: 'Windows', gpuMaker: 'NVIDIA', gpuName: 'RTX 4090', vramGB: 24, ramGB: 64, cpuName: '', devicePriceUsd: 3200 },
  },
  {
    key: 'macm4',
    label: 'Mac mini M4 16GB',
    note: 'Efficient Apple Silicon baseline.',
    profile: { preset: 'macmini_m4_16gb', os: 'macOS', gpuMaker: 'Apple', gpuName: 'M4', vramGB: 12, ramGB: 16, cpuName: '', devicePriceUsd: 799 },
  },
  {
    key: 'm3max',
    label: 'MacBook Pro M3 Max 64GB',
    note: 'Portable high-memory local setup.',
    profile: { preset: 'm3max_64gb', os: 'macOS', gpuMaker: 'Apple', gpuName: 'M3 Max', vramGB: 48, ramGB: 64, cpuName: '', devicePriceUsd: 3999 },
  },
];

function applyWorkload(base: UsageProfile, workload: WorkloadKey): UsageProfile {
  if (workload === 'current') return base;

  const presets: Record<Exclude<WorkloadKey, 'current'>, Partial<UsageProfile>> = {
    startup: { goal: 'chat', frequency: 'daily', hoursPerDay: 3, modelSizePreference: 'medium', needsPrivacy: false, offlineRequired: false },
    coding: { goal: 'coding', frequency: 'heavy', hoursPerDay: 6, modelSizePreference: 'medium', needsPrivacy: false, offlineRequired: false },
    agents: { goal: 'agents', frequency: 'heavy', hoursPerDay: 8, modelSizePreference: 'large', needsPrivacy: false, offlineRequired: false },
    production: { goal: 'agents', frequency: 'production', hoursPerDay: 12, modelSizePreference: 'large', needsPrivacy: false, offlineRequired: false },
  };

  return { ...base, ...presets[workload] };
}

function estimateTokens(usage: UsageProfile) {
  const activeDaysPerMonth: Record<UsageProfile['frequency'], number> = {
    occasional: 8,
    daily: 30,
    heavy: 30,
    production: 30,
  };
  const requestsPerHour: Record<UsageProfile['frequency'], number> = {
    occasional: 2,
    daily: 8,
    heavy: 25,
    production: 120,
  };
  const tokensPerRequest: Record<UsageProfile['goal'], { input: number; output: number }> = {
    chat: { input: 800, output: 400 },
    coding: { input: 2800, output: 1200 },
    agents: { input: 4200, output: 1800 },
    rag: { input: 4200, output: 800 },
    vision: { input: 1800, output: 700 },
    embedding: { input: 800, output: 0 },
  };

  const requests = usage.hoursPerDay * requestsPerHour[usage.frequency] * activeDaysPerMonth[usage.frequency];
  const tokenShape = tokensPerRequest[usage.goal];

  return {
    requests,
    inputTokens: requests * tokenShape.input,
    outputTokens: requests * tokenShape.output,
  };
}

function formatMoney(usd: number, usage: UsageProfile, digits = 0) {
  const value = usd * (usage.exchangeRateFromUsd || 1);
  const suffix = usage.currencySymbol.trim() === usage.currencyCode ? '' : ` ${usage.currencyCode}`;
  return `${usage.currencySymbol}${value.toLocaleString(undefined, { maximumFractionDigits: digits })}${suffix}`;
}

function apiMonthlyCost(api: ApiOption, tokens: ReturnType<typeof estimateTokens>) {
  return (tokens.inputTokens / 1000000) * api.inputUsdPerMillion + (tokens.outputTokens / 1000000) * api.outputUsdPerMillion;
}

export function ComparisonPage({ hardware, usage }: Props) {
  const { t } = useLanguage();
  const [workload, setWorkload] = useState<WorkloadKey>('current');
  const scenario = useMemo(() => applyWorkload(usage, workload), [usage, workload]);
  const tokens = useMemo(() => estimateTokens(scenario), [scenario]);

  const apiRows = useMemo(() => API_OPTIONS
    .map((api) => ({ ...api, monthlyUsd: apiMonthlyCost(api, tokens) }))
    .sort((a, b) => a.monthlyUsd - b.monthlyUsd), [tokens]);

  const hardwareRows = useMemo(() => {
    const current: HardwareOption = { key: 'current', label: `Your hardware (${hardware.gpuName})`, note: 'Detected or selected on the dashboard.', profile: hardware };
    return [current, ...HARDWARE_OPTIONS].map((option) => {
      const diagnosis = evaluateSystem(option.profile, scenario, t);
      const fastestModel = diagnosis.recommendedModels.find((model) => model.canRun && model.speed !== 'unusable');
      return {
        ...option,
        monthlyUsd: diagnosis.economics.totalLocalMonthly,
        breakevenMonths: diagnosis.economics.breakevenMonths,
        canRun: diagnosis.canRunLocal,
        modelLabel: fastestModel?.name ?? 'Limited',
        verdict: diagnosis.economics.verdict,
      };
    }).sort((a, b) => a.monthlyUsd - b.monthlyUsd);
  }, [hardware, scenario, t]);

  const cheapestApi = apiRows[0];
  const bestHardware = hardwareRows.find((row) => row.canRun) ?? hardwareRows[0];
  const monthlyDelta = cheapestApi.monthlyUsd - bestHardware.monthlyUsd;

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="panel-card flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[#8ba7c7]">API vs hardware matrix</p>
          <h2 className="font-mono text-4xl font-medium tracking-normal text-[#dbeafe] md:text-5xl">Comparador</h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[#8ba7c7]">
            Compara varias APIs contra varios equipos locales usando el mismo perfil de uso, moneda, electricidad y criterio de compatibilidad del dashboard.
          </p>
        </div>
        <div className="w-full max-w-sm">
          <label className="micro-label mb-2">Escenario</label>
          <select className="control-field" value={workload} onChange={(event) => setWorkload(event.target.value as WorkloadKey)}>
            <option value="current">Perfil actual</option>
            <option value="startup">Startup / app pequena</option>
            <option value="coding">Coding intenso</option>
            <option value="agents">Agentes y RAG</option>
            <option value="production">Produccion</option>
          </select>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="panel-card-muted">
          <div className="mb-6 flex items-center justify-between">
            <Cloud className="h-6 w-6" />
            <span className="rounded-full border border-[#06111f]/30 px-3 py-1 text-[10px] uppercase tracking-[0.16em]">API barata</span>
          </div>
          <p className="text-sm text-[#405a78]">{cheapestApi.name}</p>
          <p className="mt-2 font-mono text-4xl">{formatMoney(cheapestApi.monthlyUsd, scenario, 2)}</p>
          <p className="mt-3 text-xs leading-5 text-[#405a78]">Costo mensual estimado con {Math.round(tokens.requests).toLocaleString()} requests.</p>
        </div>
        <div className="panel-card">
          <div className="mb-6 flex items-center justify-between">
            <Cpu className="h-6 w-6 text-[#7dd3fc]" />
            <span className="rounded-full border border-[#7dd3fc]/30 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#7dd3fc]">Hardware viable</span>
          </div>
          <p className="text-sm text-[#8ba7c7]">{bestHardware.label}</p>
          <p className="mt-2 font-mono text-4xl text-[#dbeafe]">{formatMoney(bestHardware.monthlyUsd, scenario, 2)}</p>
          <p className="mt-3 text-xs leading-5 text-[#8ba7c7]">Modelo objetivo: {bestHardware.modelLabel}</p>
        </div>
        <div className="panel-card">
          <div className="mb-6 flex items-center justify-between">
            <BarChart3 className="h-6 w-6 text-[#7dd3fc]" />
            <span className="rounded-full border border-[#7dd3fc]/30 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#7dd3fc]">Diferencia</span>
          </div>
          <p className="text-sm text-[#8ba7c7]">{monthlyDelta >= 0 ? 'Ahorro local mensual' : 'API sigue abajo'}</p>
          <p className="mt-2 font-mono text-4xl text-[#dbeafe]">{formatMoney(Math.abs(monthlyDelta), scenario, 2)}</p>
          <p className="mt-3 text-xs leading-5 text-[#8ba7c7]">Antes de mantenimiento, setup y diferencias de calidad de modelos.</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="panel-card overflow-hidden">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="font-mono text-2xl font-medium tracking-normal text-[#dbeafe]">APIs</h3>
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#8ba7c7]">Input + output</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="border-b border-[#7dd3fc]/10 text-[#8ba7c7]">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Proveedor</th>
                  <th className="pb-3 pr-4 font-medium">Costo mensual</th>
                  <th className="pb-3 pr-4 font-medium">Tarifa</th>
                  <th className="pb-3 font-medium">Mejor para</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#7dd3fc]/10">
                {apiRows.map((api) => (
                  <tr key={api.name} className="transition hover:bg-[#7dd3fc]/5">
                    <td className="py-4 pr-4 align-top">
                      <div className="font-medium text-[#eaf4ff]">{api.name}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#7dd3fc]">{api.tier} / {api.context}</div>
                    </td>
                    <td className="py-4 pr-4 align-top font-mono text-lg text-[#dbeafe]">{formatMoney(api.monthlyUsd, scenario, 2)}</td>
                    <td className="py-4 pr-4 align-top text-[#8ba7c7]">${api.inputUsdPerMillion}/$${api.outputUsdPerMillion} per 1M</td>
                    <td className="py-4 align-top text-[#b7cbe2]">{api.bestFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel-card overflow-hidden">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="font-mono text-2xl font-medium tracking-normal text-[#dbeafe]">Hardwares</h3>
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#8ba7c7]">24 month amortization</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-b border-[#7dd3fc]/10 text-[#8ba7c7]">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Equipo</th>
                  <th className="pb-3 pr-4 font-medium">Costo local</th>
                  <th className="pb-3 pr-4 font-medium">Compatibilidad</th>
                  <th className="pb-3 pr-4 font-medium">Break-even</th>
                  <th className="pb-3 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#7dd3fc]/10">
                {hardwareRows.map((row) => {
                  const monthsVsCheapest = cheapestApi.monthlyUsd > 0
                    ? row.profile.devicePriceUsd / Math.max(cheapestApi.monthlyUsd - (row.monthlyUsd - row.profile.devicePriceUsd / 24), 0.01)
                    : -1;
                  return (
                    <tr key={row.key} className="transition hover:bg-[#7dd3fc]/5">
                      <td className="py-4 pr-4 align-top">
                        <div className="font-medium text-[#eaf4ff]">{row.label}</div>
                        <div className="mt-1 text-[10px] text-[#8ba7c7]">{row.profile.vramGB}GB VRAM / {row.profile.ramGB}GB RAM</div>
                      </td>
                      <td className="py-4 pr-4 align-top font-mono text-lg text-[#dbeafe]">{formatMoney(row.monthlyUsd, scenario, 2)}</td>
                      <td className="py-4 pr-4 align-top">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${row.canRun ? 'border-[#7dd3fc]/40 bg-[#7dd3fc]/10 text-[#7dd3fc]' : 'border-[#f3a6a6]/40 bg-[#f3a6a6]/10 text-[#f3a6a6]'}`}>
                          {row.canRun ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {row.canRun ? row.modelLabel : 'Limitado'}
                        </span>
                      </td>
                      <td className="py-4 pr-4 align-top text-[#b7cbe2]">{monthsVsCheapest > 0 && monthsVsCheapest < 120 ? `${Math.ceil(monthsVsCheapest)} meses` : 'No claro'}</td>
                      <td className="py-4 align-top text-[#8ba7c7]">{row.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="mb-5 flex items-center gap-3">
          <Gauge className="h-5 w-5 text-[#7dd3fc]" />
          <h3 className="font-mono text-2xl font-medium tracking-normal text-[#dbeafe]">Matriz rapida</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {hardwareRows.filter((row) => row.canRun).slice(0, 6).map((row) => (
            <div key={row.key} className="rounded-[14px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-mono text-lg text-[#dbeafe]">{row.label}</h4>
                  <p className="mt-1 text-xs text-[#8ba7c7]">vs {cheapestApi.name}</p>
                </div>
                <span className="rounded-full border border-[#7dd3fc]/30 px-2 py-1 text-[10px] text-[#7dd3fc]">{row.verdict}</span>
              </div>
              <p className="text-sm leading-6 text-[#b7cbe2]">
                {row.monthlyUsd < cheapestApi.monthlyUsd
                  ? `Local ahorra aprox. ${formatMoney(cheapestApi.monthlyUsd - row.monthlyUsd, scenario, 2)} al mes.`
                  : `API cuesta aprox. ${formatMoney(row.monthlyUsd - cheapestApi.monthlyUsd, scenario, 2)} menos al mes.`}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
