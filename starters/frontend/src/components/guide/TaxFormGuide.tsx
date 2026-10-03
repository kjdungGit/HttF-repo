"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import TaxDocumentUpload, { type UploadReview } from "./TaxDocumentUpload";
import { PdfPreview } from "./PdfPreview";
import { CheckIcon, CrossIcon } from "./ui";
import {
  GUIDE_FORMS,
  emptyValues,
  formStatus,
  matchGuideForm,
  missingRequired,
  type FormId,
  type FormPacket,
  type GuideForm,
} from "@/utils/guide/forms";
import { DEMO_LIBRARY, readPdfWidgets, valuesFromWidgets } from "@/utils/guide/pdf-widgets";

const STORAGE_KEY = "keenfinance-form-packets-v1";

function readPackets(): Partial<Record<FormId, FormPacket>> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Record<FormId, FormPacket>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export default function TaxFormGuide({
  files,
  setFiles,
  reviews,
  setReviews,
}: {
  files: File[];
  setFiles: (next: File[] | ((prev: File[]) => File[])) => void;
  reviews: UploadReview[];
  setReviews: Dispatch<SetStateAction<UploadReview[]>>;
}) {
  const { t } = useTranslation();
  const [packets, setPackets] = useState<Partial<Record<FormId, FormPacket>>>({});
  const [openId, setOpenId] = useState<FormId | null>(null);
  const [demoDragging, setDemoDragging] = useState(false);
  const [demoMessage, setDemoMessage] = useState("");
  const sources = useRef<Partial<Record<FormId, string>>>({});
  const demoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPackets(readPackets());
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(packets));
    } catch {
      /* ignore */
    }
  }, [packets]);

  useEffect(() => {
    return () => {
      for (const url of Object.values(sources.current)) if (url) URL.revokeObjectURL(url);
    };
  }, []);

  const openForm = openId ? GUIDE_FORMS.find((form) => form.id === openId) ?? null : null;

  function upsert(form: GuideForm, patch: Partial<FormPacket> & { values?: Record<string, string> }, started = true) {
    setPackets((prev) => {
      const current = prev[form.id] ?? { values: emptyValues(form), status: "missing", sourceKind: "blank" as const };
      const values = patch.values ?? current.values;
      const next: FormPacket = {
        ...current,
        ...patch,
        values,
        status: formStatus(form, values, started || current.status !== "missing" || patch.sourceKind === "upload"),
      };
      return { ...prev, [form.id]: next };
    });
  }

  function open(form: GuideForm) {
    setPackets((prev) => {
      if (prev[form.id]) return prev;
      return { ...prev, [form.id]: { values: emptyValues(form), status: "missing", sourceKind: "blank" } };
    });
    setOpenId(form.id);
  }

  async function ingestDemo(selected: File[]) {
    if (!selected.length) return;
    const notes: string[] = [];
    for (const file of selected) {
      const matched = matchGuideForm(file.name);
      if (!matched) {
        notes.push(t("fill.demoUnknown", { name: file.name }));
        continue;
      }
      const { form } = matched;
      if (sources.current[form.id]) URL.revokeObjectURL(sources.current[form.id]!);
      sources.current[form.id] = URL.createObjectURL(file);
      let values = emptyValues(form);
      try {
        const widgets = await readPdfWidgets(file);
        if (Object.keys(widgets).length) values = valuesFromWidgets(form, widgets);
      } catch {
        /* filename matching still records the attempt */
      }
      upsert(form, { values, sourceKind: "upload", sourceName: file.name }, true);
      setFiles((prev) => [...prev.filter((item) => item.name !== file.name), file]);
      const status = formStatus(form, values, true);
      notes.push(
        t(status === "complete" ? "fill.demoComplete" : "fill.demoIncomplete", {
          name: file.name,
          form: t(`forms.${form.id}.name`),
        }),
      );
    }
    setDemoMessage(notes.join(" "));
  }

  async function loadLibraryFile(href: string, fileName: string) {
    const response = await fetch(href);
    if (!response.ok) {
      setDemoMessage(t("fill.demoUnknown", { name: fileName }));
      return;
    }
    const file = new File([await response.blob()], fileName, { type: "application/pdf" });
    await ingestDemo([file]);
  }

  return (
    <div>
      <TaxDocumentUpload files={files} setFiles={setFiles} reviews={reviews} setReviews={setReviews} />

      <section className="mt-6 rounded-xl border border-dashed border-black/25 bg-white px-4 py-5">
        <h3 className="font-semibold text-ink">{t("fill.demoTitle")}</h3>
        <p className="mt-1 text-sm leading-relaxed text-black/65">{t("fill.demoHint")}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <DemoFolder
            title={t("fill.demoCompleteFolder")}
            files={DEMO_LIBRARY.complete}
            onLoad={loadLibraryFile}
          />
          <DemoFolder
            title={t("fill.demoIncompleteFolder")}
            files={DEMO_LIBRARY.incomplete}
            onLoad={loadLibraryFile}
          />
        </div>
        <button
          type="button"
          className={`mt-4 flex w-full flex-col items-center rounded-xl border-2 border-dashed px-4 py-7 text-center ${demoDragging ? "border-orange bg-[#fff7f4]" : "border-black/25"}`}
          onClick={() => demoInput.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDemoDragging(true);
          }}
          onDragLeave={() => setDemoDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDemoDragging(false);
            void ingestDemo(Array.from(event.dataTransfer.files));
          }}
        >
          <span className="font-semibold">{t("fill.demoDrop")}</span>
          <span className="mt-1 text-xs text-black/55">{t("fill.demoTypes")}</span>
        </button>
        <input
          ref={demoInput}
          className="sr-only"
          type="file"
          multiple
          accept=".pdf,application/pdf"
          aria-label={t("fill.demoTitle")}
          onChange={(event) => {
            void ingestDemo(Array.from(event.target.files || []));
            event.target.value = "";
          }}
        />
        {demoMessage ? <p className="mt-3 text-sm text-black/70">{demoMessage}</p> : null}
      </section>

      <ul className="mt-6 space-y-3">
        {GUIDE_FORMS.map((form) => {
          const packet = packets[form.id];
          const status = packet?.status ?? "missing";
          const done = status === "complete";
          return (
            <li key={form.id}>
              <button
                type="button"
                onClick={() => open(form)}
                className="flex w-full items-start gap-3 rounded-lg border border-black/10 bg-white px-4 py-3 text-left hover:border-orange"
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    done ? "bg-check text-white" : "bg-miss text-white"
                  }`}
                  aria-hidden="true"
                >
                  {done ? <CheckIcon /> : <CrossIcon />}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-orange underline decoration-dotted underline-offset-2">
                    {t(`forms.${form.id}.name`)}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-black/70">{t(`forms.${form.id}.summary`)}</span>
                  <span className="mt-1 block text-xs font-medium text-black/55">
                    {done ? t("fill.statusComplete") : status === "incomplete" ? t("fill.statusIncomplete") : t("fill.statusMissing")}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {openForm ? (
        <FormDrawer
          form={openForm}
          packet={packets[openForm.id] ?? { values: emptyValues(openForm), status: "missing", sourceKind: "blank" }}
          pdfUrl={sources.current[openForm.id] ?? openForm.pdf}
          onChange={(values) => upsert(openForm, { values })}
          onClose={() => setOpenId(null)}
          onFinish={(values) => {
            if (missingRequired(openForm, values).length) return false;
            upsert(openForm, { values }, true);
            setOpenId(null);
            return true;
          }}
        />
      ) : null}
    </div>
  );
}

function FormDrawer({
  form,
  packet,
  pdfUrl,
  onChange,
  onClose,
  onFinish,
}: {
  form: GuideForm;
  packet: FormPacket;
  pdfUrl: string;
  onChange: (values: Record<string, string>) => void;
  onClose: () => void;
  onFinish: (values: Record<string, string>) => boolean;
}) {
  const { t } = useTranslation();
  const [shake, setShake] = useState(false);
  const [error, setError] = useState(false);
  const valuesRef = useRef(packet.values);
  valuesRef.current = packet.values;

  function setValue(key: string, value: string) {
    const next = { ...valuesRef.current, [key]: value };
    valuesRef.current = next;
    onChange(next);
  }

  function finish() {
    if (missingRequired(form, valuesRef.current).length) {
      setError(true);
      setShake(true);
      window.setTimeout(() => setShake(false), 480);
      return;
    }
    onFinish(valuesRef.current);
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" className="absolute inset-0 bg-navy/50" aria-label={t("fill.close")} onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-5xl flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-black/10 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange">KEENFinance</p>
            <h3 className="mt-1 text-xl font-bold text-ink">{t(`forms.${form.id}.name`)}</h3>
            <p className="mt-1 text-sm text-black/60">{t("fill.scrollHint")}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-2 py-1 text-xl text-slate-500 hover:bg-slate-100" aria-label={t("fill.close")}>
            ×
          </button>
        </div>

        <div className="p-5">
          <div className="w-full overflow-auto rounded-xl border border-black/15 bg-white">
            <PdfPreview url={pdfUrl} title={t(`forms.${form.id}.name`)} />
          </div>
          <div className="mt-6 space-y-5">
            <p className="text-sm font-semibold text-ink">{t("fill.answersHeading")}</p>
            {form.fields.map((item) => {
              const filled = Boolean(packet.values[item.key]?.trim());
              return (
                <label key={item.key} className="block text-sm font-medium text-ink">
                  <span className="flex items-center gap-2">
                    {t(`forms.${form.id}.fields.${item.key}.label`)}
                    {item.required ? <span className="text-miss">*</span> : null}
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/20 text-sm font-bold text-uiuc" title={t("fill.help")} aria-hidden="true">
                      ?
                    </span>
                    <span className={`text-xs ${filled ? "text-check" : "text-miss"}`}>
                      {filled ? t("fill.filled") : item.required ? t("fill.needed") : t("fill.optional")}
                    </span>
                  </span>
                  <span role="note" className="mt-2 block rounded-lg border border-uiuc/20 bg-[#f3f7fb] px-3 py-2 text-sm font-normal leading-relaxed text-black/75">
                    {t(`forms.${form.id}.fields.${item.key}.help`)}
                  </span>
                  <input
                    className="mt-3 w-full rounded-lg border border-black/20 px-3 py-3 outline-none focus:border-orange focus:ring-2 focus:ring-orange/20"
                    value={packet.values[item.key] ?? ""}
                    onChange={(event) => setValue(item.key, event.target.value)}
                  />
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-auto border-t border-black/10 px-5 py-6">
          {error ? (
            <p role="alert" className="mb-3 text-center text-sm font-semibold text-miss">
              {t("fill.requiredError")}
            </p>
          ) : null}
          <button
            type="button"
            onClick={finish}
            className={`${shake ? "keen-shake" : "keen-bounce"} mx-auto flex flex-col items-center gap-2 text-ink`}
          >
            <span className="text-sm font-semibold">{t("fill.finished")}</span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-white text-2xl text-orange shadow-[3px_3px_0_0_#0a0a0a]">
              ↓
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
}

function DemoFolder({
  title,
  files,
  onLoad,
}: {
  title: string;
  files: { file: string; href: string }[];
  onLoad: (href: string, fileName: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-black/10 bg-[#f6f7f9] p-3">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <ul className="mt-2 space-y-2">
        {files.map((item) => (
          <li key={item.file} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <a className="text-uiuc underline" href={item.href} download={item.file}>
              {item.file}
            </a>
            <button
              type="button"
              className="rounded-md border border-black/20 bg-white px-2 py-1 text-xs font-semibold"
              onClick={() => onLoad(item.href, item.file)}
            >
              {t("fill.demoLoad")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
