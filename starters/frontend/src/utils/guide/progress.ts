export type Tri = "" | "yes" | "no" | "unsure";
export type Id =
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
  | "6c"
  | "7"
  | "8";

export type ChildFact = { dob: string; monthsHome: number };

export type Answers = {
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

export type GuideSnapshot = {
  active: Id;
  openChild: Partial<Record<Id, Id>>;
  done: Id[];
  answers: Answers;
  language: "en" | "es";
};

export const MAIN: { id: Id; label: string }[] = [
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "3", label: "3" },
  { id: "4", label: "4" },
  { id: "5", label: "5" },
  { id: "6", label: "6" },
  { id: "7", label: "7" },
  { id: "8", label: "8" },
];

export const NEXT_MAIN: Record<string, Id | null> = {
  "1": "2",
  "2": "3",
  "3": "4",
  "4": "5",
  "5": "6",
  "6": "7",
  "7": "8",
  "8": null,
};

export const PARENT: Partial<Record<Id, Id>> = {
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
  "6c": "6",
};

export const CHILDREN: Partial<Record<Id, Id[]>> = {
  "1": ["1a"],
  "2": ["2a", "2b"],
  "3": ["3a", "3b"],
  "4": ["4a", "4b", "4c"],
  "5": ["5a", "5b", "5c", "5d"],
  "6": ["6a", "6c"],
};

export const INCOME_OPTIONS = ["wages", "tips", "gig", "interest", "unemployment", "retirement"] as const;

export const EMPTY: Answers = {
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

const IDS = new Set<string>([
  "1", "1a", "2", "2a", "2b", "3", "3a", "3b", "4", "4a", "4b", "4c",
  "5", "5a", "5b", "5c", "5d", "6", "6a", "6c", "7", "8",
]);

function migrateId(value: unknown) {
  return value === "6b" ? "6a" : value;
}

function asId(value: unknown): Id | null {
  const next = migrateId(value);
  return typeof next === "string" && IDS.has(next) ? (next as Id) : null;
}

function asTri(value: unknown): Tri {
  return value === "yes" || value === "no" || value === "unsure" ? value : "";
}

function asNumber(value: unknown, max = 100000) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(0, n));
}

function exclusiveChildren(openChild: Partial<Record<Id, Id>>) {
  const next: Partial<Record<Id, Id>> = {};
  for (const [parent, allowed] of Object.entries(CHILDREN) as [Id, Id[]][]) {
    const child = asId(openChild[parent]);
    if (child && allowed.includes(child)) next[parent] = child;
  }
  return next;
}

export function emptySnapshot(language: "en" | "es" = "en"): GuideSnapshot {
  return { active: "1", openChild: {}, done: [], answers: { ...EMPTY, children: [], incomeTypes: [] }, language };
}

export function sanitizeSnapshot(value: unknown, language: "en" | "es" = "en"): GuideSnapshot {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const openChild = exclusiveChildren((raw.openChild ?? {}) as Partial<Record<Id, Id>>);
  const done = Array.isArray(raw.done)
    ? [...new Set(raw.done.map(asId).filter((id): id is Id => Boolean(id)))]
    : [];
  const filteredDone = done.filter((id) => {
    const parent = PARENT[id];
    if (!parent) return true;
    const selected = openChild[parent];
    return !selected || selected === id;
  });
  const answersIn = raw.answers && typeof raw.answers === "object" && !Array.isArray(raw.answers)
    ? (raw.answers as Record<string, unknown>)
    : {};
  const children = Array.isArray(answersIn.children)
    ? answersIn.children.slice(0, 8).map((child) => {
        const row = child && typeof child === "object" ? (child as Record<string, unknown>) : {};
        return { dob: typeof row.dob === "string" ? row.dob.slice(0, 32) : "", monthsHome: asNumber(row.monthsHome, 12) };
      })
    : [];
  const incomeTypes = Array.isArray(answersIn.incomeTypes)
    ? answersIn.incomeTypes.filter((item): item is string => typeof item === "string" && INCOME_OPTIONS.includes(item as (typeof INCOME_OPTIONS)[number]))
    : [];
  return {
    active: asId(raw.active) ?? "1",
    openChild,
    done: filteredDone,
    language: raw.language === "es" || language === "es" ? "es" : "en",
    answers: {
      ...EMPTY,
      taxYear2025: asTri(answersIn.taxYear2025),
      livedIL: asTri(answersIn.livedIL),
      usResident: asTri(answersIn.usResident),
      alreadyFiled: asTri(answersIn.alreadyFiled),
      extension: asTri(answersIn.extension),
      otherStates: typeof answersIn.otherStates === "string" ? answersIn.otherStates.slice(0, 80) : "",
      married: asTri(answersIn.married),
      couldBeClaimed: asTri(answersIn.couldBeClaimed),
      wasClaimed: asTri(answersIn.wasClaimed),
      dob: typeof answersIn.dob === "string" ? answersIn.dob.slice(0, 32) : "",
      blindness: asTri(answersIn.blindness),
      hasKids: asTri(answersIn.hasKids),
      childCount: asNumber(answersIn.childCount, 8),
      children,
      foreignIncome: asTri(answersIn.foreignIncome),
      incomeTypes,
      wages: asNumber(answersIn.wages),
      otherIncome: asNumber(answersIn.otherIncome),
      investmentIncome: asNumber(answersIn.investmentIncome),
      studentLoans: asTri(answersIn.studentLoans),
      loanInterest: asNumber(answersIn.loanInterest, 2500),
      college: asTri(answersIn.college),
      retirement: asTri(answersIn.retirement),
      homeowner: asTri(answersIn.homeowner),
      propertyTax: asNumber(answersIn.propertyTax),
      childcare: asTri(answersIn.childcare),
      k12: asTri(answersIn.k12),
      tips: asTri(answersIn.tips),
      marketplace: asTri(answersIn.marketplace),
    },
  };
}

export function snapshotHasProgress(snapshot: GuideSnapshot) {
  return snapshot.done.length > 0 || Object.keys(snapshot.openChild).length > 0 || snapshot.active !== "1";
}

export const CHECKLIST_PREFIX = "guide:";

export function checklistTitle(id: Id) {
  return `${CHECKLIST_PREFIX}${id}`;
}

export function stepStatus(id: Id, snapshot: GuideSnapshot): "needed" | "in_progress" | "complete" {
  if (snapshot.done.includes(id)) return "complete";
  if (snapshot.active === id || PARENT[snapshot.active] === id) return "in_progress";
  return "needed";
}

export function whyNeeded(id: Id) {
  const text: Record<string, string> = {
    "1": "Collect payer documents or skip if you will gather them later.",
    "2": "Lock tax year 2025 and Illinois residency before later credits.",
    "3": "Household and dependent facts change filing status and credits.",
    "4": "Income types decide which payer forms belong on the recap.",
    "5": "Screen credits that match the path you chose; do not add refunds.",
    "6": "Choose how you will file and keep the document list.",
    "7": "List the credits and benefits that match the answers you gave.",
    "8": "Review the preparation recap before you file on official sites.",
  };
  return text[id] ?? "Complete this checklist step.";
}
