import { Cpu, HelpCircle } from 'lucide-react';

export default function Header() {
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
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-white transition-colors flex items-center gap-1">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Cómo funciona</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
