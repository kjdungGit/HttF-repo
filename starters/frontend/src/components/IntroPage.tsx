"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/client";
import { SpeechControls } from "./guide/SpeechControls";
import { useSpeech, type SpeechLang } from "./guide/useSpeech";
import { requestGoToService } from "./GoToService";

export default function IntroPage() {
  const { t, i18n: i18nInstance } = useTranslation();
  const lang: SpeechLang = i18nInstance.language.startsWith("es") ? "es" : "en";
  const speech = useSpeech(lang);
  const endRef = useRef<HTMLElement>(null);
  const [atEnd, setAtEnd] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const node = endRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setAtEnd(entry.isIntersecting),
      { threshold: 0.65 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function startFiling() {
    setLeaving(true);
    requestGoToService();
  }

  const speechLabels = {
    listen: t("speech.listen"),
    play: t("speech.play"),
    pause: t("speech.pause"),
    stop: t("speech.stop"),
  };

  return (
    <main className={`bg-white ${leaving ? "keen-leave" : ""}`}>
      <div className="mx-auto max-w-3xl px-6 py-12 pb-36">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange">
            {t("intro.kicker")}
          </p>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            {t("lang.label")}
            <select
              className="rounded-lg border border-black/20 bg-white px-3 py-2 text-sm outline-none focus:border-orange"
              value={lang}
              onChange={(event) => {
                speech.stop();
                void i18n.changeLanguage(event.target.value);
              }}
            >
              <option value="en">{t("lang.en")}</option>
              <option value="es">{t("lang.es")}</option>
            </select>
          </label>
        </div>
        {speech.ready && !speech.supported ? (
          <p className="mt-4 rounded-lg border border-orange/40 bg-[#fff7f4] px-4 py-3 text-sm text-ink" role="status">
            {t("speech.unsupported")}
          </p>
        ) : null}

        <ReadBlock
          id="hero"
          text={t("intro.heroSpeech")}
          speakingId={speech.speakingId}
          paused={speech.paused}
          supported={speech.supported}
          labels={speechLabels}
          speech={speech}
        >
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            {t("intro.title")}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-black/75">{t("intro.lead")}</p>
        </ReadBlock>

        <ReadBlock
          id="filing"
          text={t("intro.filingSpeech")}
          speakingId={speech.speakingId}
          paused={speech.paused}
          supported={speech.supported}
          labels={speechLabels}
          speech={speech}
          className="mt-10 rounded-2xl border border-black/15 bg-white p-6 shadow-[4px_4px_0_0_#0a0a0a]"
        >
          <h2 className="text-xl font-bold text-ink">{t("intro.filingH2")}</h2>
          <p className="mt-2 text-sm font-semibold text-uiuc">{t("intro.yesIf")}</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-black/80">
            <li>{t("intro.yes1")}</li>
            <li>{t("intro.yes2")}</li>
            <li>{t("intro.yes3")}</li>
            <li>{t("intro.yes4")}</li>
            <li>{t("intro.yes5")}</li>
          </ul>
          <p className="mt-4 text-sm font-semibold text-orange">{t("intro.pauseIf")}</p>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-black/80">
            <li>{t("intro.pause1")}</li>
            <li>{t("intro.pause2")}</li>
          </ul>
        </ReadBlock>

        <ReadBlock
          id="happens"
          text={t("intro.happensSpeech")}
          speakingId={speech.speakingId}
          paused={speech.paused}
          supported={speech.supported}
          labels={speechLabels}
          speech={speech}
          className="mt-10"
        >
          <h2 className="text-xl font-bold text-ink">{t("intro.happensH2")}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-black/75">{t("intro.happens1")}</p>
          <p className="mt-3 text-[15px] leading-relaxed text-black/75">{t("intro.happens2")}</p>
        </ReadBlock>

        <ReadBlock
          id="roles"
          text={t("intro.rolesSpeech")}
          speakingId={speech.speakingId}
          paused={speech.paused}
          supported={speech.supported}
          labels={speechLabels}
          speech={speech}
          className="mt-10"
        >
          <h2 className="text-xl font-bold text-ink">{t("intro.rolesH2")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-uiuc/30 bg-[#f7f9fc] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-uiuc">{t("intro.keen")}</p>
              <p className="mt-2 text-sm leading-relaxed text-black/75">{t("intro.keenBody")}</p>
            </div>
            <div className="rounded-xl border border-orange/40 bg-[#fff7f4] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-orange">{t("intro.you")}</p>
              <p className="mt-2 text-sm leading-relaxed text-black/75">{t("intro.youBody")}</p>
            </div>
          </div>
        </ReadBlock>

        <ReadBlock
          id="words"
          text={t("intro.wordsSpeech")}
          speakingId={speech.speakingId}
          paused={speech.paused}
          supported={speech.supported}
          labels={speechLabels}
          speech={speech}
          className="mt-10"
        >
          <h2 className="text-xl font-bold text-ink">{t("intro.wordsH2")}</h2>
          <dl className="mt-4 space-y-3 text-sm leading-relaxed">
            <div>
              <dt className="font-semibold text-ink">{t("intro.credit")}</dt>
              <dd className="text-black/70">{t("intro.creditBody")}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">{t("intro.deduction")}</dt>
              <dd className="text-black/70">{t("intro.deductionBody")}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">{t("intro.withholding")}</dt>
              <dd className="text-black/70">{t("intro.withholdingBody")}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">{t("intro.eligible")}</dt>
              <dd className="text-black/70">{t("intro.eligibleBody")}</dd>
            </div>
          </dl>
        </ReadBlock>

        <ReadBlock
          id="ready"
          text={t("intro.readySpeech")}
          speakingId={speech.speakingId}
          paused={speech.paused}
          supported={speech.supported}
          labels={speechLabels}
          speech={speech}
          className="mt-10 border-t border-black pt-8"
          innerRef={endRef}
        >
          <h2 className="text-xl font-bold text-ink">{t("intro.readyH2")}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-black/75">{t("intro.readyBody")}</p>
        </ReadBlock>
      </div>

      {atEnd && !leaving ? (
        <button
          type="button"
          onClick={startFiling}
          className="keen-bounce fixed bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-ink"
        >
          <span className="text-sm font-semibold">{t("intro.cta")}</span>
          <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-white text-2xl text-orange shadow-[3px_3px_0_0_#0a0a0a]">
            ↓
          </span>
        </button>
      ) : null}
    </main>
  );
}

function ReadBlock({
  id,
  text,
  speakingId,
  paused,
  supported,
  labels,
  speech,
  className = "",
  innerRef,
  children,
}: {
  id: string;
  text: string;
  speakingId: string | null;
  paused: boolean;
  supported: boolean;
  labels: { listen: string; play: string; pause: string; stop: string };
  speech: { play: (id: string, text: string) => void; pause: () => void; stop: () => void };
  className?: string;
  innerRef?: React.Ref<HTMLElement>;
  children: ReactNode;
}) {
  const reading = speakingId === id;
  return (
    <section
      ref={innerRef}
      className={`${className} ${reading ? "rounded-xl bg-orange/10 ring-2 ring-orange" : ""}`}
    >
      <div className="mb-3">
        <SpeechControls
          stepId={id}
          text={text}
          speakingId={speakingId}
          paused={paused}
          supported={supported}
          labels={labels}
          onPlay={speech.play}
          onPause={speech.pause}
          onStop={speech.stop}
        />
      </div>
      {children}
    </section>
  );
}
