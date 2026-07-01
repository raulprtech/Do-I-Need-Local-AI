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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('s')) return; // Do not fetch country if loaded from share link
    if (localStorage.getItem('usage_v2')) return; // Don't override saved settings

    // Attempt to detect country to set a realistic electricity cost (USD)
    fetch('https://get.geojs.io/v1/ip/country.json')
      .then(res => res.json())
      .then(data => {
        const countryCode = data.country;
        const costs: Record<string, number> = {
          'US': 0.16, 'GB': 0.40, 'DE': 0.40, 'FR': 0.28, 'ES': 0.25, 'IT': 0.35,
          'MX': 0.08, 'AR': 0.05, 'CO': 0.15, 'CL': 0.18, 'PE': 0.18, 'BR': 0.17,
          'UY': 0.22, 'CR': 0.15, 'DO': 0.20, 'PA': 0.18, 'SV': 0.18, 'EC': 0.10,
        };
        if (countryCode && costs[countryCode]) {
          setUsage(prev => ({ ...prev, electricityCostPerKwh: costs[countryCode] }));
        }
      })
      .catch(() => {
        // Silently fail and keep default 0.20
      });
  }, []);

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
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Header onShare={handleShare} shared={shared} />
      
      <main className="flex-1 w-full p-6 flex flex-col gap-6 max-w-[1200px] mx-auto">
        <div className="mb-2 max-w-2xl">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
            {t('app.title')}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {t('app.subtitle')}
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

