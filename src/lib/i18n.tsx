import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'es' | 'en';

const translations: Record<Language, Record<string, string>> = {
  es: {
    'app.title': '¿Me conviene correr IA local?',
    'app.subtitle': 'Descubre si tu equipo actual es capaz de ejecutar modelos de lenguaje (LLMs) localmente, qué rendimiento esperar y si financieramente tiene sentido comparado con pagar APIs como OpenAI o Anthropic.',
    'header.howItWorks': 'Cómo funciona',
    'header.share': 'Compartir',
    'header.copied': 'Copiado',
    'input.hardware.title': 'Perfil de Hardware',
    'input.hardware.preset': 'Plantilla Rápida',
    'input.hardware.preset.custom': 'Personalizado...',
    'input.hardware.preset.rtx3060': 'PC Gamer (RTX 3060 12GB)',
    'input.hardware.preset.rtx4070': 'PC Entusiasta (RTX 4070 Ti Super 16GB)',
    'input.hardware.preset.rtx4090': 'Workstation (RTX 4090 24GB)',
    'input.hardware.preset.macm4': 'Mac mini M4 (16GB RAM)',
    'input.hardware.preset.macm3': 'MacBook Pro M3 Max (64GB RAM)',
    'input.hardware.preset.nogpu': 'Laptop / PC sin GPU dedicada',
    'input.hardware.os': 'Sistema Operativo',
    'input.hardware.gpuMaker': 'Fabricante de GPU',
    'input.hardware.vram': 'VRAM (GB) - Memoria de Video',
    'input.hardware.ram': 'RAM del Sistema (GB)',
    'input.hardware.price': 'Costo del Equipo (USD)',
    'input.hardware.marketEst': 'Est. Mercado Actual',
    'input.usage.title': 'Perfil de Uso',
    'input.usage.goal': 'Principal Caso de Uso',
    'input.usage.goal.chat': 'Chat General / Asistente',
    'input.usage.goal.coding': 'Programación / Autocompletado',
    'input.usage.goal.rag': 'Análisis de Documentos (RAG)',
    'input.usage.frequency': 'Frecuencia de Uso',
    'input.usage.frequency.occasional': 'Ocasional (1-2 veces por semana)',
    'input.usage.frequency.daily': 'Diario Moderado',
    'input.usage.frequency.heavy': 'Uso Intensivo',
    'input.usage.frequency.production': 'Producción / API / Agentes',
    'input.usage.hours': 'Horas Activas al Día',
    'input.usage.electricity': 'Costo Eléctrico (USD/kWh)',
    'input.usage.privacy': 'Privacidad Estricta (Datos sensibles)',
    'input.usage.offline': 'Uso 100% Offline Requerido',
    
    // Results
    'results.verdict.title': 'Veredicto: ',
    'results.verdict.local': 'Local te conviene',
    'results.verdict.api': 'Pagar API sigue siendo más barato',
    'results.economics.title': 'Proyección a 12 Meses (Costo Total)',
    'results.economics.apiCost': 'Costo API (Nube)',
    'results.economics.localCost': 'Costo Local (Hardware + Luz)',
    'results.economics.breakeven': 'Punto de equilibrio',
    'results.economics.months': 'Meses',
    'results.models.title': 'Modelos Compatibles',
    'results.models.canRun': 'Correr',
    'results.models.cannotRun': 'Memoria Insuficiente',
    'results.models.speed.fast': 'Rápido',
    'results.models.speed.acceptable': 'Aceptable',
    'results.models.speed.slow': 'Lento',
    'results.models.speed.unusable': 'Inutilizable',
    'results.software.title': 'Software Recomendado para tu Sistema',
    'results.software.download': 'Descargar',
    
    // Calculator messages
    'calc.models.phi3': 'Ideal para hardware modesto. Rápido y eficiente.',
    'calc.models.llama3_8b.gpu': 'Corre 100% en GPU, muy rápido.',
    'calc.models.llama3_8b.cpu': 'Correrá usando RAM (CPU), será más lento.',
    'calc.models.gemma2': 'Gran calidad, requiere ligeramente más VRAM que Llama 3.',
    'calc.models.deepseek_r1': 'Excelente para razonamiento lógico y código.',
    'calc.models.qwen.gpu': 'Excelente rendimiento en GPU.',
    'calc.models.qwen.cpu': 'Requiere offload parcial a RAM.',
    'calc.models.llama3_70b.gpu': 'Corre completo en VRAM.',
    'calc.models.llama3_70b.cpu': 'Correrá pero muy lento y con contexto limitado.',
    'calc.verdict.mandatory': 'Debido a la necesidad estricta de privacidad u offline, la vía local es mandatoria, independientemente del costo.',
    'calc.verdict.local_hours': 'Local te conviene porque el gasto en API supera la amortización del hardware.',
    'calc.verdict.local_breakeven': 'Con este perfil de uso, recuperarás la inversión en hardware en ',
    'calc.verdict.local_breakeven_months': ' meses. Local te conviene a medio plazo.',
    'calc.verdict.api_cheaper': 'Para este perfil, pagar API sigue siendo más barato durante los próximos 12 meses frente a comprar o mantener hardware.',
    'calc.limit.memory': 'Poca memoria (VRAM/RAM) limita gravemente el uso de IA local.',
    'calc.limit.nogpu': 'Falta GPU dedicada (NVIDIA o Apple Silicon) afectará la velocidad.',
  },
  en: {
    'app.title': 'Do I Need Local AI?',
    'app.subtitle': 'Find out if your current rig can run Large Language Models (LLMs) locally, what performance to expect, and if it makes financial sense compared to paying for APIs like OpenAI or Anthropic.',
    'header.howItWorks': 'How it works',
    'header.share': 'Share',
    'header.copied': 'Copied',
    'input.hardware.title': 'Hardware Profile',
    'input.hardware.preset': 'Quick Preset',
    'input.hardware.preset.custom': 'Custom...',
    'input.hardware.preset.rtx3060': 'Gaming PC (RTX 3060 12GB)',
    'input.hardware.preset.rtx4070': 'Enthusiast PC (RTX 4070 Ti Super 16GB)',
    'input.hardware.preset.rtx4090': 'Workstation (RTX 4090 24GB)',
    'input.hardware.preset.macm4': 'Mac mini M4 (16GB RAM)',
    'input.hardware.preset.macm3': 'MacBook Pro M3 Max (64GB RAM)',
    'input.hardware.preset.nogpu': 'Laptop / PC without dedicated GPU',
    'input.hardware.os': 'Operating System',
    'input.hardware.gpuMaker': 'GPU Manufacturer',
    'input.hardware.vram': 'VRAM (GB) - Video Memory',
    'input.hardware.ram': 'System RAM (GB)',
    'input.hardware.price': 'Device Cost (USD)',
    'input.hardware.marketEst': 'Current Market Est.',
    'input.usage.title': 'Usage Profile',
    'input.usage.goal': 'Primary Use Case',
    'input.usage.goal.chat': 'General Chat / Assistant',
    'input.usage.goal.coding': 'Coding / Autocomplete',
    'input.usage.goal.rag': 'Document Analysis (RAG)',
    'input.usage.frequency': 'Usage Frequency',
    'input.usage.frequency.occasional': 'Occasional (1-2 times/week)',
    'input.usage.frequency.daily': 'Moderate Daily',
    'input.usage.frequency.heavy': 'Heavy Usage',
    'input.usage.frequency.production': 'Production / API / Agents',
    'input.usage.hours': 'Active Hours per Day',
    'input.usage.electricity': 'Electricity Cost (USD/kWh)',
    'input.usage.privacy': 'Strict Privacy (Sensitive Data)',
    'input.usage.offline': '100% Offline Required',

    'results.verdict.title': 'Verdict: ',
    'results.verdict.local': 'Local makes sense',
    'results.verdict.api': 'API is cheaper',
    'results.economics.title': '12-Month Projection (Total Cost)',
    'results.economics.apiCost': 'API Cost (Cloud)',
    'results.economics.localCost': 'Local Cost (Hardware + Electricity)',
    'results.economics.breakeven': 'Break-even point',
    'results.economics.months': 'Months',
    'results.models.title': 'Compatible Models',
    'results.models.canRun': 'Can Run',
    'results.models.cannotRun': 'Insufficient Memory',
    'results.models.speed.fast': 'Fast',
    'results.models.speed.acceptable': 'Acceptable',
    'results.models.speed.slow': 'Slow',
    'results.models.speed.unusable': 'Unusable',
    'results.software.title': 'Recommended Software for Your System',
    'results.software.download': 'Download',
    
    // Calculator messages
    'calc.models.phi3': 'Ideal for modest hardware. Fast and efficient.',
    'calc.models.llama3_8b.gpu': 'Runs 100% on GPU, very fast.',
    'calc.models.llama3_8b.cpu': 'Will run using RAM (CPU), which is slower.',
    'calc.models.gemma2': 'Great quality, requires slightly more VRAM than Llama 3.',
    'calc.models.deepseek_r1': 'Excellent for logical reasoning and coding.',
    'calc.models.qwen.gpu': 'Excellent GPU performance.',
    'calc.models.qwen.cpu': 'Requires partial offloading to RAM.',
    'calc.models.llama3_70b.gpu': 'Fits entirely in VRAM.',
    'calc.models.llama3_70b.cpu': 'Will run but extremely slowly and with limited context.',
    'calc.verdict.mandatory': 'Due to strict privacy or offline requirements, local execution is mandatory regardless of cost.',
    'calc.verdict.local_hours': 'Local makes sense because API costs exceed hardware amortization.',
    'calc.verdict.local_breakeven': 'With this usage profile, you will break even on hardware in ',
    'calc.verdict.local_breakeven_months': ' months. Local is better long-term.',
    'calc.verdict.api_cheaper': 'For this profile, paying for APIs remains cheaper for the next 12 months compared to buying/running hardware.',
    'calc.limit.memory': 'Low memory (VRAM/RAM) severely limits local AI.',
    'calc.limit.nogpu': 'Lack of dedicated GPU (NVIDIA or Apple Silicon) will impact speed.',
  }
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'es',
  setLang: () => {},
  t: (key) => key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    if (saved === 'en' || saved === 'es') return saved;
    return navigator.language.startsWith('es') ? 'es' : 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const t = (key: string) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
