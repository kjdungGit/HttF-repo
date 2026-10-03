"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import TaxDocumentUpload, { type UploadReview } from "./TaxDocumentUpload";
import {
  Card,
  CheckIcon,
  ChoiceButton,
  CompleteButton,
  DatePicker,
  Field,
  NumberStepper,
  Term,
  TriState,
} from "./ui";

type Tri = "" | "yes" | "no" | "unsure";
type Id =
  | "1"
  | "1a"
  | "2"
  | "2a"
  | "2b"
  | "3"
  | "3a"
  | "3b"
  | "4"
  | "4a"
  | "4b"
  | "4c"
  | "5"
  | "5a"
  | "5b"
  | "5c"
  | "5d"
  | "6"
  | "6a"
  | "6b"
  | "6c"
  | "7";

type ChildFact = { dob: string; monthsHome: number };

type Answers = {
  taxYear2025: Tri;
  livedIL: Tri;
  usResident: Tri;
  alreadyFiled: Tri;
  extension: Tri;
  otherStates: string;
  married: Tri;
  couldBeClaimed: Tri;
  wasClaimed: Tri;
  dob: string;
  blindness: Tri;
  hasKids: Tri;
  childCount: number;
  children: ChildFact[];
  foreignIncome: Tri;
  incomeTypes: string[];
  wages: number;
  otherIncome: number;
  investmentIncome: number;
  studentLoans: Tri;
  loanInterest: number;
  college: Tri;
  retirement: Tri;
  homeowner: Tri;
  propertyTax: number;
  childcare: Tri;
  k12: Tri;
  tips: Tri;
  marketplace: Tri;
};

type NavItem = { id: Id; label: string; title: string; indent: boolean };

const MAIN: { id: Id; label: string; title: string }[] = [
  { id: "1", label: "1", title: "Gather documents" },
  { id: "2", label: "2", title: "Confirm 2025 Illinois year" },
  { id: "3", label: "3", title: "Household snapshot" },
  { id: "4", label: "4", title: "Where the money came from" },
  { id: "5", label: "5", title: "Credits worth screening" },
  { id: "6", label: "6", title: "Checklist and how you will file" },
  { id: "7", label: "7", title: "Your preparation recap" },
];

const NEXT_MAIN: Record<string, Id | null> = {
  "1": "2",
  "2": "3",
  "3": "4",
  "4": "5",
  "5": "6",
  "6": "7",
  "7": null,
};

const PARENT: Partial<Record<Id, Id>> = {
  "1a": "1",
  "2a": "2",
  "2b": "2",
  "3a": "3",
  "3b": "3",
  "4a": "4",
  "4b": "4",
  "4c": "4",
  "5a": "5",
  "5b": "5",
  "5c": "5",
  "5d": "5",
  "6a": "6",
  "6b": "6",
  "6c": "6",
};

const INCOME_OPTIONS = [
  "Wages from a job (W-2)",
  "Tips",
  "Side job / gig / 1099",
  "Bank interest",
  "Unemployment",
  "Retirement or Social Security",
];

const EMPTY: Answers = {
  taxYear2025: "",
  livedIL: "",
  usResident: "",
  alreadyFiled: "",
  extension: "",
  otherStates: "",
  married: "",
  couldBeClaimed: "",
  wasClaimed: "",
  dob: "",
  blindness: "",
  hasKids: "",
  childCount: 0,
  children: [],
  foreignIncome: "",
  incomeTypes: [],
  wages: 0,
  otherIncome: 0,
  investmentIncome: 0,
  studentLoans: "",
  loanInterest: 0,
  college: "",
  retirement: "",
  homeowner: "",
  propertyTax: 0,
  childcare: "",
  k12: "",
  tips: "",
  marketplace: "",
};

export default function GuidePage() {
  const [active, setActive] = useState<Id>("1");
  const [openChild, setOpenChild] = useState<Partial<Record<Id, Id>>>({});
  const [done, setDone] = useState<Set<Id>>(new Set());
  const [files, setFiles] = useState<File[]>([]);
  const [uploadReviews, setUploadReviews] = useState<UploadReview[]>([]);
  const [answers, setAnswers] = useState<Answers>(EMPTY);

  const items = useMemo<NavItem[]>(() => {
    const childMeta: Record<string, { label: string; title: string }> = {
      "1a": { label: "1a", title: "Upload tax documents" },
      "2a": { label: "2a", title: "Full-year Illinois" },
      "2b": { label: "2b", title: "Moved or multi-state" },
      "3a": { label: "3a", title: "Filing on your own" },
      "3b": { label: "3b", title: "Someone may claim you" },
      "4a": { label: "4a", title: "Mostly a W-2 job" },
      "4b": { label: "4b", title: "Gig or 1099 work" },
      "4c": { label: "4c", title: "A mix of income" },
      "5a": { label: "5a", title: "Simple W-2 path" },
      "5b": { label: "5b", title: "School, loans, savings" },
      "5c": { label: "5c", title: "Kids, care, or a home" },
      "5d": { label: "5d", title: "Needs a human review" },
      "6a": { label: "6a", title: "File it yourself" },
      "6b": { label: "6b", title: "Free in-person help" },
      "6c": { label: "6c", title: "Already filed or waiting" },
    };
    const list: NavItem[] = [];
    for (const step of MAIN) {
      list.push({ ...step, indent: false });
      const child = openChild[step.id];
      if (child && childMeta[child]) {
        list.push({
          id: child,
          label: childMeta[child].label,
          title: childMeta[child].title,
          indent: true,
        });
      }
    }
    return list;
  }, [openChild]);

  function set<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function choose(parent: Id, child: Id) {
    setOpenChild((prev) => ({ ...prev, [parent]: child }));
    setDone((prev) => {
      const next = new Set(prev);
      next.delete(parent);
      for (const [id, owner] of Object.entries(PARENT)) {
        if (owner === parent) next.delete(id as Id);
      }
      return next;
    });
    setActive(child);
  }

  function complete(id: Id) {
    setDone((prev) => {
      const next = new Set(prev);
      next.add(id);
      const parent = PARENT[id];
      if (parent) next.add(parent);
      return next;
    });
    const parent = PARENT[id] ?? id;
    const following = NEXT_MAIN[parent];
    if (following) setActive(following);
  }

  function skipStepOne() {
    setOpenChild((prev) => {
      const next = { ...prev };
      delete next["1"];
      return next;
    });
    complete("1");
  }

  function toggleIncome(label: string) {
    setAnswers((prev) => {
      const has = prev.incomeTypes.includes(label);
      return {
        ...prev,
        incomeTypes: has
          ? prev.incomeTypes.filter((item) => item !== label)
          : [...prev.incomeTypes, label],
      };
    });
  }

  function submitChildCount(count: number) {
    setAnswers((prev) => {
      const children = [...prev.children];
      while (children.length < count) children.push({ dob: "", monthsHome: 0 });
      return { ...prev, childCount: count, children: children.slice(0, count) };
    });
  }

  function updateChild(index: number, patch: Partial<ChildFact>) {
    setAnswers((prev) => ({
      ...prev,
      children: prev.children.map((child, childIndex) =>
        childIndex === index ? { ...child, ...patch } : child,
      ),
    }));
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-white keen-enter">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange">
          Preparation checklist
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-ink">
          Seven steps, then you file
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-black/70">
          This is a Champaign / Illinois screener for tax year 2025 — not a filed
          return. Click a dotted{" "}
          <Term word="blue word">
            Those links open a short explanation of the tax idea and how to
            answer. Close it by clicking the word again.
          </Term>{" "}
          anytime you want more detail.
        </p>

        <div className="relative mt-10 flex flex-col gap-2">
          <div className="pointer-events-none absolute bottom-3 left-[17px] top-3 w-px bg-black/20" />
          {items.map((item) => {
            const isActive = active === item.id;
            const isDone = done.has(item.id);
            return (
              <div
                key={item.id}
                className={`relative z-10 flex items-start gap-3 ${item.indent ? "ml-10" : ""}`}
              >
                <button
                  type="button"
                  aria-expanded={isActive}
                  aria-label={`${item.label} ${item.title}${isDone ? ", complete" : ""}`}
                  onClick={() => setActive(item.id)}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                    isDone
                      ? "bg-check text-white"
                      : isActive
                        ? "bg-orange text-white shadow-[0_0_0_3px_rgba(232,74,39,0.25)]"
                        : "border-2 border-black bg-white text-ink hover:border-orange"
                  } ${isDone && isActive ? "shadow-[0_0_0_3px_rgba(232,74,39,0.25)]" : ""}`}
                >
                  {isDone ? <CheckIcon /> : item.label}
                </button>
                <p className="mt-1.5 hidden w-40 shrink-0 text-sm font-medium text-black sm:block">
                  {item.title}
                </p>
                {isActive ? (
                  <div id={`panel-${item.id}`} className="min-w-0 flex-1">
                    <section className="overflow-visible rounded-2xl border border-black/20 bg-[#f6f7f9] p-5 sm:p-7">
                      <Panel
                        id={item.id}
                        answers={answers}
                        files={files}
                        openChild={openChild}
                        set={set}
                        setFiles={setFiles}
                        uploadReviews={uploadReviews}
                        setUploadReviews={setUploadReviews}
                        choose={choose}
                        complete={complete}
                        skipStepOne={skipStepOne}
                        toggleIncome={toggleIncome}
                        submitChildCount={submitChildCount}
                        updateChild={updateChild}
                      />
                    </section>
                  </div>
                ) : (
                  <div className="flex-1 sm:hidden">
                    <p className="mt-1.5 text-sm font-medium text-black">{item.title}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function Panel({
  id,
  answers,
  files,
  openChild,
  set,
  setFiles,
  uploadReviews,
  setUploadReviews,
  choose,
  complete,
  skipStepOne,
  toggleIncome,
  submitChildCount,
  updateChild,
}: {
  id: Id;
  answers: Answers;
  files: File[];
  openChild: Partial<Record<Id, Id>>;
  set: <K extends keyof Answers>(key: K, value: Answers[K]) => void;
  setFiles: (next: File[] | ((prev: File[]) => File[])) => void;
  uploadReviews: UploadReview[];
  setUploadReviews: Dispatch<SetStateAction<UploadReview[]>>;
  choose: (parent: Id, child: Id) => void;
  complete: (id: Id) => void;
  skipStepOne: () => void;
  toggleIncome: (label: string) => void;
  submitChildCount: (count: number) => void;
  updateChild: (index: number, patch: Partial<ChildFact>) => void;
}) {
  if (id === "1") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">Gather payer documents — or skip ahead</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          IRS and Illinois want forms from whoever paid you, not a screenshot of
          your checking app. Upload what you already have, or skip and we will
          build a list as you answer. A blank IRS PDF is not a substitute for an
          employer{" "}
          <Term word="W-2">
            A W-2 is the year-end form your employer prepares. It shows wages and
            tax already withheld. Get it from payroll. If it never arrives, ask
            them first; Form 4852 is a last-resort substitute, not a homemade W-2.
          </Term>
          .
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ChoiceButton
            title="Upload documents"
            detail="Opens 1a. Upload a PDF, review its values, then save to your profile."
            selected={openChild["1"] === "1a"}
            onClick={() => choose("1", "1a")}
          />
          <ChoiceButton
            title="Skip for now"
            detail="Marks step 1 complete. You can still upload later by reopening this step."
            onClick={skipStepOne}
          />
        </div>
      </div>
    );
  }

  if (id === "1a") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">Upload what the payer sent you</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          Only attach copies you actually received. Skim the names below if you
          are not sure whether you need a form. Nothing here is sent to the IRS.
        </p>
        <TaxDocumentUpload files={files} setFiles={setFiles} reviews={uploadReviews} setReviews={setUploadReviews} />
        <ul className="mt-6 space-y-3">
          {[
            ["Form W-2", "Job wages and withholding. Employer/payroll portal; request a replacement if missing."],
            ["1099-NEC / 1099-K / 1099-MISC", "Side jobs and platforms, plus your own income/expense notes."],
            ["1099-INT", "Bank interest. Download from the bank tax-document portal."],
            ["1098-E", "Student-loan interest. Interest under $600 can still count even without this form."],
            ["1098-T", "College tuition billed. You still need what you actually paid and any grants."],
            ["1099-G", "Unemployment from the issuing state agency’s document portal."],
            ["1095-A", "Marketplace health coverage. Required if you had advance premium credits."],
            ["Prior-year return", "Helps match last year’s AGI if software asks. Optional."],
          ].map(([name, summary]) => (
            <li key={name} className="rounded-lg border border-black/10 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-orange">{name}</p>
              <p className="mt-1 text-sm leading-relaxed text-black/70">{summary}</p>
            </li>
          ))}
        </ul>
        <CompleteButton onClick={() => complete("1a")}>I have what I need for now</CompleteButton>
      </div>
    );
  }

  if (id === "2") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">Lock tax year 2025 and Illinois</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          We are preparing money earned in calendar year 2025, usually filed in
          2026. Living in Champaign today does not prove you were a full-year{" "}
          <Term word="Illinois resident">
            Full-year residents generally file a resident IL-1040. If you moved
            or worked in another state, Illinois may need Schedule NR. Answer
            based on 2025, not where your mail goes now.
          </Term>
          . Answer Yes / No / Not sure — “not sure” is stored as unknown, not as
          No.
        </p>
        <div className="mt-4 space-y-3">
          <TriState
            label="Are we preparing taxes for money you earned in 2025?"
            value={answers.taxYear2025}
            onChange={(v) => set("taxYear2025", v)}
          />
          <TriState
            label={
              <>
                Are you a U.S. citizen or{" "}
                <Term word="U.S. resident for tax purposes">
                  Tax residency is not the same as a Champaign mailing address or
                  an immigration label. If you are unsure, pick Not sure. We will
                  flag review instead of guessing.
                </Term>{" "}
                for all of 2025?
              </>
            }
            value={answers.usResident}
            onChange={(v) => set("usResident", v)}
          />
          <TriState
            label="Did you already file your 2025 return?"
            value={answers.alreadyFiled}
            onChange={(v) => set("alreadyFiled", v)}
          />
          <TriState
            label="If you have not filed, did you request an on-time extension?"
            value={answers.extension}
            onChange={(v) => set("extension", v)}
          />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ChoiceButton
            title="I lived in Illinois all of 2025"
            detail="Opens 2a. Typical for a Champaign student or worker who did not move mid-year."
            selected={openChild["2"] === "2a"}
            onClick={() => choose("2", "2a")}
          />
          <ChoiceButton
            title="I moved or also worked in another state"
            detail="Opens 2b and closes 2a. Part-year / nonresident cases need extra review."
            selected={openChild["2"] === "2b"}
            onClick={() => choose("2", "2b")}
          />
        </div>
      </div>
    );
  }

  if (id === "2a") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">Full-year Illinois resident</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          You will usually prepare a federal{" "}
          <Term word="Form 1040">
            Your main federal income tax return. 2025 forms are labeled 2025 —
            confirm the printed year before you file.
          </Term>{" "}
          and a resident{" "}
          <Term word="IL-1040">
            Your Illinois income tax return. Illinois starts from federal income,
            then applies its own exemptions. For ordinary 2025 cases the personal
            exemption is $2,850 per eligible person. The state rate is 4.95%. We
            still will not invent a refund.
          </Term>
          . Ordinary filing and payment date: April 15, 2026. An extension
          generally moves paperwork, not the payment date.
        </p>
        <CompleteButton onClick={() => complete("2a")}>This matches me</CompleteButton>
      </div>
    );
  }

  if (id === "2b") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">Moved or multi-state — review needed</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          This is not “you cannot file.” It means our supported residency rules
          stop here. Part-year and nonresident Illinois filers often add{" "}
          <Term word="Schedule NR">
            Illinois Schedule NR splits income among states. Use software or a
            VITA volunteer for the split. Keep collecting documents in this
            checklist.
          </Term>
          .
        </p>
        <Field
          label="Which other state(s), if you remember?"
          value={answers.otherStates}
          onChange={(v) => set("otherStates", v)}
        />
        <CompleteButton onClick={() => complete("2b")}>Keep my document list and continue</CompleteButton>
      </div>
    );
  }

  if (id === "3") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">Who counts in your tax household</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          Use December 31, 2025 for marriage. Dates, not today’s age, drive the
          rules. “Single parent” is not automatically{" "}
          <Term word="head of household">
            Head of household has extra tests: unmarried or considered unmarried,
            a qualifying person, and paying more than half the home’s upkeep.
            Dependent parents living elsewhere have their own rules. We only
            screen; Pub 501 has the official tests.
          </Term>
          . Do not type a real SSN — identifier type is enough for this demo.
        </p>
        <div className="mt-4 space-y-3">
          <TriState
            label="Were you married on December 31, 2025?"
            value={answers.married}
            onChange={(v) => set("married", v)}
          />
          <DatePicker
            label="Your date of birth (age rules use this date, not how old you feel today)"
            value={answers.dob}
            onChange={(v) => set("dob", v)}
          />
          <TriState
            label={
              <>
                Do you meet the tax definition of{" "}
                <Term word="legal blindness">
                  Totally blind, or certified limits of 20/200 or a 20-degree
                  field in the better eye with correction. Confirm; do not infer
                  this from using a screen reader or large text.
                </Term>
                ?
              </>
            }
            value={answers.blindness}
            onChange={(v) => set("blindness", v)}
          />
          <TriState
            label="Do you have children or other people you may claim?"
            value={answers.hasKids}
            onChange={(v) => set("hasKids", v)}
          />
        </div>
        {answers.hasKids === "yes" ? (
          <div className="mt-4 space-y-4">
            <NumberStepper
              label="How many people might you claim? (not everyone who lives with you qualifies)"
              value={answers.childCount}
              max={8}
              onSubmit={submitChildCount}
            />
            {answers.children.map((child, index) => (
              <div key={index} className="rounded-xl border border-black/15 bg-white p-4">
                <p className="text-sm font-semibold text-ink">Person {index + 1}</p>
                <div className="mt-3 space-y-3">
                  <DatePicker
                    label="Date of birth (federal child credit generally needs under 17 at year-end; Illinois child credit uses under 12)"
                    value={child.dob}
                    onChange={(v) => updateChild(index, { dob: v })}
                    minYear={2005}
                    maxYear={2025}
                  />
                  <NumberStepper
                    label="Months they lived with you in 2025"
                    value={child.monthsHome}
                    max={12}
                    onSubmit={(monthsHome) => updateChild(index, { monthsHome })}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ChoiceButton
            title="Nobody else claims me"
            detail="Opens 3a. Needed for several credits, including federal childless EITC."
            selected={openChild["3"] === "3a"}
            onClick={() => choose("3", "3a")}
          />
          <ChoiceButton
            title="A parent or someone else might claim me"
            detail="Opens 3b. Common for students. You may still need to file."
            selected={openChild["3"] === "3b"}
            onClick={() => choose("3", "3b")}
          />
        </div>
      </div>
    );
  }

  if (id === "3a") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">Filing as independent</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          Confirm with anyone who claimed you last year. If you can be claimed as
          a{" "}
          <Term word="dependent">
            Living with someone is not enough. Different credits use different
            tests. Dependents also use a different standard-deduction worksheet —
            we will not auto-grant the full $15,750 single amount.
          </Term>
          , federal childless EITC usually fails even if Illinois expanded EITC
          might still be screened.
        </p>
        <CompleteButton onClick={() => complete("3a")}>Continue</CompleteButton>
      </div>
    );
  }

  if (id === "3b") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">You might be a dependent</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          Record two facts separately: could someone claim you, and did they?
          Those answers feed different benefits. Talk so you do not both e-file
          conflicting statuses.
        </p>
        <div className="mt-4 space-y-3">
          <TriState
            label="Could someone else claim you on their 2025 return?"
            value={answers.couldBeClaimed}
            onChange={(v) => set("couldBeClaimed", v)}
          />
          <TriState
            label="Did they actually claim you (if you know)?"
            value={answers.wasClaimed}
            onChange={(v) => set("wasClaimed", v)}
          />
        </div>
        <CompleteButton onClick={() => complete("3b")}>Continue</CompleteButton>
      </div>
    );
  }

  if (id === "4") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">What kinds of income showed up</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          Do not guess taxable wages from a Venmo or paycheck deposit. Use the
          payer form. Pick the closest path — you can still list extra types
          inside it. Amounts you submit here are facts you confirmed, not a
          refund estimate.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ChoiceButton
            title="Mostly a W-2 job"
            detail="Campus job, internship, or hourly work with an employer."
            selected={openChild["4"] === "4a"}
            onClick={() => choose("4", "4a")}
          />
          <ChoiceButton
            title="Gig, freelance, or 1099"
            detail="Opens 4b. Self-employment tax and expenses need review."
            selected={openChild["4"] === "4b"}
            onClick={() => choose("4", "4b")}
          />
          <ChoiceButton
            title="A mix, or I am not sure"
            detail="Wages plus interest, unemployment, or a side job."
            selected={openChild["4"] === "4c"}
            onClick={() => choose("4", "4c")}
          />
        </div>
      </div>
    );
  }

  if (id === "4a" || id === "4b" || id === "4c") {
    const copy =
      id === "4a" ? (
        <>
          Collect every W-2. Missing one? Ask payroll first. We will not treat a
          net deposit as wages.
        </>
      ) : id === "4b" ? (
        <>
          Platforms may send a 1099, but you still report all self-employment
          income. We will not invent deductions from transaction labels — keep
          notes and mark review if you had expenses.
        </>
      ) : (
        <>
          Check every type that applies. Keep{" "}
          <Term word="earned income">
            Pay from work, including wages and many gig earnings. EITC compares
            earned income and AGI separately against a ceiling. Being under the
            ceiling is not enough by itself.
          </Term>{" "}
          separate from bank interest.
        </>
      );
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">
          {id === "4a" ? "W-2 wages" : id === "4b" ? "Gig and 1099 income" : "Mixed income"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">{copy}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {INCOME_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleIncome(option)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                answers.incomeTypes.includes(option)
                  ? "border-black bg-ink text-white"
                  : "border-black/20 bg-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <TriState
            label="Did you receive any foreign income or file Form 2555?"
            value={answers.foreignIncome}
            onChange={(v) => set("foreignIncome", v)}
          />
          <NumberStepper
            label="Wages from W-2s (optional). Use +/− then Submit. Unknown is better than a guess."
            value={answers.wages}
            step={50}
            prefix="$"
            onSubmit={(wages) => set("wages", wages)}
          />
          <NumberStepper
            label="Other work or gig income you already know from forms"
            value={answers.otherIncome}
            step={50}
            prefix="$"
            onSubmit={(otherIncome) => set("otherIncome", otherIncome)}
          />
          <NumberStepper
            label={
              <>
                Investment income from forms (interest/dividends). Federal{" "}
                <Term word="EITC">
                  Earned Income Tax Credit. Investment income must be $11,950 or
                  less for 2025. We screen; we do not compute your credit.
                </Term>{" "}
                uses this separately from wages.
              </>
            }
            value={answers.investmentIncome}
            step={25}
            prefix="$"
            onSubmit={(investmentIncome) => set("investmentIncome", investmentIncome)}
          />
        </div>
        <CompleteButton onClick={() => complete(id)}>Continue</CompleteButton>
      </div>
    );
  }

  if (id === "5") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">Which extra story is closest?</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          We show separate federal and Illinois cards. Labels mean{" "}
          <Term word="appears eligible">
            Supported checks passed on facts you confirmed. It is not a reviewed,
            filed, or accepted return.
          </Term>
          ,{" "}
          <Term word="more information needed">
            A required fact is missing, unclear, or contradictory. Missing is not
            No.
          </Term>
          , or{" "}
          <Term word="review needed">
            Outside our rules (moves, gigs, Marketplace insurance, custody
            fights). Keep the checklist.
          </Term>
          . A published maximum is not your award. Amount not calculated until a
          real engine runs. Do not add credits and deductions into “your refund.”
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ChoiceButton
            title="Simple: job, maybe rent, no kids"
            detail="Standard deduction and possible federal/Illinois EITC screening."
            selected={openChild["5"] === "5a"}
            onClick={() => choose("5", "5a")}
          />
          <ChoiceButton
            title="School, student loans, or retirement savings"
            detail="1098-E, education credits, Saver’s Credit (students often excluded)."
            selected={openChild["5"] === "5b"}
            onClick={() => choose("5", "5b")}
          />
          <ChoiceButton
            title="Kids, childcare, or an Illinois home I own"
            detail="Child credits, care, property tax, K–12 fees. Renters skip property tax credit."
            selected={openChild["5"] === "5c"}
            onClick={() => choose("5", "5c")}
          />
          <ChoiceButton
            title="Something messier"
            detail="Marketplace 1095-A, tips/overtime, or self-employment review."
            selected={openChild["5"] === "5d"}
            onClick={() => choose("5", "5d")}
          />
        </div>
      </div>
    );
  }

  if (id === "5a") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">Simple W-2 screening</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          For ordinary independent single filers, the 2025 federal{" "}
          <Term word="standard deduction">
            $15,750 single or married filing separately; $31,500 joint; $23,625
            head of household. It lowers income used to compute tax — it is not
            money paid to you. Age 65+ or qualifying blindness can add $2,000
            (single/HOH) or $1,600 (married categories). Dependents use a
            different worksheet.
          </Term>{" "}
          is $15,750. Rent does not create the Illinois property tax credit. A
          22-year-old may fail federal childless EITC on age (generally 25–64)
          and still be screened for Illinois expanded EITC (ages 18–24 without a
          child).
        </p>
        <div className="mt-4 grid gap-3">
          <Card
            title="Federal earned income credit"
            jurisdiction="Federal"
            label="Screen, do not promise"
            body="Needs earned income and AGI under the table for your filing status and qualifying children, investment income ≤ $11,950, and other tests. Childless filers generally need age 25–64 and cannot be someone else’s dependent. Amount not calculated."
          />
          <Card
            title="Illinois earned income credit"
            jurisdiction="Illinois"
            label="Evaluate even if federal is no"
            body="Ordinary Illinois EITC is 20% of federal EITC. Expanded coverage can include qualifying ITIN filers and workers 18–24 or 65+ without a child. Use the state worksheet — do not return zero only because federal EITC is zero."
          />
        </div>
        <CompleteButton onClick={() => complete("5a")}>Continue</CompleteButton>
      </div>
    );
  }

  if (id === "5b") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">School, loans, and savings</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          Loan interest and college tuition are different branches. A 1098-T
          alone does not prove an education credit.
        </p>
        <div className="mt-4 space-y-3">
          <TriState
            label="Did you pay student-loan interest (not just principal)?"
            value={answers.studentLoans}
            onChange={(v) => set("studentLoans", v)}
          />
          {answers.studentLoans === "yes" ? (
            <NumberStepper
              label="Qualified interest you paid in 2025 (max we screen is $2,500)"
              value={answers.loanInterest}
              step={25}
              max={2500}
              prefix="$"
              onSubmit={(loanInterest) => set("loanInterest", loanInterest)}
            />
          ) : null}
          <TriState
            label="Did you pay college tuition?"
            value={answers.college}
            onChange={(v) => set("college", v)}
          />
          <TriState
            label={
              <>
                Did you put your own money into a retirement plan or{" "}
                <Term word="ABLE account">
                  Your contributions may feed the Saver’s Credit. Employer match
                  and rollovers do not count. Full-time students during any part
                  of five calendar months are generally excluded.
                </Term>{" "}
                you own?
              </>
            }
            value={answers.retirement}
            onChange={(v) => set("retirement", v)}
          />
        </div>
        <div className="mt-4 grid gap-3">
          <Card
            title="Student-loan interest deduction"
            jurisdiction="Federal"
            label="Deduction, not a credit"
            body="Smaller of qualified interest paid or $2,500. 2025 phaseout MAGI $85,000–$100,000 if not joint. Excludes many MFS and claimed-dependent cases. Claim through Schedule 1."
          />
          <Card
            title="College education credits"
            jurisdiction="Federal"
            label="Review needed before claiming"
            body="AOTC up to $2,500 per eligible student (first four postsecondary years). LLC up to $2,000 per return. Do not claim both for the same student. Form 8863."
          />
          <Card
            title="Saver’s Credit"
            jurisdiction="Federal"
            label="Nonrefundable; students usually out"
            body="2025 AGI ceilings include $39,500 single. Rates 10/20/50% on up to $2,000 of eligible contributions per person. Form 8880. Amount not calculated."
          />
        </div>
        <CompleteButton onClick={() => complete("5b")}>Continue</CompleteButton>
      </div>
    );
  }

  if (id === "5c") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">Kids, care, or a home you own</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          Federal child credit generally needs a child under 17 at year-end.
          Illinois child credit is 40% of Illinois EITC for an eligible child
          under 12 — not a flat amount per kid. A home bought in 2025 generally
          cannot create the 2025 property tax credit. Renters skip it.
        </p>
        <div className="mt-4 space-y-3">
          <TriState
            label="Did you pay someone to care for a child or other person so you could work or look for work?"
            value={answers.childcare}
            onChange={(v) => set("childcare", v)}
          />
          <TriState
            label="Did you pay Illinois K–12 tuition, book fees, or lab fees?"
            value={answers.k12}
            onChange={(v) => set("k12", v)}
          />
          <TriState
            label="Did you own and live in an Illinois home in 2024, and pay its property taxes in 2025?"
            value={answers.homeowner}
            onChange={(v) => set("homeowner", v)}
          />
          {answers.homeowner === "yes" ? (
            <NumberStepper
              label="Eligible Illinois property tax paid in 2025 (credit is generally 5% of this, limited by state tax)"
              value={answers.propertyTax}
              step={50}
              prefix="$"
              onSubmit={(propertyTax) => set("propertyTax", propertyTax)}
            />
          ) : null}
        </div>
        <div className="mt-4 grid gap-3">
          <Card
            title="Child Tax Credit / ACTC"
            jurisdiction="Federal"
            label="Schedule 8812"
            body="2025 CTC maximum $2,200 per qualifying child; refundable ACTC portion up to $1,700 subject to calculation. Do not add them as two independent awards."
          />
          <Card
            title="Illinois property tax credit"
            jurisdiction="Illinois"
            label="Owners, Schedule ICR"
            body="Need the bill, payment proof, and parcel number (Champaign County Treasurer if local). Penalties and non-residence portions do not count."
          />
          <Card
            title="K–12 education expense credit"
            jurisdiction="Illinois"
            label="25% of qualified costs above $250, max $750 total"
            body="Not per child. After-school care and ordinary supplies do not automatically qualify."
          />
        </div>
        <CompleteButton onClick={() => complete("5c")}>Continue</CompleteButton>
      </div>
    );
  }

  if (id === "5d") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">Review needed — still useful</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          “We have not checked this benefit” is different from “you cannot claim
          it.” Take 1095-A, gig records, or overtime stubs to software or VITA.
        </p>
        <div className="mt-4 space-y-3">
          <TriState
            label="Marketplace health insurance or Form 1095-A?"
            value={answers.marketplace}
            onChange={(v) => set("marketplace", v)}
          />
          <TriState
            label="Qualifying tips or FLSA overtime premium in 2025?"
            value={answers.tips}
            onChange={(v) => set("tips", v)}
          />
        </div>
        <div className="mt-4 grid gap-3">
          <Card
            title="Form 8962 / 1095-A"
            jurisdiction="Federal"
            label="Can raise tax owed"
            body="Advance premium tax credit must be reconciled. Missing this can stall e-file."
          />
          <Card
            title="Schedule 1-A tips / overtime"
            jurisdiction="Federal"
            label="Not all extra hours count"
            body="2025 caps: tips $25,000 per return; overtime $12,500 nonjoint / $25,000 joint. Do not assume Illinois copies the federal deduction. Amount not calculated."
          />
        </div>
        <CompleteButton onClick={() => complete("5d")}>Continue with a review flag</CompleteButton>
      </div>
    );
  }

  if (id === "6") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">How do you want to file for real?</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          KEENFinance stops at a preparation summary. You still submit the 1040
          and IL-1040 yourself (or with a volunteer). Only one subtab stays open.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ChoiceButton
            title="I will file myself"
            detail="Official 2025 PDFs, MyTax Illinois, IRS Free File."
            selected={openChild["6"] === "6a"}
            onClick={() => choose("6", "6a")}
          />
          <ChoiceButton
            title="I want a free helper"
            detail="VITA / IRS locator. Bring ID and your forms."
            selected={openChild["6"] === "6b"}
            onClick={() => choose("6", "6b")}
          />
          <ChoiceButton
            title="I already filed, or I am waiting on forms"
            detail="Do not file a second original return."
            selected={openChild["6"] === "6c"}
            onClick={() => choose("6", "6c")}
          />
        </div>
      </div>
    );
  }

  if (id === "6a" || id === "6b" || id === "6c") {
    return (
      <ChecklistPanel
        id={id}
        answers={answers}
        files={files}
        openChild={openChild}
        complete={complete}
      />
    );
  }

  return <Recap answers={answers} files={files} openChild={openChild} complete={complete} />;
}

function ChecklistPanel({
  id,
  answers,
  files,
  openChild,
  complete,
}: {
  id: Id;
  answers: Answers;
  files: File[];
  openChild: Partial<Record<Id, Id>>;
  complete: (id: Id) => void;
}) {
  const docs = buildDocs(answers, files, openChild);
  const heading =
    id === "6a" ? "File it yourself" : id === "6b" ? "Free in-person help" : "Pause before another return";
  const blurb =
    id === "6a"
      ? "Use 2025 Form 1040 and IL-1040. Confirm the printed year. Field helpers on those sites should cite the form name, year, line label, and your confirmed value — never invent a missing box."
      : id === "6b"
        ? "Bring photo ID, payer forms, and last year’s AGI if you have it. Volunteers can e-file; this site cannot."
        : "If a 2025 original return is already in, you need an amendment — not a second 1040. Still waiting on a W-2? Ask payroll before Form 4852.";
  return (
    <div>
      <h2 className="text-xl font-bold text-ink">{heading}</h2>
      <p className="mt-2 text-sm leading-relaxed text-black/70">{blurb}</p>
      <ul className="mt-5 space-y-2">
        {docs.map((doc) => (
          <li key={doc} className="rounded-lg border border-black/10 bg-white px-4 py-3 text-sm leading-relaxed text-black/75">
            {doc}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col gap-2 text-sm text-uiuc">
        <a className="underline" href="https://www.irs.gov/pub/irs-prior/f1040--2025.pdf" target="_blank" rel="noreferrer">
          2025 Form 1040 (PDF)
        </a>
        <a className="underline" href="https://tax.illinois.gov/forms/incometax/currentyear/individual.html" target="_blank" rel="noreferrer">
          Illinois IL-1040 and schedules
        </a>
        <a className="underline" href="https://tax.illinois.gov/programs/mytax/il-1040.html" target="_blank" rel="noreferrer">
          MyTax Illinois
        </a>
        <a className="underline" href="https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers" target="_blank" rel="noreferrer">
          IRS free tax-preparation locator
        </a>
      </div>
      <CompleteButton onClick={() => complete(id)}>Add this to my recap</CompleteButton>
    </div>
  );
}

function buildDocs(answers: Answers, files: File[], openChild: Partial<Record<Id, Id>>) {
  const list = [
    "Photo ID and your filing address for 2025.",
    files.length
      ? `Files already attached in this tab: ${files.map((file) => file.name).join(", ")}.`
      : "Payer forms still to collect (nothing uploaded yet).",
  ];
  if (answers.incomeTypes.some((item) => item.includes("W-2")) || openChild["4"] === "4a") {
    list.push("Form W-2 from each employer — payroll portal or a replacement from HR.");
  }
  if (answers.incomeTypes.some((item) => item.includes("1099")) || openChild["4"] === "4b") {
    list.push("1099-NEC/K/MISC plus your own income/expense log. Gig totals are not automatic write-offs.");
  }
  if (answers.incomeTypes.some((item) => item.includes("interest"))) {
    list.push("Form 1099-INT from each bank.");
  }
  if (answers.incomeTypes.some((item) => item.includes("Unemployment"))) {
    list.push("Form 1099-G from the state unemployment site.");
  }
  if (answers.studentLoans === "yes") list.push("Form 1098-E or a servicer year-end interest statement.");
  if (answers.college === "yes") list.push("Form 1098-T, the bursar ledger, and which costs you actually paid.");
  if (answers.retirement === "yes") list.push("Year-end contribution record (W-2 box 12 or account statement).");
  if (answers.childcare === "yes") {
    list.push("Childcare provider statement with expenses and identifying details (W-10 if you need their tax ID).");
  }
  if (answers.k12 === "yes") {
    list.push("Itemized K–12 tuition, book, or lab receipts — not ordinary school supplies.");
  }
  if (answers.homeowner === "yes") {
    list.push("Illinois property tax bill, proof of 2025 payment, and parcel number (Champaign County Treasurer if local).");
  }
  if (answers.marketplace === "yes") list.push("Form 1095-A from the Marketplace — required before many e-files go through.");
  if (answers.tips === "yes") list.push("Pay stubs that separate tips or FLSA overtime premium.");
  if (answers.children.length) {
    list.push(
      `Child/dependent facts on file: ${answers.children.length} person(s). Bring relationship, support, and identifier-type details — not SSNs in this demo.`,
    );
  }
  list.push("Federal Form 1040 and Illinois IL-1040. Add Schedule EIC, 8812, IL-E/EITC, ICR, 8880, 2441, 8863, or 1-A only if that branch applied.");
  return list;
}

function Recap({
  answers,
  files,
  openChild,
  complete,
}: {
  answers: Answers;
  files: File[];
  openChild: Partial<Record<Id, Id>>;
  complete: (id: Id) => void;
}) {
  const path = [
    openChild["1"] === "1a"
      ? "You started from uploaded documents."
      : "You skipped upload and jumped into questions.",
    openChild["2"] === "2b"
      ? `Residency was flagged for review${answers.otherStates ? ` (${answers.otherStates})` : ""}.`
      : "You treated 2025 as a full-year Illinois situation.",
    openChild["3"] === "3b"
      ? "You noted that someone else may claim you."
      : "You described yourself as independent for this return.",
    openChild["4"] === "4b"
      ? "Income path: gig / 1099."
      : openChild["4"] === "4c"
        ? "Income path: mixed sources."
        : "Income path: mostly W-2 wages.",
    openChild["5"] === "5b"
      ? "You screened school, loans, or retirement credits."
      : openChild["5"] === "5c"
        ? "You screened kids, care, or homeowner credits."
        : openChild["5"] === "5d"
          ? "You kept a review flag for insurance, tips, or other complexity."
          : "You screened the simple W-2 / renter path.",
    openChild["6"] === "6b"
      ? "Filing plan: free VITA / IRS helper."
      : openChild["6"] === "6c"
        ? "Filing plan: do not submit a second original return."
        : "Filing plan: self-file with official 2025 forms.",
  ];

  const money = (amount: number) =>
    amount > 0 ? `$${amount.toLocaleString("en-US")}` : "Amount not calculated";

  return (
    <div>
      <h2 className="text-xl font-bold text-ink">What you built — not a filed return</h2>
      <p className="mt-2 text-sm leading-relaxed text-black/70">
        Preparation summary for tax year 2025. “Appears eligible” only means our
        supported questions were answered. No refund total is shown.
      </p>
      <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-black/80">
        {path.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
      <dl className="mt-6 space-y-2 text-sm">
        <Row label="Tax year locked" value={labelTri(answers.taxYear2025)} />
        <Row label="U.S. tax resident (2025)" value={labelTri(answers.usResident)} />
        <Row label="Already filed?" value={labelTri(answers.alreadyFiled)} />
        <Row label="On-time extension?" value={labelTri(answers.extension)} />
        <Row label="Married 12/31/2025" value={labelTri(answers.married)} />
        <Row label="Date of birth" value={answers.dob || "Not entered"} />
        <Row label="Tax blindness (self-confirmed)" value={labelTri(answers.blindness)} />
        <Row label="Might be claimed" value={labelTri(answers.couldBeClaimed)} />
        <Row label="Was claimed" value={labelTri(answers.wasClaimed)} />
        <Row
          label="People you may claim"
          value={
            answers.hasKids === "yes"
              ? `${answers.childCount} on file${
                  answers.children.length
                    ? `: ${answers.children
                        .map(
                          (child, index) =>
                            `Person ${index + 1} DOB ${child.dob || "unset"}, ${child.monthsHome} months`,
                        )
                        .join("; ")}`
                    : ""
                }`
              : labelTri(answers.hasKids)
          }
        />
        <Row label="Foreign income / Form 2555" value={labelTri(answers.foreignIncome)} />
        <Row label="Income types" value={answers.incomeTypes.join(", ") || "Not listed"} />
        <Row label="Wages noted" value={money(answers.wages)} />
        <Row label="Other work income noted" value={money(answers.otherIncome)} />
        <Row label="Investment income noted" value={money(answers.investmentIncome)} />
        <Row label="Student-loan interest" value={labelTri(answers.studentLoans)} />
        <Row label="Interest amount noted" value={money(answers.loanInterest)} />
        <Row label="College tuition" value={labelTri(answers.college)} />
        <Row label="Retirement contributions" value={labelTri(answers.retirement)} />
        <Row label="Illinois homeowner credit facts" value={labelTri(answers.homeowner)} />
        <Row label="Property tax paid (noted)" value={money(answers.propertyTax)} />
        <Row label="Childcare so you could work" value={labelTri(answers.childcare)} />
        <Row label="Illinois K–12 fees" value={labelTri(answers.k12)} />
        <Row label="Marketplace / 1095-A" value={labelTri(answers.marketplace)} />
        <Row label="Tips / overtime" value={labelTri(answers.tips)} />
        <Row
          label="Documents in this browser"
          value={files.length ? files.map((file) => file.name).join(", ") : "None uploaded"}
        />
      </dl>
      <p className="mt-6 text-sm leading-relaxed text-black/70">
        Next action: take this list to{" "}
        <a className="font-semibold text-uiuc underline" href="https://www.irs.gov/pub/irs-prior/f1040--2025.pdf" target="_blank" rel="noreferrer">
          Form 1040
        </a>{" "}
        and{" "}
        <a className="font-semibold text-uiuc underline" href="https://tax.illinois.gov/programs/mytax/il-1040.html" target="_blank" rel="noreferrer">
          MyTax Illinois
        </a>
        . Ordinary 2025 deadline: April 15, 2026.
      </p>
      <CompleteButton onClick={() => complete("7")}>Mark my recap complete</CompleteButton>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col border-b border-black/10 py-2 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="font-medium text-ink">{label}</dt>
      <dd className="text-black/70 sm:text-right">{value}</dd>
    </div>
  );
}

function labelTri(value: Tri) {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  if (value === "unsure") return "Not sure — more information needed";
  return "Not answered";
}
