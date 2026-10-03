import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { NextRequest } from "next/server.js";

const require = createRequire(import.meta.url);

function loadSessionHelper(createServerClient) {
  const source = readFileSync(new URL("../src/utils/supabase/middleware.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      if (name === "@supabase/ssr") return { createServerClient };
      if (name === "./config") return { getSupabaseConfig: () => ({ url: "https://example.supabase.co", key: "sb_publishable_test" }) };
      return require(name);
    },
  });
  return exports.createClient;
}

test("session validation forwards refreshed cookies to rendering and the browser, preserving cache headers", async () => {
  let validated = false;
  const createClient = loadSessionHelper((_url, _key, { cookies }) => ({
    auth: {
      async getClaims() {
        validated = true;
        assert.equal(cookies.getAll().find((cookie) => cookie.name === "original").value, "kept");
        cookies.setAll([{ name: "session.0", value: "refreshed", options: { path: "/", httpOnly: true } }], { "Cache-Control": "private, no-store" });
        cookies.setAll([{ name: "session.1", value: "continued", options: { path: "/", sameSite: "lax" } }], {});
        return { data: { claims: {} }, error: null };
      },
    },
  }));
  const request = new NextRequest("https://example.test/", { headers: { cookie: "original=kept" } });
  const response = await createClient(request);
  assert.equal(validated, true);
  assert.equal(request.cookies.get("session.0").value, "refreshed");
  assert.equal(response.cookies.get("session.0").httpOnly, true);
  assert.equal(response.cookies.get("session.1").value, "continued");
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.match(response.headers.get("x-middleware-request-cookie"), /session.0=refreshed/);
  assert.match(response.headers.get("x-middleware-request-cookie"), /session.1=continued/);
});

test("an anonymous visitor is passed through without an auth redirect or session cookie", async () => {
  const createClient = loadSessionHelper(() => ({ auth: { getClaims: async () => ({ data: null, error: null }) } }));
  const response = await createClient(new NextRequest("https://example.test/"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
  assert.equal(response.headers.get("set-cookie"), null);
});
