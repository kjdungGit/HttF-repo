"use client";
import { useCallback, useEffect, useId, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { Extraction } from '@/utils/pdf/tax-extraction.mjs';

type SavedForm = { id: string; formType: string; taxYear: number | string | null; language: string; fields: Record<string, string | number | null> };

export type UploadReview = { id: string; name: string; ownerUserId?: string; state: 'uploading' | 'review' | 'saving' | 'saved' | 'error'; extraction?: Extraction; message?: string };
export default function TaxDocumentUpload({ files, setFiles, reviews, setReviews }: {
  files: File[]; setFiles: (next: File[] | ((prev: File[]) => File[])) => void;
  reviews: UploadReview[]; setReviews: Dispatch<SetStateAction<UploadReview[]>>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [recording, setRecording] = useState(false);
  const recordLock = useRef(false);
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [savedError, setSavedError] = useState("");
  const savedExplanationId = useId();
  const [signedIn, setSignedIn] = useState(false);
  const activeUser = useRef<string | null | undefined>(undefined);
  const accountVersion = useRef(0);
  const listVersion = useRef(0);
  const listRequest = useRef<AbortController | null>(null);
  const latestReviews = useRef(reviews);
  useEffect(() => { latestReviews.current = reviews; }, [reviews]);
  const reconcileReviews = useCallback((userId: string | null) => {
    const removedNames = new Set(latestReviews.current.filter(review => review.ownerUserId && review.ownerUserId !== userId).map(review => review.name));
    if (removedNames.size) setFiles(previous => previous.filter(file => !removedNames.has(file.name)));
    setReviews(previous => previous.filter(review => !review.ownerUserId || review.ownerUserId === userId));
  }, [setFiles, setReviews]);
  const refreshSaved = useCallback(async (expectedUser?: string | null) => {
    listRequest.current?.abort();
    const version = ++listVersion.current;
    const controller = new AbortController();
    listRequest.current = controller;
    setSavedError("");
    if (expectedUser === null) { setLoadingSaved(false); return; }
    setLoadingSaved(true);
    try {
      const response = await fetch('/api/documents', { credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
      if (controller.signal.aborted || version !== listVersion.current) return;
      if (response.status === 401) { accountVersion.current += 1; activeUser.current = null; setSignedIn(false); setSavedForms([]); reconcileReviews(null); setFiles([]); return; }
      const data = await response.json();
      if (controller.signal.aborted || version !== listVersion.current) return;
      if (!response.ok) throw new Error('Could not load saved forms. Please try again.');
      if (typeof data.userId !== 'string' || !Array.isArray(data.forms)) throw new Error('Could not load saved forms. Please try again.');
      if (expectedUser && data.userId !== expectedUser) return;
      if (activeUser.current !== undefined && activeUser.current !== data.userId) accountVersion.current += 1;
      activeUser.current = data.userId;
      reconcileReviews(data.userId);
      setSignedIn(true);
      const unique = new Map<string, SavedForm>();
      for (const form of data.forms) {
        if (typeof form.id === 'string' && typeof form.formType === 'string' && form.fields && typeof form.fields === 'object') unique.set(form.id, form);
      }
      setSavedForms([...unique.values()]);
    } catch (error) {
      if (!controller.signal.aborted && version === listVersion.current) setSavedError(error instanceof Error ? error.message : 'Could not load saved forms.');
    } finally { if (!controller.signal.aborted && version === listVersion.current) setLoadingSaved(false); }
  }, [reconcileReviews, setFiles]);
  useEffect(() => {
    function sessionChanged(event: Event) {
      const userId = (event as CustomEvent<{ userId: string | null }>).detail?.userId;
      if (typeof userId !== 'string' && userId !== null) return;
      if ((activeUser.current !== undefined && activeUser.current !== userId) || userId === null) {
        accountVersion.current += 1;
        setSavedForms([]);
        setReviews([]);
        setFiles([]);
      }
      reconcileReviews(userId);
      activeUser.current = userId;
      setSignedIn(userId !== null);
      void refreshSaved(userId);
    }
    window.addEventListener('keenfinance:session-change', sessionChanged);
    const initialLoad = window.setTimeout(() => { void refreshSaved(); }, 0);
    return () => { window.clearTimeout(initialLoad); window.removeEventListener('keenfinance:session-change', sessionChanged); listRequest.current?.abort(); listVersion.current += 1; accountVersion.current += 1; };
  }, [refreshSaved, reconcileReviews, setFiles, setReviews]);
  const pending = reviews.filter(review => review.state === "review" && review.extraction && Object.values(review.extraction.fields).some(value => value !== null && value !== ""));
  const patch = (id: string, changes: Partial<UploadReview>) => setReviews(previous => previous.map(review => review.id === id ? { ...review, ...changes } : review));
  async function upload(selected: File[]) {
    if (!selected.length) return;
    const version = accountVersion.current;
    setFiles(previous => [...previous, ...selected]);
    const queued = selected.map(file => ({ file, id: crypto.randomUUID() }));
    setReviews(previous => [...previous, ...queued.map(({ file, id }) => ({ id, name: file.name, ownerUserId: activeUser.current ?? undefined, state: 'uploading' as const }))]);
    for (const { file, id } of queued) {
      if (version !== accountVersion.current) return;
      if (!file.name.toLowerCase().endsWith('.pdf') || file.size > 8*1024*1024) {
        patch(id, { state: 'error', message: 'Choose a PDF no larger than 8 MB. Photos need OCR.' }); continue;
      }
      try {
        const body = new FormData(); body.append('file', file);
        const response = await fetch('/api/documents/upload', { method: 'POST', credentials: 'same-origin', body });
        const data = await response.json();
        if (version !== accountVersion.current) return;
        if (!response.ok) throw new Error(data.error?.message || 'Document extraction failed.');
        if (typeof data.userId !== 'string' || (activeUser.current && data.userId !== activeUser.current)) throw new Error('Your account changed. Please upload this form again.');
        patch(id, { state: 'review', extraction: data.extraction, ownerUserId: data.userId });
      } catch (error) { if (version !== accountVersion.current) return; patch(id, { state: 'error', message: error instanceof Error ? error.message : 'Upload failed.' }); }
    }
  }
  async function save(review: UploadReview) {
    if (!review.extraction || review.state !== 'review') return;
    if (!review.ownerUserId || !activeUser.current || review.ownerUserId !== activeUser.current) { patch(review.id, { message: 'This review belongs to a previous account. Upload it again in your current account.' }); return; }
    const version = accountVersion.current;
    patch(review.id, { state: 'saving', message: undefined });
    try {
      const response = await fetch('/api/documents/save', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true, recordId: review.extraction.recordId, templateId: review.extraction.templateId, fields: review.extraction.fields }),
      });
      const data = await response.json();
      if (version !== accountVersion.current) return;
      if (!response.ok) throw new Error(data.error?.message || 'Could not save this form.');
      patch(review.id, { state: 'saved', message: 'Confirmed values saved to your profile.' });
      void refreshSaved(activeUser.current);
    } catch (error) { if (version !== accountVersion.current) return; patch(review.id, { state: 'review', message: error instanceof Error ? error.message : 'Save failed.' }); }
  }
  async function recordForms() {
    if (recordLock.current || !pending.length) return;
    recordLock.current = true;
    setRecording(true);
    const version = accountVersion.current;
    try { for (const review of pending) { if (version !== accountVersion.current) break; await save(review); } }
    finally { recordLock.current = false; setRecording(false); }
  }
  function edit(review: UploadReview, key: string, value: string) {
    if (!review.extraction) return;
    patch(review.id, { extraction: { ...review.extraction, fields: { ...review.extraction.fields, [key]: value || null } } });
  }
  return <div className="mt-5">
    <button type="button" disabled={recording} className={`flex w-full flex-col items-center rounded-xl border-2 border-dashed bg-white px-4 py-8 text-center ${dragging ? 'border-orange' : 'border-black/30'}`}
      onClick={() => input.current?.click()} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
      onDrop={event => { event.preventDefault(); setDragging(false); if (!recording) void upload(Array.from(event.dataTransfer.files)); }}>
      <span className="font-semibold">Drop PDFs here or browse</span><span className="mt-1 text-xs text-black/60">Sign in first. Up to 8 MB per PDF. Review values before saving.</span>
    </button>
    <input ref={input} disabled={recording} aria-label="Choose tax PDFs" className="sr-only" type="file" multiple accept=".pdf,application/pdf" onChange={event => { void upload(Array.from(event.target.files || [])); event.target.value = ''; }} />
    <section className="mt-4" aria-label="Saved tax forms" aria-busy={loadingSaved}>
      <h3 className="font-semibold">Saved to your profile</h3>
      <p id={savedExplanationId} className="mt-1 text-xs text-black/60">Checked forms are already recorded. These checkboxes show saved status; they do not select or delete forms.</p>
      {loadingSaved && <p role="status" className="mt-2 text-sm">Loading saved forms…</p>}
      {savedError && <div className="mt-2"><p role="alert" className="text-sm">{savedError}</p><button type="button" onClick={() => void refreshSaved(activeUser.current)} className="mt-2 rounded border border-black/25 px-3 py-2 text-sm">Retry loading saved forms</button></div>}
      {!loadingSaved && !savedError && savedForms.length === 0 && <p className="mt-2 text-sm text-black/60">{signedIn ? 'No saved tax forms yet.' : 'Sign in to see your saved tax forms.'}</p>}
      <ul className="mt-3 space-y-2">
        {savedForms.map(form => <li key={form.id} className="rounded-lg border border-black/15 bg-white p-3">
          <label className="flex items-center gap-3"><input type="checkbox" checked disabled aria-describedby={savedExplanationId} className="h-4 w-4 accent-navy" /><span>Form {form.formType.replaceAll('_', ' ')} · {form.taxYear ?? 'Year unknown'} · {form.language === 'es' ? 'Spanish' : 'English'} <span className="text-xs text-black/60">— Saved</span></span></label>
        </li>)}
      </ul>
    </section>
    <div className="mt-4 space-y-4" aria-live="polite">
      {reviews.filter(review => !(review.state === 'saved' && savedForms.some(form => form.id === review.extraction?.recordId))).map(review => <section key={review.id} className="rounded-lg border border-black/15 bg-white p-4">
        <h3 className="break-all font-semibold">{review.state === 'saved' && <input type="checkbox" checked disabled aria-label={`${review.name} is saved to your profile`} aria-describedby={savedExplanationId} className="mr-2 h-4 w-4 accent-navy" />}{review.name}</h3>
        {review.state === 'uploading' && <p className="text-sm">Reading PDF…</p>}
        {review.message && <p role={review.state === 'saved' ? 'status' : 'alert'} className="mt-2 text-sm">{review.message}</p>}
        {review.extraction && <>
          <p className="mt-2 text-sm">Form {review.extraction.formType.replaceAll('_', ' ')} · {review.extraction.taxYear} · {review.extraction.language === 'es' ? 'Spanish' : 'English'}</p>
          {review.state !== 'saved' && <>
            <p className="mt-2 text-xs">Review the numbers against your PDF. Blank means unknown, not zero. Use a decimal point for cents.</p>
            <details className="mt-3" open><summary className="cursor-pointer text-sm font-semibold">Review mapped fields ({Object.values(review.extraction.fields).filter(value => value !== null && value !== '').length} filled)</summary>
              <div className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-2">
                {Object.entries(review.extraction.fields).map(([key, value]) => <label key={key} className="block text-sm">
                  {key.replaceAll('_', ' ')} <span className="text-xs text-black/50">(line {review.extraction?.evidence[key]?.line}, page {review.extraction?.evidence[key]?.page})</span>
                  <input aria-label={key.replaceAll('_', ' ')} disabled={recording || review.state === 'saving'} type="text" inputMode="decimal" value={value ?? ''} onChange={event => edit(review, key, event.target.value)} className="mt-1 block w-full rounded border border-black/25 px-3 py-2" />
                </label>)}
              </div>
            </details>
            <p className="mt-3 text-xs text-black/60">{review.extraction.warnings.join(' ')}</p>

          </>}
        </>}
      </section>)}
    </div>
    {files.length > 0 && <p className="mt-2 text-xs text-black/60">{files.length} selected file(s). Originals are processed for this request and are not stored.</p>}
    <p className="mt-4 text-xs text-black/60">By recording, you confirm the reviewed values are ready to save to your profile.</p>
    <button type="button" disabled={recording || loadingSaved || !signedIn || reviews.some(review => review.state === 'uploading') || !pending.length} onClick={() => void recordForms()} className="mt-2 w-full rounded-lg bg-navy px-4 py-3 font-semibold text-white disabled:opacity-50">
      {recording ? 'Recording forms…' : 'Record forms'}
    </button>
  </div>;
}
