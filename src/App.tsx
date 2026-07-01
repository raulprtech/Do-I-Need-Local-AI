import { useState, useMemo, useEffect, type ReactNode } from 'react';
import Header from './components/Header';
import { InputForms } from './components/InputForms';
import { ResultsDashboard } from './components/ResultsDashboard';
import { evaluateSystem } from './lib/calculator';
import { detectHardwareProfile } from './lib/hardwareDetection';
import { DEFAULT_COUNTRY, detectCountryDefaults } from './lib/locale';
import { HardwareProfile, UsageProfile } from './lib/types';
import { useLanguage } from './lib/i18n';

type View = 'dashboard' | 'why' | 'how';

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

function normalizeUsage(data: Partial<UsageProfile>): UsageProfile {
  return {
    goal: data.goal ?? 'chat',
    frequency: data.frequency ?? 'daily',
    hoursPerDay: data.hoursPerDay ?? 4,
    needsPrivacy: data.needsPrivacy ?? false,
    offlineRequired: data.offlineRequired ?? false,
    modelSizePreference: data.modelSizePreference ?? 'medium',
    electricityCostPerKwh: data.electricityCostPerKwh ?? DEFAULT_COUNTRY.electricityCostPerKwh,
    currencyCode: data.currencyCode ?? DEFAULT_COUNTRY.currencyCode,
    currencySymbol: data.currencySymbol ?? DEFAULT_COUNTRY.currencySymbol,
    exchangeRateFromUsd: data.exchangeRateFromUsd ?? DEFAULT_COUNTRY.exchangeRateFromUsd,
  };
}

function InfoPage({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section className="panel-card mx-auto max-w-5xl">
      <p className="mb-4 text-xs uppercase tracking-[0.28em] text-[#8ba7c7]">{eyebrow}</p>
      <h2 className="font-mono text-4xl font-medium tracking-normal text-[#dbeafe] md:text-5xl">{title}</h2>
      <div className="mt-8 grid gap-4 text-sm leading-7 text-[#b7cbe2] md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function WhyPage() {
  return (
    <InfoPage eyebrow="Decision guide" title="Por que comparar local vs API">
      <div className="rounded-[18px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 p-5">
        <h3 className="mb-3 font-mono text-xl text-[#dbeafe]">Costos reales</h3>
        <p>Una API puede ser barata al inicio, pero el costo sube con horas de uso, agentes, RAG y produccion. Local tiene costo inicial, electricidad y mantenimiento.</p>
      </div>
      <div className="rounded-[18px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 p-5">
        <h3 className="mb-3 font-mono text-xl text-[#dbeafe]">Privacidad y control</h3>
        <p>Si trabajas con datos sensibles, offline o flujos internos, correr modelos locales puede ser una ventaja aunque no siempre sea lo mas barato.</p>
      </div>
      <div className="rounded-[18px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 p-5">
        <h3 className="mb-3 font-mono text-xl text-[#dbeafe]">Calidad y escala</h3>
        <p>Los modelos frontera en la nube siguen ganando para tareas complejas, picos de demanda y produccion. Por eso el veredicto hibrido existe.</p>
      </div>
      <div className="rounded-[18px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 p-5">
        <h3 className="mb-3 font-mono text-xl text-[#dbeafe]">Hardware honesto</h3>
        <p>No todo equipo con GPU sirve para todo. La app estima si tu memoria alcanza para modelos pequenos, medianos o grandes en cuantizacion Q4.</p>
      </div>
    </InfoPage>
  );
}

function HowPage() {
  return (
    <InfoPage eyebrow="Methodology" title="Como calculamos el veredicto">
      <div className="rounded-[18px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 p-5">
        <h3 className="mb-3 font-mono text-xl text-[#dbeafe]">Costo API</h3>
        <p>Estimamos requests por hora segun frecuencia, tokens por caso de uso y costo por millon de tokens segun preferencia de modelo.</p>
      </div>
      <div className="rounded-[18px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 p-5">
        <h3 className="mb-3 font-mono text-xl text-[#dbeafe]">Costo local</h3>
        <p>Amortizamos el hardware a 24 meses y sumamos electricidad. La inferencia activa se estima como 25% de las horas de uso declaradas.</p>
      </div>
      <div className="rounded-[18px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 p-5">
        <h3 className="mb-3 font-mono text-xl text-[#dbeafe]">Compatibilidad</h3>
        <p>El catalogo compara VRAM efectiva y RAM contra requerimientos aproximados de modelos GGUF Q4. Apple Silicon usa memoria unificada estimada.</p>
      </div>
      <div className="rounded-[18px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 p-5">
        <h3 className="mb-3 font-mono text-xl text-[#dbeafe]">Moneda local</h3>
        <p>El calculo base se mantiene en USD para consistencia. La moneda local se usa para mostrar resultados con una tasa aproximada editable.</p>
      </div>
    </InfoPage>
  );
}

export default function App() {
  const { t } = useLanguage();
  const [shared, setShared] = useState(false);
  const [view, setView] = useState<View>('dashboard');
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
      if (decoded && decoded.u) return normalizeUsage(decoded.u);
    }
    const saved = localStorage.getItem('usage_v2');
    if (saved) {
      try {
        return normalizeUsage(JSON.parse(saved));
      } catch (e) {}
    }
    return normalizeUsage({});
  });

  useEffect(() => {
    localStorage.setItem('hardware_v2', JSON.stringify(hardware));
    localStorage.setItem('usage_v2', JSON.stringify(usage));
  }, [hardware, usage]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isShared = Boolean(params.get('s'));
    if (isShared || localStorage.getItem('auto_detected_v1')) return;

    localStorage.setItem('auto_detected_v1', 'true');

    detectCountryDefaults()
      .then((defaults) => {
        setUsage((prev) => ({
          ...prev,
          electricityCostPerKwh: defaults.electricityCostPerKwh,
          currencyCode: defaults.currencyCode,
          currencySymbol: defaults.currencySymbol,
          exchangeRateFromUsd: defaults.exchangeRateFromUsd,
        }));
      })
      .catch(() => undefined);

    detectHardwareProfile(hardware)
      .then((detected) => setHardware((prev) => ({ ...prev, ...detected })))
      .catch(() => undefined);
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

  const handleNavigate = (nextView: View, targetId?: string) => {
    setView(nextView);
    if (targetId) {
      window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#07111f] font-sans">
      <div className="dashboard-shell flex min-h-screen w-full flex-col overflow-hidden">
        <Header onShare={handleShare} shared={shared} onNavigate={handleNavigate} activeView={view} />

        <main className="flex-1 w-full px-5 pb-6 pt-5 md:px-10 md:pb-10 md:pt-8">
          {view === 'dashboard' && (
            <>
              <div className="mb-8 flex flex-col gap-4 border-b border-[#7dd3fc]/10 pb-7 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                  <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[#8ba7c7]">Local AI readiness</p>
                  <h2 className="font-mono text-4xl font-medium tracking-normal text-[#dbeafe] md:text-5xl">
                    {t('app.title')}
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-[#8ba7c7]">
                    {t('app.subtitle')}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-right font-mono text-[#dbeafe]">
                  <span className="text-3xl md:text-4xl">12</span>
                  <span className="text-sm text-[#8ba7c7]">month<br />projection</span>
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
            </>
          )}
          {view === 'why' && <WhyPage />}
          {view === 'how' && <HowPage />}
        </main>
      </div>
    </div>
  );
}
