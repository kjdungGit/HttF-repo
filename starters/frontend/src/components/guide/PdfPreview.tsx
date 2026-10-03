"use client";

import { useEffect, useRef, useState } from "react";

export function PdfPreview({ url, title }: { url: string; title: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const update = () => {
      const next = Math.floor(host.clientWidth);
      setWidth((current) => (Math.abs(current - next) < 8 ? current : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || width < 80) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;

    (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
      const task = pdfjs.getDocument({ url });
      destroy = () => task.destroy();
      const pdf = await task.promise;
      if (cancelled || !host) return;
      host.replaceChildren();
      for (let number = 1; number <= pdf.numPages; number++) {
        const page = await pdf.getPage(number);
        if (cancelled) return;
        const unscaled = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: width / unscaled.width });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = "mb-3 block w-full bg-white";
        canvas.setAttribute("aria-label", `${title} page ${number}`);
        host.append(canvas);
        const context = canvas.getContext("2d");
        if (!context) continue;
        await page.render({ canvas, viewport }).promise;
      }
    })().catch(() => {
      /* keep the host empty if the preview cannot load */
    });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [url, title, width]);

  return <div ref={hostRef} className="min-h-48 w-full bg-white" />;
}
