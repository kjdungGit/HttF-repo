import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function config(env) {
  const source=readFileSync(new URL('../src/utils/supabase/config.ts',import.meta.url),'utf8');
  const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}});
  const exports={};vm.runInNewContext(outputText,{exports,process:{env}});return exports;
}
test('public project configuration works for both browser and server helpers',()=>{
 const env={NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_demo',SUPABASE_SERVICE_ROLE_KEY:'private-admin-key'};
 for(const values of [config(env).getSupabasePublicConfig(),config(env).getSupabaseConfig()]){
  assert.equal(values.url,env.NEXT_PUBLIC_SUPABASE_URL);assert.equal(values.key,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);assert.doesNotMatch(JSON.stringify(values),/private-admin-key/);
 }
});
test('legacy server configuration still works but is not exposed by the browser helper',()=>{
 const helpers=config({SUPABASE_URL:'https://legacy.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_legacy'});
 assert.equal(helpers.getSupabaseConfig().key,'sb_publishable_legacy');assert.throws(()=>helpers.getSupabasePublicConfig());
});
test('an administration key cannot substitute for missing public configuration',()=>{
 const helpers=config({NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'private-admin-key'});
 assert.throws(()=>helpers.getSupabasePublicConfig());assert.throws(()=>helpers.getSupabaseConfig());
});
