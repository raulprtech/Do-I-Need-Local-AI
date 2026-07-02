import { useMemo, useState } from 'react';
import { BarChart3, FileUp, RotateCcw, ShieldCheck } from 'lucide-react';
import { parseApiUsage, summarizeApiUsage, type ApiUsageGroup } from '../lib/apiUsageImport';
import { HardwareProfile, UsageProfile } from '../lib/types';
import { useLanguage } from '../lib/i18n';

interface Props {
  hardware: HardwareProfile;
  usage: UsageProfile;
}

const SAMPLE_CSV = `provider,model,input_tokens,output_tokens,cost_usd,requests
OpenAI,gpt-4o-mini,2400000,900000,2.34,1800
Anthropic,claude-sonnet,1200000,520000,11.40,320
Google,gemini-flash,4200000,1100000,3.98,2100
DeepSeek,deepseek-chat,1800000,700000,1.26,900`;

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatMoney(usd: number, usage: UsageProfile, digits = 2) {
  const value = usd * (usage.exchangeRateFromUsd || 1);
  const suffix = usage.currencySymbol.trim() === usage.currencyCode ? '' : ` ${usage.currencyCode}`;
  return `${usage.currencySymbol}${value.toLocaleString(undefined, { maximumFractionDigits: digits })}${suffix}`;
}

function GroupList({ title, groups, usage }: { title: string; groups: ApiUsageGroup[]; usage: UsageProfile }) {
  return (
    <div className="panel-card">
      <h3 className="mb-4 font-mono text-2xl font-medium tracking-normal text-[#dbeafe]">{title}</h3>
      <div className="space-y-3">
        {groups.slice(0, 6).map((group) => (
          <div key={group.key} className="rounded-[14px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-[#eaf4ff]">{group.key}</span>
              <span className="font-mono text-sm text-[#7dd3fc]">{formatMoney(group.costUsd, usage)}</span>
            </div>
            <div className="mt-2 text-[11px] leading-5 text-[#8ba7c7]">
              {formatNumber(group.totalTokens)} tokens - {formatNumber(group.requests)} requests
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ApiUsagePage({ hardware, usage }: Props) {
  const { t } = useLanguage();
  const [rawInput, setRawInput] = useState(SAMPLE_CSV);

  const parsed = useMemo(() => {
    try {
      return { summary: summarizeApiUsage(parseApiUsage(rawInput)), error: null as string | null };
    } catch (err) {
      return {
        summary: summarizeApiUsage([]),
        error: err instanceof Error ? err.message : 'Invalid input',
      };
    }
  }, [rawInput]);

  const { summary, error } = parsed;

  const paybackMonths = hardware.purchaseStatus === 'planned' && summary.estimatedMonthlySavingsUsd > 0
    ? hardware.devicePriceUsd / summary.estimatedMonthlySavingsUsd
    : null;
  const localizablePercent = Math.round(summary.localizableShare * 100);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setRawInput(await file.text());
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="panel-card">
        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[#8ba7c7]">{t('apiUsage.eyebrow')}</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-mono text-4xl font-medium tracking-normal text-[#dbeafe] md:text-5xl">{t('apiUsage.title')}</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#8ba7c7]">{t('apiUsage.description')}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#7dd3fc]/30 bg-[#7dd3fc]/10 px-4 py-2 text-xs text-[#b7cbe2]">
            <ShieldCheck className="h-4 w-4 text-[#7dd3fc]" />
            {t('apiUsage.localOnly')}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
        <div className="panel-card flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="micro-label">CSV / JSON</label>
            <div className="flex gap-2">
              <label className="pill-button inline-flex cursor-pointer items-center gap-2">
                <FileUp className="h-4 w-4" />
                {t('apiUsage.upload')}
                <input className="hidden" type="file" accept=".csv,.json,text/csv,application/json" onChange={(event) => handleFile(event.target.files?.[0])} />
              </label>
              <button type="button" className="pill-button inline-flex items-center gap-2" onClick={() => setRawInput(SAMPLE_CSV)}>
                <RotateCcw className="h-4 w-4" />
                {t('apiUsage.sample')}
              </button>
            </div>
          </div>
          <textarea
            className="min-h-[360px] w-full resize-y rounded-[18px] border border-[#7dd3fc]/20 bg-black/25 p-4 font-mono text-xs leading-5 text-[#eaf4ff] outline-none transition focus:border-[#7dd3fc]/70"
            value={rawInput}
            onChange={(event) => setRawInput(event.target.value)}
            spellCheck={false}
          />
          <p className="text-xs leading-5 text-[#8ba7c7]">{t('apiUsage.formatHelp')}</p>
          {error && <p className="rounded-full border border-[#f3a6a6]/30 bg-[#f3a6a6]/10 px-4 py-2 text-xs text-[#ffd6d6]">{error}</p>}
        </div>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="panel-card-muted">
              <span className="block text-[10px] uppercase tracking-[0.18em] text-[#405a78]">{t('apiUsage.monthlySpend')}</span>
              <span className="mt-3 block font-mono text-4xl">{formatMoney(summary.totalCostUsd, usage)}</span>
            </div>
            <div className="panel-card">
              <span className="micro-label">{t('apiUsage.localizable')}</span>
              <span className="mt-3 block font-mono text-4xl text-[#7dd3fc]">{localizablePercent}%</span>
              <span className="mt-2 block text-xs text-[#8ba7c7]">{formatMoney(summary.localizableCostUsd, usage)} / month</span>
            </div>
            <div className="panel-card">
              <span className="micro-label">{t('apiUsage.savings')}</span>
              <span className="mt-3 block font-mono text-4xl text-[#dbeafe]">{formatMoney(summary.estimatedMonthlySavingsUsd, usage)}</span>
              <span className="mt-2 block text-xs text-[#8ba7c7]">
                {paybackMonths ? `${Math.ceil(paybackMonths)} ${t('results.economics.months')}` : hardware.purchaseStatus === 'owned' ? t('apiUsage.ownedHardware') : t('apiUsage.noPayback')}
              </span>
            </div>
          </div>

          <div className="panel-card flex items-start gap-4">
            <span className="rounded-full border border-[#7dd3fc]/40 p-3 text-[#7dd3fc]"><BarChart3 className="h-5 w-5" /></span>
            <div>
              <h3 className="font-mono text-2xl font-medium tracking-normal text-[#dbeafe]">{t('apiUsage.diagnosisTitle')}</h3>
              <p className="mt-3 text-sm leading-6 text-[#8ba7c7]">
                {summary.records.length > 0
                  ? t('apiUsage.diagnosisReady')
                  : t('apiUsage.diagnosisEmpty')}
              </p>
              <p className="mt-3 text-xs leading-5 text-[#8ba7c7]">
                {formatNumber(summary.totalTokens)} tokens - {formatNumber(summary.totalRequests)} requests - {summary.records.length} rows
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <GroupList title={t('apiUsage.byProvider')} groups={summary.byProvider} usage={usage} />
            <GroupList title={t('apiUsage.byModel')} groups={summary.byModel} usage={usage} />
          </div>
        </div>
      </section>
    </div>
  );
}
