import { useState } from 'react';
import { Diagnosis, ModelCapability } from '../lib/types';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, CheckCircle2, Copy, ExternalLink, GitBranch, X, XCircle } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface Props {
  diagnosis: Diagnosis;
}

export function ResultsDashboard({ diagnosis }: Props) {
  const { t } = useLanguage();
  const [showAllModels, setShowAllModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelCapability | null>(null);
  const { mainLimitation, recommendedModels, economics, overallSummary, intelligenceComparison, frontierScore, bestLocalScore } = diagnosis;
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
  const qualityEntries = selectedModel?.dataQuality ? Object.entries(selectedModel.dataQuality).filter(([, value]) => value) : [];
  const compatibleModels = recommendedModels.filter((model) => model.canRun && model.speed !== 'unusable');
  const visibleModels = showAllModels || compatibleModels.length === 0 ? recommendedModels : compatibleModels;
  const hasHiddenModels = recommendedModels.length > visibleModels.length;

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

      <div className="flex flex-col gap-5">
        <div className="panel-card flex min-h-[420px] flex-col overflow-hidden">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-mono text-2xl font-medium tracking-normal text-[#dbeafe]">{t('results.models.title')}</h3>
              <p className="mt-2 text-xs leading-5 text-[#8ba7c7]">
                {showAllModels ? t('results.models.showingAll') : t('results.models.showingCompatible')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-[#7dd3fc]/30 px-3 py-1 text-xs text-[#7dd3fc] transition hover:border-[#7dd3fc]/70 hover:bg-[#7dd3fc]/10 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => setShowAllModels((value) => !value)}
                disabled={!showAllModels && !hasHiddenModels}
              >
                {showAllModels ? t('results.models.showCompatible') : t('results.models.showAll')}
              </button>
              <span className="rounded-full border border-[#7dd3fc]/70 px-3 py-1 text-xs text-[#7dd3fc]">GGUF Q4</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr className="border-b border-[#7dd3fc]/10 text-[#8ba7c7]">
                  <th className="pb-3 pr-4 font-medium">Model</th>
                  <th className="pb-3 pr-4 font-medium">Ideal</th>
                  <th className="pb-3 pr-4 font-medium">Quality</th>
                  <th className="pb-3 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#7dd3fc]/10">
                {visibleModels.map((model, idx) => (
                  <tr
                    key={idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedModel(model)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedModel(model);
                      }
                    }}
                    className={`cursor-pointer transition hover:bg-[#7dd3fc]/5 focus:bg-[#7dd3fc]/5 focus:outline-none ${!model.canRun ? 'text-[#53677f]' : 'text-[#eaf4ff]'}`}
                  >
                    <td className="py-4 pr-4 align-top">
                      <div className="font-medium">{model.name}</div>
                      <div className="mt-1 max-w-[260px] text-[10px] leading-4 text-[#8ba7c7]">{model.notes}</div>
                    </td>
                    <td className="py-4 pr-4 align-top">
                      <div className="max-w-[220px] text-[10px] leading-4 text-[#8ba7c7]">{model.idealUseCaseLabels}</div>
                      <span className="mt-2 inline-block rounded-full border border-[#7dd3fc]/15 bg-black/20 px-2 py-1 font-mono text-[10px] text-[#7dd3fc]">
                        {model.quantization}
                      </span>
                    </td>
                    <td className="py-4 pr-4 align-top">
                      <span className="font-mono text-lg text-[#dbeafe]">{model.intelligenceScore}</span>
                      <span className="ml-1 text-[10px] text-[#8ba7c7]">/100</span>
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

        <div className="panel-card-muted flex min-h-[360px] flex-col">
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
              <span className="block text-[10px] uppercase tracking-[0.18em] text-[#405a78]">{t(economics.includesHardwarePurchase ? 'results.economics.localCost' : 'results.economics.localCostOwned')}</span>
              <span className="mt-2 block font-mono text-4xl">{formatMoney(economics.totalLocalMonthly, 2)}</span>
            </div>
          </div>

          <div className="min-h-[260px] flex-1">
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

      {intelligenceComparison.length > 0 && (
        <section className="panel-card flex min-h-[360px] flex-col overflow-hidden">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="font-mono text-2xl font-medium tracking-normal text-[#dbeafe]">{t('results.intelligence.title')}</h3>
              <p className="mt-2 text-sm leading-6 text-[#8ba7c7]">{t('results.intelligence.description')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-right">
              <div>
                <span className="micro-label mb-1">Frontier</span>
                <span className="block font-mono text-3xl text-[#dbeafe]">{frontierScore}</span>
              </div>
              <div>
                <span className="micro-label mb-1">Local</span>
                <span className="block font-mono text-3xl text-[#7dd3fc]">{bestLocalScore}</span>
              </div>
            </div>
          </div>
          <div className="min-h-[230px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intelligenceComparison} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,211,252,0.10)" vertical={false} />
                <XAxis dataKey="name" stroke="#8ba7c7" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#8ba7c7" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip cursor={{ fill: 'rgba(125,211,252,0.035)' }} contentStyle={{ backgroundColor: '#06111f', borderColor: 'rgba(125,211,252,0.18)', borderRadius: '14px', color: '#eaf4ff' }} itemStyle={{ fontSize: '12px' }} />
                <Legend verticalAlign="top" height={34} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8ba7c7' }} />
                <Bar dataKey="frontierScore" name="Frontier" fill="#dbeafe" radius={[6, 6, 0, 0]} />
                <Bar dataKey="localScore" name="Local" fill="#7dd3fc" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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

      {selectedModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020711]/80 px-4 py-6 backdrop-blur-sm" onClick={() => setSelectedModel(null)}>
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[8px] border border-[#7dd3fc]/20 bg-[#06111f] shadow-2xl shadow-black/50"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#7dd3fc]/10 bg-[#06111f]/95 px-5 py-4 backdrop-blur">
              <div>
                <p className="micro-label mb-2">{t('results.models.detailsTitle')}</p>
                <h3 className="font-mono text-2xl font-medium tracking-normal text-[#dbeafe]">{selectedModel.name}</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8ba7c7]">{selectedModel.description}</p>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#7dd3fc]/20 text-[#dbeafe] transition hover:border-[#7dd3fc]/60 hover:bg-[#7dd3fc]/10"
                onClick={() => setSelectedModel(null)}
                aria-label={t('results.models.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
              <section className="rounded-[8px] border border-[#7dd3fc]/10 bg-black/20 p-4">
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <span className="micro-label mb-1">Params</span>
                    <span className="block font-mono text-2xl text-[#dbeafe]">{selectedModel.parameters}</span>
                  </div>
                  <div>
                    <span className="micro-label mb-1">Quality</span>
                    <span className="block font-mono text-2xl text-[#7dd3fc]">{selectedModel.intelligenceScore}/100</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="micro-label mb-1">{t('results.models.license')}</span>
                    <span className="block text-xs leading-5 text-[#8ba7c7]">{selectedModel.license}</span>
                  </div>
                  {(selectedModel.confidence || selectedModel.lastCheckedAt) && (
                    <div className="sm:col-span-4">
                      <span className="micro-label mb-1">{t('results.models.dataQuality')}</span>
                      <span className="block text-xs leading-5 text-[#8ba7c7]">
                        {selectedModel.confidence ?? 'dataset'}{selectedModel.lastCheckedAt ? ` - ${selectedModel.lastCheckedAt}` : ''}
                      </span>
                    </div>
                  )}
                  {selectedModel.deploymentOptions && selectedModel.deploymentOptions.length > 0 && (
                    <div className="sm:col-span-4">
                      <span className="micro-label mb-2">{t('results.models.runtimes')}</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedModel.deploymentOptions.map((runtime) => (
                          <span key={runtime} className="rounded-full border border-[#7dd3fc]/20 bg-[#7dd3fc]/10 px-2 py-1 text-[10px] text-[#7dd3fc]">{runtime}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedModel.specs.map((spec) => (
                    <div key={spec.label} className="rounded-[8px] border border-[#7dd3fc]/10 bg-[#071a2c] p-3">
                      <span className="block text-[10px] uppercase tracking-[0.16em] text-[#8ba7c7]">{spec.label}</span>
                      <span className="mt-1 block text-sm text-[#dbeafe]">{spec.value}</span>
                    </div>
                  ))}
                </div>
                {selectedModel.benchmarkRefs && selectedModel.benchmarkRefs.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedModel.benchmarkRefs.map((source) => (
                      <a key={`${source.type}-${source.url}`} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#7dd3fc]/20 px-3 py-2 text-xs text-[#7dd3fc] transition hover:border-[#7dd3fc]/70 hover:bg-[#7dd3fc]/10">
                        {source.type}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                )}
                {qualityEntries.length > 0 && (
                  <div className="mt-4 border-t border-[#7dd3fc]/10 pt-4">
                    <h4 className="mb-3 font-mono text-lg text-[#dbeafe]">{t('results.models.dataQualityBreakdown')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {qualityEntries.map(([key, value]) => (
                        <span key={key} className="rounded-full border border-[#7dd3fc]/20 bg-[#7dd3fc]/10 px-3 py-1 text-[10px] text-[#7dd3fc]">{key}: {value}</span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-[8px] border border-[#7dd3fc]/10 bg-black/20 p-4">
                <h4 className="mb-3 font-mono text-lg text-[#dbeafe]">{t('results.models.links')}</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedModel.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-[#7dd3fc]/20 px-3 py-2 text-xs text-[#7dd3fc] transition hover:border-[#7dd3fc]/70 hover:bg-[#7dd3fc]/10"
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
                <h4 className="mb-3 mt-5 font-mono text-lg text-[#dbeafe]">{t('results.models.useCases')}</h4>
                <p className="text-sm leading-6 text-[#8ba7c7]">{selectedModel.idealUseCaseLabels}</p>
                {selectedModel.sources && selectedModel.sources.length > 0 && (
                  <>
                    <h4 className="mb-3 mt-5 font-mono text-lg text-[#dbeafe]">{t('results.models.sources')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedModel.sources.map((source) => (
                        <a
                          key={`${source.type}-${source.url}`}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-[#7dd3fc]/20 px-3 py-2 text-xs text-[#7dd3fc] transition hover:border-[#7dd3fc]/70 hover:bg-[#7dd3fc]/10"
                        >
                          {source.type}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </section>

              <section className="rounded-[8px] border border-[#7dd3fc]/10 bg-black/20 p-4">
                <h4 className="mb-3 font-mono text-lg text-[#dbeafe]">{t('results.models.quantizations')}</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedModel.quantizationOptions.map((option) => (
                    <span key={option} className="rounded-full border border-[#7dd3fc]/20 bg-[#7dd3fc]/10 px-3 py-1 font-mono text-xs text-[#7dd3fc]">{option}</span>
                  ))}
                </div>
              </section>

              <section className="rounded-[8px] border border-[#7dd3fc]/10 bg-black/20 p-4">
                <h4 className="mb-3 font-mono text-lg text-[#dbeafe]">{t('results.models.install')}</h4>
                <div className="flex flex-col gap-2">
                  {selectedModel.installCommands.length === 0 && (
                    <p className="text-xs leading-5 text-[#8ba7c7]">{t('results.models.noInstall')}</p>
                  )}
                  {selectedModel.installCommands.map((command) => (
                    <div key={command.label} className="rounded-[8px] border border-[#7dd3fc]/10 bg-[#020711] p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs text-[#8ba7c7]">{command.label}</span>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-[#7dd3fc]/20 px-2 py-1 text-[10px] text-[#7dd3fc] hover:border-[#7dd3fc]/60"
                          onClick={() => navigator.clipboard?.writeText(command.command)}
                        >
                          <Copy className="h-3 w-3" />
                          {t('results.models.copy')}
                        </button>
                      </div>
                      <code className="block overflow-x-auto whitespace-nowrap font-mono text-xs text-[#dbeafe]">{command.command}</code>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[8px] border border-[#7dd3fc]/10 bg-black/20 p-4 lg:col-span-2">
                <h4 className="mb-3 font-mono text-lg text-[#dbeafe]">{t('results.models.benchmarks')}</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedModel.benchmarkSummary.map((item) => (
                    <div key={item.label} className="rounded-[8px] border border-[#7dd3fc]/10 bg-[#071a2c] p-4">
                      <span className="block text-[10px] uppercase tracking-[0.16em] text-[#8ba7c7]">{item.label}</span>
                      <span className="mt-2 block font-mono text-xl text-[#dbeafe]">{item.value}</span>
                      {item.note && <p className="mt-2 text-xs leading-5 text-[#8ba7c7]">{item.note}</p>}
                      {item.sourceUrl && (
                        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[10px] text-[#7dd3fc] hover:text-[#dbeafe]">
                          {t('results.models.source')}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
