import { Diagnosis } from '../lib/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface Props {
  diagnosis: Diagnosis;
}

export function ResultsDashboard({ diagnosis }: Props) {
  const { t } = useLanguage();
  const { canRunLocal, mainLimitation, recommendedModels, economics, overallSummary } = diagnosis;

  return (
    <div className="flex min-w-0 flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="panel-card flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h3 className="micro-label mb-4">{t('results.verdict.title')}</h3>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <span className="flex items-center gap-3 font-mono text-3xl font-medium tracking-normal text-[#f3f8ef] md:text-4xl">
              {canRunLocal ? <CheckCircle2 className="h-8 w-8 shrink-0 text-[#dfeadd]" /> : <XCircle className="h-8 w-8 shrink-0 text-[#f3a6a6]" />}
              {overallSummary}
            </span>
            {canRunLocal && economics.breakevenMonths > 0 && (
              <span className="self-start rounded-full bg-[#dfeadd] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#111411] md:self-auto">
                {t('results.economics.breakeven')}: {Math.ceil(economics.breakevenMonths)} {t('results.economics.months')}
              </span>
            )}
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#aab6a8]">
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
            <span className="block font-mono text-4xl text-[#f3f8ef]">${economics.monthlyApiCost.toFixed(0)}</span>
            <span className="text-xs text-[#aab6a8]">/ month</span>
          </div>
          <div>
            <span className="micro-label mb-2">Local</span>
            <span className="block font-mono text-4xl text-[#dfeadd]">${economics.totalLocalMonthly.toFixed(0)}</span>
            <span className="text-xs text-[#aab6a8]">/ month</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <div className="panel-card flex min-h-[420px] flex-col overflow-hidden">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-mono text-2xl font-medium tracking-normal text-[#f3f8ef]">{t('results.models.title')}</h3>
            <span className="rounded-full border border-[#dfeadd]/70 px-3 py-1 text-xs text-[#dfeadd]">GGUF Q4</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead>
                <tr className="border-b border-[#dfeadd]/10 text-[#aab6a8]">
                  <th className="pb-3 pr-4 font-medium">Model</th>
                  <th className="pb-3 pr-4 font-medium">Quantization</th>
                  <th className="pb-3 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dfeadd]/10">
                {recommendedModels.map((model, idx) => (
                  <tr key={idx} className={`transition hover:bg-[#dfeadd]/5 ${!model.canRun ? 'text-[#667061]' : 'text-[#edf4eb]'}`}>
                    <td className="py-4 pr-4 align-top">
                      <div className="font-medium">{model.name}</div>
                      <div className="mt-1 max-w-[260px] text-[10px] leading-4 text-[#aab6a8]">{model.notes}</div>
                    </td>
                    <td className="py-4 pr-4 align-top">
                      <span className="rounded-full border border-[#dfeadd]/15 bg-black/20 px-2 py-1 font-mono text-[10px] text-[#dfeadd]">
                        {model.quantization}
                      </span>
                    </td>
                    <td className="py-4 align-top">
                      {model.canRun ? (
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                          model.speed === 'fast' ? 'border-[#dfeadd]/40 bg-[#dfeadd]/10 text-[#dfeadd]' :
                          model.speed === 'acceptable' ? 'border-[#f0d48a]/40 bg-[#f0d48a]/10 text-[#f0d48a]' :
                          'border-[#f3a6a6]/40 bg-[#f3a6a6]/10 text-[#f3a6a6]'
                        }`}>
                          {model.speed === 'fast' ? t('results.models.speed.fast') : model.speed === 'acceptable' ? t('results.models.speed.acceptable') : t('results.models.speed.slow')}
                        </span>
                      ) : (
                        <span className="rounded-full border border-[#dfeadd]/10 bg-black/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#667061]">
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
              <p className="mt-3 text-sm text-[#5f6d5c]">API spend against local ownership cost.</p>
            </div>
            <span className="rounded-full border border-[#111411]/50 px-3 py-1 text-xs">12M</span>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-[#5f6d5c]">{t('results.economics.apiCost')}</span>
              <span className="mt-2 block font-mono text-4xl">${economics.monthlyApiCost.toFixed(2)}</span>
            </div>
            <div className="border-l border-[#111411]/15 pl-4">
              <span className="block text-[10px] uppercase tracking-[0.18em] text-[#5f6d5c]">{t('results.economics.localCost')}</span>
              <span className="mt-2 block font-mono text-4xl">${economics.totalLocalMonthly.toFixed(2)}</span>
            </div>
          </div>

          <div className="min-h-[230px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={economics.costDataOverTime} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111411" stopOpacity={0.28}/>
                    <stop offset="95%" stopColor="#111411" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLocal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6d7b68" stopOpacity={0.32}/>
                    <stop offset="95%" stopColor="#6d7b68" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,20,17,0.14)" vertical={false} />
                <XAxis dataKey="month" stroke="#5f6d5c" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `M${val}`} />
                <YAxis stroke="#5f6d5c" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip contentStyle={{ backgroundColor: '#111411', borderColor: 'rgba(223,234,221,0.18)', borderRadius: '14px', color: '#edf4eb' }} itemStyle={{ fontSize: '12px' }} />
                <Legend verticalAlign="top" height={34} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#5f6d5c' }} />
                <Area type="monotone" dataKey="apiCost" name="API" stroke="#111411" fillOpacity={1} fill="url(#colorApi)" strokeWidth={2} />
                <Area type="monotone" dataKey="localCost" name="Local" stroke="#6d7b68" fillOpacity={1} fill="url(#colorLocal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {diagnosis.softwareRecommendations && diagnosis.softwareRecommendations.length > 0 && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {diagnosis.softwareRecommendations.map((sw, idx) => (
            <a
              key={idx}
              href={sw.url}
              target="_blank"
              rel="noreferrer"
              className={idx === 0 ? 'panel-card-muted block transition hover:scale-[1.01]' : 'panel-card block transition hover:border-[#dfeadd]/45'}
            >
              <div className="mb-8 flex items-center justify-between">
                <h4 className="font-mono text-2xl font-medium">{sw.name}</h4>
                <span className="rounded-full border border-current px-3 py-1 text-[10px] uppercase tracking-[0.16em]">
                  {t('results.software.download')}
                </span>
              </div>
              <p className={idx === 0 ? 'text-sm leading-6 text-[#5f6d5c]' : 'text-sm leading-6 text-[#aab6a8]'}>
                {sw.description}
              </p>
            </a>
          ))}
        </section>
      )}
    </div>
  );
}
