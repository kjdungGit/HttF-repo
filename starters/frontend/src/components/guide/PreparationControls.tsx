"use client";
import { useTranslation } from "react-i18next";
import { SpeechControls } from "./SpeechControls";
import { useSpeech } from "./useSpeech";
export const progressKey = () => "keenfinance:preparation:v1:device";
export function download(
  name: string,
  data: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function PreparationControls({
  text,
  id,
}: {
  text: string;
  id: string;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("es") ? "es" : "en";
  const speech = useSpeech(lang);
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
      <label className="flex items-center gap-2">
        {t("lang.label")}
        <select
          className="rounded-lg border p-2"
          value={lang}
          onChange={(e) => {
            speech.stop();
            void i18n.changeLanguage(e.target.value);
          }}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </label>
      <SpeechControls
        key={id}
        stepId={id}
        text={text}
        speakingId={speech.speakingId}
        paused={speech.paused}
        supported={speech.supported}
        labels={{
          listen: t("speech.listen"),
          play: t("speech.play"),
          pause: t("speech.pause"),
          stop: t("speech.stop"),
        }}
        onPlay={speech.play}
        onPause={speech.pause}
        onStop={speech.stop}
      />
      {speech.ready && !speech.supported && (
        <p role="status">{t("speech.unsupported")}</p>
      )}
    </div>
  );
}
