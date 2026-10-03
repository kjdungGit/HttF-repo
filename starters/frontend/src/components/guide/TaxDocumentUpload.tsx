"use client";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useTranslation } from "react-i18next";
import {
  extractTaxPdf,
  confirmedRecord,
  type Extraction,
} from "@/utils/pdf/tax-extraction.mjs";
import {
  readLocalForms,
  recordLocalForm,
  formsBackup,
  restoreFormsBackup,
  FORMS_KEY,
  type LocalForm,
} from "@/utils/preparation/local-forms.mjs";
import { download } from "./PreparationControls";
export type UploadReview = {
  id: string;
  name: string;
  state: "uploading" | "review" | "saving" | "saved" | "error";
  extraction?: Extraction;
  message?: string;
};
export default function TaxDocumentUpload({
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
  const tr = (key: string) => t(`localForms.${key}`);
  const input = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  const recordLock = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [recording, setRecording] = useState(false);
  const [savedForms, setSavedForms] = useState<LocalForm[]>([]);
  const [savedError, setSavedError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const explanation = useId();
  const refresh = useCallback(() => {
    try {
      setSavedForms(readLocalForms());
      setSavedError("");
    } catch {
      setSavedError("storageError");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    const counter = generation;
    const stored = (event: StorageEvent) => {
      if (event.key === FORMS_KEY) refresh();
    };
    window.addEventListener("storage", stored);
    window.addEventListener("keenfinance:forms-change", refresh);
    return () => {
      window.clearTimeout(timer);
      ++counter.current;
      window.removeEventListener("storage", stored);
      window.removeEventListener("keenfinance:forms-change", refresh);
    };
  }, [refresh]);
  const patch = (id: string, changes: Partial<UploadReview>) =>
    setReviews((previous) =>
      previous.map((review) =>
        review.id === id ? { ...review, ...changes } : review,
      ),
    );
  const pending = reviews.filter(
    (review) =>
      review.state === "review" &&
      review.extraction &&
      Object.values(review.extraction.fields).some(
        (value) => value !== null && value !== "",
      ),
  );
  async function upload(selected: File[]) {
    if (!selected.length) return;
    const run = generation.current;
    setFiles((previous) => [...previous, ...selected]);
    const queued = selected.map((file) => ({ file, id: crypto.randomUUID() }));
    setReviews((previous) => [
      ...previous,
      ...queued.map(({ file, id }) => ({
        id,
        name: file.name,
        state: "uploading" as const,
      })),
    ]);
    for (const { file, id } of queued) {
      if (run !== generation.current) return;
      try {
        if (
          !file.name.toLowerCase().endsWith(".pdf") ||
          file.size > 8 * 1024 * 1024
        )
          throw Error();
        const extraction = await extractTaxPdf(
          new Uint8Array(await file.arrayBuffer()),
        );
        if (run !== generation.current) return;
        patch(id, { state: "review", extraction });
      } catch {
        if (run !== generation.current) return;
        patch(id, { state: "error", message: "readError" });
      }
    }
  }
  function recordForms() {
    if (recordLock.current || !pending.length) return;
    recordLock.current = true;
    setRecording(true);
    for (const review of pending) {
      try {
        const result = confirmedRecord({
          confirmed: true,
          recordId: review.extraction!.recordId,
          templateId: review.extraction!.templateId,
          fields: review.extraction!.fields,
        });
        recordLocalForm({ ...result.record, source: "pdf" });
        patch(review.id, { state: "saved", message: "saved" });
      } catch {
        patch(review.id, { state: "review", message: "saveError" });
      }
    }
    recordLock.current = false;
    setRecording(false);
    refresh();
    window.dispatchEvent(new Event("keenfinance:forms-change"));
  }
  return (
    <div className="mt-5">
      <button
        type="button"
        disabled={recording}
        className={`flex w-full flex-col items-center rounded-xl border-2 border-dashed bg-white px-4 py-8 text-center ${dragging ? "border-orange" : "border-black/30"}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!recording) void upload(Array.from(e.dataTransfer.files));
        }}
      >
        <span className="font-semibold">{tr("drop")}</span>
        <span className="mt-2 text-sm text-black/70">{tr("hint")}</span>
      </button>
      <input
        ref={input}
        disabled={recording}
        aria-label={tr("choose")}
        className="sr-only"
        type="file"
        multiple
        accept=".pdf,application/pdf"
        onChange={(e) => {
          void upload(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <section className="mt-5" aria-label={tr("savedHeading")}>
        <h3 className="font-semibold">{tr("savedHeading")}</h3>
        <p id={explanation} className="mt-2 text-sm text-black/70">
          {tr("checkedHint")}
        </p>
        {savedError && <p role="alert">{tr(savedError)}</p>}
        {loaded && !savedForms.length && !savedError && (
          <p className="mt-2 text-sm">{tr("empty")}</p>
        )}
        <ul className="mt-3 space-y-2">
          {savedForms.map((form) => (
            <li key={form.id} className="rounded-lg border p-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked
                  disabled
                  aria-describedby={explanation}
                />
                <span>
                  {form.form_type.replaceAll("_", " ")} · {form.tax_year} ·{" "}
                  {form.language === "es" ? "Español" : "English"} —{" "}
                  {tr("saved")}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>
      <div className="mt-4 space-y-4" aria-live="polite">
        {reviews
          .filter(
            (review) =>
              !(
                review.state === "saved" &&
                savedForms.some(
                  (form) => form.id === review.extraction?.recordId,
                )
              ),
          )
          .map((review) => (
            <section key={review.id} className="rounded-xl border p-4">
              <h3 className="break-all font-semibold">{review.name}</h3>
              {review.state === "uploading" && (
                <p role="status">{tr("reading")}</p>
              )}
              {review.message && (
                <p
                  role={review.state === "error" ? "alert" : "status"}
                  className="mt-2 text-sm"
                >
                  {tr(review.message)}
                </p>
              )}
              {review.extraction && (
                <>
                  <p className="mt-2 text-sm">
                    {review.extraction.formType.replaceAll("_", " ")} ·{" "}
                    {review.extraction.taxYear}
                  </p>
                  {review.state !== "saved" && (
                    <>
                      <p className="mt-2 text-sm">{tr("reviewHint")}</p>
                      <details className="mt-3" open>
                        <summary className="cursor-pointer font-semibold">
                          {tr("reviewFields")}
                        </summary>
                        <div className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-2">
                          {Object.entries(review.extraction.fields).map(
                            ([key, value]) => (
                              <label key={key} className="block text-sm">
                                {key.replaceAll("_", " ")}{" "}
                                <span className="text-black/60">
                                  ({tr("page")}{" "}
                                  {review.extraction?.evidence[key]?.page})
                                </span>
                                <input
                                  aria-label={key.replaceAll("_", " ")}
                                  disabled={recording}
                                  type="text"
                                  inputMode="decimal"
                                  value={value ?? ""}
                                  onChange={(e) =>
                                    patch(review.id, {
                                      message: undefined,
                                      extraction: {
                                        ...review.extraction!,
                                        fields: {
                                          ...review.extraction!.fields,
                                          [key]: e.target.value || null,
                                        },
                                      },
                                    })
                                  }
                                  className="mt-2 block w-full rounded-lg border p-3"
                                />
                              </label>
                            ),
                          )}
                        </div>
                      </details>
                    </>
                  )}
                </>
              )}
            </section>
          ))}
      </div>
      {files.length > 0 && (
        <p className="mt-3 text-sm text-black/70">{tr("originals")}</p>
      )}
      <p className="mt-4 text-sm">{tr("confirmation")}</p>
      <button
        type="button"
        disabled={
          recording ||
          !loaded ||
          reviews.some((review) => review.state === "uploading") ||
          !pending.length
        }
        onClick={recordForms}
        className="mt-3 w-full rounded-xl bg-navy px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {tr(recording ? "recording" : "record")}
      </button>
      <div className="mt-5 flex flex-wrap gap-4">
        <button
          type="button"
          className="underline"
          onClick={() => {
            try {
              download(
                "keenfinance-forms.json",
                JSON.stringify(formsBackup(), null, 2),
              );
            } catch {
              setSavedError("storageError");
            }
          }}
        >
          {tr("export")}
        </button>
        <label className="underline">
          {tr("restore")}
          <input
            className="mt-2 block max-w-full text-sm"
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              try {
                const file = e.target.files?.[0];
                if (!file || file.size > 512 * 1024) throw Error();
                restoreFormsBackup(JSON.parse(await file.text()));
                refresh();
                window.dispatchEvent(new Event("keenfinance:forms-change"));
              } catch {
                setSavedError("restoreError");
              } finally {
                e.target.value = "";
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}
