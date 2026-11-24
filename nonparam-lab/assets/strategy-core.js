/* NP LAB analysis-strategy module. Deterministic educational simulation.
   'Oracle' uses known latent outcomes of simulated participants ONLY. */
(function(root){'use strict';
const MODES={
  complete:{label:'完整病例',explain:'只分析有4周随访的对象。失访并非完全随机时，完整病例可能受到选择偏倚。',tag:'基准分析'},
  locf:{label:'末次观测前移（LOCF）',explain:'将失访者的第2周评分当作第4周评分。是人为假设，并不代表真实结局。',tag:'敏感性情景'},
  bocf:{label:'基线观测前移（BOCF）',explain:'假设所有失访者没有改善。可作为压力情景，但不应被当作通用的缺失值处理方法。',tag:'敏感性情景'},
  oracle:{label:'模拟完整结局',explain:'使用模拟引擎保存的潜在4周评分，仅用于验证缺失造成的影响。现实研究无法知道这些真实缺失值。',tag:'仅供模拟对照'},
  zero:{label:'错误：把失访记为疼痛0分',explain:'把“未知疼痛评分”强行设为“完全无痛”，人为制造改善，结论可能严重失真。',tag:'错误操作'}
};
function analyze(rows, opts, S){
  const mode=Object.hasOwn(MODES,opts?.missing)?opts.missing:'complete';
  const duplicate=!!opts?.duplicate;
  const processed=[];let substituted=0;
  for(const r of rows){
    let delta=r.delta;
    if(delta===null || delta===undefined){
      if(mode==='complete')continue;
      if(mode==='locf')delta=r.baseline-r.week2;
      if(mode==='bocf')delta=0;
      if(mode==='oracle')delta=r.baseline-r.latentWeek4;
      if(mode==='zero')delta=r.baseline;
      substituted++;
    }
    if(Number.isFinite(delta))processed.push({group:r.group,delta,baseline:r.baseline,id:r.id});
  }
  const used=duplicate?processed.concat(processed.map(x=>({...x}))):processed;
  const byGroup=[0,1,2].map(g=>used.filter(x=>x.group===g).map(x=>x.delta));
  const kw=S.kw(byGroup), all=used.length;
  const med=byGroup.map(g=>g.length?S.median(g):null);
  const medDiff=med[0]===null||med[2]===null?null:med[2]-med[0];
  const pairs=S.pairwise(used), minRaw=pairs.length?pairs.reduce((a,b)=>!a||b.p<a.p?b:a,null):null;
  const baseMeans=[0,1,2].map(g=>{const x=rows.filter(z=>z.group===g);return x.length?x.reduce((sum,z)=>sum+z.baseline,0)/x.length:null;});
  const finite=baseMeans.filter(Number.isFinite);
  const baselineGap=finite.length>1?Math.max(...finite)-Math.min(...finite):null;
  return {mode,duplicate,kw,n:all,uniqueN:processed.length,excluded:rows.length-processed.length,missing:rows.filter(x=>x.delta===null).length,substituted,med,medDiff,pairs,minRaw,baselineGap,baselineMeans:baseMeans,warning:duplicate||mode==='zero',rows:processed};
}
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
const api={MODES,analyze,mean};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NPLStrategy=api;
})(typeof window!=='undefined'?window:globalThis);
