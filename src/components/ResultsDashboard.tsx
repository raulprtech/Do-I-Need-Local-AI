import React from 'react';
import { Diagnosis } from '../lib/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, CheckCircle2, XCircle, Info, Zap } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface Props {
  diagnosis: Diagnosis;
}

export function ResultsDashboard({ diagnosis }: Props) {
  const { t } = useLanguage();
  const { canRunLocal, mainLimitation, recommendedModels, economics, overallSummary } = diagnosis;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      
      {/* Verdict Header */}
      <section className={`p-5 rounded-xl border flex items-center justify-between ${canRunLocal ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 border-rose-900/50'}`}>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            {t('results.verdict.title')}
          </h3>
          <div className="text-2xl font-bold text-white tracking-tight flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
            <span className="flex items-center gap-2">
              {canRunLocal ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> : <XCircle className="w-6 h-6 text-rose-400 shrink-0" />}
              {overallSummary}
            </span>
            {canRunLocal && economics.breakevenMonths > 0 && (
              <span className="bg-emerald-500 text-[10px] uppercase px-2 py-0.5 rounded text-slate-950 tracking-widest font-black self-start sm:self-auto">
                {t('results.economics.breakeven')}: {Math.ceil(economics.breakevenMonths)} {t('results.economics.months')}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
            {economics.verdictMessage}
          </p>
          {mainLimitation && (
            <div className="mt-3 flex items-center gap-2 text-rose-400 text-xs bg-rose-950/20 p-2 rounded border border-rose-900/30">
              <AlertTriangle className="w-4 h-4" />
              <span>{mainLimitation}</span>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1">
        {/* Model Capabilities */}
        <div className="flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            {t('results.models.title')}
          </h3>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="p-3 font-medium text-slate-400">Model</th>
                  <th className="p-3 font-medium text-slate-400">Quantization</th>
                  <th className="p-3 font-medium text-slate-400">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recommendedModels.map((model, idx) => (
                  <tr key={idx} className={`hover:bg-slate-800/30 ${!model.canRun ? 'text-slate-500' : ''}`}>
                    <td className="p-3">
                      <div className="font-medium">{model.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{model.notes}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300">
                        {model.quantization}
                      </span>
                    </td>
                    <td className="p-3">
                      {model.canRun ? (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          model.speed === 'fast' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
                          model.speed === 'acceptable' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' :
                          'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                        }`}>
                          {model.speed === 'fast' ? t('results.models.speed.fast') : model.speed === 'acceptable' ? t('results.models.speed.acceptable') : t('results.models.speed.slow')}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-500">
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

        {/* Economics Chart */}
        <div className="flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            {t('results.economics.title')}
          </h3>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1 flex flex-col">
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="block text-[10px] uppercase text-slate-500 mb-1">{t('results.economics.apiCost')}</span>
                <span className="text-xl font-mono text-rose-400 font-bold">${economics.monthlyApiCost.toFixed(2)}</span>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="block text-[10px] uppercase text-slate-500 mb-1">{t('results.economics.localCost')}</span>
                <span className="text-xl font-mono text-emerald-400 font-bold">${economics.electricityCostMonthly.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex-1 min-h-[200px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={economics.costDataOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLocal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `M${val}`} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }} />
                  <Area type="monotone" dataKey="apiCost" name="API" stroke="#f43f5e" fillOpacity={1} fill="url(#colorApi)" strokeWidth={2} />
                  <Area type="monotone" dataKey="localCost" name="Local" stroke="#10b981" fillOpacity={1} fill="url(#colorLocal)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Software Recommendations */}
      {diagnosis.softwareRecommendations && diagnosis.softwareRecommendations.length > 0 && (
        <section className="mt-6 border-t border-slate-800 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            {t('results.software.title')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {diagnosis.softwareRecommendations.map((sw, idx) => (
              <a 
                key={idx}
                href={sw.url}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-emerald-500/50 transition-colors group block"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{sw.name}</h4>
                  <span className="text-[10px] uppercase tracking-wider bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    {t('results.software.download')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {sw.description}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
