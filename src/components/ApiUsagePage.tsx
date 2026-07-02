import { useMemo, useState } from 'react';
import { BarChart3, FileUp, RotateCcw, X } from 'lucide-react';
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
  if (groups.length === 0) return null;

  return (
    <div className="rounded-[16px] border border-[#7dd3fc]/10 bg-[#07111f]/50 p-4">
      <h4 className="mb-3 font-mono text-lg font-medium tracking-normal text-[#dbeafe]">{title}</h4>
      <div className="space-y-3">
        {groups.slice(0, 4).map((group) => (
          <div key={group.key} className="rounded-[14px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-sm font-medium text-[#eaf4ff]">{group.key}</span>
              <span className="shrink-0 font-mono text-xs text-[#7dd3fc]">{formatMoney(group.costUsd, usage)}</span>
            </div>
            <div className="mt-2 text-[10px] leading-4 text-[#8ba7c7]">
              {formatNumber(group.totalTokens)} tokens - {formatNumber(group.requests)} requests
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ApiUsageImportPanel({ hardware, usage }: Props) {
  const { t } = useLanguage();
  const [rawInput, setRawInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  const hasRecords = summary.records.length > 0;
  const paybackMonths = hardware.purchaseStatus === 'planned' && summary.estimatedMonthlySavingsUsd > 0
    ? hardware.devicePriceUsd / summary.estimatedMonthlySavingsUsd
    : null;
  const localizablePercent = Math.round(summary.localizableShare * 100);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setRawInput(await file.text());
    setIsModalOpen(true);
  };

  return (
    <div className="rounded-[18px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="micro-label">{t('apiUsage.eyebrow')}</p>
          <h3 className="mt-2 font-mono text-xl font-medium tracking-normal text-[#dbeafe]">{t('apiUsage.title')}</h3>
          <p className="mt-2 text-xs leading-5 text-[#8ba7c7]">
            {hasRecords ? t('apiUsage.diagnosisReady') : t('apiUsage.diagnosisEmpty')}
          </p>
        </div>
        <button
          type="button"
          className="pill-button inline-flex shrink-0 items-center gap-2 self-start"
          onClick={() => setIsModalOpen(true)}
        >
          <FileUp className="h-4 w-4" />
          {hasRecords ? t('apiUsage.edit') : t('apiUsage.open')}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[14px] border border-[#7dd3fc]/10 bg-[#07111f]/60 p-3">
          <span className="micro-label">{t('apiUsage.monthlySpend')}</span>
          <span className="mt-2 block font-mono text-2xl text-[#eaf4ff]">{hasRecords ? formatMoney(summary.totalCostUsd, usage) : '-'}</span>
        </div>
        <div className="rounded-[14px] border border-[#7dd3fc]/10 bg-[#07111f]/60 p-3">
          <span className="micro-label">{t('apiUsage.localizable')}</span>
          <span className="mt-2 block font-mono text-2xl text-[#7dd3fc]">{hasRecords ? `${localizablePercent}%` : '-'}</span>
        </div>
        <div className="rounded-[14px] border border-[#7dd3fc]/10 bg-[#07111f]/60 p-3">
          <span className="micro-label">{t('apiUsage.savings')}</span>
          <span className="mt-2 block font-mono text-2xl text-[#dbeafe]">{hasRecords ? formatMoney(summary.estimatedMonthlySavingsUsd, usage) : '-'}</span>
          {hasRecords && (
            <span className="mt-1 block text-[10px] leading-4 text-[#8ba7c7]">
              {paybackMonths ? `${Math.ceil(paybackMonths)} ${t('results.economics.months')}` : hardware.purchaseStatus === 'owned' ? t('apiUsage.ownedHardware') : t('apiUsage.noPayback')}
            </span>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02060d]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="api-usage-modal-title">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[22px] border border-[#7dd3fc]/20 bg-[#07111f] p-5 shadow-2xl shadow-black/50 md:p-6">
            <div className="flex flex-col gap-4 border-b border-[#7dd3fc]/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="micro-label">{t('apiUsage.eyebrow')}</p>
                <h3 id="api-usage-modal-title" className="mt-2 font-mono text-2xl font-medium tracking-normal text-[#dbeafe]">{t('apiUsage.title')}</h3>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#8ba7c7]">{t('apiUsage.description')}</p>
              </div>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#7dd3fc]/20 text-[#eaf4ff] transition hover:border-[#7dd3fc]/60 hover:bg-[#7dd3fc]/10"
                onClick={() => setIsModalOpen(false)}
                aria-label={t('apiUsage.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
              <div className="flex flex-col gap-4">
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
                  className="min-h-[330px] w-full resize-y rounded-[16px] border border-[#7dd3fc]/20 bg-black/25 p-4 font-mono text-xs leading-5 text-[#eaf4ff] outline-none transition focus:border-[#7dd3fc]/70"
                  value={rawInput}
                  onChange={(event) => setRawInput(event.target.value)}
                  spellCheck={false}
                />
                <p className="text-xs leading-5 text-[#8ba7c7]">{t('apiUsage.formatHelp')}</p>
                {error && <p className="rounded-[14px] border border-[#f3a6a6]/30 bg-[#f3a6a6]/10 px-4 py-2 text-xs text-[#ffd6d6]">{error}</p>}
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-[16px] border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 p-4">
                  <div className="flex items-start gap-3">
                    <span className="rounded-full border border-[#7dd3fc]/40 p-2 text-[#7dd3fc]"><BarChart3 className="h-4 w-4" /></span>
                    <div>
                      <h4 className="font-mono text-lg font-medium tracking-normal text-[#dbeafe]">{t('apiUsage.diagnosisTitle')}</h4>
                      <p className="mt-2 text-xs leading-5 text-[#8ba7c7]">
                        {hasRecords ? t('apiUsage.diagnosisReady') : t('apiUsage.diagnosisEmpty')}
                      </p>
                      {hasRecords && (
                        <p className="mt-2 text-[10px] leading-4 text-[#8ba7c7]">
                          {formatNumber(summary.totalTokens)} tokens - {formatNumber(summary.totalRequests)} requests - {summary.records.length} rows
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {hasRecords && (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <GroupList title={t('apiUsage.byProvider')} groups={summary.byProvider} usage={usage} />
                    <GroupList title={t('apiUsage.byModel')} groups={summary.byModel} usage={usage} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
