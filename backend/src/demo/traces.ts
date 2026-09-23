import { TraceEvent } from '../routes/execute.js';

export function getDemoTrace(sampleId: string): { trace: TraceEvent[], stdout: string, isDemo: boolean } | null {
  if (sampleId === 'array-sum') {
    return {
      isDemo: true,
      stdout: 'Sum: 15\n',
      trace: [
        { step: 1, line: 1, event: 'START', callStack: [{func: 'main', line: 1}], variables: { arr: [1,2,3,4,5], sum: 0, i: 0 }, changed: [] },
        { step: 2, line: 2, event: 'VAR_UPDATE', callStack: [{func: 'main', line: 1}], variables: { arr: [1,2,3,4,5], sum: 1, i: 0 }, changed: ['sum'], arrayAccess: { name: 'arr', index: 0, action: 'read', value: 1 } },
        { step: 3, line: 3, event: 'VAR_UPDATE', callStack: [{func: 'main', line: 1}], variables: { arr: [1,2,3,4,5], sum: 3, i: 1 }, changed: ['sum', 'i'], arrayAccess: { name: 'arr', index: 1, action: 'read', value: 2 } },
        { step: 4, line: 2, event: 'VAR_UPDATE', callStack: [{func: 'main', line: 1}], variables: { arr: [1,2,3,4,5], sum: 6, i: 2 }, changed: ['sum', 'i'], arrayAccess: { name: 'arr', index: 2, action: 'read', value: 3 } },
        { step: 5, line: 3, event: 'VAR_UPDATE', callStack: [{func: 'main', line: 1}], variables: { arr: [1,2,3,4,5], sum: 10, i: 3 }, changed: ['sum', 'i'], arrayAccess: { name: 'arr', index: 3, action: 'read', value: 4 } },
        { step: 6, line: 4, event: 'VAR_UPDATE', callStack: [{func: 'main', line: 1}], variables: { arr: [1,2,3,4,5], sum: 15, i: 4 }, changed: ['sum', 'i'], arrayAccess: { name: 'arr', index: 4, action: 'read', value: 5 } },
        { step: 7, line: 5, event: 'PRINT', callStack: [{func: 'main', line: 1}], variables: { arr: [1,2,3,4,5], sum: 15, i: 5 }, changed: ['i'], stdout: 'Sum: 15\n' },
        { step: 8, line: 6, event: 'END', callStack: [], variables: {}, changed: [] }
      ]
    };
  }
  if (sampleId === 'binary-search') {
    return {
      isDemo: true,
      stdout: 'Found at index 3\n',
      trace: [
        { step: 1, line: 1, event: 'START', callStack: [{func: 'main', line: 1}], variables: { arr: [1,3,5,7,9,11,13], left: 0, right: 6 }, changed: [] },
        { step: 2, line: 2, event: 'VAR_UPDATE', callStack: [{func: 'main', line: 1}], variables: { arr: [1,3,5,7,9,11,13], left: 0, right: 6, mid: 3 }, changed: ['mid'] },
        { step: 3, line: 3, event: 'COMPARE', callStack: [{func: 'main', line: 1}], variables: { arr: [1,3,5,7,9,11,13], left: 0, right: 6, mid: 3 }, changed: [], compareInfo: { left: 'arr[mid]', right: '7', leftValue: 7, rightValue: 7, operator: '==', result: true } },
        { step: 4, line: 4, event: 'PRINT', callStack: [{func: 'main', line: 1}], variables: { arr: [1,3,5,7,9,11,13], left: 0, right: 6, mid: 3 }, changed: [], stdout: 'Found at index 3\n' }
      ]
    };
  }
  if (sampleId === 'bubble-sort') {
    return {
      isDemo: true,
      stdout: 'Sorted\n',
      trace: [
        { step: 1, line: 1, event: 'START', callStack: [{func: 'main', line: 1}], variables: { arr: [5,3,1,4,2] }, changed: [] },
        { step: 2, line: 2, event: 'SWAP', callStack: [{func: 'main', line: 1}], variables: { arr: [3,5,1,4,2] }, changed: ['arr'], swapInfo: { name: 'arr', i: 0, j: 1 } },
        { step: 3, line: 3, event: 'SWAP', callStack: [{func: 'main', line: 1}], variables: { arr: [3,1,5,4,2] }, changed: ['arr'], swapInfo: { name: 'arr', i: 1, j: 2 } },
        { step: 4, line: 4, event: 'SWAP', callStack: [{func: 'main', line: 1}], variables: { arr: [3,1,4,5,2] }, changed: ['arr'], swapInfo: { name: 'arr', i: 2, j: 3 } },
        { step: 5, line: 5, event: 'SWAP', callStack: [{func: 'main', line: 1}], variables: { arr: [3,1,4,2,5] }, changed: ['arr'], swapInfo: { name: 'arr', i: 3, j: 4 } }
      ]
    };
  }
  if (sampleId === 'factorial') {
    return {
      isDemo: true,
      stdout: 'Factorial: 120\n',
      trace: [
        { step: 1, line: 10, event: 'CALL', callStack: [{func: 'main', line: 10}, {func: 'factorial', line: 1}], variables: { n: 5 }, changed: [] },
        { step: 2, line: 2, event: 'CALL', callStack: [{func: 'main', line: 10}, {func: 'factorial', line: 1}, {func: 'factorial', line: 1}], variables: { n: 4 }, changed: [] },
        { step: 3, line: 2, event: 'CALL', callStack: [{func: 'main', line: 10}, {func: 'factorial', line: 1}, {func: 'factorial', line: 1}, {func: 'factorial', line: 1}], variables: { n: 3 }, changed: [] },
        { step: 4, line: 2, event: 'RETURN', callStack: [{func: 'main', line: 10}, {func: 'factorial', line: 1}, {func: 'factorial', line: 1}], variables: { n: 4 }, changed: [] },
        { step: 5, line: 2, event: 'RETURN', callStack: [{func: 'main', line: 10}, {func: 'factorial', line: 1}], variables: { n: 5 }, changed: [] },
        { step: 6, line: 11, event: 'PRINT', callStack: [{func: 'main', line: 10}], variables: { }, changed: [], stdout: 'Factorial: 120\n' }
      ]
    };
  }
  
  return null;
}

