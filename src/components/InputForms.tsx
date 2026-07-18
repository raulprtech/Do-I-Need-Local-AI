import React from 'react';
import { HardwareProfile, UsageProfile, GPUMaker, UsageGoal, UsageFrequency, CloudModelId, CloudPlanId, UsageModelSelection } from '../lib/types';
import { CLOUD_MODEL_PROFILES, CLOUD_PLAN_PROFILES, HARDWARE_PRESETS } from '../lib/calculator';
import { detectHardwareProfile, getHardwareDetectionDiagnostics } from '../lib/hardwareDetection';
import { CURRENCY_OPTIONS, detectCountryDefaults } from '../lib/locale';
import { useLanguage } from '../lib/i18n';
import { ApiUsageImportPanel } from './ApiUsagePage';
import { Plus, SlidersHorizontal, Trash2, X } from 'lucide-react';

interface Props {
  hardware: HardwareProfile;
  setHardware: (h: HardwareProfile) => void;
  usage: UsageProfile;
  setUsage: (u: UsageProfile) => void;
}

export function InputForms({ hardware, setHardware, usage, setUsage }: Props) {
  const { t } = useLanguage();
  const [isDetectingElectricity, setIsDetectingElectricity] = React.useState(false);
  const [isDetectingGpu, setIsDetectingGpu] = React.useState(false);
  const [electricityDetectionStatus, setElectricityDetectionStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [gpuDetectionStatus, setGpuDetectionStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [gpuDiagnosticStatus, setGpuDiagnosticStatus] = React.useState<'idle' | 'copied' | 'error'>('idle');
  const [isModelMixOpen, setIsModelMixOpen] = React.useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

  const detectElectricityCost = async () => {
    setIsDetectingElectricity(true);
    setElectricityDetectionStatus('idle');

    try {
      const defaults = await detectCountryDefaults();
      setUsage({
        ...usage,
        electricityCostPerKwh: defaults.electricityCostPerKwh,
        currencyCode: defaults.currencyCode,
        currencySymbol: defaults.currencySymbol,
        exchangeRateFromUsd: defaults.exchangeRateFromUsd,
      });
      setElectricityDetectionStatus('success');
    } catch {
      setElectricityDetectionStatus('error');
    } finally {
      setIsDetectingElectricity(false);
    }
  };

  const copyGpuDiagnostics = async () => {
    setGpuDiagnosticStatus('idle');

    try {
      const diagnostics = await getHardwareDetectionDiagnostics();
      await navigator.clipboard?.writeText(JSON.stringify(diagnostics, null, 2));
      setGpuDiagnosticStatus('copied');
    } catch {
      setGpuDiagnosticStatus('error');
    }
  };

  const detectGpu = async () => {
    setIsDetectingGpu(true);
    setGpuDetectionStatus('idle');

    try {
      const detected = await detectHardwareProfile(hardware);
      setHardware({ ...hardware, ...detected });
      setGpuDetectionStatus('success');
    } catch {
      setGpuDetectionStatus('error');
    } finally {
      setIsDetectingGpu(false);
    }
  };

  const updateModelMix = (modelMix: UsageModelSelection[]) => setUsage({ ...usage, modelMix });
  const activeModelMix = usage.modelMix ?? [];

  const addModelMixItem = () => {
    updateModelMix([
      ...activeModelMix,
      {
        id: String(Date.now()),
        modelId: usage.modelSizePreference === 'large' ? 'claude-sonnet' : 'gpt-4o-mini',
        goal: usage.goal,
        hoursPerDay: Math.min(usage.hoursPerDay, 2),
        billingMode: 'usage',
        planId: 'chatgpt-plus',
        monthlyPlanUsd: CLOUD_PLAN_PROFILES['chatgpt-plus'].monthlyUsd,
      },
    ]);
  };

  const updateModelMixItem = (id: string, patch: Partial<UsageModelSelection>) => {
    updateModelMix(activeModelMix.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const removeModelMixItem = (id: string) => {
    updateModelMix(activeModelMix.filter((item) => item.id !== id));
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetKey = e.target.value;
    if (presetKey === 'custom') {
      setHardware({ ...hardware, preset: 'custom' });
    } else {
      setHardware({ ...hardware, ...HARDWARE_PRESETS[presetKey] });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <section id="hardware" className="panel-card scroll-mt-8 flex flex-col gap-6">
        <h2 className="font-mono text-2xl font-medium tracking-normal text-[#dbeafe]">
          {t('input.hardware.title')}
        </h2>

        <div className="space-y-4">
          <div className="rounded-[14px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 p-4">
            <button
              type="button"
              onClick={detectGpu}
              disabled={isDetectingGpu}
              className="text-[10px] uppercase tracking-[0.18em] text-[#7dd3fc] hover:text-[#eaf4ff] disabled:cursor-wait disabled:opacity-60"
            >
              {isDetectingGpu ? t('input.hardware.detectingGpu') : t('input.hardware.detectGpu')}
            </button>
            {gpuDetectionStatus !== 'idle' && (
              <span className={`ml-3 text-[10px] ${gpuDetectionStatus === 'success' ? 'text-[#7dd3fc]' : 'text-[#f0d48a]'}`}>
                {gpuDetectionStatus === 'success' ? t('input.hardware.detectedGpu') : t('input.hardware.gpuUnavailable')}
              </span>
            )}
            <p className="mt-2 text-xs leading-5 text-[#8ba7c7]">{hardware.gpuName}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={copyGpuDiagnostics}
                className="rounded-full border border-[#7dd3fc]/20 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[#8ba7c7] transition hover:border-[#7dd3fc]/60 hover:text-[#dbeafe]"
              >
                {t('input.hardware.copyGpuDiagnostics')}
              </button>
              {gpuDiagnosticStatus !== 'idle' && (
                <span className={`text-[10px] ${gpuDiagnosticStatus === 'copied' ? 'text-[#7dd3fc]' : 'text-[#f0d48a]'}`}>
                  {gpuDiagnosticStatus === 'copied' ? t('input.hardware.gpuDiagnosticsCopied') : t('input.hardware.gpuDiagnosticsError')}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="micro-label mb-2">{t('input.hardware.preset')}</label>
            <select
              className="control-field"
              value={hardware.preset}
              onChange={handlePresetChange}
            >
              <option value="custom">{t('input.hardware.preset.custom')}</option>
              <option value="rtx3060">{t('input.hardware.preset.rtx3060')}</option>
              <option value="rtx4070tisuper">{t('input.hardware.preset.rtx4070')}</option>
              <option value="rtx4090">{t('input.hardware.preset.rtx4090')}</option>
              <option value="macmini_m4_16gb">{t('input.hardware.preset.macm4')}</option>
              <option value="m3max_64gb">{t('input.hardware.preset.macm3')}</option>
              <option value="no_gpu">{t('input.hardware.preset.nogpu')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="micro-label mb-2">{t('input.hardware.gpuMaker')}</label>
              <select
                className="control-field disabled:opacity-50"
                value={hardware.gpuMaker}
                onChange={(e) => setHardware({ ...hardware, gpuMaker: e.target.value as GPUMaker, preset: 'custom' })}
              >
                <option value="NVIDIA">NVIDIA</option>
                <option value="AMD">AMD</option>
                <option value="Apple">Apple Silicon</option>
                <option value="Intel">Intel</option>
                <option value="None">None (CPU)</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="micro-label mb-2">{t('input.hardware.vram')}</label>
              <input
                type="number"
                min="0"
                className="control-field"
                value={hardware.vramGB}
                onChange={(e) => setHardware({ ...hardware, vramGB: Number(e.target.value), preset: 'custom' })}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="micro-label mb-2">{t('input.hardware.ram')}</label>
              <input
                type="number"
                min="4"
                className="control-field"
                value={hardware.ramGB}
                onChange={(e) => setHardware({ ...hardware, ramGB: Number(e.target.value), preset: 'custom' })}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="micro-label mb-2">{t('input.hardware.price')}</label>
              <input
                type="number"
                min="0"
                step="100"
                className="control-field"
                value={hardware.devicePriceUsd}
                onChange={(e) => setHardware({ ...hardware, devicePriceUsd: Number(e.target.value), preset: 'custom' })}
              />
              <span className="mt-2 block text-[9px] uppercase tracking-[0.18em] text-[#7dd3fc]/80">{t('input.hardware.marketEst')}</span>
            </div>

            <div className="col-span-2">
              <label className="micro-label mb-2">{t('input.hardware.purchaseStatus')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-xs transition ${hardware.purchaseStatus === 'owned' ? 'border-[#7dd3fc] bg-[#7dd3fc]/15 text-[#eaf4ff]' : 'border-[#7dd3fc]/20 text-[#8ba7c7] hover:border-[#7dd3fc]/60'}`}
                  onClick={() => setHardware({ ...hardware, purchaseStatus: 'owned' })}
                >
                  {t('input.hardware.purchaseStatus.owned')}
                </button>
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-xs transition ${hardware.purchaseStatus === 'planned' ? 'border-[#7dd3fc] bg-[#7dd3fc]/15 text-[#eaf4ff]' : 'border-[#7dd3fc]/20 text-[#8ba7c7] hover:border-[#7dd3fc]/60'}`}
                  onClick={() => setHardware({ ...hardware, purchaseStatus: 'planned' })}
                >
                  {t('input.hardware.purchaseStatus.planned')}
                </button>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#8ba7c7]">{hardware.purchaseStatus === 'planned' ? t('input.hardware.purchaseStatus.plannedHelp') : t('input.hardware.purchaseStatus.ownedHelp')}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="usage" className="panel-card scroll-mt-8 flex flex-col gap-6">
        <h2 className="font-mono text-2xl font-medium tracking-normal text-[#dbeafe]">
          {t('input.usage.title')}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="micro-label mb-2">{t('input.usage.frequency')}</label>
            <select
              className="control-field"
              value={usage.frequency}
              onChange={(e) => setUsage({ ...usage, frequency: e.target.value as UsageFrequency })}
            >
              <option value="occasional">{t('input.usage.frequency.occasional')}</option>
              <option value="daily">{t('input.usage.frequency.daily')}</option>
              <option value="heavy">{t('input.usage.frequency.heavy')}</option>
              <option value="production">{t('input.usage.frequency.production')}</option>
            </select>
          </div>

          <div>
            <label className="micro-label mb-2">{t('input.usage.goal')}</label>
            <select
              className="control-field"
              value={usage.goal}
              onChange={(e) => setUsage({ ...usage, goal: e.target.value as UsageGoal })}
            >
              <option value="chat">{t('input.usage.goal.chat')}</option>
              <option value="coding">{t('input.usage.goal.coding')}</option>
              <option value="rag">{t('input.usage.goal.rag')}</option>
              <option value="agents">{t('input.usage.goal.agents')}</option>
              <option value="embedding">{t('input.usage.goal.embedding')}</option>
            </select>
          </div>

          <div>
            <label className="mb-2 flex justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8ba7c7]">
              <span>{t('input.usage.hours')}</span>
              <span className="font-mono font-normal text-[#7dd3fc]">{usage.hoursPerDay} hrs</span>
            </label>
            <input
              type="range"
              min="0.5"
              step="0.5"
              max="24"
              className="h-1.5 w-full appearance-none rounded-full bg-[#7dd3fc]/15 accent-[#7dd3fc] outline-none"
              value={usage.hoursPerDay}
              onChange={(e) => setUsage({ ...usage, hoursPerDay: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="micro-label mb-2">{t('input.usage.currency')}</label>
            <select
              className="control-field"
              value={usage.currencyCode}
              onChange={(e) => {
                const selected = CURRENCY_OPTIONS.find((currency) => currency.currencyCode === e.target.value);
                if (!selected) return;
                setUsage({
                  ...usage,
                  currencyCode: selected.currencyCode,
                  currencySymbol: selected.currencySymbol,
                  exchangeRateFromUsd: selected.exchangeRateFromUsd,
                });
              }}
            >
              {CURRENCY_OPTIONS.map((currency) => (
                <option key={currency.currencyCode} value={currency.currencyCode}>
                  {currency.currencyCode} ({currency.currencySymbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="micro-label mb-2">{t('input.usage.electricity')}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="control-field"
              value={usage.electricityCostPerKwh}
              onChange={(e) => {
                setElectricityDetectionStatus('idle');
                setUsage({ ...usage, electricityCostPerKwh: Number(e.target.value) });
              }}
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={detectElectricityCost}
                disabled={isDetectingElectricity}
                className="text-[10px] uppercase tracking-[0.18em] text-[#7dd3fc] hover:text-[#eaf4ff] disabled:cursor-wait disabled:opacity-60"
              >
                {isDetectingElectricity ? t('input.usage.electricity.detecting') : t('input.usage.electricity.detect')}
              </button>
              {electricityDetectionStatus !== 'idle' && (
                <span className={`text-[10px] ${electricityDetectionStatus === 'success' ? 'text-[#7dd3fc]' : 'text-[#f0d48a]'}`}>
                  {electricityDetectionStatus === 'success' ? t('input.usage.electricity.detected') : t('input.usage.electricity.unavailable')}
                </span>
              )}
            </div>
          </div>


          <div className="rounded-[18px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="micro-label">{t('input.usage.advancedOptions')}</p>
                <p className="mt-2 text-xs leading-5 text-[#8ba7c7]">{t('input.usage.advancedOptionsHelp')}</p>
              </div>
              <button type="button" className="pill-button inline-flex shrink-0 items-center gap-2" onClick={() => setIsAdvancedOpen((value) => !value)}>
                <SlidersHorizontal className="h-4 w-4" />
                {isAdvancedOpen ? t('input.usage.advancedOptionsHide') : t('input.usage.advancedOptionsShow')}
              </button>
            </div>

            {isAdvancedOpen && (
              <div className="mt-4 grid grid-cols-1 gap-4">
                <div className="rounded-[16px] border border-[#7dd3fc]/10 bg-[#07111f]/60 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="micro-label">{t('input.usage.advancedModels')}</p>
                      <p className="mt-2 text-xs leading-5 text-[#8ba7c7]">
                        {activeModelMix.length > 0 ? t('input.usage.advancedModelsActive') : t('input.usage.advancedModelsHelp')}
                      </p>
                    </div>
                    <button type="button" className="pill-button shrink-0" onClick={() => setIsModelMixOpen(true)}>
                      {activeModelMix.length > 0 ? t('input.usage.advancedModelsEdit') : t('input.usage.advancedModelsOpen')}
                    </button>
                  </div>
                </div>
                <ApiUsageImportPanel hardware={hardware} usage={usage} />
              </div>
            )}
          </div>
        </div>
      </section>

      {isModelMixOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02060d]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="model-mix-modal-title">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[22px] border border-[#7dd3fc]/20 bg-[#07111f] p-5 shadow-2xl shadow-black/50 md:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-[#7dd3fc]/10 pb-5">
              <div>
                <p className="micro-label">{t('input.usage.advancedModels')}</p>
                <h3 id="model-mix-modal-title" className="mt-2 font-mono text-2xl font-medium tracking-normal text-[#dbeafe]">{t('input.usage.advancedModelsTitle')}</h3>
                <p className="mt-3 text-sm leading-6 text-[#8ba7c7]">{t('input.usage.advancedModelsHelp')}</p>
              </div>
              <button type="button" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#7dd3fc]/20 text-[#eaf4ff] transition hover:border-[#7dd3fc]/60 hover:bg-[#7dd3fc]/10" onClick={() => setIsModelMixOpen(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {activeModelMix.map((item) => (
                <div key={item.id} className="rounded-[16px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.05fr_0.95fr_0.85fr_0.9fr_0.75fr_auto] xl:items-end">
                    <div>
                      <label className="micro-label mb-2">{t('input.usage.advancedModels.model')}</label>
                      <select className="control-field" value={item.modelId} onChange={(event) => updateModelMixItem(item.id, { modelId: event.target.value as CloudModelId })}>
                        {Object.entries(CLOUD_MODEL_PROFILES).map(([id, profile]) => (
                          <option key={id} value={id}>{profile.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="micro-label mb-2">{t('input.usage.goal')}</label>
                      <select className="control-field" value={item.goal} onChange={(event) => updateModelMixItem(item.id, { goal: event.target.value as UsageGoal })}>
                        <option value="chat">{t('input.usage.goal.chat')}</option>
                        <option value="coding">{t('input.usage.goal.coding')}</option>
                        <option value="rag">{t('input.usage.goal.rag')}</option>
                        <option value="agents">{t('input.usage.goal.agents')}</option>
                        <option value="embedding">{t('input.usage.goal.embedding')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="micro-label mb-2">{t('input.usage.advancedModels.billing')}</label>
                      <select className="control-field" value={item.billingMode} onChange={(event) => updateModelMixItem(item.id, { billingMode: event.target.value as UsageModelSelection['billingMode'] })}>
                        <option value="usage">{t('input.usage.advancedModels.billing.usage')}</option>
                        <option value="plan">{t('input.usage.advancedModels.billing.plan')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="micro-label mb-2">{t('input.usage.advancedModels.plan')}</label>
                      <select
                        className="control-field disabled:opacity-50"
                        value={item.planId}
                        disabled={item.billingMode !== 'plan'}
                        onChange={(event) => {
                          const planId = event.target.value as CloudPlanId;
                          updateModelMixItem(item.id, { planId, monthlyPlanUsd: CLOUD_PLAN_PROFILES[planId].monthlyUsd });
                        }}
                      >
                        {Object.entries(CLOUD_PLAN_PROFILES).map(([id, plan]) => (
                          <option key={id} value={id}>{plan.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="micro-label mb-2">{item.billingMode === 'plan' ? t('input.usage.advancedModels.planCost') : t('input.usage.advancedModels.hours')}</label>
                      <input
                        className="control-field"
                        type="number"
                        min="0"
                        max={item.billingMode === 'plan' ? undefined : 24}
                        step={item.billingMode === 'plan' ? 1 : 0.5}
                        value={item.billingMode === 'plan' ? item.monthlyPlanUsd : item.hoursPerDay}
                        onChange={(event) => updateModelMixItem(item.id, item.billingMode === 'plan' ? { monthlyPlanUsd: Number(event.target.value) } : { hoursPerDay: Number(event.target.value) })}
                      />
                    </div>
                    <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f3a6a6]/30 text-[#f3a6a6] transition hover:bg-[#f3a6a6]/10" onClick={() => removeModelMixItem(item.id)} aria-label={t('input.usage.advancedModels.remove')}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {activeModelMix.length === 0 && (
                <div className="rounded-[16px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 p-5 text-sm leading-6 text-[#8ba7c7]">
                  {t('input.usage.advancedModelsEmpty')}
                </div>
              )}

              <button type="button" className="pill-button inline-flex items-center gap-2" onClick={addModelMixItem}>
                <Plus className="h-4 w-4" />
                {t('input.usage.advancedModelsAdd')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
