"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export type SpeechLang = "en" | "es";

function speechSupported() {
  return typeof window !== "undefined" && Boolean(window.speechSynthesis) && typeof window.SpeechSynthesisUtterance === "function";
}

const subscribeSpeechSupport = () => () => {};

function pickVoice(langCode: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const lower = langCode.toLowerCase();
  const prefix = lower.slice(0, 2);
  return (
    voices.find((voice) => voice.lang.toLowerCase() === lower) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix))
  );
}

export function useSpeech(lang: SpeechLang) {
  const supported = useSyncExternalStore(
    subscribeSpeechSupport,
    speechSupported,
    () => true,
  );
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const generation = useRef(0);

  useEffect(() => {
    if (!supported || !speechSupported()) return;
    const refresh = () => {
      window.speechSynthesis.getVoices();
    };
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", refresh);
      generation.current += 1;
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!speechSupported()) return;
    generation.current += 1;
    window.speechSynthesis.cancel();
    setSpeakingId(null);
    setPaused(false);
  }, []);

  const play = useCallback(
    (id: string, text: string) => {
      if (!supported || !speechSupported()) return;
      const synth = window.speechSynthesis;
      if (speakingId === id && paused) {
        synth.resume();
        setPaused(false);
        return;
      }
      const current = ++generation.current;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "es" ? "es-ES" : "en-US";
      const voice = pickVoice(utterance.lang);
      if (voice) utterance.voice = voice;
      utterance.onend = () => {
        if (current !== generation.current) return;
        setSpeakingId(null);
        setPaused(false);
      };
      utterance.onerror = () => {
        if (current !== generation.current) return;
        setSpeakingId(null);
        setPaused(false);
      };
      setSpeakingId(id);
      setPaused(false);
      synth.speak(utterance);
    },
    [lang, paused, speakingId, supported],
  );

  const pause = useCallback(() => {
    if (!supported || !speakingId || !speechSupported()) return;
    window.speechSynthesis.pause();
    setPaused(true);
  }, [speakingId, supported]);

  return { supported, ready: true, speakingId, paused, play, pause, stop };
}
