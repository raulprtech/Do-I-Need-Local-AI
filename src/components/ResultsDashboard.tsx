import React from 'react';
import { Diagnosis } from '../lib/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, CheckCircle2, XCircle, Info, Zap } from 'lucide-react';

interface Props {
  diagnosis: Diagnosis;
}

export function ResultsDashboard({ diagnosis }: Props) {
  const { canRunLocal, mainLimitation, recommendedModels, economics, overallSummary } = diagnosis;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      
      {/* Verdict Header */}
      <section className={`p-5 rounded-xl border flex items-center justify-between ${canRunLocal ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 border-rose-900/50'}`}>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Veredicto Final
          </h3>
          <div className="text-2xl font-bold text-white tracking-tight flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
            <span className="flex items-center gap-2">
              {canRunLocal ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> : <XCircle className="w-6 h-6 text-rose-400 shrink-0" />}
              {overallSummary}
            </span>
            {canRunLocal && economics.breakevenMonths > 0 && (
              <span className="bg-emerald-500 text-[10px] uppercase px-2 py-0.5 rounded text-slate-950 tracking-widest font-black self-start sm:self-auto">
                Retorno: {Math.ceil(economics.breakevenMonths)} Meses
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
            Matriz de Modelos
          </h3>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="p-3 font-medium text-slate-400">Modelo</th>
                  <th className="p-3 font-medium text-slate-400">Cuantización</th>
                  <th className="p-3 font-medium text-slate-400">Rendimiento</th>
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
                          {model.speed === 'fast' ? 'Rápido' : model.speed === 'acceptable' ? 'Aceptable' : 'Muy Lento'}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-500">
                          No Soportado
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
            Proyección de Costos (12 Meses)
          </h3>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1 flex flex-col">
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="block text-[10px] uppercase text-slate-500 mb-1">Costo API (Mensual)</span>
                <span className="text-xl font-mono text-rose-400 font-bold">${economics.monthlyApiCost.toFixed(2)}</span>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="block text-[10px] uppercase text-slate-500 mb-1">Costo Local (Mensual)</span>
                <span className="text-xl font-mono text-emerald-400 font-bold">${economics.electricityCostMonthly.toFixed(2)}</span>
                <span className="block text-[9px] text-slate-500 mt-1 uppercase tracking-wider">Solo electricidad</span>
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
                  <Area type="monotone" dataKey="apiCost" name="API Acumulado" stroke="#f43f5e" fillOpacity={1} fill="url(#colorApi)" strokeWidth={2} />
                  <Area type="monotone" dataKey="localCost" name="Local (Hardware + Luz)" stroke="#10b981" fillOpacity={1} fill="url(#colorLocal)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
