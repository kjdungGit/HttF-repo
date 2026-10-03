"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/client";
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
import { SpeechControls } from "./SpeechControls";
import { useSpeech, type SpeechLang } from "./useSpeech";

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

const MAIN: { id: Id; label: string }[] = [
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "3", label: "3" },
  { id: "4", label: "4" },
  { id: "5", label: "5" },
  { id: "6", label: "6" },
  { id: "7", label: "7" },
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
  "wages",
  "tips",
  "gig",
  "interest",
  "unemployment",
  "retirement",
] as const;

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
  const { t, i18n: i18nInstance } = useTranslation();
  const lang: SpeechLang = i18nInstance.language.startsWith("es") ? "es" : "en";
  const speech = useSpeech(lang);
  const [active, setActive] = useState<Id>("1");
  const [openChild, setOpenChild] = useState<Partial<Record<Id, Id>>>({});
  const [done, setDone] = useState<Set<Id>>(new Set());
  const [files, setFiles] = useState<File[]>([]);
  const [answers, setAnswers] = useState<Answers>(EMPTY);

  const items = useMemo<NavItem[]>(() => {
    const childIds: Partial<Record<Id, Id[]>> = {
      "1": ["1a"],
      "2": ["2a", "2b"],
      "3": ["3a", "3b"],
      "4": ["4a", "4b", "4c"],
      "5": ["5a", "5b", "5c", "5d"],
      "6": ["6a", "6b", "6c"],
    };
    const list: NavItem[] = [];
    for (const step of MAIN) {
      list.push({
        id: step.id,
        label: step.label,
        title: t(`nav.${step.id}`),
        indent: false,
      });
      const child = openChild[step.id];
      if (child && childIds[step.id]?.includes(child)) {
        list.push({
          id: child,
          label: child,
          title: t(`nav.${child}`),
          indent: true,
        });
      }
    }
    return list;
  }, [openChild, t]);

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange">
              {t("page.kicker")}
            </p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-ink">
              {t("page.title")}
            </h1>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            {t("lang.label")}
            <select
              className="rounded-lg border border-black/20 bg-white px-3 py-2 text-sm outline-none focus:border-orange"
              value={lang}
              onChange={(event) => {
                speech.stop();
                void i18n.changeLanguage(event.target.value);
              }}
            >
              <option value="en">{t("lang.en")}</option>
              <option value="es">{t("lang.es")}</option>
            </select>
          </label>
        </div>
        {speech.ready && !speech.supported ? (
          <p className="mt-4 rounded-lg border border-orange/40 bg-[#fff7f4] px-4 py-3 text-sm text-ink" role="status">
            {t("speech.unsupported")}
          </p>
        ) : null}
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-black/70">
          {t("page.intro")}{" "}
          <Term word={t("page.blueWord")}>{t("page.blueHelp")}</Term>
        </p>

        <div className="relative mt-10 flex flex-col gap-2">
          <div className="pointer-events-none absolute bottom-3 left-[17px] top-3 w-px bg-black/20" />
          {items.map((item) => {
            const isActive = active === item.id;
            const isDone = done.has(item.id);
            const reading = speech.speakingId === item.id;
            return (
              <div
                key={item.id}
                className={`relative z-10 flex items-start gap-3 rounded-xl ${item.indent ? "ml-10" : ""} ${
                  reading ? "bg-orange/10 ring-2 ring-orange" : ""
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isActive}
                  aria-label={`${item.label} ${item.title}${isDone ? t("common.complete") : ""}`}
                  onClick={() => setActive(item.id)}
                  className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                    isDone
                      ? "bg-check text-white"
                      : isActive
                        ? "bg-orange text-white shadow-[0_0_0_3px_rgba(232,74,39,0.25)]"
                        : "border-2 border-black bg-white text-ink hover:border-orange"
                  } ${isDone && isActive ? "shadow-[0_0_0_3px_rgba(232,74,39,0.25)]" : ""}`}
                >
                  {isDone ? <CheckIcon /> : item.label}
                </button>
                <div className="mt-1.5 hidden w-44 shrink-0 sm:block">
                  <p className="text-sm font-medium text-black">{item.title}</p>
                  <div className="mt-1">
                    <SpeechControls
                      stepId={item.id}
                      text={t(`steps.${item.id}.speech`)}
                      speakingId={speech.speakingId}
                      paused={speech.paused}
                      supported={speech.supported}
                      labels={{
                        listen: t("speech.listen"),
                        play: t("speech.play"),
                        pause: t("speech.pause"),
                        stop: t("speech.stop"),
                      }}
                      onPlay={speech.play}
                      onPause={speech.pause}
                      onStop={speech.stop}
                    />
                  </div>
                </div>
                {isActive ? (
                  <div id={`panel-${item.id}`} className="min-w-0 flex-1 p-1">
                    <div className="mb-2 sm:hidden">
                      <SpeechControls
                        stepId={item.id}
                        text={t(`steps.${item.id}.speech`)}
                        speakingId={speech.speakingId}
                        paused={speech.paused}
                        supported={speech.supported}
                        labels={{
                          listen: t("speech.listen"),
                          play: t("speech.play"),
                          pause: t("speech.pause"),
                          stop: t("speech.stop"),
                        }}
                        onPlay={speech.play}
                        onPause={speech.pause}
                        onStop={speech.stop}
                      />
                    </div>
                    <section className="overflow-visible rounded-2xl border border-black/20 bg-[#f6f7f9] p-5 sm:p-7">
                      <Panel
                        id={item.id}
                        answers={answers}
                        files={files}
                        openChild={openChild}
                        set={set}
                        setFiles={setFiles}
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
                  <div className="flex-1 py-1 sm:hidden">
                    <p className="text-sm font-medium text-black">{item.title}</p>
                    <SpeechControls
                      stepId={item.id}
                      text={t(`steps.${item.id}.speech`)}
                      speakingId={speech.speakingId}
                      paused={speech.paused}
                      supported={speech.supported}
                      labels={{
                        listen: t("speech.listen"),
                        play: t("speech.play"),
                        pause: t("speech.pause"),
                        stop: t("speech.stop"),
                      }}
                      onPlay={speech.play}
                      onPause={speech.pause}
                      onStop={speech.stop}
                    />
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
  choose: (parent: Id, child: Id) => void;
  complete: (id: Id) => void;
  skipStepOne: () => void;
  toggleIncome: (label: string) => void;
  submitChildCount: (count: number) => void;
  updateChild: (index: number, patch: Partial<ChildFact>) => void;
}) {
  const { t } = useTranslation();
  if (id === "1") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">{t("steps.1.h2")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          {t("steps.1.p1")}{" "}
          <Term word={t("steps.1.w2")}>{t("steps.1.w2Help")}</Term>.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ChoiceButton
            title={t("steps.1.uploadTitle")}
            detail={t("steps.1.uploadDetail")}
            selected={openChild["1"] === "1a"}
            onClick={() => choose("1", "1a")}
          />
          <ChoiceButton
            title={t("steps.1.skipTitle")}
            detail={t("steps.1.skipDetail")}
            onClick={skipStepOne}
          />
        </div>
      </div>
    );
  }

  if (id === "1a") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">{t("steps.1a.h2")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">{t("steps.1a.p")}</p>
        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-black/30 bg-white px-4 py-8 text-center hover:border-orange">
          <span className="font-semibold text-ink">{t("steps.1a.drop")}</span>
          <span className="mt-1 text-xs text-black/60">{t("steps.1a.types")}</span>
          <input
            className="sr-only"
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(event) => {
              const next = event.target.files ? Array.from(event.target.files) : [];
              setFiles((prev) => [...prev, ...next]);
            }}
          />
        </label>
        {files.length > 0 ? (
          <ul className="mt-4 space-y-1 text-sm text-ink">
            {files.map((file) => (
              <li key={`${file.name}-${file.lastModified}`}>
                {file.name}{" "}
                <span className="text-black/50">
                  ({Math.max(1, Math.round(file.size / 1024))} KB)
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <ul className="mt-6 space-y-3">
          {(["w2", "nec", "int", "e", "t", "g", "a", "prior"] as const).map((key) => (
            <li key={key} className="rounded-lg border border-black/10 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-orange">{t(`forms.${key}.name`)}</p>
              <p className="mt-1 text-sm leading-relaxed text-black/70">{t(`forms.${key}.summary`)}</p>
            </li>
          ))}
        </ul>
        <CompleteButton onClick={() => complete("1a")}>{t("steps.1a.done")}</CompleteButton>
      </div>
    );
  }

  if (id === "2") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">{t("steps.2.h2")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          {t("steps.2.p1")}{" "}
          <Term word={t("steps.2.resident")}>{t("steps.2.residentHelp")}</Term>
          {t("steps.2.p2")}
        </p>
        <div className="mt-4 space-y-3">
          <TriState
            label={t("steps.2.qYear")}
            value={answers.taxYear2025}
            onChange={(v) => set("taxYear2025", v)}
          />
          <TriState
            label={
              <>
                {t("steps.2.qResidentPre")}{" "}
                <Term word={t("steps.2.qResident")}>{t("steps.2.qResidentHelp")}</Term>{" "}
                {t("steps.2.qResidentPost")}
              </>
            }
            value={answers.usResident}
            onChange={(v) => set("usResident", v)}
          />
          <TriState
            label={t("steps.2.qFiled")}
            value={answers.alreadyFiled}
            onChange={(v) => set("alreadyFiled", v)}
          />
          <TriState
            label={t("steps.2.qExt")}
            value={answers.extension}
            onChange={(v) => set("extension", v)}
          />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ChoiceButton
            title={t("steps.2.fullTitle")}
            detail={t("steps.2.fullDetail")}
            selected={openChild["2"] === "2a"}
            onClick={() => choose("2", "2a")}
          />
          <ChoiceButton
            title={t("steps.2.movedTitle")}
            detail={t("steps.2.movedDetail")}
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
        <h2 className="text-xl font-bold text-ink">{t("steps.2a.h2")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          {t("steps.2a.p1")}{" "}
          <Term word={t("steps.2a.f1040")}>{t("steps.2a.f1040Help")}</Term>{" "}
          {t("steps.2a.p2")}{" "}
          <Term word={t("steps.2a.il1040")}>{t("steps.2a.il1040Help")}</Term>
          {t("steps.2a.p3")}
        </p>
        <CompleteButton onClick={() => complete("2a")}>{t("steps.2a.done")}</CompleteButton>
      </div>
    );
  }

  if (id === "2b") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">{t("steps.2b.h2")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          {t("steps.2b.p1")}{" "}
          <Term word={t("steps.2b.nr")}>{t("steps.2b.nrHelp")}</Term>.
        </p>
        <Field
          label={t("steps.2b.states")}
          value={answers.otherStates}
          onChange={(v) => set("otherStates", v)}
        />
        <CompleteButton onClick={() => complete("2b")}>{t("steps.2b.done")}</CompleteButton>
      </div>
    );
  }

  if (id === "3") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">{t("steps.3.h2")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          {t("steps.3.p1")}{" "}
          <Term word={t("steps.3.hoh")}>{t("steps.3.hohHelp")}</Term>
          {t("steps.3.p2")}
        </p>
        <div className="mt-4 space-y-3">
          <TriState
            label={t("steps.3.qMarried")}
            value={answers.married}
            onChange={(v) => set("married", v)}
          />
          <DatePicker
            label={t("steps.3.dob")}
            value={answers.dob}
            onChange={(v) => set("dob", v)}
          />
          <TriState
            label={
              <>
                {t("steps.3.qBlindPre")}{" "}
                <Term word={t("steps.3.blind")}>{t("steps.3.blindHelp")}</Term>?
              </>
            }
            value={answers.blindness}
            onChange={(v) => set("blindness", v)}
          />
          <TriState
            label={t("steps.3.qKids")}
            value={answers.hasKids}
            onChange={(v) => set("hasKids", v)}
          />
        </div>
        {answers.hasKids === "yes" ? (
          <div className="mt-4 space-y-4">
            <NumberStepper
              label={t("steps.3.childCount")}
              value={answers.childCount}
              max={8}
              onSubmit={submitChildCount}
            />
            {answers.children.map((child, index) => (
              <div key={index} className="rounded-xl border border-black/15 bg-white p-4">
                <p className="text-sm font-semibold text-ink">{t("steps.3.person", { n: index + 1 })}</p>
                <div className="mt-3 space-y-3">
                  <DatePicker
                    label={t("steps.3.childDob")}
                    value={child.dob}
                    onChange={(v) => updateChild(index, { dob: v })}
                    minYear={2005}
                    maxYear={2025}
                  />
                  <NumberStepper
                    label={t("steps.3.months")}
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
            title={t("steps.3.indepTitle")}
            detail={t("steps.3.indepDetail")}
            selected={openChild["3"] === "3a"}
            onClick={() => choose("3", "3a")}
          />
          <ChoiceButton
            title={t("steps.3.depTitle")}
            detail={t("steps.3.depDetail")}
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
        <h2 className="text-xl font-bold text-ink">{t("steps.3a.h2")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          {t("steps.3a.p1")}{" "}
          <Term word={t("steps.3a.dep")}>{t("steps.3a.depHelp")}</Term>
          {t("steps.3a.p2")}
        </p>
        <CompleteButton onClick={() => complete("3a")}>{t("common.continue")}</CompleteButton>
      </div>
    );
  }

  if (id === "3b") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">{t("steps.3b.h2")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">{t("steps.3b.p")}</p>
        <div className="mt-4 space-y-3">
          <TriState
            label={t("steps.3b.qCould")}
            value={answers.couldBeClaimed}
            onChange={(v) => set("couldBeClaimed", v)}
          />
          <TriState
            label={t("steps.3b.qDid")}
            value={answers.wasClaimed}
            onChange={(v) => set("wasClaimed", v)}
          />
        </div>
        <CompleteButton onClick={() => complete("3b")}>{t("common.continue")}</CompleteButton>
      </div>
    );
  }

  if (id === "4") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">{t("steps.4.h2")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">{t("steps.4.p")}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ChoiceButton
            title={t("steps.4.w2Title")}
            detail={t("steps.4.w2Detail")}
            selected={openChild["4"] === "4a"}
            onClick={() => choose("4", "4a")}
          />
          <ChoiceButton
            title={t("steps.4.gigTitle")}
            detail={t("steps.4.gigDetail")}
            selected={openChild["4"] === "4b"}
            onClick={() => choose("4", "4b")}
          />
          <ChoiceButton
            title={t("steps.4.mixTitle")}
            detail={t("steps.4.mixDetail")}
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
        t("steps.4a.p")
      ) : id === "4b" ? (
        t("steps.4b.p")
      ) : (
        <>
          {t("steps.4c.p1")}{" "}
          <Term word={t("steps.4c.earned")}>{t("steps.4c.earnedHelp")}</Term>{" "}
          {t("steps.4c.p2")}
        </>
      );
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">{t(`steps.${id}.h2`)}</h2>
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
              {t(`income.${option}`)}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <TriState
            label={t("steps.4x.foreign")}
            value={answers.foreignIncome}
            onChange={(v) => set("foreignIncome", v)}
          />
          <NumberStepper
            label={t("steps.4x.wages")}
            value={answers.wages}
            step={50}
            prefix="$"
            onSubmit={(wages) => set("wages", wages)}
          />
          <NumberStepper
            label={t("steps.4x.other")}
            value={answers.otherIncome}
            step={50}
            prefix="$"
            onSubmit={(otherIncome) => set("otherIncome", otherIncome)}
          />
          <NumberStepper
            label={
              <>
                {t("steps.4x.invest1")}{" "}
                <Term word={t("steps.4x.eitc")}>{t("steps.4x.eitcHelp")}</Term>{" "}
                {t("steps.4x.invest2")}
              </>
            }
            value={answers.investmentIncome}
            step={25}
            prefix="$"
            onSubmit={(investmentIncome) => set("investmentIncome", investmentIncome)}
          />
        </div>
        <CompleteButton onClick={() => complete(id)}>{t("common.continue")}</CompleteButton>
      </div>
    );
  }

  if (id === "5") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">{t("steps.5.h2")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          {t("steps.5.p1")}{" "}
          <Term word={t("steps.5.eligible")}>{t("steps.5.eligibleHelp")}</Term>
          ,{" "}
          <Term word={t("steps.5.more")}>{t("steps.5.moreHelp")}</Term>
          , {t("common.or")}{" "}
          <Term word={t("steps.5.review")}>{t("steps.5.reviewHelp")}</Term>
          {t("steps.5.p2")}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ChoiceButton
            title={t("steps.5.simpleTitle")}
            detail={t("steps.5.simpleDetail")}
            selected={openChild["5"] === "5a"}
            onClick={() => choose("5", "5a")}
          />
          <ChoiceButton
            title={t("steps.5.schoolTitle")}
            detail={t("steps.5.schoolDetail")}
            selected={openChild["5"] === "5b"}
            onClick={() => choose("5", "5b")}
          />
          <ChoiceButton
            title={t("steps.5.kidsTitle")}
            detail={t("steps.5.kidsDetail")}
            selected={openChild["5"] === "5c"}
            onClick={() => choose("5", "5c")}
          />
          <ChoiceButton
            title={t("steps.5.messyTitle")}
            detail={t("steps.5.messyDetail")}
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
        <h2 className="text-xl font-bold text-ink">{t("steps.5a.h2")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          {t("steps.5a.p1")}{" "}
          <Term word={t("steps.5a.std")}>{t("steps.5a.stdHelp")}</Term>{" "}
          {t("steps.5a.p2")}
        </p>
        <div className="mt-4 grid gap-3">
          <Card
            title={t("steps.5a.c1t")}
            jurisdiction={t("common.federal")}
            label={t("steps.5a.c1l")}
            body={t("steps.5a.c1b")}
          />
          <Card
            title={t("steps.5a.c2t")}
            jurisdiction={t("common.illinois")}
            label={t("steps.5a.c2l")}
            body={t("steps.5a.c2b")}
          />
        </div>
        <CompleteButton onClick={() => complete("5a")}>{t("common.continue")}</CompleteButton>
      </div>
    );
  }

  if (id === "5b") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">{t("steps.5b.h2")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">{t("steps.5b.p")}</p>
        <div className="mt-4 space-y-3">
          <TriState
            label={t("steps.5b.qLoan")}
            value={answers.studentLoans}
            onChange={(v) => set("studentLoans", v)}
          />
          {answers.studentLoans === "yes" ? (
            <NumberStepper
              label={t("steps.5b.loanAmt")}
              value={answers.loanInterest}
              step={25}
              max={2500}
              prefix="$"
              onSubmit={(loanInterest) => set("loanInterest", loanInterest)}
            />
          ) : null}
          <TriState
            label={t("steps.5b.qCollege")}
            value={answers.college}
            onChange={(v) => set("college", v)}
          />
          <TriState
            label={
              <>
                {t("steps.5b.qRetPre")}{" "}
                <Term word={t("steps.5b.able")}>{t("steps.5b.ableHelp")}</Term>{" "}
                {t("steps.5b.qRetPost")}
              </>
            }
            value={answers.retirement}
            onChange={(v) => set("retirement", v)}
          />
        </div>
        <div className="mt-4 grid gap-3">
          <Card
            title={t("steps.5b.c1t")}
            jurisdiction={t("common.federal")}
            label={t("steps.5b.c1l")}
            body={t("steps.5b.c1b")}
          />
          <Card
            title={t("steps.5b.c2t")}
            jurisdiction={t("common.federal")}
            label={t("steps.5b.c2l")}
            body={t("steps.5b.c2b")}
          />
          <Card
            title={t("steps.5b.c3t")}
            jurisdiction={t("common.federal")}
            label={t("steps.5b.c3l")}
            body={t("steps.5b.c3b")}
          />
        </div>
        <CompleteButton onClick={() => complete("5b")}>{t("common.continue")}</CompleteButton>
      </div>
    );
  }

  if (id === "5c") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">{t("steps.5c.h2")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">{t("steps.5c.p")}</p>
        <div className="mt-4 space-y-3">
          <TriState
            label={t("steps.5c.qCare")}
            value={answers.childcare}
            onChange={(v) => set("childcare", v)}
          />
          <TriState
            label={t("steps.5c.qK12")}
            value={answers.k12}
            onChange={(v) => set("k12", v)}
          />
          <TriState
            label={t("steps.5c.qHome")}
            value={answers.homeowner}
            onChange={(v) => set("homeowner", v)}
          />
          {answers.homeowner === "yes" ? (
            <NumberStepper
              label={t("steps.5c.propAmt")}
              value={answers.propertyTax}
              step={50}
              prefix="$"
              onSubmit={(propertyTax) => set("propertyTax", propertyTax)}
            />
          ) : null}
        </div>
        <div className="mt-4 grid gap-3">
          <Card
            title={t("steps.5c.c1t")}
            jurisdiction={t("common.federal")}
            label={t("steps.5c.c1l")}
            body={t("steps.5c.c1b")}
          />
          <Card
            title={t("steps.5c.c2t")}
            jurisdiction={t("common.illinois")}
            label={t("steps.5c.c2l")}
            body={t("steps.5c.c2b")}
          />
          <Card
            title={t("steps.5c.c3t")}
            jurisdiction={t("common.illinois")}
            label={t("steps.5c.c3l")}
            body={t("steps.5c.c3b")}
          />
        </div>
        <CompleteButton onClick={() => complete("5c")}>{t("common.continue")}</CompleteButton>
      </div>
    );
  }

  if (id === "5d") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">{t("steps.5d.h2")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">{t("steps.5d.p")}</p>
        <div className="mt-4 space-y-3">
          <TriState
            label={t("steps.5d.qMkt")}
            value={answers.marketplace}
            onChange={(v) => set("marketplace", v)}
          />
          <TriState
            label={t("steps.5d.qTips")}
            value={answers.tips}
            onChange={(v) => set("tips", v)}
          />
        </div>
        <div className="mt-4 grid gap-3">
          <Card
            title={t("steps.5d.c1t")}
            jurisdiction={t("common.federal")}
            label={t("steps.5d.c1l")}
            body={t("steps.5d.c1b")}
          />
          <Card
            title={t("steps.5d.c2t")}
            jurisdiction={t("common.federal")}
            label={t("steps.5d.c2l")}
            body={t("steps.5d.c2b")}
          />
        </div>
        <CompleteButton onClick={() => complete("5d")}>{t("steps.5d.done")}</CompleteButton>
      </div>
    );
  }

  if (id === "6") {
    return (
      <div>
        <h2 className="text-xl font-bold text-ink">{t("steps.6.h2")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">{t("steps.6.p")}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ChoiceButton
            title={t("steps.6.selfTitle")}
            detail={t("steps.6.selfDetail")}
            selected={openChild["6"] === "6a"}
            onClick={() => choose("6", "6a")}
          />
          <ChoiceButton
            title={t("steps.6.helpTitle")}
            detail={t("steps.6.helpDetail")}
            selected={openChild["6"] === "6b"}
            onClick={() => choose("6", "6b")}
          />
          <ChoiceButton
            title={t("steps.6.waitTitle")}
            detail={t("steps.6.waitDetail")}
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
  const { t } = useTranslation();
  const docs = buildDocs(answers, files, openChild, t);
  return (
    <div>
      <h2 className="text-xl font-bold text-ink">{t(`steps.${id}.h2`)}</h2>
      <p className="mt-2 text-sm leading-relaxed text-black/70">{t(`steps.${id}.p`)}</p>
      <ul className="mt-5 space-y-2">
        {docs.map((doc) => (
          <li key={doc} className="rounded-lg border border-black/10 bg-white px-4 py-3 text-sm leading-relaxed text-black/75">
            {doc}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col gap-2 text-sm text-uiuc">
        <a className="underline" href="https://www.irs.gov/pub/irs-prior/f1040--2025.pdf" target="_blank" rel="noreferrer">
          {t("docs.l1040")}
        </a>
        <a className="underline" href="https://tax.illinois.gov/forms/incometax/currentyear/individual.html" target="_blank" rel="noreferrer">
          {t("docs.lil")}
        </a>
        <a className="underline" href="https://tax.illinois.gov/programs/mytax/il-1040.html" target="_blank" rel="noreferrer">
          {t("docs.mytax")}
        </a>
        <a className="underline" href="https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers" target="_blank" rel="noreferrer">
          {t("docs.vita")}
        </a>
      </div>
      <CompleteButton onClick={() => complete(id)}>{t("steps.6a.done")}</CompleteButton>
    </div>
  );
}

function buildDocs(
  answers: Answers,
  files: File[],
  openChild: Partial<Record<Id, Id>>,
  t: (key: string, options?: Record<string, string | number>) => string,
) {
  const list = [
    t("docs.id"),
    files.length
      ? t("docs.files", { names: files.map((file) => file.name).join(", ") })
      : t("docs.none"),
  ];
  if (answers.incomeTypes.includes("wages") || openChild["4"] === "4a") {
    list.push(t("docs.w2"));
  }
  if (answers.incomeTypes.includes("gig") || openChild["4"] === "4b") {
    list.push(t("docs.gig"));
  }
  if (answers.incomeTypes.includes("interest")) {
    list.push(t("docs.int"));
  }
  if (answers.incomeTypes.includes("unemployment")) {
    list.push(t("docs.unemp"));
  }
  if (answers.studentLoans === "yes") list.push(t("docs.e"));
  if (answers.college === "yes") list.push(t("docs.t"));
  if (answers.retirement === "yes") list.push(t("docs.ret"));
  if (answers.childcare === "yes") list.push(t("docs.care"));
  if (answers.k12 === "yes") list.push(t("docs.k12"));
  if (answers.homeowner === "yes") list.push(t("docs.home"));
  if (answers.marketplace === "yes") list.push(t("docs.mkt"));
  if (answers.tips === "yes") list.push(t("docs.tips"));
  if (answers.children.length) {
    list.push(t("docs.kids", { count: answers.children.length }));
  }
  list.push(t("docs.forms"));
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
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("es") ? "es-ES" : "en-US";
  const path = [
    openChild["1"] === "1a" ? t("recap.upload") : t("recap.skip"),
    openChild["2"] === "2b"
      ? t("recap.review", { states: answers.otherStates ? ` (${answers.otherStates})` : "" })
      : t("recap.fullYear"),
    openChild["3"] === "3b" ? t("recap.claimed") : t("recap.independent"),
    openChild["4"] === "4b"
      ? t("recap.gig")
      : openChild["4"] === "4c"
        ? t("recap.mix")
        : t("recap.w2"),
    openChild["5"] === "5b"
      ? t("recap.school")
      : openChild["5"] === "5c"
        ? t("recap.kids")
        : openChild["5"] === "5d"
          ? t("recap.messy")
          : t("recap.simple"),
    openChild["6"] === "6b"
      ? t("recap.vita")
      : openChild["6"] === "6c"
        ? t("recap.wait")
        : t("recap.self"),
  ];

  const money = (amount: number) =>
    amount > 0 ? `$${amount.toLocaleString(locale)}` : t("common.amountNone");

  const tri = (value: Tri) => {
    if (value === "yes") return t("common.yes");
    if (value === "no") return t("common.no");
    if (value === "unsure") return t("common.unsureValue");
    return t("common.notAnswered");
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-ink">{t("steps.7.h2")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-black/70">{t("steps.7.p")}</p>
      <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-black/80">
        {path.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
      <dl className="mt-6 space-y-2 text-sm">
        <Row label={t("recap.taxYear")} value={tri(answers.taxYear2025)} />
        <Row label={t("recap.usRes")} value={tri(answers.usResident)} />
        <Row label={t("recap.filed")} value={tri(answers.alreadyFiled)} />
        <Row label={t("recap.ext")} value={tri(answers.extension)} />
        <Row label={t("recap.married")} value={tri(answers.married)} />
        <Row label={t("recap.dob")} value={answers.dob || t("recap.notEntered")} />
        <Row label={t("recap.blind")} value={tri(answers.blindness)} />
        <Row label={t("recap.could")} value={tri(answers.couldBeClaimed)} />
        <Row label={t("recap.was")} value={tri(answers.wasClaimed)} />
        <Row
          label={t("recap.people")}
          value={
            answers.hasKids === "yes"
              ? t("recap.peopleOn", {
                  count: answers.childCount,
                  detail: answers.children
                    .map((child, index) =>
                      t("recap.personLine", {
                        n: index + 1,
                        dob: child.dob || t("recap.unset"),
                        months: child.monthsHome,
                      }),
                    )
                    .join("; "),
                })
              : tri(answers.hasKids)
          }
        />
        <Row label={t("recap.foreign")} value={tri(answers.foreignIncome)} />
        <Row
          label={t("recap.types")}
          value={
            answers.incomeTypes.length
              ? answers.incomeTypes.map((key) => t(`income.${key}`)).join(", ")
              : t("recap.notListed")
          }
        />
        <Row label={t("recap.wages")} value={money(answers.wages)} />
        <Row label={t("recap.other")} value={money(answers.otherIncome)} />
        <Row label={t("recap.invest")} value={money(answers.investmentIncome)} />
        <Row label={t("recap.loans")} value={tri(answers.studentLoans)} />
        <Row label={t("recap.loanAmt")} value={money(answers.loanInterest)} />
        <Row label={t("recap.college")} value={tri(answers.college)} />
        <Row label={t("recap.ret")} value={tri(answers.retirement)} />
        <Row label={t("recap.home")} value={tri(answers.homeowner)} />
        <Row label={t("recap.prop")} value={money(answers.propertyTax)} />
        <Row label={t("recap.care")} value={tri(answers.childcare)} />
        <Row label={t("recap.k12")} value={tri(answers.k12)} />
        <Row label={t("recap.mkt")} value={tri(answers.marketplace)} />
        <Row label={t("recap.tips")} value={tri(answers.tips)} />
        <Row
          label={t("recap.files")}
          value={files.length ? files.map((file) => file.name).join(", ") : t("recap.noFiles")}
        />
      </dl>
      <p className="mt-6 text-sm leading-relaxed text-black/70">
        {t("steps.7.next")}
      </p>
      <CompleteButton onClick={() => complete("7")}>{t("steps.7.done")}</CompleteButton>
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
