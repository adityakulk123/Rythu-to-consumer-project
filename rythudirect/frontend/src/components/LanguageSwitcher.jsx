import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-1 bg-white/80 backdrop-blur-sm border border-emerald-200/60 rounded-full px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm">
      <Globe className="w-3.5 h-3.5 text-emerald-700" />
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-0.5 rounded-full transition-all ${
          language === 'en'
            ? 'bg-[#1B4332] text-white shadow-xs'
            : 'text-gray-600 hover:text-emerald-800'
        }`}
      >
        EN
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={() => setLanguage('te')}
        className={`px-2 py-0.5 rounded-full transition-all telugu-text ${
          language === 'te'
            ? 'bg-[#1B4332] text-white shadow-xs'
            : 'text-gray-600 hover:text-emerald-800'
        }`}
      >
        తెలుగు
      </button>
    </div>
  );
};

export default LanguageSwitcher;
