import React from 'react';
import { HardwareProfile, UsageProfile, GPUMaker, OS, UsageGoal, UsageFrequency } from '../lib/types';
import { HARDWARE_PRESETS } from '../lib/calculator';

interface Props {
  hardware: HardwareProfile;
  setHardware: (h: HardwareProfile) => void;
  usage: UsageProfile;
  setUsage: (u: UsageProfile) => void;
}

export function InputForms({ hardware, setHardware, usage, setUsage }: Props) {
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetKey = e.target.value;
    if (presetKey === 'custom') {
      setHardware({ ...hardware, preset: 'custom' });
    } else {
      setHardware({ ...hardware, ...HARDWARE_PRESETS[presetKey] });
    }
  };

  return (
    <div className="space-y-6 flex flex-col">
      {/* Hardware Section */}
      <section className="border border-slate-800 p-5 flex flex-col gap-6 bg-slate-900/30 rounded-xl">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0">
          Especificaciones de Hardware
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] mb-1.5 text-slate-400 font-bold uppercase tracking-wider">Preset rápido</label>
            <select 
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white outline-none focus:border-emerald-500"
              value={hardware.preset}
              onChange={handlePresetChange}
            >
              <option value="custom">Personalizado...</option>
              <option value="rtx3060">PC Gamer (RTX 3060 12GB)</option>
              <option value="rtx4090">Workstation (RTX 4090 24GB)</option>
              <option value="m2_16gb">MacBook M2 (16GB RAM)</option>
              <option value="m3max_64gb">MacBook M3 Max (64GB RAM)</option>
              <option value="no_gpu">Laptop / PC sin GPU dedicada</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] mb-1.5 text-slate-400 font-bold uppercase tracking-wider">Fabricante GPU</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white outline-none focus:border-emerald-500 disabled:opacity-50"
                value={hardware.gpuMaker}
                onChange={(e) => setHardware({ ...hardware, gpuMaker: e.target.value as GPUMaker, preset: 'custom' })}
              >
                <option value="NVIDIA">NVIDIA</option>
                <option value="AMD">AMD</option>
                <option value="Apple">Apple Silicon</option>
                <option value="Intel">Intel</option>
                <option value="None">Ninguna (Solo CPU)</option>
              </select>
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] mb-1.5 text-slate-400 font-bold uppercase tracking-wider">VRAM (GB)</label>
              <input 
                type="number"
                min="0"
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white outline-none focus:border-emerald-500"
                value={hardware.vramGB}
                onChange={(e) => setHardware({ ...hardware, vramGB: Number(e.target.value), preset: 'custom' })}
              />
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] mb-1.5 text-slate-400 font-bold uppercase tracking-wider">RAM Total (GB)</label>
              <input 
                type="number"
                min="4"
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white outline-none focus:border-emerald-500"
                value={hardware.ramGB}
                onChange={(e) => setHardware({ ...hardware, ramGB: Number(e.target.value), preset: 'custom' })}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] mb-1.5 text-slate-400 font-bold uppercase tracking-wider">Costo (USD)</label>
              <input 
                type="number"
                min="0"
                step="100"
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white outline-none focus:border-emerald-500"
                value={hardware.devicePriceUsd}
                onChange={(e) => setHardware({ ...hardware, devicePriceUsd: Number(e.target.value), preset: 'custom' })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Usage Section */}
      <section className="border border-slate-800 p-5 flex flex-col gap-6 bg-slate-900/30 rounded-xl">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0">
          Perfil de Uso Esperado
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] mb-1.5 text-slate-400 font-bold uppercase tracking-wider">Frecuencia de Uso</label>
            <select 
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white outline-none focus:border-emerald-500"
              value={usage.frequency}
              onChange={(e) => setUsage({ ...usage, frequency: e.target.value as UsageFrequency })}
            >
              <option value="occasional">Ocasional (unas horas a la semana)</option>
              <option value="daily">Diario (uso constante para trabajo)</option>
              <option value="heavy">Intensivo (agentes, automatización)</option>
              <option value="production">Producción (servidor abierto a usuarios)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] mb-1.5 text-slate-400 font-bold uppercase tracking-wider">Caso de Uso Principal</label>
            <select 
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white outline-none focus:border-emerald-500"
              value={usage.goal}
              onChange={(e) => setUsage({ ...usage, goal: e.target.value as UsageGoal })}
            >
              <option value="chat">Chat general / Asistente</option>
              <option value="coding">Programación (Copilot local)</option>
              <option value="rag">RAG / Análisis de documentos grandes</option>
              <option value="agents">Agentes autónomos</option>
              <option value="embedding">Solo Embeddings (Búsqueda vectorial)</option>
            </select>
          </div>

          <div>
            <label className="flex justify-between text-[11px] mb-1.5 text-slate-400 font-bold uppercase tracking-wider">
              <span>Horas de Uso al Día</span>
              <span className="text-emerald-400 font-mono font-normal">{usage.hoursPerDay} hrs</span>
            </label>
            <input 
              type="range"
              min="0.5"
              step="0.5"
              max="24"
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-full appearance-none outline-none"
              value={usage.hoursPerDay}
              onChange={(e) => setUsage({ ...usage, hoursPerDay: Number(e.target.value) })}
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={usage.needsPrivacy}
                  onChange={(e) => setUsage({ ...usage, needsPrivacy: e.target.checked })}
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
              <span className="text-xs text-slate-300">Privacidad estricta</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={usage.offlineRequired}
                  onChange={(e) => setUsage({ ...usage, offlineRequired: e.target.checked })}
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
              <span className="text-xs text-slate-300">Necesita funcionar 100% Offline</span>
            </label>
          </div>

        </div>
      </section>
    </div>
  );
}
