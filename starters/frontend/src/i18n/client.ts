"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import es from "./es.json";

export const SPEECH_LANG: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
};

if (!i18n.isInitialized) {
  const stored = typeof window !== "undefined" ? window.localStorage.getItem("keen-lang") : null;
  const lng = stored === "es" || stored === "en" ? stored : "en";
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
  i18n.on("languageChanged", (next) => {
    try {
      window.localStorage.setItem("keen-lang", next);
    } catch {
      /* ignore quota / private-mode failures */
    }
  });
}

export default i18n;
