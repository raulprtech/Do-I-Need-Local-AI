import { Cpu, HelpCircle, Share2, Check, Globe } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface Props {
  onShare?: () => void;
  shared?: boolean;
}

export default function Header({ onShare, shared }: Props) {
  const { t, lang, setLang } = useLanguage();

  return (
    <header className="px-5 py-5 md:px-10 md:py-7">
      <div className="flex items-center justify-between border-b border-[#7dd3fc]/10 pb-7">
        <div className="flex items-center gap-8">
          <div className="relative flex h-10 w-12 items-center justify-center rounded-[14px] border border-[#7dd3fc]/80">
            <Cpu className="h-5 w-5 text-[#eaf4ff]" />
            <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-[#7dd3fc]" />
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#eaf4ff] md:flex">
            <a href="#" className="transition hover:text-[#7dd3fc]">Dashboard</a>
            <a href="#" className="transition hover:text-[#7dd3fc]">Hardware</a>
            <a href="#" className="transition hover:text-[#7dd3fc]">Usage</a>
            <a href="#" className="transition hover:text-[#7dd3fc]">{t('header.howItWorks')}</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            className="pill-button flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            <span>{lang === 'es' ? 'EN' : 'ES'}</span>
          </button>
          <a href="#" className="hidden rounded-full p-2 text-[#eaf4ff] transition hover:bg-[#7dd3fc]/10 sm:block" title={t('header.howItWorks')}>
            <HelpCircle className="h-5 w-5" />
          </a>
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
    </header>
  );
}
