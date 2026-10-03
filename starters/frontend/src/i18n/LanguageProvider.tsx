"use client";
import { useEffect, type ReactNode } from 'react';
import i18n from './client';
import { ServiceTransitionHost } from '@/components/GoToService';

/** Restore the locale after hydration so server and initial browser HTML agree. */
export default function LanguageProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const update = (language: string) => {
      const locale = language.startsWith('es') ? 'es' : 'en';
      document.documentElement.lang = locale;
      try { window.localStorage.setItem('keen-lang', locale); } catch { /* Storage may be unavailable. */ }
    };
    let stored: string | null = null;
    try { stored = window.localStorage.getItem('keen-lang'); } catch { /* Use English when storage is unavailable. */ }
    i18n.on('languageChanged', update);
    if (stored === 'es' || stored === 'en') void i18n.changeLanguage(stored);
    else update(i18n.language);
    return () => { i18n.off('languageChanged', update); };
  }, []);
  return (
    <>
      {children}
      <ServiceTransitionHost />
    </>
  );
}
