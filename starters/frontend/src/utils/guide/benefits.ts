import type { Answers } from "./progress";
import type { Id } from "./progress";

export type BenefitHit = {
  id: string;
  status: "likely" | "maybe";
};

export function qualifiedBenefits(answers: Answers, openChild: Partial<Record<Id, Id>>): BenefitHit[] {
  const hits: BenefitHit[] = [];
  const independent = openChild["3"] !== "3b" && answers.wasClaimed !== "yes";
  const earned = answers.incomeTypes.includes("wages") || answers.incomeTypes.includes("gig") || answers.wages > 0 || answers.otherIncome > 0;
  const illinois = answers.livedIL === "yes" || openChild["2"] === "2a";

  hits.push({ id: "std", status: "likely" });
  if (illinois) hits.push({ id: "ilExempt", status: "likely" });

  if (independent && earned && answers.wasClaimed !== "yes") {
    hits.push({ id: "eitc", status: answers.couldBeClaimed === "yes" ? "maybe" : "likely" });
    if (illinois) hits.push({ id: "ilEitc", status: answers.couldBeClaimed === "yes" ? "maybe" : "likely" });
  }

  if (answers.hasKids === "yes" || answers.childCount > 0) hits.push({ id: "ctc", status: "likely" });
  if (answers.childcare === "yes") hits.push({ id: "care", status: "likely" });
  if (answers.college === "yes") hits.push({ id: "education", status: "likely" });
  if (answers.studentLoans === "yes") hits.push({ id: "loan", status: "likely" });
  if (answers.retirement === "yes") hits.push({ id: "saver", status: "maybe" });
  if (answers.homeowner === "yes") hits.push({ id: "property", status: "likely" });
  if (answers.k12 === "yes") hits.push({ id: "k12", status: "likely" });
  if (answers.marketplace === "yes") hits.push({ id: "premium", status: "likely" });
  if (answers.tips === "yes") hits.push({ id: "tips", status: "maybe" });
  if (openChild["5"] === "5d") hits.push({ id: "review", status: "maybe" });

  return hits;
}
