import React from 'react';
import { HardwareProfile, UsageProfile, GPUMaker, OS, UsageGoal, UsageFrequency } from '../lib/types';
import { HARDWARE_PRESETS } from '../lib/calculator';
import { useLanguage } from '../lib/i18n';

interface Props {
  hardware: HardwareProfile;
  setHardware: (h: HardwareProfile) => void;
  usage: UsageProfile;
  setUsage: (u: UsageProfile) => void;
}

export function InputForms({ hardware, setHardware, usage, setUsage }: Props) {
  const { t } = useLanguage();
  const [isDetectingElectricity, setIsDetectingElectricity] = React.useState(false);
  const [electricityDetectionStatus, setElectricityDetectionStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const detectElectricityCost = async () => {
    const costsByCountry: Record<string, number> = {
      US: 0.16, GB: 0.40, DE: 0.40, FR: 0.28, ES: 0.25, IT: 0.35,
      MX: 0.08, AR: 0.05, CO: 0.15, CL: 0.18, PE: 0.18, BR: 0.17,
      UY: 0.22, CR: 0.15, DO: 0.20, PA: 0.18, SV: 0.18, EC: 0.10,
    };

    setIsDetectingElectricity(true);
    setElectricityDetectionStatus('idle');

    try {
      const response = await fetch('https://get.geojs.io/v1/ip/country.json');
      const data = await response.json();
      const countryCost = costsByCountry[data.country];

      if (!countryCost) {
        setElectricityDetectionStatus('error');
        return;
      }

      setUsage({ ...usage, electricityCostPerKwh: countryCost });
      setElectricityDetectionStatus('success');
    } catch {
      setElectricityDetectionStatus('error');
    } finally {
      setIsDetectingElectricity(false);
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
      {/* Hardware Section */}
      <section className="panel-card flex flex-col gap-6">
        <h2 className="font-mono text-2xl font-medium tracking-normal text-[#f3f8ef]">
          {t('input.hardware.title')}
        </h2>
        
        <div className="space-y-4">
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
              <span className="mt-2 block text-[9px] uppercase tracking-[0.18em] text-[#dfeadd]/80">{t('input.hardware.marketEst')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Usage Section */}
      <section className="panel-card flex flex-col gap-6">
        <h2 className="font-mono text-2xl font-medium tracking-normal text-[#f3f8ef]">
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
            <label className="mb-2 flex justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-[#aab6a8]">
              <span>{t('input.usage.hours')}</span>
              <span className="font-mono font-normal text-[#dfeadd]">{usage.hoursPerDay} hrs</span>
            </label>
            <input 
              type="range"
              min="0.5"
              step="0.5"
              max="24"
              className="h-1.5 w-full appearance-none rounded-full bg-[#dfeadd]/15 accent-[#dfeadd] outline-none"
              value={usage.hoursPerDay}
              onChange={(e) => setUsage({ ...usage, hoursPerDay: Number(e.target.value) })}
            />
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
                className="text-[10px] uppercase tracking-[0.18em] text-[#dfeadd] hover:text-white disabled:cursor-wait disabled:opacity-60"
              >
                {isDetectingElectricity ? t('input.usage.electricity.detecting') : t('input.usage.electricity.detect')}
              </button>
              {electricityDetectionStatus !== 'idle' && (
                <span className={`text-[10px] ${electricityDetectionStatus === 'success' ? 'text-[#dfeadd]' : 'text-[#f0d48a]'}`}>
                  {electricityDetectionStatus === 'success' ? t('input.usage.electricity.detected') : t('input.usage.electricity.unavailable')}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <label className="flex cursor-pointer items-center gap-3">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={usage.needsPrivacy}
                  onChange={(e) => setUsage({ ...usage, needsPrivacy: e.target.checked })}
                />
                <div className="peer h-5 w-9 rounded-full bg-[#dfeadd]/20 peer-focus:outline-none peer-checked:bg-[#dfeadd] after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-[#dfeadd]/50 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </div>
              <span className="text-xs text-[#c9d4c7]">{t('input.usage.privacy')}</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={usage.offlineRequired}
                  onChange={(e) => setUsage({ ...usage, offlineRequired: e.target.checked })}
                />
                <div className="peer h-5 w-9 rounded-full bg-[#dfeadd]/20 peer-focus:outline-none peer-checked:bg-[#dfeadd] after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-[#dfeadd]/50 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </div>
              <span className="text-xs text-[#c9d4c7]">{t('input.usage.offline')}</span>
            </label>
          </div>

        </div>
      </section>
    </div>
  );
}
