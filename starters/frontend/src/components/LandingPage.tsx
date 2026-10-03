"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";

import TaxDocumentUpload, { type UploadReview } from "./guide/TaxDocumentUpload";

type TabId = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "bank" | "docs";

type NavItem = {
  id: TabId;
  label: string;
  indent: boolean;
};

const TAX_FILES = [
  {
    name: "Form W-2",
    summary:
      "Wage and tax statement from each employer. Use it for wages, federal income tax withheld, Social Security, and Medicare wages.",
  },
  {
    name: "Form 1099-NEC or 1099-MISC",
    summary:
      "Nonemployee compensation and miscellaneous income. Needed if you were paid as a contractor, freelancer, or received prizes or rents.",
  },
  {
    name: "Form 1099-INT / 1099-DIV",
    summary:
      "Interest and dividend statements from banks and brokerages. These report taxable investment income and any tax already withheld.",
  },
  {
    name: "Form 1098",
    summary:
      "Mortgage interest statement from your lender. This supports the mortgage interest deduction if you itemize.",
  },
  {
    name: "Form 1098-T / 1098-E",
    summary:
      "Tuition and student loan interest statements. Use these for education credits and the student loan interest deduction.",
  },
  {
    name: "Prior-year return",
    summary:
      "Last year’s Form 1040 (or a transcript). Helps match your AGI, filing status, dependents, and carryovers.",
  },
  {
    name: "Government ID",
    summary:
      "Driver’s license or state ID. Some e-file providers use it to verify identity before submitting your return.",
  },
];

export default function LandingPage() {
  const [active, setActive] = useState<TabId>("1");
  const [showBank, setShowBank] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadReviews, setUploadReviews] = useState<UploadReview[]>([]);
  const [bank, setBank] = useState({
    holder: "",
    institution: "",
    routing: "",
    account: "",
    type: "checking",
  });

  const items = useMemo<NavItem[]>(() => {
    const start: NavItem[] = [{ id: "1", label: "1", indent: false }];
    if (showBank) start.push({ id: "bank", label: "1a", indent: true });
    if (showDocs) start.push({ id: "docs", label: "1b", indent: true });
    const rest: NavItem[] = [
      { id: "2", label: "2", indent: false },
      { id: "3", label: "3", indent: false },
      { id: "4", label: "4", indent: false },
      { id: "5", label: "5", indent: false },
      { id: "6", label: "6", indent: false },
      { id: "7", label: "7", indent: false },
    ];
    return [...start, ...rest];
  }, [showBank, showDocs]);

  function openTab(id: TabId) {
    setActive((current) => (current === id ? current : id));
  }

  function chooseBanking() {
    setSkipped(false);
    setShowBank(true);
    setActive("bank");
  }

  function chooseDocuments() {
    setSkipped(false);
    setShowDocs(true);
    setActive("docs");
  }

  function chooseSkip() {
    setSkipped(true);
    setShowBank(false);
    setShowDocs(false);
    setActive("1");
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange">
          Guided filing
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
          KEENFinance
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-navy/75">
          A short path from documents to a finished return. Open a step on the
          left; it expands to the right so you only see what you need.
        </p>

        <div className="mt-10 flex flex-col gap-2">
          {items.map((item) => {
            const isActive = active === item.id;
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 ${item.indent ? "ml-10" : ""}`}
              >
                <button
                  type="button"
                  aria-expanded={isActive}
                  aria-controls={`panel-${item.id}`}
                  onClick={() => openTab(item.id)}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                    isActive
                      ? "bg-orange text-white shadow-[0_0_0_3px_rgba(232,74,39,0.22)]"
                      : "border border-navy/20 bg-white text-navy hover:border-uiuc hover:text-uiuc"
                  }`}
                >
                  {item.label}
                </button>

                {isActive ? (
                  <div id={`panel-${item.id}`} className="min-w-0 flex-1">
                    <section className="rounded-2xl border border-[#d7dde8] bg-[#f7f8fb] p-5 shadow-sm sm:p-7">
                      {item.id === "1" ? (
                        <StartPanel
                          skipped={skipped}
                          onBank={chooseBanking}
                          onDocs={chooseDocuments}
                          onSkip={chooseSkip}
                        />
                      ) : null}
                      {item.id === "bank" ? (
                        <BankingPanel bank={bank} setBank={setBank} />
                      ) : null}
                      {item.id === "docs" ? (
                        <DocumentsPanel files={files} setFiles={setFiles} reviews={uploadReviews} setReviews={setUploadReviews} />
                      ) : null}
                      {item.id !== "1" &&
                      item.id !== "bank" &&
                      item.id !== "docs" ? (
                        <div className="min-h-40" aria-hidden="true" />
                      ) : null}
                    </section>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function StartPanel({
  skipped,
  onBank,
  onDocs,
  onSkip,
}: {
  skipped: boolean;
  onBank: () => void;
  onDocs: () => void;
  onSkip: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-navy">Start with what you have</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-navy/70">
        Connect a bank account, drop in tax forms, or skip this step and come
        back later. Choosing bank or documents opens a nested tab just below
        this one.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ChoiceButton
          title="Enter banking information"
          detail="Opens an indented tab for routing and account details."
          onClick={onBank}
        />
        <ChoiceButton
          title="Upload documents"
          detail="Opens an indented tab with file types and an upload area."
          onClick={onDocs}
        />
        <ChoiceButton
          title="Skip for now"
          detail="Leave this step empty and continue with the numbered tabs."
          onClick={onSkip}
          muted
        />
      </div>
      {skipped ? (
        <p className="mt-4 text-sm font-medium text-uiuc">
          Step 1 skipped. You can still open it anytime.
        </p>
      ) : null}
    </div>
  );
}

function ChoiceButton({
  title,
  detail,
  onClick,
  muted = false,
}: {
  title: string;
  detail: string;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-4 text-left transition hover:-translate-y-0.5 ${
        muted
          ? "border-navy/15 bg-white text-navy hover:border-navy/40"
          : "border-uiuc/25 bg-white text-navy hover:border-orange hover:shadow-md"
      }`}
    >
      <span className="block font-semibold">{title}</span>
      <span className="mt-1 block text-xs leading-relaxed text-navy/65">
        {detail}
      </span>
    </button>
  );
}

function BankingPanel({
  bank,
  setBank,
}: {
  bank: {
    holder: string;
    institution: string;
    routing: string;
    account: string;
    type: string;
  };
  setBank: Dispatch<
    SetStateAction<{
      holder: string;
      institution: string;
      routing: string;
      account: string;
      type: string;
    }>
  >;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-navy">Banking information</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-navy/70">
        Direct deposit uses these details for a refund. Enter the same routing
        and account numbers printed on a check or in your bank app.
      </p>
      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <Field
          label="Account holder name"
          value={bank.holder}
          onChange={(value) => setBank((prev) => ({ ...prev, holder: value }))}
        />
        <Field
          label="Bank or credit union"
          value={bank.institution}
          onChange={(value) =>
            setBank((prev) => ({ ...prev, institution: value }))
          }
        />
        <Field
          label="Routing number"
          value={bank.routing}
          inputMode="numeric"
          onChange={(value) => setBank((prev) => ({ ...prev, routing: value }))}
        />
        <Field
          label="Account number"
          value={bank.account}
          inputMode="numeric"
          onChange={(value) => setBank((prev) => ({ ...prev, account: value }))}
        />
        <label className="block text-sm font-medium text-navy">
          Account type
          <select
            className="mt-1 w-full rounded-lg border border-navy/20 bg-white px-3 py-2 text-sm outline-none focus:border-orange"
            value={bank.type}
            onChange={(event) =>
              setBank((prev) => ({ ...prev, type: event.target.value }))
            }
          >
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
          </select>
        </label>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="block text-sm font-medium text-navy">
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-navy/20 bg-white px-3 py-2 text-sm outline-none focus:border-orange"
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function DocumentsPanel({
  files,
  setFiles,
  reviews,
  setReviews,
}: {
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
  reviews: UploadReview[];
  setReviews: Dispatch<SetStateAction<UploadReview[]>>;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-navy">Upload tax documents</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy/70">
        Add PDFs of the forms you received this year. Below is what
        each common file is and why it matters on a return.
      </p>

      <TaxDocumentUpload files={files} setFiles={setFiles} reviews={reviews} setReviews={setReviews} />

      <ul className="mt-6 space-y-3">
        {TAX_FILES.map((doc) => (
          <li
            key={doc.name}
            className="rounded-lg border border-navy/10 bg-white px-4 py-3"
          >
            <p className="text-sm font-semibold text-orange">{doc.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-navy/75">
              {doc.summary}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
