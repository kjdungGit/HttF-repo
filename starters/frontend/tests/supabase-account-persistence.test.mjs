import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = ts.transpileModule(fs.readFileSync(new URL('../src/utils/supabase/users.ts', import.meta.url), 'utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {createUserFunctions} = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function client({disabled=false,profileFail=false,existing=false}={}) {
 const calls=[];const user={id:'test-user',user_metadata:{display_name:'Demo'},is_anonymous:true};
 return {calls,auth:{getUser:async()=>({data:{user:existing?user:null},error:null}),signInAnonymously:async(input)=>{calls.push(['signup',input]);return disabled?{error:{code:'anonymous_provider_disabled'}}:{data:{user,session:{}},error:null}}},
 from:(table)=>{calls.push(['table',table]);return {upsert:async(value)=>{calls.push(['profile',value]);return {error:profileFail?{}:null}},select:()=>({eq:()=>({single:async()=>({data:{id:user.id},error:null})})})}}};
}
test('username creation requires a real Supabase session and verifies a persisted profile',async()=>{const c=client();const result=await createUserFunctions(c).signInWithUsername({username:'Demo'});assert.equal(result.user.id,'test-user');assert.deepEqual(c.calls.find(x=>x[0]==='profile'),['profile',{id:'test-user'}]);});
test('disabled anonymous auth fails instead of fabricating a local account',async()=>{const c=client({disabled:true});await assert.rejects(createUserFunctions(c).signInWithUsername({username:'Demo'}),{code:'GUEST_SIGNIN_DISABLED'});assert.ok(!c.calls.some(x=>x[0]==='profile'));});
test('profile write failure never reports successful account creation',async()=>{await assert.rejects(createUserFunctions(client({profileFail:true})).signInWithUsername({username:'Demo'}),{code:'PROFILE_UNAVAILABLE'});});
test('retry repairs an existing session profile without creating a second auth user',async()=>{const c=client({existing:true});await createUserFunctions(c).signInWithUsername({username:'Demo'});assert.ok(!c.calls.some(x=>x[0]==='signup'));assert.ok(c.calls.some(x=>x[0]==='profile'));});
const originSource=ts.transpileModule(fs.readFileSync(new URL('../src/utils/supabase/origin.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {isSameOrigin}=await import('data:text/javascript;base64,'+Buffer.from(originSource).toString('base64'));
test('same-origin checks accept browser host when Next binds 0.0.0.0 and reject foreign origins',()=>{
 assert.equal(isSameOrigin(new Request('http://0.0.0.0:3000/api/auth/guest',{headers:{host:'localhost:3000',origin:'http://localhost:3000'}})),true);
 assert.equal(isSameOrigin(new Request('http://0.0.0.0:3000/api/auth/guest',{headers:{host:'localhost:3000',origin:'http://evil.example'}})),false);
 assert.equal(isSameOrigin(new Request('http://0.0.0.0:3000/api/auth/guest',{headers:{host:'localhost:3000',origin:'null'}})),false);
});
