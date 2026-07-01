import { Diagnosis } from '../lib/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, CheckCircle2, GitBranch, XCircle } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface Props {
  diagnosis: Diagnosis;
}

export function ResultsDashboard({ diagnosis }: Props) {
  const { t } = useLanguage();
  const { mainLimitation, recommendedModels, economics, overallSummary } = diagnosis;
  const exchangeRate = economics.exchangeRateFromUsd || 1;
  const formatMoney = (usd: number, maximumFractionDigits = 0) => {
    const value = usd * exchangeRate;
    const suffix = economics.currencySymbol.trim() === economics.currencyCode ? '' : ` ${economics.currencyCode}`;
    return `${economics.currencySymbol}${value.toLocaleString(undefined, { maximumFractionDigits })}${suffix}`;
  };
  const localizedCostData = economics.costDataOverTime.map((point) => ({
    ...point,
    apiCost: point.apiCost * exchangeRate,
    localCost: point.localCost * exchangeRate,
  }));

  return (
    <div className="flex min-w-0 flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="panel-card flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h3 className="micro-label mb-4">{t('results.verdict.title')}</h3>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <span className="flex items-center gap-3 font-mono text-3xl font-medium tracking-normal text-[#dbeafe] md:text-4xl">
              {economics.verdict === 'local' ? <CheckCircle2 className="h-8 w-8 shrink-0 text-[#7dd3fc]" /> : economics.verdict === 'hybrid' ? <GitBranch className="h-8 w-8 shrink-0 text-[#7dd3fc]" /> : <XCircle className="h-8 w-8 shrink-0 text-[#f3a6a6]" />}
              {overallSummary}
            </span>
            {economics.verdict !== 'api' && economics.breakevenMonths > 0 && (
              <span className="self-start rounded-full bg-[#7dd3fc] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#06111f] md:self-auto">
                {t('results.economics.breakeven')}: {Math.ceil(economics.breakevenMonths)} {t('results.economics.months')}
              </span>
            )}
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#8ba7c7]">
            {economics.verdictMessage}
          </p>
          {mainLimitation && (
            <div className="mt-5 flex items-center gap-2 rounded-full border border-[#f3a6a6]/30 bg-[#f3a6a6]/10 px-4 py-2 text-xs text-[#ffd6d6]">
              <AlertTriangle className="h-4 w-4" />
              <span>{mainLimitation}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 lg:min-w-[280px]">
          <div>
            <span className="micro-label mb-2">API</span>
            <span className="block font-mono text-4xl text-[#dbeafe]">{formatMoney(economics.monthlyApiCost)}</span>
            <span className="text-xs text-[#8ba7c7]">/ month</span>
          </div>
          <div>
            <span className="micro-label mb-2">Local</span>
            <span className="block font-mono text-4xl text-[#7dd3fc]">{formatMoney(economics.totalLocalMonthly)}</span>
            <span className="text-xs text-[#8ba7c7]">/ month</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <div className="panel-card flex min-h-[420px] flex-col overflow-hidden">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-mono text-2xl font-medium tracking-normal text-[#dbeafe]">{t('results.models.title')}</h3>
            <span className="rounded-full border border-[#7dd3fc]/70 px-3 py-1 text-xs text-[#7dd3fc]">GGUF Q4</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead>
                <tr className="border-b border-[#7dd3fc]/10 text-[#8ba7c7]">
                  <th className="pb-3 pr-4 font-medium">Model</th>
                  <th className="pb-3 pr-4 font-medium">Quantization</th>
                  <th className="pb-3 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#7dd3fc]/10">
                {recommendedModels.map((model, idx) => (
                  <tr key={idx} className={`transition hover:bg-[#7dd3fc]/5 ${!model.canRun ? 'text-[#53677f]' : 'text-[#eaf4ff]'}`}>
                    <td className="py-4 pr-4 align-top">
                      <div className="font-medium">{model.name}</div>
                      <div className="mt-1 max-w-[260px] text-[10px] leading-4 text-[#8ba7c7]">{model.notes}</div>
                    </td>
                    <td className="py-4 pr-4 align-top">
                      <span className="rounded-full border border-[#7dd3fc]/15 bg-black/20 px-2 py-1 font-mono text-[10px] text-[#7dd3fc]">
                        {model.quantization}
                      </span>
                    </td>
                    <td className="py-4 align-top">
                      {model.canRun ? (
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                          model.speed === 'fast' ? 'border-[#7dd3fc]/40 bg-[#7dd3fc]/10 text-[#7dd3fc]' :
                          model.speed === 'acceptable' ? 'border-[#f0d48a]/40 bg-[#f0d48a]/10 text-[#f0d48a]' :
                          'border-[#f3a6a6]/40 bg-[#f3a6a6]/10 text-[#f3a6a6]'
                        }`}>
                          {model.speed === 'fast' ? t('results.models.speed.fast') : model.speed === 'acceptable' ? t('results.models.speed.acceptable') : t('results.models.speed.slow')}
                        </span>
                      ) : (
                        <span className="rounded-full border border-[#7dd3fc]/10 bg-black/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#53677f]">
                          {t('results.models.cannotRun')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel-card-muted flex min-h-[420px] flex-col">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-mono text-2xl font-medium tracking-normal">{t('results.economics.title')}</h3>
              <p className="mt-3 text-sm text-[#405a78]">API spend against local ownership cost.</p>
            </div>
            <span className="rounded-full border border-[#06111f]/50 px-3 py-1 text-xs">12M</span>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-[#405a78]">{t('results.economics.apiCost')}</span>
              <span className="mt-2 block font-mono text-4xl">{formatMoney(economics.monthlyApiCost, 2)}</span>
            </div>
            <div className="border-l border-[#06111f]/15 pl-4">
              <span className="block text-[10px] uppercase tracking-[0.18em] text-[#405a78]">{t('results.economics.localCost')}</span>
              <span className="mt-2 block font-mono text-4xl">{formatMoney(economics.totalLocalMonthly, 2)}</span>
            </div>
          </div>

          <div className="min-h-[230px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={localizedCostData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06111f" stopOpacity={0.28}/>
                    <stop offset="95%" stopColor="#06111f" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLocal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f83c2" stopOpacity={0.32}/>
                    <stop offset="95%" stopColor="#4f83c2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,17,31,0.16)" vertical={false} />
                <XAxis dataKey="month" stroke="#405a78" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `M${val}`} />
                <YAxis stroke="#405a78" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${economics.currencySymbol}${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                <Tooltip contentStyle={{ backgroundColor: '#06111f', borderColor: 'rgba(125,211,252,0.22)', borderRadius: '14px', color: '#eaf4ff' }} itemStyle={{ fontSize: '12px' }} formatter={(value) => formatMoney(Number(value))} />
                <Legend verticalAlign="top" height={34} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#405a78' }} />
                <Area type="monotone" dataKey="apiCost" name="API" stroke="#06111f" fillOpacity={1} fill="url(#colorApi)" strokeWidth={2} />
                <Area type="monotone" dataKey="localCost" name="Local" stroke="#4f83c2" fillOpacity={1} fill="url(#colorLocal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {diagnosis.assumptions.length > 0 && (
        <section className="panel-card">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="font-mono text-2xl font-medium tracking-normal text-[#dbeafe]">{t('results.assumptions.title')}</h3>
            <span className="rounded-full border border-[#7dd3fc]/40 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#7dd3fc]">Beta</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {diagnosis.assumptions.map((assumption) => (
              <div key={assumption} className="rounded-[14px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 px-4 py-3 text-sm leading-6 text-[#b7cbe2]">
                {assumption}
              </div>
            ))}
          </div>
        </section>
      )}

      {diagnosis.softwareRecommendations && diagnosis.softwareRecommendations.length > 0 && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {diagnosis.softwareRecommendations.map((sw, idx) => (
            <a
              key={idx}
              href={sw.url}
              target="_blank"
              rel="noreferrer"
              className={idx === 0 ? 'panel-card-muted block transition hover:scale-[1.01]' : 'panel-card block transition hover:border-[#7dd3fc]/45'}
            >
              <div className="mb-8 flex items-center justify-between">
                <h4 className="font-mono text-2xl font-medium">{sw.name}</h4>
                <span className="rounded-full border border-current px-3 py-1 text-[10px] uppercase tracking-[0.16em]">
                  {t('results.software.download')}
                </span>
              </div>
              <p className={idx === 0 ? 'text-sm leading-6 text-[#405a78]' : 'text-sm leading-6 text-[#8ba7c7]'}>
                {sw.description}
              </p>
            </a>
          ))}
        </section>
      )}
    </div>
  );
}
