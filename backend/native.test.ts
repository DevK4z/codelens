import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import executeRouter from './src/routes/execute.js';
import { LocalRunner } from './src/runner/local.js';
import { DockerRunner } from './src/runner/dockerRunner.js';

const docker = process.env.TEST_DOCKER === '1';
const runner = docker ? new DockerRunner() : new LocalRunner();
const cases = [
  {
    name: 'macros, templates, aliases, lambdas, containers, structured bindings and GNU builtins',
    standard: 'gnu++17' as const,
    code: `#include <bits/stdc++.h>
using namespace std;
#define int long long
#define all(x) (x).begin(), (x).end()
#define FOR(i,n) for(int i=0;i<(n);++i)
#pragma GCC optimize("O2")
template<class T> T twice(T x){return x+x;}
using ll = long long;
struct Item { ll x; bool operator<(const Item& b) const{return x<b.x;} };
signed main(){
 int n; cin>>n; vector<int> a(n); FOR(i,n) cin>>a[i];
 sort(all(a), [](auto x, auto y){return x<y;});
 map<int,int> m; for(auto x:a) m[x]++;
 auto [key,value]=*m.begin();
 priority_queue<Item> pq; pq.push({a.back()});
 unordered_set<int> seen(all(a)); bitset<8> bits(5);
 __int128 wide=(__int128)1<<70;
 cout<<twice(a.front())<<' '<<key<<' '<<value<<' '<<pq.top().x<<' '<<seen.size()<<' '<<bits.count()<<' '<<(wide>0)<<' '<<__builtin_popcount(7)<<'\\n';
}`,
    stdin: '4\n5 2 2 9', expected: '4 2 2 9 3 2 1 3\n'
  },
  {
    name: 'GNU PBDS ordered set and order statistics', standard: 'gnu++17' as const,
    code: `#include <bits/stdc++.h>
#include <ext/pb_ds/assoc_container.hpp>
#include <ext/pb_ds/tree_policy.hpp>
using namespace std; using namespace __gnu_pbds;
using ordered_set=tree<int,null_type,less<int>,rb_tree_tag,tree_order_statistics_node_update>;
int main(){ordered_set s; s.insert(8);s.insert(2);s.insert(5);cout<<*s.find_by_order(1)<<' '<<s.order_of_key(8);}`,
    stdin: '', expected: '5 2'
  },
  {
    name: 'C++20 concepts, ranges, span and bit operations', standard: 'gnu++20' as const,
    code: `#include <bits/stdc++.h>
using namespace std;
template<integral T> T twice(T x){return x+x;}
int main(){vector<int> a{5,1,3}; ranges::sort(a); span<int> s(a); cout<<twice(s.front())<<' '<<popcount(7u);}`,
    stdin: '', expected: '2 3'
  },
  {
    name: 'native stdout JSON and stderr are never mistaken for trace or compiler errors', standard: 'gnu++17' as const,
    code: `#include <iostream>
int main(){std::cout<<R"({"compilationError":"ordinary program output"})";std::cerr<<R"({"step":1,"error":"STEP_LIMIT"})";}`,
    stdin: '', expected: '{"compilationError":"ordinary program output"}'
  },
  {
    name: 'scanf/printf, recursion, namespace, enum, exceptions and attributes', standard: 'gnu++17' as const,
    code: `#include <bits/stdc++.h>
namespace cp { enum class State{ok}; __attribute__((noinline)) long long f(int n){return n<2?1:n*f(n-1);} }
int main(){int n;scanf("%d",&n);try{if(n<0)throw n;printf("%lld",cp::f(n));}catch(int){puts("negative");}}`,
    stdin: '6', expected: '720'
  }
];
for (const c of cases) test(c.name, async () => {
  const result = await runner.run(c.code, c.stdin, {standard:c.standard,captureTrace:false});
  assert.equal(result.exitCode,0, result.stderr);
  assert.equal(result.stdout,c.expected);
  assert.deepEqual(result.trace,[]);
  assert.equal(result.stepLimitExceeded,false);
  if(c.name.startsWith('native stdout')) assert.match(result.stderr,/STEP_LIMIT/);
});
test('real compiler diagnoses malformed source',async()=>{
  await assert.rejects(runner.run('int main( {', '', {captureTrace:false}), {name:'CompilationError'});
});
test('runtime nonzero exit is not successful',async()=>{
  const result=await runner.run('int main(){return 7;}', '', {captureTrace:false});
  assert.equal(result.exitCode,7);
});
test('execution timeout is reported',async()=>{
  const result=await runner.run('int main(){for(;;){}}','',{captureTrace:false,timeoutMs:1000});
  assert.equal(result.timeLimitExceeded,true);
});
test('API validates execution options and never runs native code on LocalRunner',async()=>{
  const savedRunner=process.env.RUNNER, savedNode=process.env.NODE_ENV;
  process.env.RUNNER=docker?'docker':'local'; process.env.NODE_ENV='test';
  const app=express(); app.use(express.json()); app.use('/api/execute',executeRouter);
  const server=app.listen(0,'127.0.0.1'); await once(server,'listening');
  const addr=server.address(); assert.ok(addr && typeof addr!=='string');
  const post=(body:object)=>fetch(`http://127.0.0.1:${addr.port}/api/execute`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try {
    const base={code:cases[0].code,stdin:cases[0].stdin,language:'cpp',mode:'run'};
    for(const extra of [{standard:'gnu++17;id'},{mode:'unknown'},{stdin:0}]) {
      assert.equal((await post({...base,...extra})).status,400);
    }
    const res=await post(base); const data=await res.json();
    if(docker){ assert.equal(data.success,true,JSON.stringify(data));assert.equal(data.stdout,cases[0].expected);assert.deepEqual(data.trace,[]);assert.equal(data.executionMode,'run'); }
    else {assert.equal(res.status,400);assert.match(data.runtimeError,/Docker/);}
  } finally {
    server.closeAllConnections(); await new Promise<void>(resolve=>server.close(()=>resolve()));
    if(savedRunner===undefined) delete process.env.RUNNER;else process.env.RUNNER=savedRunner;
    if(savedNode===undefined) delete process.env.NODE_ENV;else process.env.NODE_ENV=savedNode;
  }
});
