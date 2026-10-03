export const QUESTION_KEYS = [
  "residency",
  "employment",
  "gig",
  "college",
  "claimed",
];
export const W2_FIELDS = [
  "box_1_wages",
  "box_2_federal_withholding",
  "box_16_state_wages",
  "box_17_state_withholding",
];
export class PreparationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.status = 400;
  }
}
export function blankPreparation() {
  return {
    version: 1,
    step: 0,
    answers: Object.fromEntries(QUESTION_KEYS.map((key) => [key, null])),
    documentStatus: "needed",
    w2: {
      employer: "",
      fields: Object.fromEntries(W2_FIELDS.map((key) => [key, null])),
      confirmed: false,
      recordId: null,
      source: "manual",
    },
    updatedAt: new Date().toISOString(),
  };
}
export function validatePreparation(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    input.version !== 1
  )
    throw new PreparationError(
      "INVALID_PROGRESS",
      "Choose a valid KEENFinance progress backup.",
    );
  const result = blankPreparation();
  if (!Number.isInteger(input.step) || input.step < 0 || input.step > 7)
    throw new PreparationError("INVALID_PROGRESS", "Invalid preparation step.");
  result.step = input.step;
  if (!input.answers || typeof input.answers !== "object")
    throw new PreparationError(
      "INVALID_PROGRESS",
      "Missing preparation answers.",
    );
  for (const key of QUESTION_KEYS) {
    const value = input.answers[key];
    if (![null, "yes", "no", "unsure"].includes(value))
      throw new PreparationError(
        "INVALID_PROGRESS",
        "Invalid preparation answer.",
      );
    result.answers[key] = value;
  }
  if (
    !["needed", "received", "collect_later", "not_needed"].includes(
      input.documentStatus,
    )
  )
    throw new PreparationError("INVALID_PROGRESS", "Invalid document status.");
  result.documentStatus = input.documentStatus;
  if (
    !input.w2 ||
    typeof input.w2 !== "object" ||
    !input.w2.fields ||
    typeof input.w2.fields !== "object"
  )
    throw new PreparationError("INVALID_PROGRESS", "Missing W-2 review.");
  if (typeof input.w2.employer !== "string" || input.w2.employer.length > 100)
    throw new PreparationError(
      "INVALID_PROGRESS",
      "Employer name is too long.",
    );
  result.w2.employer = input.w2.employer;
  for (const key of W2_FIELDS) {
    const value = input.w2.fields[key];
    if (
      value !== null &&
      (typeof value !== "string" || !/^\d{1,12}(?:\.\d{0,2})?$/.test(value))
    )
      throw new PreparationError(
        "INVALID_PROGRESS",
        "Use a decimal point for amounts; leave unknown boxes blank.",
      );
    result.w2.fields[key] = value;
  }
  if (typeof input.w2.confirmed !== "boolean")
    throw new PreparationError("INVALID_PROGRESS", "Invalid review status.");
  result.w2.confirmed = input.w2.confirmed;
  result.w2.source = input.w2.source === "pdf" ? "pdf" : "manual";
  if (
    input.w2.recordId !== null &&
    (typeof input.w2.recordId !== "string" ||
      !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(
        input.w2.recordId,
      ))
  )
    throw new PreparationError("INVALID_PROGRESS", "Invalid saved form id.");
  result.w2.recordId = input.w2.recordId;
  const time = Date.parse(input.updatedAt);
  if (!Number.isFinite(time))
    throw new PreparationError("INVALID_PROGRESS", "Invalid progress date.");
  result.updatedAt = new Date(time).toISOString();
  return result;
}
export function backupFor(state) {
  const clean = validatePreparation(state);
  clean.w2.recordId = null;
  return {
    product: "KEENFinance",
    format: "preparation-backup",
    version: 1,
    preparation: clean,
  };
}
export function restoreBackup(input) {
  if (
    input?.product !== "KEENFinance" ||
    input?.format !== "preparation-backup"
  )
    throw new PreparationError(
      "INVALID_PROGRESS",
      "This is not a KEENFinance progress backup.",
    );
  const clean = validatePreparation(input.preparation);
  clean.w2.recordId = null;
  return clean;
}
export function documentChecklist(state) {
  const result = [];
  const a = state.answers;
  if (a.employment === "yes" || a.employment === "unsure")
    result.push({
      key: "w2",
      source: "https://www.irs.gov/taxtopics/tc154",
      status: state.w2.confirmed
        ? "reviewed"
        : state.documentStatus === "collect_later"
          ? "collect_later"
          : "needed",
    });
  if (a.gig === "yes" || a.gig === "unsure")
    result.push({
      key: "gig",
      source:
        "https://www.irs.gov/businesses/small-businesses-self-employed/self-employed-individuals-tax-center",
      status: "needed",
    });
  if (a.college === "yes" || a.college === "unsure")
    result.push({
      key: "college",
      source: "https://www.irs.gov/forms-pubs/about-form-1098-t",
      status: "needed",
    });
  if (a.claimed !== "no")
    result.push({
      key: "dependency",
      source: "https://www.irs.gov/help/ita/whom-may-i-claim-as-a-dependent",
      status: "needed",
    });
  result.push({
    key: "filing",
    source:
      "https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers",
    status: "next_step",
  });
  return result;
}
export function unresolvedQuestions(state) {
  return QUESTION_KEYS.filter(
    (key) => state.answers[key] === null || state.answers[key] === "unsure",
  );
}
export function routeToHelp(state) {
  return (
    state.answers.residency !== "yes" ||
    state.answers.gig !== "no" ||
    state.answers.claimed !== "no" ||
    unresolvedQuestions(state).length > 0 ||
    state.documentStatus === "collect_later"
  );
}
