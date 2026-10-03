"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  blankPreparation,
  validatePreparation,
  backupFor,
  restoreBackup,
  documentChecklist,
  unresolvedQuestions,
  routeToHelp,
  QUESTION_KEYS,
  W2_FIELDS,
  type Preparation,
  type W2Key,
} from "@/utils/preparation/model.mjs";
import { extractTaxPdf } from "@/utils/pdf/tax-extraction.mjs";
import {
  readLocalForms,
  recordLocalForm,
} from "@/utils/preparation/local-forms.mjs";
import type { Extraction } from "@/utils/pdf/tax-extraction.mjs";
import {
  PreparationControls,
  progressKey,
  download,
} from "./PreparationControls";
import PdfEvidencePreview from "./PdfEvidencePreview";
const button =
  "rounded-xl border border-black/30 px-5 py-3 font-semibold hover:bg-orange/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange disabled:opacity-40";
export default function GuidedPreparation() {
  const { t, i18n } = useTranslation();
  const tr = (key: string) => t(`overhaul.${key}`);
  const [state, setState] = useState<Preparation>(blankPreparation);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [selected, setSelected] = useState<W2Key>("box_1_wages");
  const [recorded, setRecorded] = useState(false);
  const generation = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      let draft = blankPreparation();
      let isRecorded = false;
      try {
        const saved = localStorage.getItem(progressKey());
        if (saved) draft = validatePreparation(JSON.parse(saved));
      } catch {
        setStorageBlocked(true);
      }
      try {
        const forms = readLocalForms();
        isRecorded = forms.some((f) => f.id === draft.w2.recordId);
        const saved = forms.findLast(
          (f) => f.form_type === "w2" && f.tax_year === 2025,
        );
        if (saved && W2_FIELDS.every((k) => draft.w2.fields[k] === null)) {
          const fields = { ...draft.w2.fields };
          for (const key of W2_FIELDS) {
            const value = saved.fields[key];
            if (value && /^\d{1,12}(?:\.\d{0,2})?$/.test(value))
              fields[key] = value;
          }
          draft = {
            ...draft,
            documentStatus: "received",
            w2: {
              ...draft.w2,
              employer: saved.issuer ?? "",
              fields,
              confirmed: Object.values(fields).some((value) => value !== null),
              recordId: saved.id,
              source: saved.source,
            },
          };
          isRecorded = true;
        }
      } catch {
        setStorageBlocked(true);
      }
      try {
        const restored = sessionStorage.getItem("keenfinance:restore");
        if (restored) {
          draft = validatePreparation(JSON.parse(restored));
          sessionStorage.removeItem("keenfinance:restore");
          isRecorded = false;
        }
      } catch {
        /* Browser draft remains available when session storage is blocked. */
      }
      setState(draft);
      setRecorded(isRecorded);
      setLoaded(true);
    }, 0);
    const counter = generation;
    return () => {
      window.clearTimeout(timer);
      ++counter.current;
    };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(progressKey(), JSON.stringify(state));
    } catch {
      const timer = setTimeout(() => setStorageBlocked(true), 0);
      return () => clearTimeout(timer);
    }
  }, [state, loaded]);
  useEffect(() => {
    if (loaded) heading.current?.focus();
  }, [state.step, loaded]);
  function change(next: Preparation) {
    setState({ ...next, updatedAt: new Date().toISOString() });
    setMessage("");
  }
  function go(step: number) {
    change({ ...state, step });
  }
  function updateField(key: W2Key, value: string) {
    if (value !== "" && !/^\d{1,12}(?:\.\d{0,2})?$/.test(value)) {
      setMessage("invalidAmount");
      return;
    }
    change({
      ...state,
      w2: {
        ...state.w2,
        fields: { ...state.w2.fields, [key]: value || null },
        confirmed: false,
        recordId: null,
      },
    });
    setRecorded(false);
  }
  async function upload(input: File) {
    const run = generation.current;
    setFile(input);
    setExtraction(null);
    change({
      ...state,
      w2: { ...state.w2, confirmed: false, recordId: null, source: "manual" },
    });
    setRecorded(false);
    if (input.size > 8 * 1024 * 1024) {
      setMessage("uploadFallback");
      return;
    }
    setBusy(true);
    try {
      const result = await extractTaxPdf(
        new Uint8Array(await input.arrayBuffer()),
      );
      if (run !== generation.current) return;
      if (result.formType !== "w2") throw Error();
      setExtraction(result);
      const fields = { ...blankPreparation().w2.fields };
      for (const key of W2_FIELDS) {
        const value = result.fields[key];
        if (
          value !== null &&
          value !== undefined &&
          /^\d{1,12}(?:\.\d{0,2})?$/.test(value)
        )
          fields[key] = value;
      }
      change({
        ...state,
        w2: {
          ...state.w2,
          fields,
          confirmed: false,
          recordId: null,
          source: "pdf",
        },
      });
      setRecorded(false);
    } catch {
      if (run === generation.current) setMessage("uploadFallback");
    } finally {
      if (run === generation.current) setBusy(false);
    }
  }
  function recordW2() {
    const payload = state.w2.recordId
      ? state
      : { ...state, w2: { ...state.w2, recordId: crypto.randomUUID() } };
    if (
      !payload.w2.confirmed ||
      !Object.values(payload.w2.fields).some((value) => value !== null)
    )
      return;
    try {
      recordLocalForm({
        id: payload.w2.recordId,
        form_type: "w2",
        tax_year: 2025,
        language: i18n.language,
        issuer: payload.w2.employer,
        fields: payload.w2.fields,
        source: payload.w2.source,
      });
      change(payload);
      setRecorded(true);
      setMessage("savedW2");
      window.dispatchEvent(new Event("keenfinance:forms-change"));
    } catch {
      setStorageBlocked(true);
      setMessage("localError");
    }
  }
  function checklistText() {
    return [
      tr("finishTitle"),
      tr("boundary"),
      ...QUESTION_KEYS.map(
        (key) =>
          `${tr(`questions.${key}`)}: ${tr(state.answers[key] ?? "unknown")}`,
      ),
      ...documentChecklist(state).map(
        (item) =>
          `${tr(`checklist.${item.key}`)} [${tr(item.status)}] ${item.source}`,
      ),
      ...W2_FIELDS.map(
        (key) =>
          `${tr(`fields.${key}`)}: ${state.w2.confirmed ? (state.w2.fields[key] ?? tr("unknown")) : tr("needReview")}`,
      ),
      tr(routeToHelp(state) ? "helpText" : "selfText"),
    ].join("\n\n");
  }
  const key = QUESTION_KEYS[state.step];
  const title = key
    ? tr(`questions.${key}`)
    : tr(
        state.step === 5
          ? "documentQuestion"
          : state.step === 6
            ? "reviewTitle"
            : "finishTitle",
      );
  const evidence = extraction?.evidence[selected];
  const hasValues = W2_FIELDS.some((k) => state.w2.fields[k] !== null);
  const ready = state.w2.confirmed && hasValues;
  if (!loaded)
    return (
      <main className="p-12" role="status">
        {tr("loading")}
      </main>
    );
  return (
    <main className="mx-auto max-w-5xl px-5 py-10 text-ink">
      <PreparationControls
        key={state.step}
        id={`step-${state.step}`}
        text={[
          title,
          key
            ? tr(`explain.${key}`)
            : tr(state.step === 6 ? "reviewHelp" : "finishLead"),
          ...(state.step === 7 ? [checklistText()] : []),
        ].join(" ")}
      />
      <p className="mb-3 text-sm font-semibold text-orange">
        {t("overhaul.step", { current: state.step + 1, total: 8 })}
      </p>
      <div
        className="mb-6 h-2 rounded-full bg-black/10 print:hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={8}
        aria-valuenow={state.step + 1}
        aria-label={title}
      >
        <div
          className="h-full rounded-full bg-orange"
          style={{ width: `${((state.step + 1) / 8) * 100}%` }}
        />
      </div>
      <h1
        ref={heading}
        tabIndex={-1}
        className="text-3xl font-bold outline-none sm:text-4xl"
      >
        {title}
      </h1>
      {key && (
        <section className="mt-6">
          <p>{tr(`explain.${key}`)}</p>
          <p className="mt-3 text-sm text-black/70">{tr("questionHint")}</p>
          <div
            className="mt-6 grid gap-3 sm:grid-cols-3"
            role="group"
            aria-label={title}
          >
            {(["yes", "no", "unsure"] as const).map((answer) => (
              <button
                key={answer}
                aria-pressed={state.answers[key] === answer}
                className={`${button} ${state.answers[key] === answer ? "bg-uiuc text-white" : ""}`}
                onClick={() =>
                  change({
                    ...state,
                    answers: { ...state.answers, [key]: answer },
                    ...(key === "employment" && answer === "no"
                      ? {
                          documentStatus: "not_needed" as const,
                          w2: blankPreparation().w2,
                        }
                      : {}),
                  })
                }
              >
                {tr(answer)}
              </button>
            ))}
          </div>
        </section>
      )}
      {state.step === 5 && (
        <section className="mt-6">
          {state.answers.employment === "no" ? (
            <p>{tr("noW2")}</p>
          ) : (
            <>
              <p>{tr("missingHelp")}</p>
              <a
                className="mt-3 inline-block underline"
                href="https://www.irs.gov/taxtopics/tc154"
                target="_blank"
                rel="noreferrer"
              >
                {tr("request")} ↗
              </a>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className={button}
                  onClick={() =>
                    change({ ...state, step: 6, documentStatus: "received" })
                  }
                >
                  {tr("have")}
                </button>
                <button
                  disabled={busy}
                  className={button}
                  onClick={() =>
                    change({
                      ...state,
                      step: 7,
                      documentStatus: "collect_later",
                      w2: { ...state.w2, confirmed: false, recordId: null },
                    })
                  }
                >
                  {tr("later")}
                </button>
              </div>
            </>
          )}
          <h2 className="mt-8 text-xl font-semibold">
            {tr("documentsHeading")}
          </h2>
          <ul className="mt-4 space-y-3">
            {documentChecklist(state).map((item) => (
              <li key={item.key}>{tr(`checklist.${item.key}`)}</li>
            ))}
          </ul>
        </section>
      )}
      {state.step === 6 && (
        <fieldset disabled={busy} className="mt-6">
          <p>{tr("reviewHelp")}</p>
          <p className="mt-3 text-sm">{tr("uploadLimit")}</p>
          <label className="my-5 block font-semibold">
            {tr("choosePdf")}
            <input
              type="file"
              accept=".pdf,application/pdf"
              disabled={busy}
              className="mt-2 block max-w-full text-sm"
              onChange={(e) => {
                const chosen = e.target.files?.[0];
                if (chosen) void upload(chosen);
                e.target.value = "";
              }}
            />
          </label>
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-lg font-semibold">{tr("manual")}</h2>
              <label className="mb-4 block">
                {tr("employer")}
                <input
                  maxLength={100}
                  value={state.w2.employer}
                  className="mt-2 block w-full rounded-lg border p-3"
                  onChange={(e) => {
                    change({
                      ...state,
                      w2: {
                        ...state.w2,
                        employer: e.target.value,
                        confirmed: false,
                        recordId: null,
                      },
                    });
                    setRecorded(false);
                  }}
                />
              </label>
              {W2_FIELDS.map((field) => (
                <label key={field} className="mb-5 block font-semibold">
                  {tr(`fields.${field}`)}
                  <input
                    inputMode="decimal"
                    type="text"
                    value={state.w2.fields[field] ?? ""}
                    placeholder={tr("unknown")}
                    aria-describedby={`${field}-help`}
                    className="mt-2 block w-full rounded-lg border p-3 font-normal"
                    onFocus={() => setSelected(field)}
                    onChange={(e) => updateField(field, e.target.value)}
                  />
                  <span
                    id={`${field}-help`}
                    className="mt-2 block text-sm font-normal text-black/70"
                  >
                    {tr(`fieldHelp.${field}`)}
                  </span>
                </label>
              ))}
              <label className="flex gap-3 rounded-xl border p-4">
                <input
                  type="checkbox"
                  disabled={!hasValues}
                  checked={state.w2.confirmed}
                  onChange={(e) => {
                    setRecorded(false);
                    change({
                      ...state,
                      w2: {
                        ...state.w2,
                        confirmed: e.target.checked,
                        recordId: e.target.checked ? crypto.randomUUID() : null,
                      },
                    });
                  }}
                />
                {tr("confirm")}
              </label>
              <p className="mt-3 text-sm">{tr("needReview")}</p>
            </div>
            <div>
              {file ? (
                <PdfEvidencePreview
                  file={file}
                  pageNumber={evidence?.page ?? 1}
                  rect={evidence?.rect}
                  label={
                    evidence
                      ? t("overhaul.sourceBox", {
                          box: tr(`fields.${selected}`),
                          page: evidence.page,
                        })
                      : tr("sourceManual")
                  }
                />
              ) : (
                <div className="rounded-xl bg-[#f7f9fc] p-6">
                  <p>{tr("blankPreview")}</p>
                  <p className="mt-4">{tr(`fieldHelp.${selected}`)}</p>
                </div>
              )}
            </div>
          </div>
        </fieldset>
      )}
      {state.step === 7 && (
        <section className="mt-6 space-y-7">
          <p>{tr("finishLead")}</p>
          <div className="rounded-xl border p-5">
            <h2 className="text-xl font-semibold">{tr("checklistTitle")}</h2>
            <ul className="mt-4 space-y-4">
              {documentChecklist(state).map((item) => (
                <li key={item.key} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.status === "reviewed"}
                    readOnly
                    disabled
                    aria-label={tr(`checklist.${item.key}`)}
                    className="mt-1"
                  />
                  <div>
                    <a
                      href={item.source}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {tr(`checklist.${item.key}`)}
                    </a>
                    <p className="text-sm text-orange">{tr(item.status)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{tr("confirmedFacts")}</h2>
            {state.w2.confirmed ? (
              <dl className="mt-3 space-y-2">
                {W2_FIELDS.map((field) => (
                  <div key={field}>
                    <dt className="inline">{tr(`fields.${field}`)}: </dt>
                    <dd className="inline font-semibold">
                      {state.w2.fields[field] ?? tr("unknown")}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-3">{tr("needReview")}</p>
            )}
            {ready && (
              <p className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={recorded}
                  readOnly
                  disabled
                  aria-label={tr("recorded")}
                />
                {tr(recorded ? "recorded" : "notRecorded")}
              </p>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{tr("followups")}</h2>
            <ul className="mt-3 space-y-2">
              {unresolvedQuestions(state).map((k) => (
                <li key={k}>{tr(`questions.${k}`)}</li>
              ))}
            </ul>
            {!unresolvedQuestions(state).length && <p>{tr("noneFollowups")}</p>}
          </div>
          <div className="rounded-xl bg-[#f7f9fc] p-5">
            <h2 className="text-xl font-semibold">
              {tr(routeToHelp(state) ? "helpRoute" : "selfRoute")}
            </h2>
            <p className="mt-3">
              {tr(routeToHelp(state) ? "helpText" : "selfText")}
            </p>
            <div className="mt-4 flex flex-wrap gap-5">
              <a
                className="underline"
                href="https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers"
                target="_blank"
                rel="noreferrer"
              >
                {tr("vita")}
              </a>
              <a
                className="underline"
                href="https://www.irs.gov/filing/irs-free-file-do-your-taxes-for-free"
                target="_blank"
                rel="noreferrer"
              >
                {tr("irs")}
              </a>
              <a
                className="underline"
                href="https://tax.illinois.gov/individuals/filingrequirements.html"
                target="_blank"
                rel="noreferrer"
              >
                {tr("illinois")}
              </a>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 print:hidden">
            <button className={button} onClick={() => window.print()}>
              {tr("print")}
            </button>
            <button
              className={button}
              onClick={() =>
                download(
                  `preparation-${i18n.language}.txt`,
                  checklistText(),
                  "text/plain;charset=utf-8",
                )
              }
            >
              {tr("downloadChecklist")}
            </button>
            {ready && (
              <button
                className={button}
                disabled={busy || recorded}
                onClick={recordW2}
              >
                {tr("recordW2")}
              </button>
            )}
          </div>
        </section>
      )}
      <div className="my-8 flex flex-wrap gap-3 print:hidden">
        {state.step > 0 && (
          <button
            className={button}
            disabled={busy}
            onClick={() =>
              go(
                state.step === 7 &&
                  (state.documentStatus === "collect_later" ||
                    state.answers.employment === "no")
                  ? 5
                  : state.step - 1,
              )
            }
          >
            {tr("back")}
          </button>
        )}
        {state.step < 5 && (
          <button
            className={`${button} bg-uiuc text-white`}
            disabled={busy || !state.answers[key]}
            onClick={() => go(state.step + 1)}
          >
            {tr("next")}
          </button>
        )}
        {state.step === 5 && state.answers.employment === "no" && (
          <button className={button} onClick={() => go(7)}>
            {tr("next")}
          </button>
        )}
        {state.step === 6 && (
          <>
            <button
              className={`${button} bg-uiuc text-white`}
              disabled={!ready || busy}
              onClick={() => go(7)}
            >
              {tr("next")}
            </button>
            <button
              disabled={busy}
              className={button}
              onClick={() =>
                change({
                  ...state,
                  step: 7,
                  documentStatus: "collect_later",
                  w2: { ...state.w2, confirmed: false, recordId: null },
                })
              }
            >
              {tr("later")}
            </button>
          </>
        )}
        {state.step === 7 && (
          <button disabled={busy} className={button} onClick={() => go(0)}>
            {tr("restart")}
          </button>
        )}
      </div>
      {message && (
        <p role="status" className="my-4 rounded-xl border border-orange p-4">
          {tr(message)}
        </p>
      )}
      {busy && <p role="status">{tr("reading")}</p>}
      <aside className="mt-10 space-y-4 border-t pt-6 print:hidden">
        <p className="text-sm">
          {tr(storageBlocked ? "deviceBlocked" : "deviceSaved")}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            className={button}
            onClick={() =>
              download(
                "keenfinance-progress.json",
                JSON.stringify(backupFor(state), null, 2),
              )
            }
          >
            {tr("backup")}
          </button>
          <label className={button}>
            {tr("restore")}
            <input
              className="mt-2 block max-w-full text-sm"
              disabled={busy}
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const run = generation.current;
                try {
                  const chosen = e.target.files?.[0];
                  if (!chosen || chosen.size > 32768) throw Error();
                  const restored = restoreBackup(
                    JSON.parse(await chosen.text()),
                  );
                  if (run !== generation.current) return;
                  change(restored);
                  setRecorded(false);
                  setFile(null);
                  setExtraction(null);
                  setMessage("restored");
                } catch {
                  setMessage("restoreError");
                } finally {
                  e.target.value = "";
                }
              }}
            />
          </label>
        </div>
        <p className="text-sm text-black/70">{tr("recoveryNote")}</p>
        <p className="text-sm text-black/70">{tr("privateBackup")}</p>
        <button
          disabled={busy}
          className="underline"
          onClick={() => {
            if (window.confirm(tr("clearAsk"))) {
              change(blankPreparation());
              setFile(null);
              setExtraction(null);
              setRecorded(false);
            }
          }}
        >
          {tr("clear")}
        </button>
        <Link href="/file/advanced" className="ml-5 underline">
          {tr("advanced")}
        </Link>
      </aside>
      <p className="mt-6 text-sm">{tr("boundary")}</p>
    </main>
  );
}
