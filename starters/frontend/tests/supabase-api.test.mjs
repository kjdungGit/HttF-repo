import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

function loadRoute(result, failSetup = false) {
  const source = readFileSync(new URL("../src/app/api/todos/route.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  const cookieStore = {};
  const client = {};
  vm.runInNewContext(outputText, {
    exports,
    console: { error() {} },
    require(name) {
      if (name === "next/headers") return { cookies: async () => cookieStore };
      if (name === "@/utils/supabase/server") return { createClient(store) {
        assert.equal(store, cookieStore);
        if (failSetup) throw new Error("internal configuration details");
        return client;
      } };
      if (name === "@/utils/supabase/todos") return { listTodos(supabase) {
        assert.equal(supabase, client);
        return Promise.resolve(result);
      } };
      return require(name);
    },
  });
  return exports.GET;
}

test("GET todos returns rows and prevents caching session-specific data", async () => {
  const rows = [{ id: 1, name: "Review equipment" }];
  const response = await loadRoute({ data: rows, error: null })();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { todos: rows });
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});

test("unavailable table returns a structured 503 without leaking database details", async () => {
  const response = await loadRoute({ data: null, error: { code: "PGRST205", message: "internal schema details" } })();
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error.code, "TODOS_UNAVAILABLE");
  assert.doesNotMatch(JSON.stringify(body), /internal|PGRST205/);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});

test("configuration failure returns a structured 500", async () => {
  const response = await loadRoute(null, true)();
  assert.equal(response.status, 500);
  assert.equal((await response.json()).error.code, "REQUEST_FAILED");
});
