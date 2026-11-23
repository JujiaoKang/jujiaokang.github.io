const assert=require('node:assert/strict');
const S=require('../assets/stats.js');
const x={n:30,seed:2026,allocation:'block',effect:'low',noise:'skew',dropout:'mar',dropoutRate:.15};
let A=S.simulate(x),B=S.simulate(x),C=S.simulate({...x,seed:2027});
assert.deepEqual(A,B,'same seed yields same result');assert.notDeepEqual(A,C,'different seeds vary');assert.equal(A.length,90);assert.deepEqual(S.summary(A).map(x=>x.n),[30,30,30]);
assert(Math.abs(S.spearman([1,2,3,4],[10,20,30,40])-1)<1e-10);
assert(Math.abs(S.spearman([1,2,3,4],[40,30,20,10])+1)<1e-10);
assert.equal(S.signTest([1,1,1,1,1]).p,.0625);
assert.equal(S.kw([[1,2,3],[1,2,3],[1,2,3]]).H,0);
assert.deepEqual(S.holm([.03,.01,.04]).map(v=>+v.toFixed(2)),[.06,.03,.06]);
let r=S.analyze(A,2026);assert(r.kw.p>=0&&r.kw.p<=1);assert(r.pairwise.length===3);assert(r.bootstrap.upper>=r.bootstrap.lower);assert(r.spearman.p>=0&&r.spearman.p<=1);
for(let noise of ['normal','skew','heavy'])for(let effect of ['zero','low','medium'])for(let n of [15,30,60]){
let d=S.simulate({...x,noise,effect,n,seed:2026});let z=S.analyze(d,2026);assert(Number.isFinite(z.kw.H));assert(z.kw.p>=0&&z.kw.p<=1);assert(z.pairwise.every(v=>v.p>=0&&v.p<=1));}
console.log('STATS TESTS PASS');
