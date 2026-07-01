import { Cpu, HelpCircle, Share2, Check, Globe } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface Props {
  onShare?: () => void;
  shared?: boolean;
}

export default function Header({ onShare, shared }: Props) {
  const { t, lang, setLang } = useLanguage();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Cpu className="w-5 h-5 text-slate-950" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Do I Need Local <span className="text-emerald-500">AI</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-400">
            <button 
              onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
              className="hover:text-white transition-colors flex items-center gap-1 uppercase"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'es' ? 'EN' : 'ES'}</span>
            </button>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t('header.howItWorks')}</span>
            </a>
          </nav>
          {onShare && (
            <button
              onClick={onShare}
              title={shared ? t('header.copied') : t('header.share')}
              className="bg-slate-800 p-2 rounded-md border border-slate-700 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
            >
              {shared ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
