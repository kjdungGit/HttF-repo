import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  readLocalForms,
  recordLocalForm,
  formsBackup,
  restoreFormsBackup,
  FORMS_KEY,
} from "../src/utils/preparation/local-forms.mjs";
function storage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
}
const record = () => ({
  id: randomUUID(),
  form_type: "w2",
  tax_year: 2025,
  language: "es",
  fields: {
    box_1_wages: "42000.25",
    box_2_federal_withholding: "0",
    box_16_state_wages: null,
  },
  issuer: "Demo employer",
});
test("recorded forms persist on this browser, preserve zero, omit unknowns, and retry without duplication", () => {
  const db = storage();
  const form = record();
  recordLocalForm(form, db);
  recordLocalForm(form, db);
  const saved = readLocalForms(db);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].fields.box_2_federal_withholding, "0.00");
  assert.equal(saved[0].fields.box_16_state_wages, undefined);
  assert.equal(saved[0].issuer, "Demo employer");
});
test("only reviewed numeric keys are stored; unknown fields and unsupported form types fail", () => {
  const db = storage();
  const form = record();
  for (const input of [
    { ...form, fields: { ssn: "999999999" } },
    { ...form, form_type: "todos" },
    { ...form, fields: { box_1_wages: "1.234,50" } },
    { ...form, fields: { box_1_wages: null } },
  ])
    assert.throws(() => recordLocalForm(input, db));
  assert.equal(readLocalForms(db).length, 0);
});
test("a forms backup restores values to another browser and repeated restore deduplicates IDs", () => {
  const first = storage(),
    second = storage();
  recordLocalForm(record(), first);
  const backup = JSON.parse(JSON.stringify(formsBackup(first)));
  restoreFormsBackup(backup, second);
  restoreFormsBackup(backup, second);
  assert.deepEqual(readLocalForms(first), readLocalForms(second));
  assert.equal(readLocalForms(second).length, 1);
});
test("malformed imports never overwrite existing forms", () => {
  const db = storage();
  recordLocalForm(record(), db);
  const before = db.getItem(FORMS_KEY);
  assert.throws(() =>
    restoreFormsBackup(
      {
        product: "KEENFinance",
        format: "forms-backup",
        version: 1,
        forms: [record(), { bad: true }],
      },
      db,
    ),
  );
  assert.equal(db.getItem(FORMS_KEY), before);
});
test("storage quota/access failures never report a successful recording or erase malformed data", () => {
  const inaccessible = {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  };
  assert.throws(() => recordLocalForm(record(), inaccessible));
  const db = storage();
  db.setItem(FORMS_KEY, "malformed");
  assert.throws(() => recordLocalForm(record(), db));
  assert.equal(db.getItem(FORMS_KEY), "malformed");
  const quota = {
    getItem() {
      return null;
    },
    setItem() {
      throw Error("Quota");
    },
  };
  assert.throws(() => recordLocalForm(record(), quota));
});
