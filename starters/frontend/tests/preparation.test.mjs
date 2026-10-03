import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import vm from "node:vm";
import ts from "typescript";
import * as model from "../src/utils/preparation/model.mjs";
import * as extraction from "../src/utils/pdf/tax-extraction.mjs";
function moduleFrom(file, deps) {
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(file, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  );
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: (n) => deps[n],
    Request,
    Response,
    Buffer,
    Uint8Array,
  });
  return exports;
}
const bodyModule = moduleFrom("../src/utils/preparation/request.ts", {
  "@/utils/pdf/tax-extraction.mjs": extraction,
});
function route(file, client, denied = false) {
  return moduleFrom(file, {
    "@/utils/preparation/request": bodyModule,
    "@/utils/preparation/model.mjs": model,
    "@/utils/pdf/tax-extraction.mjs": extraction,
    "@/utils/pdf/document-request": {
      documentSession: async () => {
        if (denied)
          throw new extraction.DocumentError("AUTH_REQUIRED", 401, "Sign in");
        return { client, user: { id: "verified-owner" } };
      },
      documentError: (e) =>
        Response.json({ error: e.code }, { status: e.status ?? 503 }),
    },
  });
}
const request = (state) =>
  new Request("http://localhost/api/preparation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
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
  const data = await extraction.extractTaxPdf(
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
test("progress saving binds the verified owner and ignores caller identity", async () => {
  const calls = [];
  const client = {
    from(table) {
      assert.equal(table, "profiles");
      return {
        update(patch) {
          calls.push(patch);
          return {
            eq(column, id) {
              calls.push([column, id]);
              return {
                select() {
                  return {
                    maybeSingle: async () => ({ data: { id }, error: null }),
                  };
                },
              };
            },
          };
        },
      };
    },
  };
  const api = route("../src/app/api/preparation/route.ts", client);
  const response = await api.POST(
    request({ ...model.blankPreparation(), user_id: "someone-else" }),
  );
  assert.equal(response.status, 200);
  assert.equal(calls[0].user_id, undefined);
  assert.deepEqual(calls[1], ["id", "verified-owner"]);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(
    (
      await route("../src/app/api/preparation/route.ts", {}, true).POST(
        request(model.blankPreparation()),
      )
    ).status,
    401,
  );
});
test("W2 recording requires review and preserves idempotent record id without owner input", async () => {
  const calls = [];
  const api = route("../src/app/api/preparation/w2/route.ts", {
    rpc: async (...args) => {
      calls.push(args);
      return { error: null };
    },
  });
  const state = model.blankPreparation();
  assert.equal((await api.POST(request(state))).status, 400);
  assert.equal(calls.length, 0);
  state.w2.confirmed = true;
  state.w2.recordId = randomUUID();
  state.w2.fields.box_1_wages = "0";
  const response = await api.POST(
    request({ ...state, user_id: "someone-else" }),
  );
  assert.equal(response.status, 201);
  assert.equal(calls[0][1].target_column, "form_w2");
  assert.equal(calls[0][1].form_record.id, state.w2.recordId);
  assert.equal(calls[0][1].form_record.fields.box_1_wages, "0");
  assert.equal(calls[0][1].form_record.user_id, undefined);
});
test("unavailable database and oversized JSON return recoverable errors", async () => {
  const api = route("../src/app/api/preparation/w2/route.ts", {
    rpc: async () => ({ error: { code: "PGRST202" } }),
  });
  const state = model.blankPreparation();
  state.w2.confirmed = true;
  state.w2.recordId = randomUUID();
  state.w2.fields.box_1_wages = "100";
  assert.equal((await api.POST(request(state))).status, 503);
  await assert.rejects(
    bodyModule.preparationBody(request({ padding: "x".repeat(40000) })),
    (e) => e.status === 413,
  );
});
