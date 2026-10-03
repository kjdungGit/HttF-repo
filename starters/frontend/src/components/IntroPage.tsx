"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function IntroPage() {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const node = endRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setAtEnd(entry.isIntersecting),
      { threshold: 0.65 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function startFiling() {
    setLeaving(true);
    window.setTimeout(() => router.push("/file"), 420);
  }

  return (
    <main className={`bg-white ${leaving ? "keen-leave" : ""}`}>
      <div className="mx-auto max-w-3xl px-6 py-12 pb-36">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange">
          Champaign · tax year 2025
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Filing Illinois taxes without the panic
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-black/75">
          If you had a campus job, internship, side hustle, or first full-time
          paycheck in 2025 and you lived around Champaign, this walkthrough is
          for you. KEENFinance does not file for you. It lines up the questions,
          forms, and official links so you can file with confidence.
        </p>

        <section className="mt-10 rounded-2xl border border-black/15 bg-white p-6 shadow-[4px_4px_0_0_#0a0a0a]">
          <h2 className="text-xl font-bold text-ink">Is filing taxes for me?</h2>
          <p className="mt-2 text-sm font-semibold text-uiuc">Yes, if…</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-black/80">
            <li>You earned money in 2025 — wages, tips, gig pay, interest, or unemployment.</li>
            <li>You lived in Illinois for all or part of 2025, including as a student in Champaign.</li>
            <li>You are a young adult and a parent might still claim you. You may still need to file.</li>
            <li>You want to check credits like the earned income credit, student-loan interest, or Illinois work credits.</li>
            <li>You have not already filed an original 2025 return.</li>
          </ul>
          <p className="mt-4 text-sm font-semibold text-orange">Pause and get extra help if…</p>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-black/80">
            <li>You moved between states, had gig expenses, crypto, rentals, or Marketplace insurance (Form 1095-A).</li>
            <li>You already filed, or you need someone to click Submit — that happens at IRS, MyTax Illinois, or a VITA site.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-ink">What actually happens</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-black/75">
            You are reporting money earned in <strong>calendar year 2025</strong>.
            Most people file two returns: a federal <strong>Form 1040</strong> and
            an Illinois <strong>IL-1040</strong>. Illinois starts from federal
            income, then uses its own exemptions. The state rate for 2025 is
            4.95%. The usual filing and payment date is{" "}
            <strong>April 15, 2026</strong>. An extension (if you still qualify)
            generally moves the paperwork deadline, not the payment deadline.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-black/75">
            Living in Champaign today does not automatically mean you were a
            full-year Illinois resident in 2025. If you moved, worked in another
            state, or are on a visa, we will flag that as “review needed” and
            still give you a document list.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-ink">What we do, and what you do</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-uiuc/30 bg-[#f7f9fc] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-uiuc">
                KEENFinance
              </p>
              <p className="mt-2 text-sm leading-relaxed text-black/75">
                Walk you through residency, household, income, and possible
                credits. Build a personalized checklist. Point to official 2025
                forms. Explain benefits in plain language — never as a promised
                refund.
              </p>
            </div>
            <div className="rounded-xl border border-orange/40 bg-[#fff7f4] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-orange">
                You
              </p>
              <p className="mt-2 text-sm leading-relaxed text-black/75">
                Gather the real W-2s and 1099s, confirm the facts, then file on
                IRS Free File, MyTax Illinois, or with a free VITA helper. Do
                not enter a real SSN or bank login here — this is a guide, not
                the government.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-ink">Words you will see</h2>
          <dl className="mt-4 space-y-3 text-sm leading-relaxed">
            <div>
              <dt className="font-semibold text-ink">Credit</dt>
              <dd className="text-black/70">Lowers tax you owe. Some credits can increase a refund.</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Deduction</dt>
              <dd className="text-black/70">Taken off income before tax is calculated. It is not cash handed to you.</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Withholding</dt>
              <dd className="text-black/70">Tax already taken from your paycheck.</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Appears eligible</dt>
              <dd className="text-black/70">
                Our supported checks passed based on what you confirmed. It is
                not a filed, reviewed, or accepted return.
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-10 border-t border-black pt-8" ref={endRef}>
          <h2 className="text-xl font-bold text-ink">Ready when you are</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-black/75">
            Next you will answer a short checklist. Each circle turns into a
            green check when that step is done. Pick one path at a time — if you
            change your mind, the other subtab closes. At the end you get a
            recap of what you told us and which official forms to use. Then you
            file for real.
          </p>
        </section>
      </div>

      {atEnd && !leaving ? (
        <button
          type="button"
          onClick={startFiling}
          className="keen-bounce fixed bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-ink"
        >
          <span className="text-sm font-semibold">I&apos;m ready to file my taxes!</span>
          <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-white text-2xl text-orange shadow-[3px_3px_0_0_#0a0a0a]">
            ↓
          </span>
        </button>
      ) : null}

      {leaving ? (
        <div className="pointer-events-none fixed inset-0 z-30 bg-white/90" />
      ) : null}
    </main>
  );
}
