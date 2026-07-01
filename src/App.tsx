import { useState, useMemo } from 'react';
import Header from './components/Header';
import { InputForms } from './components/InputForms';
import { ResultsDashboard } from './components/ResultsDashboard';
import { evaluateSystem } from './lib/calculator';
import { HardwareProfile, UsageProfile } from './lib/types';

export default function App() {
  const [hardware, setHardware] = useState<HardwareProfile>({
    preset: 'rtx3060',
    os: 'Windows',
    gpuMaker: 'NVIDIA',
    gpuName: 'RTX 3060',
    vramGB: 12,
    ramGB: 16,
    devicePriceUsd: 1000,
    cpuName: '',
  });

  const [usage, setUsage] = useState<UsageProfile>({
    goal: 'chat',
    frequency: 'daily',
    hoursPerDay: 4,
    needsPrivacy: false,
    offlineRequired: false,
    modelSizePreference: 'medium',
  });

  const diagnosis = useMemo(() => evaluateSystem(hardware, usage), [hardware, usage]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 w-full p-6 flex flex-col gap-6 max-w-[1200px] mx-auto">
        <div className="mb-2 max-w-2xl">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
            ¿Me conviene correr IA local?
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Descubre si tu equipo actual es capaz de ejecutar modelos de lenguaje (LLMs) localmente, 
            qué rendimiento esperar y si financieramente tiene sentido comparado con pagar APIs como OpenAI o Anthropic.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          {/* Sidebar Area */}
          <div className="w-full lg:w-80 shrink-0">
            <InputForms 
              hardware={hardware} 
              setHardware={setHardware} 
              usage={usage} 
              setUsage={setUsage} 
            />
          </div>
          
          {/* Main Results Area */}
          <div className="flex-1 min-w-0">
            <ResultsDashboard diagnosis={diagnosis} />
          </div>
        </div>
      </main>
    </div>
  );
}

