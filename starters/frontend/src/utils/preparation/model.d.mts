export type Answer = "yes" | "no" | "unsure" | null;
export type QuestionKey =
  "residency" | "employment" | "gig" | "college" | "claimed";
export type W2Key =
  | "box_1_wages"
  | "box_2_federal_withholding"
  | "box_16_state_wages"
  | "box_17_state_withholding";
export type Preparation = {
  version: 1;
  step: number;
  answers: Record<QuestionKey, Answer>;
  documentStatus: "needed" | "received" | "collect_later" | "not_needed";
  w2: {
    employer: string;
    fields: Record<W2Key, string | null>;
    confirmed: boolean;
    recordId: string | null;
    source: "manual" | "pdf";
  };
  updatedAt: string;
};
export const QUESTION_KEYS: QuestionKey[];
export const W2_FIELDS: W2Key[];
export function blankPreparation(): Preparation;
export function validatePreparation(input: unknown): Preparation;
export function backupFor(state: Preparation): object;
export function restoreBackup(input: unknown): Preparation;
export function documentChecklist(
  state: Preparation,
): { key: string; source: string; status: string }[];
export function unresolvedQuestions(state: Preparation): QuestionKey[];
export function routeToHelp(state: Preparation): boolean;
