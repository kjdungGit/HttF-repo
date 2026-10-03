"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
export default function PdfEvidencePreview({
  file,
  pageNumber = 1,
  rect,
  label,
}: {
  file: File;
  pageNumber?: number;
  rect?: number[];
  label: string;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (canvas.current) canvas.current.dataset.rendered = "false";
    let task: import("pdfjs-dist").PDFDocumentLoadingTask | undefined;
    let render: import("pdfjs-dist").RenderTask | undefined;
    async function draw() {
      try {
        const pdfjs = await import("pdfjs-dist");
        if (cancelled) return;
        setLoading(true);
        setFailed(false);
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        const data = new Uint8Array(await file.arrayBuffer());
        if (cancelled) return;
        task = pdfjs.getDocument({
          data,
          standardFontDataUrl: "/pdfjs/standard_fonts/",
          wasmUrl: "/pdfjs/wasm/",
        });
        const pdf = await task.promise;
        const page = await pdf.getPage(Math.min(pageNumber, pdf.numPages));
        if (cancelled || !canvas.current) return;
        const natural = page.getViewport({ scale: 1, rotation: 0 });
        const scale = 560 / natural.width;
        const viewport = page.getViewport({ scale, rotation: 0 });
        const element = canvas.current;
        const context = element.getContext("2d");
        if (!context) return;
        element.width = viewport.width;
        element.height = viewport.height;
        render = page.render({
          canvas: element,
          canvasContext: context,
          viewport,
        });
        await render.promise;
        if (cancelled) return;
        if (rect) {
          context.strokeStyle = "#e84a27";
          context.lineWidth = 3;
          context.fillStyle = "rgba(232,74,39,0.14)";
          context.fillRect(
            rect[0] * scale,
            rect[1] * scale,
            (rect[2] - rect[0]) * scale,
            (rect[3] - rect[1]) * scale,
          );
          context.strokeRect(
            rect[0] * scale,
            rect[1] * scale,
            (rect[2] - rect[0]) * scale,
            (rect[3] - rect[1]) * scale,
          );
        }
        element.dataset.rendered = "true";
        setLoading(false);
        setFailed(false);
      } catch {
        if (!cancelled) {
          setLoading(false);
          setFailed(true);
        }
      }
    }
    void draw();
    return () => {
      cancelled = true;
      render?.cancel();
      void task?.destroy().catch(() => {});
    };
  }, [file, pageNumber, rect]);
  return (
    <figure className="rounded-xl border border-black/15 bg-white p-3">
      <figcaption className="mb-2 text-sm font-semibold">{label}</figcaption>
      {loading && (
        <p role="status" className="text-sm">
          {t("overhaul.previewLoading")}
        </p>
      )}
      {failed && (
        <p role="status" className="text-sm">
          {t("overhaul.previewUnavailable")}
        </p>
      )}
      <canvas
        ref={canvas}
        role="img"
        aria-label={label}
        hidden={failed}
        className="h-auto w-full"
      />
    </figure>
  );
}
