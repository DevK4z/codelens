import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeTrace } from './src/engine/traceSummary.ts';
import type { TraceEvent } from './src/engine/types.ts';
const line = (n: number): TraceEvent => ({step:0,line:n,event:'line',callStack:[],variables:{},changed:[]});
test('trace summary separates repeated observations, distinct lines and output without deleting steps', () => {
  const trace = [line(3), line(4), line(3), line(3), {...line(4),event:'stdout'}];
  assert.deepEqual(summarizeTrace(trace), {total:5,sourceStops:4,uniqueLines:2,outputRecords:1,otherRecords:0,frequentLines:[[3,3]]});
  assert.equal(trace.length,5);
});
test('legacy semantic events and empty traces are counted without fabricating source stops', () => {
  assert.equal(summarizeTrace([]).total,0);
  assert.equal(summarizeTrace([{...line(3),event:'compare'}]).otherRecords,1);
});
