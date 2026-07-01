import { Cpu, HelpCircle, Share2, Check, Globe } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

type View = 'dashboard' | 'why' | 'how';

interface Props {
  onShare?: () => void;
  shared?: boolean;
  activeView: View;
  onNavigate: (view: View, targetId?: string) => void;
}

export default function Header({ onShare, shared, activeView, onNavigate }: Props) {
  const { t, lang, setLang } = useLanguage();
  const navClass = (view: View) => `transition ${activeView === view ? 'text-[#7dd3fc]' : 'hover:text-[#7dd3fc]'}`;

  return (
    <header className="px-5 py-5 md:px-10 md:py-7">
      <div className="flex items-center justify-between pb-5 md:border-b md:border-[#7dd3fc]/10 md:pb-7">
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="relative flex h-10 w-12 items-center justify-center rounded-[14px] border border-[#7dd3fc]/80"
            title="Dashboard"
          >
            <Cpu className="h-5 w-5 text-[#eaf4ff]" />
            <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-[#7dd3fc]" />
          </button>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#eaf4ff] md:flex">
            <button type="button" onClick={() => onNavigate('dashboard')} className={navClass('dashboard')}>Dashboard</button>
            <button type="button" onClick={() => onNavigate('why')} className={navClass('why')}>Why</button>
            <button type="button" onClick={() => onNavigate('how')} className={navClass('how')}>{t('header.howItWorks')}</button>
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
          <button type="button" onClick={() => onNavigate('how')} className="hidden rounded-full p-2 text-[#eaf4ff] transition hover:bg-[#7dd3fc]/10 sm:block" title={t('header.howItWorks')}>
            <HelpCircle className="h-5 w-5" />
          </button>
          {onShare && (
            <button
              onClick={onShare}
              title={shared ? t('header.copied') : t('header.share')}
              className="rounded-full bg-[#7dd3fc] p-2.5 text-[#06111f] transition hover:bg-[#eaf4ff]"
            >
              {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
      <nav className="flex gap-3 overflow-x-auto border-b border-[#7dd3fc]/10 pb-5 text-xs font-medium text-[#eaf4ff] md:hidden">
        <button type="button" onClick={() => onNavigate('dashboard')} className={`${navClass('dashboard')} whitespace-nowrap`}>Dashboard</button>
        <button type="button" onClick={() => onNavigate('why')} className={`${navClass('why')} whitespace-nowrap`}>Why</button>
        <button type="button" onClick={() => onNavigate('how')} className={`${navClass('how')} whitespace-nowrap`}>{t('header.howItWorks')}</button>
      </nav>
    </header>
  );
}
