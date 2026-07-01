import { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import { InputForms } from './components/InputForms';
import { ResultsDashboard } from './components/ResultsDashboard';
import { evaluateSystem } from './lib/calculator';
import { HardwareProfile, UsageProfile } from './lib/types';
import { useLanguage } from './lib/i18n';

function encodeState(hardware: HardwareProfile, usage: UsageProfile) {
  try {
    const data = { h: hardware, u: usage };
    return btoa(JSON.stringify(data));
  } catch (e) {
    return '';
  }
}

function decodeState(encoded: string) {
  try {
    return JSON.parse(atob(encoded));
  } catch(e) {
    return null;
  }
}

export default function App() {
  const { t } = useLanguage();
  const [shared, setShared] = useState(false);
  const [hardware, setHardware] = useState<HardwareProfile>(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('s');
    if (s) {
      const decoded = decodeState(s);
      if (decoded && decoded.h) return decoded.h;
    }
    const saved = localStorage.getItem('hardware_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      preset: 'rtx3060',
      os: 'Windows',
      gpuMaker: 'NVIDIA',
      gpuName: 'RTX 3060',
      vramGB: 12,
      ramGB: 16,
      devicePriceUsd: 1000,
      cpuName: '',
    };
  });

  const [usage, setUsage] = useState<UsageProfile>(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('s');
    if (s) {
      const decoded = decodeState(s);
      if (decoded && decoded.u) return decoded.u;
    }
    const saved = localStorage.getItem('usage_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      goal: 'chat',
      frequency: 'daily',
      hoursPerDay: 4,
      needsPrivacy: false,
      offlineRequired: false,
      modelSizePreference: 'medium',
      electricityCostPerKwh: 0.20,
    };
  });

  useEffect(() => {
    localStorage.setItem('hardware_v2', JSON.stringify(hardware));
    localStorage.setItem('usage_v2', JSON.stringify(usage));
  }, [hardware, usage]);

  const diagnosis = useMemo(() => evaluateSystem(hardware, usage, t), [hardware, usage, t]);

  const handleShare = () => {
    const s = encodeState(hardware, usage);
    const url = new URL(window.location.href);
    url.searchParams.set('s', s);
    navigator.clipboard.writeText(url.toString());
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-10 font-sans">
      <div className="dashboard-shell mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[1440px] flex-col overflow-hidden rounded-[28px]">
        <Header onShare={handleShare} shared={shared} />

        <main className="flex-1 w-full px-5 pb-6 pt-5 md:px-10 md:pb-10 md:pt-8">
          <div className="mb-8 flex flex-col gap-4 border-b border-[#dfeadd]/10 pb-7 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[#aab6a8]">Local AI readiness</p>
              <h2 className="font-mono text-4xl font-medium tracking-normal text-[#f3f8ef] md:text-5xl">
                {t('app.title')}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#aab6a8]">
                {t('app.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3 text-right font-mono text-[#f3f8ef]">
              <span className="text-3xl md:text-4xl">12</span>
              <span className="text-sm text-[#aab6a8]">month<br />projection</span>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <InputForms
              hardware={hardware}
              setHardware={setHardware}
              usage={usage}
              setUsage={setUsage}
            />
            <ResultsDashboard diagnosis={diagnosis} />
          </div>
        </main>
      </div>
    </div>
  );
}
