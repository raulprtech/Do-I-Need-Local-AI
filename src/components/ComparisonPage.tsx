import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Cloud, Cpu, Equal, Server, Trophy, XCircle } from 'lucide-react';
import { evaluateSystem } from '../lib/calculator';
import { MODEL_CATALOG } from '../lib/modelCatalog';
import { HardwareProfile, ModelCatalogEntry, UsageProfile } from '../lib/types';
import { useLanguage } from '../lib/i18n';
import { ApiOption, CloudRentalOption, CLOUD_RENTAL_OPTIONS, FALLBACK_API_OPTIONS, HARDWARE_OPTIONS, HardwareOption, loadApiOptions, loadCloudRentalOptions } from '../lib/infraDataset';

interface Props {
  hardware: HardwareProfile;
  usage: UsageProfile;
  modelCatalog: ModelCatalogEntry[];
}

type PlanKind = 'api' | 'hardware' | 'cloud-rental';
type SortKey = 'name' | 'winner' | 'cost' | 'fit';

type PlanOption = ApiOption | HardwareOption | CloudRentalOption;

interface CompareScenario {
  id: string;
  name: string;
  task: string;
  modelName: string;
  usagePatch: Partial<UsageProfile>;
  inputTokensPerRequest: number;
  outputTokensPerRequest: number;
}

interface PlanResult {
  canRun: boolean;
  monthlyUsd: number;
  score: number;
  label: string;
  sublabel: string;
}

const SCENARIOS: CompareScenario[] = [
  {
    id: 'chat-small',
    name: 'Chat ligero',
    task: 'Soporte, resumen, asistente diario',
    modelName: 'Phi-3 Mini',
    usagePatch: { goal: 'chat', frequency: 'daily', hoursPerDay: 2, modelSizePreference: 'small' },
    inputTokensPerRequest: 700,
    outputTokensPerRequest: 350,
  },
  {
    id: 'chat-general',
    name: 'Chat general 8B',
    task: 'Uso diario con buen balance calidad/costo',
    modelName: 'Llama 3 8B / Mistral 7B',
    usagePatch: { goal: 'chat', frequency: 'daily', hoursPerDay: 4, modelSizePreference: 'medium' },
    inputTokensPerRequest: 1000,
    outputTokensPerRequest: 500,
  },
  {
    id: 'coding',
    name: 'Coding intenso',
    task: 'Autocomplete, refactors y explicaciones',
    modelName: 'Qwen 2.5 14B / DeepSeek Coder V2 Lite',
    usagePatch: { goal: 'coding', frequency: 'heavy', hoursPerDay: 6, modelSizePreference: 'medium' },
    inputTokensPerRequest: 2800,
    outputTokensPerRequest: 1200,
  },
  {
    id: 'rag',
    name: 'RAG / documentos',
    task: 'Consultas con contexto largo y retrieval',
    modelName: 'Gemma 2 9B',
    usagePatch: { goal: 'rag', frequency: 'heavy', hoursPerDay: 5, modelSizePreference: 'medium' },
    inputTokensPerRequest: 4800,
    outputTokensPerRequest: 900,
  },
  {
    id: 'agents',
    name: 'Agentes',
    task: 'Automatizaciones multi-paso',
    modelName: 'Qwen 2.5 14B / DeepSeek Coder V2 Lite',
    usagePatch: { goal: 'agents', frequency: 'heavy', hoursPerDay: 8, modelSizePreference: 'large' },
    inputTokensPerRequest: 4200,
    outputTokensPerRequest: 1800,
  },
  {
    id: 'large-model',
    name: 'Modelo grande',
    task: 'Razonamiento local pesado',
    modelName: 'Llama 3.3 70B',
    usagePatch: { goal: 'agents', frequency: 'production', hoursPerDay: 10, modelSizePreference: 'large' },
    inputTokensPerRequest: 5200,
    outputTokensPerRequest: 2200,
  },
];

function applyScenario(base: UsageProfile, scenario: CompareScenario): UsageProfile {
  return { ...base, ...scenario.usagePatch, needsPrivacy: false, offlineRequired: false };
}

function requestsPerMonth(usage: UsageProfile) {
  const days: Record<UsageProfile['frequency'], number> = { occasional: 8, daily: 30, heavy: 30, production: 30 };
  const perHour: Record<UsageProfile['frequency'], number> = { occasional: 2, daily: 8, heavy: 25, production: 120 };
  return usage.hoursPerDay * days[usage.frequency] * perHour[usage.frequency];
}

function formatMoney(usd: number, usage: UsageProfile, digits = 0) {
  const value = usd * (usage.exchangeRateFromUsd || 1);
  const suffix = usage.currencySymbol.trim() === usage.currencyCode ? '' : ` ${usage.currencyCode}`;
  return `${usage.currencySymbol}${value.toLocaleString(undefined, { maximumFractionDigits: digits })}${suffix}`;
}

function planIcon(kind: PlanKind) {
  if (kind === 'api') return <Cloud className="h-4 w-4" />;
  if (kind === 'cloud-rental') return <Server className="h-4 w-4" />;
  return <Cpu className="h-4 w-4" />;
}

function planKindLabel(kind: PlanKind) {
  if (kind === 'api') return 'API';
  if (kind === 'cloud-rental') return 'Cloud';
  return 'HW';
}

function evaluatePlan(plan: PlanOption, scenario: CompareScenario, baseUsage: UsageProfile, t: (key: string) => string, modelCatalog: ModelCatalogEntry[]): PlanResult {
  const scenarioUsage = applyScenario(baseUsage, scenario);
  const requests = requestsPerMonth(scenarioUsage);

  if (plan.kind === 'api') {
    const monthlyUsd = ((requests * scenario.inputTokensPerRequest) / 1000000) * plan.inputUsdPerMillion
      + ((requests * scenario.outputTokensPerRequest) / 1000000) * plan.outputUsdPerMillion;

    return {
      canRun: true,
      monthlyUsd,
      score: plan.quality - monthlyUsd * 0.2,
      label: formatMoney(monthlyUsd, scenarioUsage, 2),
      sublabel: `$${plan.inputUsdPerMillion}/$${plan.outputUsdPerMillion} per 1M`,
    };
  }

  if (plan.kind === 'cloud-rental') {
    const diagnosis = evaluateSystem(plan.profile, scenarioUsage, t, modelCatalog);
    const model = diagnosis.recommendedModels.find((entry) => entry.name === scenario.modelName)
      ?? diagnosis.recommendedModels.find((entry) => entry.canRun)
      ?? diagnosis.recommendedModels[0];
    const activeHoursMonthly = scenarioUsage.hoursPerDay * 30;
    const computeUsd = plan.monthlyUsd ?? (plan.hourlyUsd * activeHoursMonthly);
    const monthlyUsd = computeUsd + plan.storageMonthlyUsd + plan.networkMonthlyUsd;
    const speedScore = model?.speed === 'fast' ? 90 : model?.speed === 'acceptable' ? 70 : model?.canRun ? 52 : 0;
    const opsPenalty = Math.max(0, 100 - plan.operationalScore) * 0.08;

    return {
      canRun: Boolean(model?.canRun),
      monthlyUsd,
      score: speedScore - monthlyUsd * 0.16 - opsPenalty,
      label: model?.canRun ? formatMoney(monthlyUsd, scenarioUsage, 2) : t('compare.noRun'),
      sublabel: model?.canRun ? `${model.speed} - ${plan.profile.vramGB}GB VRAM - ${plan.providerName}` : `${plan.profile.vramGB}GB VRAM / ${plan.profile.ramGB}GB RAM`,
    };
  }

  const diagnosis = evaluateSystem(plan.profile, scenarioUsage, t, modelCatalog);
  const model = diagnosis.recommendedModels.find((entry) => entry.name === scenario.modelName)
    ?? diagnosis.recommendedModels.find((entry) => entry.canRun)
    ?? diagnosis.recommendedModels[0];
  const speedScore = model?.speed === 'fast' ? 92 : model?.speed === 'acceptable' ? 72 : model?.canRun ? 55 : 0;

  return {
    canRun: Boolean(model?.canRun),
    monthlyUsd: diagnosis.economics.totalLocalMonthly,
    score: speedScore - diagnosis.economics.totalLocalMonthly * 0.2,
    label: model?.canRun ? formatMoney(diagnosis.economics.totalLocalMonthly, scenarioUsage, 2) : t('compare.noRun'),
    sublabel: model?.canRun ? `${model.speed} - ${plan.profile.vramGB}GB VRAM` : `${plan.profile.vramGB}GB VRAM / ${plan.profile.ramGB}GB RAM`,
  };
}

function winnerFor(a: PlanResult, b: PlanResult): 'a' | 'b' | 'tie' {
  if (a.canRun && !b.canRun) return 'a';
  if (!a.canRun && b.canRun) return 'b';
  if (!a.canRun && !b.canRun) return 'tie';
  if (Math.abs(a.score - b.score) < 3) return 'tie';
  return a.score > b.score ? 'a' : 'b';
}

function resultBadge(result: PlanResult, t: (key: string) => string) {
  if (!result.canRun) {
    return <span className="inline-flex items-center gap-1 rounded-full border border-[#f3a6a6]/40 bg-[#f3a6a6]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#f3a6a6]"><XCircle className="h-3 w-3" />{t('compare.noRun')}</span>;
  }

  return <span className="inline-flex items-center gap-1 rounded-full border border-[#7dd3fc]/40 bg-[#7dd3fc]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7dd3fc]"><CheckCircle2 className="h-3 w-3" />OK</span>;
}

export function ComparisonPage({ hardware, usage, modelCatalog }: Props) {
  const { t } = useLanguage();
  const [apiOptions, setApiOptions] = useState<ApiOption[]>(FALLBACK_API_OPTIONS);
  const [cloudOptions, setCloudOptions] = useState<CloudRentalOption[]>(CLOUD_RENTAL_OPTIONS);
  const [datasetSource, setDatasetSource] = useState<'remote' | 'fallback'>('fallback');

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([loadApiOptions(), loadCloudRentalOptions()])
      .then(([apiResult, cloudResult]) => {
        if (cancelled) return;
        if (apiResult.status === 'fulfilled' && apiResult.value.length > 0) {
          setApiOptions(apiResult.value);
          setDatasetSource('remote');
        }
        if (cloudResult.status === 'fulfilled' && cloudResult.value.length > 0) {
          setCloudOptions(cloudResult.value);
          setDatasetSource('remote');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiOptions(FALLBACK_API_OPTIONS);
          setCloudOptions(CLOUD_RENTAL_OPTIONS);
          setDatasetSource('fallback');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const currentHardware: HardwareOption = {
    id: 'current',
    kind: 'hardware',
    name: `Tu equipo (${hardware.gpuName})`,
    detail: `${hardware.vramGB}GB VRAM / ${hardware.ramGB}GB RAM`,
    profile: hardware,
  };
  const planOptions = useMemo<PlanOption[]>(() => [currentHardware, ...HARDWARE_OPTIONS, ...cloudOptions, ...apiOptions], [apiOptions, cloudOptions, hardware]);
  const [planAId, setPlanAId] = useState('current');
  const [planBId, setPlanBId] = useState('openai-mini');
  const [sortKey, setSortKey] = useState<SortKey>('winner');

  const planA = planOptions.find((plan) => plan.id === planAId) ?? planOptions[0];
  const planB = planOptions.find((plan) => plan.id === planBId) ?? planOptions[1];

  const rows = useMemo(() => {
    const scored = SCENARIOS.map((scenario) => {
      const resultA = evaluatePlan(planA, scenario, usage, t, modelCatalog);
      const resultB = evaluatePlan(planB, scenario, usage, t, modelCatalog);
      const winner = winnerFor(resultA, resultB);
      const catalogModel = modelCatalog.find((model) => model.name === scenario.modelName) ?? MODEL_CATALOG.find((model) => model.name === scenario.modelName);
      return { scenario, resultA, resultB, winner, params: catalogModel?.parameters ?? '' };
    });

    return scored.sort((left, right) => {
      if (sortKey === 'name') return left.scenario.name.localeCompare(right.scenario.name);
      if (sortKey === 'cost') return Math.min(left.resultA.monthlyUsd, left.resultB.monthlyUsd) - Math.min(right.resultA.monthlyUsd, right.resultB.monthlyUsd);
      if (sortKey === 'fit') return Math.max(right.resultA.score, right.resultB.score) - Math.max(left.resultA.score, left.resultB.score);
      const order = { a: 0, tie: 1, b: 2 };
      return order[left.winner] - order[right.winner];
    });
  }, [planA, planB, usage, t, sortKey, modelCatalog]);

  const counts = rows.reduce((acc, row) => ({
    a: acc.a + (row.winner === 'a' ? 1 : 0),
    b: acc.b + (row.winner === 'b' ? 1 : 0),
    tie: acc.tie + (row.winner === 'tie' ? 1 : 0),
  }), { a: 0, b: 0, tie: 0 });

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="panel-card">
        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[#8ba7c7]">{t('compare.eyebrow')}</p>
        <h2 className="font-mono text-4xl font-medium tracking-normal text-[#dbeafe] md:text-5xl">{t('compare.title')}</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[#8ba7c7]">
          {t('compare.description')}
        </p>
        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-[#7dd3fc]">{datasetSource === 'remote' ? t('compare.dataset.remote') : t('compare.dataset.fallback')}</p>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)]">
        <div className="panel-card">
          <label className="micro-label mb-2">Plan A</label>
          <select className="control-field" value={planAId} onChange={(event) => setPlanAId(event.target.value)}>
            {planOptions.map((plan) => <option key={plan.id} value={plan.id}>{planKindLabel(plan.kind)} - {plan.name}</option>)}
          </select>
          <div className="mt-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-2xl text-[#dbeafe]">{planA.name}</p>
              <p className="mt-1 text-xs text-[#8ba7c7]">{planA.detail}</p>
            </div>
            <span className="rounded-full border border-[#7dd3fc]/40 p-2 text-[#7dd3fc]">{planIcon(planA.kind)}</span>
          </div>
        </div>

        <div className="panel-card-muted flex flex-col items-center justify-center gap-3 text-center">
          <Trophy className="h-7 w-7" />
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div><span className="block font-mono text-2xl">{counts.a}</span>{t('compare.aWins')}</div>
            <div><span className="block font-mono text-2xl">{counts.tie}</span>{t('compare.tie')}</div>
            <div><span className="block font-mono text-2xl">{counts.b}</span>{t('compare.bWins')}</div>
          </div>
        </div>

        <div className="panel-card">
          <label className="micro-label mb-2">Plan B</label>
          <select className="control-field" value={planBId} onChange={(event) => setPlanBId(event.target.value)}>
            {planOptions.map((plan) => <option key={plan.id} value={plan.id}>{planKindLabel(plan.kind)} - {plan.name}</option>)}
          </select>
          <div className="mt-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-2xl text-[#dbeafe]">{planB.name}</p>
              <p className="mt-1 text-xs text-[#8ba7c7]">{planB.detail}</p>
            </div>
            <span className="rounded-full border border-[#7dd3fc]/40 p-2 text-[#7dd3fc]">{planIcon(planB.kind)}</span>
          </div>
        </div>
      </section>

      <section className="panel-card overflow-hidden">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-mono text-2xl font-medium tracking-normal text-[#dbeafe]">{t('compare.scenarios')}</h3>
            <p className="mt-2 text-sm text-[#8ba7c7]">{t('compare.scenarioHelp')}</p>
          </div>
          <div className="w-full md:w-56">
            <label className="micro-label mb-2">{t('compare.sortBy')}</label>
            <select className="control-field" value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
              <option value="winner">{t('compare.sort.winner')}</option>
              <option value="name">{t('compare.sort.name')}</option>
              <option value="cost">{t('compare.sort.cost')}</option>
              <option value="fit">{t('compare.sort.fit')}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="border-b border-[#7dd3fc]/10 text-[#8ba7c7]">
              <tr>
                <th className="pb-3 pr-4 font-medium">{t('compare.table.scenario')}</th>
                <th className="pb-3 pr-4 font-medium">Plan A</th>
                <th className="pb-3 pr-4 font-medium">Plan B</th>
                <th className="pb-3 font-medium">{t('compare.table.result')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7dd3fc]/10">
              {rows.map((row) => (
                <tr key={row.scenario.id} className="transition hover:bg-[#7dd3fc]/5">
                  <td className="py-4 pr-4 align-top">
                    <div className="font-medium text-[#eaf4ff]">{row.scenario.name}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#7dd3fc]">{row.scenario.modelName} {row.params && `- ${row.params}`}</div>
                    <div className="mt-2 max-w-[260px] text-[11px] leading-5 text-[#8ba7c7]">{row.scenario.task}</div>
                  </td>
                  <td className="py-4 pr-4 align-top">
                    <div className="mb-2">{resultBadge(row.resultA, t)}</div>
                    <div className="font-mono text-lg text-[#dbeafe]">{row.resultA.label}</div>
                    <div className="mt-1 text-[11px] text-[#8ba7c7]">{row.resultA.sublabel}</div>
                  </td>
                  <td className="py-4 pr-4 align-top">
                    <div className="mb-2">{resultBadge(row.resultB, t)}</div>
                    <div className="font-mono text-lg text-[#dbeafe]">{row.resultB.label}</div>
                    <div className="mt-1 text-[11px] text-[#8ba7c7]">{row.resultB.sublabel}</div>
                  </td>
                  <td className="py-4 align-top">
                    {row.winner === 'tie' ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#f0d48a]/40 bg-[#f0d48a]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#f0d48a]"><Equal className="h-3 w-3" />{t('compare.tie')}</span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#7dd3fc]/40 bg-[#7dd3fc]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7dd3fc]">{row.winner === 'a' ? t('compare.aWins') : t('compare.bWins')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
