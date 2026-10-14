import test from 'node:test';
import assert from 'node:assert/strict';
import { generateExplanation } from './src/engine/explanations.ts';
import type { TraceEvent } from './src/engine/types.ts';
const step = (patch: Partial<TraceEvent> = {}): TraceEvent => ({step:0,line:2,event:'line',callStack:[{func:'main',line:2}],variables:{x:1},changed:[],detail:'GCC/GDB: trạng thái trước khi thực thi dòng này.',stdout:'',...patch});
test('GDB line explains source and actual changes before the current line', () => {
  const text = generateExplanation(step({variables:{x:2}}),step(),undefined,'int main(){\nif (x > 1) {');
  assert.match(text,/if \(x > 1\)/);
  assert.match(text,/x: 1 → 2/);
  assert.match(text,/Chưa kết luận đúng\/sai/);
  assert.match(text,/trước khi chạy dòng đang tô sáng/);
});
test('first snapshot and unavailable values do not invent initialization', () => {
  const text=generateExplanation(step({variables:{x:null,y:'<unavailable>'}}));
  assert.match(text,/chưa có giá trị xác định/);
  assert.match(text,/không đọc được/);
  assert.doesNotMatch(text,/→/);
});
test('arrays and exact large integers are readable, output is a delta', () => {
  const text=generateExplanation(step({variables:{arr:[1,9],n:'9223372036854775807'},stdout:'a\nb\n'}),step({variables:{arr:[1,2]},stdout:'a\n'}));
  assert.match(text,/arr\[1\]: 2 → 9/);
  assert.match(text,/9223372036854775807/);
  assert.match(text,/Stdout mới: "b\\n"/);
});
test('recursive frames never compare same-named locals across depths', () => {
  const prev=step({callStack:[{func:'f',line:2}],variables:{x:99}});
  const next=step({callStack:[{func:'f',line:2},{func:'f',line:3}],variables:{x:3}});
  const text=generateExplanation(next,prev);
  assert.match(text,/Ngăn xếp tăng/);
  assert.match(text,/x = 3/);
  assert.doesNotMatch(text,/99 → 3/);
  assert.match(generateExplanation(prev,next),/Ngăn xếp giảm/);
});
test('unchanged state, unknown C++ and missing source always give an explanation', () => {
  const text=generateExplanation(step(),step(),undefined,'\nCUSTOM_MACRO(x);');
  assert.match(text,/CUSTOM_MACRO/);
  assert.match(text,/Chưa ghi nhận thay đổi/);
  assert.ok(generateExplanation(step()).length > 0);
});
test('legacy semantic events and final stdout keep their explanations', () => {
  assert.match(generateExplanation(step({event:'compare',compareInfo:{left:'x',right:'y',leftValue:1,rightValue:2,operator:'<',result:true}})),/đúng/);
  assert.match(generateExplanation(step({event:'stdout',detail:'',stdout:'done'}),step()),/done/);
});
