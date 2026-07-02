import { BrainCircuit, Globe, Sparkles } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

type View = 'dashboard' | 'compare' | 'about';

interface Props {
  activeView: View;
  onNavigate: (view: View, targetId?: string) => void;
}

export default function Header({ activeView, onNavigate }: Props) {
  const { t, lang, setLang } = useLanguage();
  const navClass = (view: View) => `transition ${activeView === view ? 'text-[#7dd3fc]' : 'hover:text-[#7dd3fc]'}`;

  return (
    <header className="px-5 py-5 md:px-10 md:py-7">
      <div className="flex items-center justify-between pb-5 md:border-b md:border-[#7dd3fc]/10 md:pb-7">
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="group relative flex h-11 w-14 items-center justify-center rounded-[8px] border border-[#7dd3fc]/40 bg-[#06111f] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(14,165,233,0.12)] transition hover:border-[#7dd3fc]/80 hover:bg-[#071a2c]"
            title={t('header.dashboard')}
          >
            <span className="absolute inset-1 rounded-[6px] border border-[#7dd3fc]/10" />
            <BrainCircuit className="relative h-5 w-5 text-[#dbeafe] transition group-hover:text-[#7dd3fc]" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#7dd3fc] text-[#06111f] shadow-lg shadow-[#7dd3fc]/20">
              <Sparkles className="h-3 w-3" />
            </span>
          </button>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#eaf4ff] md:flex">
            <button type="button" onClick={() => onNavigate('dashboard')} className={navClass('dashboard')}>{t('header.dashboard')}</button>
            <button type="button" onClick={() => onNavigate('compare')} className={navClass('compare')}>{t('header.compare')}</button>
            <button type="button" onClick={() => onNavigate('about')} className={navClass('about')}>{t('header.about')}</button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            className="pill-button flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            <span>{lang === 'es' ? 'ES' : 'EN'}</span>
          </button>
        </div>
      </div>
      <nav className="flex gap-3 overflow-x-auto border-b border-[#7dd3fc]/10 pb-5 text-xs font-medium text-[#eaf4ff] md:hidden">
        <button type="button" onClick={() => onNavigate('dashboard')} className={`${navClass('dashboard')} whitespace-nowrap`}>{t('header.dashboard')}</button>
        <button type="button" onClick={() => onNavigate('compare')} className={`${navClass('compare')} whitespace-nowrap`}>{t('header.compare')}</button>
        <button type="button" onClick={() => onNavigate('about')} className={`${navClass('about')} whitespace-nowrap`}>{t('header.about')}</button>
      </nav>
    </header>
  );
}
