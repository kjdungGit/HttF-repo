"use client";

import type { ReactNode } from "react";

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-black/20 bg-white text-ink hover:border-orange disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
      <path fill="currentColor" d="M6.2 3.6v12.8L16.4 10z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
      <path fill="currentColor" d="M5 4h3.2v12H5zm6.8 0H15v12h-3.2z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
      <path fill="currentColor" d="M5 5h10v10H5z" />
    </svg>
  );
}

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
  const playLabel = active && paused ? labels.play : labels.listen;

  if (!supported) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center text-black/35" title={labels.listen} aria-label={labels.listen}>
        <PlayIcon />
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1" onClick={(event) => event.stopPropagation()}>
      <IconButton label={playLabel} onClick={() => onPlay(stepId, text)}>
        <PlayIcon />
      </IconButton>
      <IconButton label={labels.pause} disabled={!active || paused} onClick={onPause}>
        <PauseIcon />
      </IconButton>
      <IconButton label={labels.stop} disabled={!active} onClick={onStop}>
        <StopIcon />
      </IconButton>
    </div>
  );
}
