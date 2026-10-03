import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import * as model from "../src/utils/preparation/model.mjs";
import { extractTaxPdf } from "./pdf-engine.mjs";
test("backups retain unknowns and zero, discard identity and reject malformed amounts", () => {
  const state = model.blankPreparation();
  state.w2.fields.box_1_wages = "0";
  state.w2.recordId = randomUUID();
  state.user_id = "another-account";
  const clean = model.restoreBackup(model.backupFor(state));
  assert.equal(clean.w2.recordId, null);
  assert.equal(clean.user_id, undefined);
  assert.equal(clean.w2.fields.box_1_wages, "0");
  assert.equal(clean.w2.fields.box_2_federal_withholding, null);
  assert.throws(() =>
    model.validatePreparation({
      ...state,
      w2: {
        ...state.w2,
        fields: { ...state.w2.fields, box_1_wages: "1.234,50" },
      },
    }),
  );
  assert.throws(() =>
    model.restoreBackup({ product: "other", preparation: state }),
  );
});
test("uncertain and missing-document paths produce assistance and follow-up checklists", () => {
  const state = model.blankPreparation();
  for (const key of model.QUESTION_KEYS) state.answers[key] = "no";
  state.answers.residency = "yes";
  state.answers.employment = "yes";
  assert.equal(model.routeToHelp(state), false);
  state.documentStatus = "collect_later";
  assert.equal(model.routeToHelp(state), true);
  assert.equal(model.documentChecklist(state)[0].status, "collect_later");
  state.answers.college = "unsure";
  assert.ok(model.documentChecklist(state).some((i) => i.key === "college"));
  assert.deepEqual(model.unresolvedQuestions(state), ["college"]);
});
test("verified W2 Copy B extracts all four box values without SSN", async () => {
  const data = await extractTaxPdf(
    readFileSync(new URL("./fixtures/pdf/w2-en.pdf", import.meta.url)),
  );
  assert.equal(data.formType, "w2");
  assert.deepEqual(data.fields, {
    box_1_wages: "42000.25",
    box_2_federal_withholding: "4500.50",
    box_16_state_wages: "42000.25",
    box_17_state_withholding: "2100.00",
  });
  assert.equal(data.evidence.box_1_wages.page, 1);
  assert.doesNotMatch(JSON.stringify(data), /999999999/);
});
