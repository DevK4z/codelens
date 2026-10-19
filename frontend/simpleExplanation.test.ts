import {test} from 'node:test';
import assert from 'node:assert/strict';
import {simpleExplanation} from './src/engine/simpleExplanation.ts';
import {explainStepWithAI} from './src/engine/ai.ts';
const step = (n: number, vars: Record<string,unknown> = {}) => ({step:n,line:n+1,event:'line',variables:vars,changed:[],callStack:[{func:'main',line:n+1,id:1}],detail:'GCC/GDB: before'});
test('simple summary keeps pre-line condition unknown and shows only observed changes',()=>{
 const result=simpleExplanation(step(1,{sum:10}),step(0,{sum:6}),'int main(){\nif(sum>5)',step(2));
 assert.match(result.action,/Sắp kiểm tra/); assert.doesNotMatch(result.action,/đúng|sai/);
 assert.equal(result.change,'sum: 6 → 10'); assert.equal(result.next,'Bước tiếp theo trong bản ghi: dòng 3.');
});
test('recursion never compares different call frames; changes and output stay short',()=>{
 const a=step(0,{n:4}); const b={...step(1,{n:3}),callStack:[...a.callStack,{func:'factorial',line:2,id:2}]};
 assert.doesNotMatch(simpleExplanation(b,a,'').change,/4 → 3/);
 const result=simpleExplanation(step(1,{a:[1,2,3,4,5]}),step(0,{a:[0,0,0,0,0]}),'');
 assert.match(result.change,/Xem thêm/); assert.ok(result.change.length<180);
 assert.equal(simpleExplanation({...a,event:'stdout',callStack:[],stdout:'120'},b,'').action,'Đây là kết quả chương trình đã in ra.');
});
test('AI uses header key, bounded structured reply and rejects malformed or overlong results',async()=>{
 const original=globalThis.fetch;
 try {
  globalThis.fetch=async(url,options)=>{
   assert.ok(!String(url).includes('test-key')); assert.equal((options!.headers as Record<string,string>)['x-goog-api-key'],'test-key');
   assert.ok(options!.signal); assert.match(String(options!.body),/không tính lại C\+\+/);
   return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({action:'Sắp đọc số.',change:'Chưa đổi.',next:'Xem dòng 3.'})}]}}]}));
  };
  assert.equal((await explainStepWithAI('context','test-key',new AbortController().signal)).action,'Sắp đọc số.');
  globalThis.fetch=async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:'{"action":123}'}]}}]}));
  await assert.rejects(()=>explainStepWithAI('context','test-key',new AbortController().signal),/không hợp lệ/);
  globalThis.fetch=async()=>new Response('',{status:429});
  await assert.rejects(()=>explainStepWithAI('context','test-key',new AbortController().signal),/hạn mức/);
 } finally {globalThis.fetch=original;}
});
