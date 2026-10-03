"use client";

export function SpeechControls({
  stepId,
  text,
  speakingId,
  paused,
  supported,
  labels,
  onPlay,
  onPause,
  onStop,
}: {
  stepId: string;
  text: string;
  speakingId: string | null;
  paused: boolean;
  supported: boolean;
  labels: { listen: string; play: string; pause: string; stop: string };
  onPlay: (id: string, text: string) => void;
  onPause: () => void;
  onStop: () => void;
}) {
  const active = speakingId === stepId;
  const btn =
    "rounded-full border border-black/20 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink hover:border-orange disabled:cursor-not-allowed disabled:opacity-40";

  if (!supported) {
    return (
      <span className="text-[11px] font-medium text-black/45" title={labels.listen}>
        {labels.listen}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className={btn}
        onClick={() => onPlay(stepId, text)}
        aria-label={active && paused ? labels.play : labels.listen}
      >
        {active && paused ? labels.play : labels.listen}
      </button>
      <button
        type="button"
        className={btn}
        disabled={!active || paused}
        onClick={onPause}
        aria-label={labels.pause}
      >
        {labels.pause}
      </button>
      <button
        type="button"
        className={btn}
        disabled={!active}
        onClick={onStop}
        aria-label={labels.stop}
      >
        {labels.stop}
      </button>
    </div>
  );
}
