"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import "@/i18n/client";

export function ChoiceButton({
  title,
  detail,
  onClick,
  selected = false,
}: {
  title: string;
  detail: string;
  onClick: () => void;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-4 text-left transition hover:-translate-y-0.5 ${
        selected
          ? "border-orange bg-white shadow-[3px_3px_0_0_#e84a27]"
          : "border-black/20 bg-white text-ink hover:border-black"
      }`}
    >
      <span className="block font-semibold text-ink">{title}</span>
      <span className="mt-1 block text-xs leading-relaxed text-black/65">{detail}</span>
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm outline-none focus:border-orange"
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function TriState({
  label,
  value,
  onChange,
}: {
  label: ReactNode;
  value: "" | "yes" | "no" | "unsure";
  onChange: (value: "yes" | "no" | "unsure") => void;
}) {
  const { t } = useTranslation();
  const options = [
    { id: "yes" as const, text: t("common.yes") },
    { id: "no" as const, text: t("common.no") },
    { id: "unsure" as const, text: t("common.unsure") },
  ];
  return (
    <fieldset className="rounded-lg border border-black/10 bg-white px-3 py-3">
      <legend className="text-sm font-medium text-ink">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              value === option.id
                ? "border-black bg-ink text-white"
                : "border-black/20 bg-white text-ink hover:border-orange"
            }`}
          >
            {option.text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function CompleteButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
    >
      {children}
    </button>
  );
}

export function Card({
  title,
  jurisdiction,
  label,
  body,
}: {
  title: string;
  jurisdiction: string;
  label: string;
  body: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-black/15 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-uiuc">
        {jurisdiction} · 2025
      </p>
      <h3 className="mt-1 font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-xs font-semibold text-orange">{label}</p>
      <div className="mt-2 text-sm leading-relaxed text-black/70">{body}</div>
    </article>
  );
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.7 13.3 4.4 10l-1.4 1.4 4.7 4.7 10-10L16.3 4.7z"
      />
    </svg>
  );
}

export function Term({ word, children }: { word: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="font-semibold text-uiuc underline decoration-dotted underline-offset-2"
        aria-expanded={open}
      >
        {word}
      </button>
      {open ? (
        <span
          role="note"
          className="absolute left-1/2 top-full z-40 mt-1 w-64 -translate-x-1/2 rounded-lg border border-uiuc/30 bg-white px-3 py-2 text-left text-sm font-normal leading-relaxed text-black/80 shadow-[3px_3px_0_0_#13294b]"
        >
          {children}
        </span>
      ) : null}
    </span>
  );
}

export function NumberStepper({
  label,
  value,
  onSubmit,
  step = 1,
  max = 100000,
  prefix = "",
}: {
  label: ReactNode;
  value: number;
  onSubmit: (next: number) => void;
  step?: number;
  max?: number;
  prefix?: string;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("es") ? "es-ES" : "en-US";
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(false);
  const shown = draft;

  return (
    <div className="rounded-lg border border-black/10 bg-white px-3 py-3">
      <div className="text-sm font-medium text-ink">{label}</div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label={t("common.decrease")}
          onClick={() => {
            setSaved(false);
            setDraft((current) => Math.max(0, current - step));
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black text-lg font-bold leading-none hover:border-orange"
        >
          −
        </button>
        <span className="min-w-16 text-center text-xl font-extrabold tabular-nums text-ink">
          {prefix}
          {shown.toLocaleString(locale)}
        </span>
        <button
          type="button"
          aria-label={t("common.increase")}
          onClick={() => {
            setSaved(false);
            setDraft((current) => Math.min(max, current + step));
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black text-lg font-bold leading-none hover:border-orange"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => {
            onSubmit(draft);
            setSaved(true);
          }}
          className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white hover:bg-[#d44222]"
        >
          {t("common.submit")}
        </button>
      </div>
      {saved ? (
        <p className="mt-2 text-xs font-semibold text-check">
          {t("common.saved", { value: `${prefix}${draft.toLocaleString(locale)}` })}
        </p>
      ) : null}
    </div>
  );
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function DatePicker({
  label,
  value,
  onChange,
  minYear = 1940,
  maxYear = 2025,
}: {
  label: ReactNode;
  value: string;
  onChange: (next: string) => void;
  minYear?: number;
  maxYear?: number;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("es") ? "es-ES" : "en-US";
  const months = t("months", { returnObjects: true }) as string[];
  const weekdays = t("common.weekdays", { returnObjects: true }) as string[];
  const parsed = value ? new Date(`${value}T12:00:00`) : null;
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(parsed?.getFullYear() ?? 2000);
  const [month, setMonth] = useState(parsed?.getMonth() ?? 0);

  function toggleOpen() {
    if (!open && parsed && !Number.isNaN(parsed.getTime())) {
      setYear(parsed.getFullYear());
      setMonth(parsed.getMonth());
    }
    setOpen((current) => !current);
  }

  const years = useMemo(() => {
    const list: number[] = [];
    for (let next = maxYear; next >= minYear; next -= 1) list.push(next);
    return list;
  }, [minYear, maxYear]);

  const blanks = new Date(year, month, 1).getDay();
  const count = daysInMonth(year, month);
  const selectedDay = parsed && parsed.getFullYear() === year && parsed.getMonth() === month
    ? parsed.getDate()
    : 0;

  const display = parsed && !Number.isNaN(parsed.getTime())
    ? parsed.toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric" })
    : t("common.selectDate");

  return (
    <div className="relative rounded-lg border border-black/10 bg-white px-3 py-3">
      <div className="text-sm font-medium text-ink">{label}</div>
      <button
        type="button"
        onClick={toggleOpen}
        className="mt-2 w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-left text-sm hover:border-orange"
      >
        {display}
      </button>
      {open ? (
        <div className="absolute left-3 right-3 z-30 mt-2 rounded-xl border border-black/20 bg-white p-3 shadow-[4px_4px_0_0_#0a0a0a]">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-black/60">
              {t("common.month")}
              <select
                className="mt-1 w-full rounded-md border border-black/20 bg-white px-2 py-1.5 text-sm"
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
              >
                {months.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-black/60">
              {t("common.year")}
              <select
                className="mt-1 w-full rounded-md border border-black/20 bg-white px-2 py-1.5 text-sm"
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
              >
                {years.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-black/45">
            {weekdays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: blanks }, (_, index) => (
              <span key={`b-${index}`} />
            ))}
            {Array.from({ length: count }, (_, index) => {
              const day = index + 1;
              const active = day === selectedDay;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    onChange(`${year}-${pad(month + 1)}-${pad(day)}`);
                    setOpen(false);
                  }}
                  className={`h-8 rounded-full text-sm ${
                    active ? "bg-orange font-bold text-white" : "hover:bg-black/5"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
