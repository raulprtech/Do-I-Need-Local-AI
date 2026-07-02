import React from 'react';
import { HardwareProfile, UsageProfile, GPUMaker, UsageGoal, UsageFrequency } from '../lib/types';
import { HARDWARE_PRESETS } from '../lib/calculator';
import { detectHardwareProfile } from '../lib/hardwareDetection';
import { CURRENCY_OPTIONS, detectCountryDefaults } from '../lib/locale';
import { useLanguage } from '../lib/i18n';
import { ApiUsageImportPanel } from './ApiUsagePage';

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

          <ApiUsageImportPanel hardware={hardware} usage={usage} />
        </div>
      </section>
    </div>
  );
}
