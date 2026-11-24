/* Nonparam Lab - deterministic statistical simulation and inference (prototype).
   No external data, no network, no claim of clinical effectiveness. */
(function(root){'use strict';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function rng(seed){let s=(Number(seed)>>>0)||1;return ()=>{let t=s+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function normal(rand){const u=Math.max(rand(),1e-14),v=rand();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function shuffle(a,r){for(let i=a.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function avg(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:NaN;}
function median(a){return quantile(a,.5);}
function quantile(a,q){if(!a.length)return NaN;let b=[...a].sort((x,y)=>x-y),x=(b.length-1)*q,j=Math.floor(x),f=x-j;return b[j]*(1-f)+(b[Math.min(b.length-1,j+1)])*f;}
function pearson(x,y){if(x.length!==y.length||x.length<3)return NaN;let mx=avg(x),my=avg(y),ab=0,aa=0,bb=0;for(let i=0;i<x.length;i++){let a=x[i]-mx,b=y[i]-my;ab+=a*b;aa+=a*a;bb+=b*b;}return aa>0&&bb>0?clamp(ab/Math.sqrt(aa*bb),-1,1):NaN;}
function ranks(a){const v=a.map((x,i)=>({x,i})).sort((u,v)=>u.x-v.x),r=Array(a.length);for(let i=0;i<v.length;){let j=i+1;while(j<v.length&&v[j].x===v[i].x)j++;for(let k=i;k<j;k++)r[v[k].i]=(i+j+1)/2;i=j;}return r;}
function spearman(a,b){return pearson(ranks(a),ranks(b));}
// Abramowitz/Stegun 7.1.26; max relative error in standard erf approximation ~1e-7.
function erf(x){let sign=x<0?-1:1,z=Math.abs(x),t=1/(1+.3275911*z);let y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-z*z);return sign*y;}
const cdf=z=>.5*(1+erf(z/Math.SQRT2));
const twoSided=z=>clamp(2*(1-cdf(Math.abs(z))),0,1);
const round=(x,p=3)=>Number.isFinite(x)?Number(x.toFixed(p)):null;
function simulate(cfg){const n=Number(cfg.n)||30,seed=Number(cfg.seed)||2026,rand=rng(seed),groups=['常规管理','App指导','混合干预'];const effects={zero:[0,0,0],low:[0,.35,.7],medium:[0,.85,1.7]};const scale=Number(cfg.effectScale);const eff=Number.isFinite(scale)?[0,scale*.5,scale]:(effects[cfg.effect]||effects.low);
 let all=[];for(let i=0;i<n*3;i++){const base=clamp(Math.round(6.1+1.55*normal(rand)),1,10),z=normal(rand),center=i%3;all.push({id:i+1,baseline:base,center,response:z,adherence:clamp(Math.round(70+15*normal(rand)+8*z),5,100)});}
 let alloc=[];if(cfg.allocation==='severity'){all.sort((a,b)=>a.baseline-b.baseline);alloc=all.map((_,i)=>Math.min(2,Math.floor(i/n)));}
 else if(cfg.allocation==='simple'){alloc=all.map(()=>Math.floor(rand()*3));}
 else{for(let i=0;i<all.length;i+=6){let block=[];for(let j=0;j<6;j++)block.push(j%3);shuffle(block,rand);alloc.push(...block);}}
 for(let i=0;i<all.length;i++){let p=all[i],g=alloc[i],z=p.response;const noise=()=>cfg.noise==='skew'?(Math.log(1/Math.max(rand(),1e-10))-1)*.75:cfg.noise==='heavy'?(rand()<.08?normal(rand)*2.8:normal(rand)*.68):normal(rand)*.65;
  const personal=.3*z,delta2=.35+eff[g]*.55+.15*personal+noise()*.65,delta4=.5+eff[g]+.38*personal+noise();
  const y2=clamp(Math.round(p.baseline-delta2),0,10),latent4=clamp(Math.round(p.baseline-delta4),0,10);
  const rate=Number(cfg.dropoutRate)||0;
  let m=rate;if(cfg.dropout==='mar')m*=clamp(.55+.13*p.baseline,.6,1.65);if(cfg.dropout==='mnar')m*=clamp(.5+.21*latent4,.5,2.2);
  const lost=rand()<clamp(m,0,.82),ad=clamp(Math.round(p.adherence+(g===1?6:g===2?10:0)),0,100);
  p.group=g;p.week2=y2;p.week4=lost?null:latent4;p.latentWeek4=latent4;p.delta=lost?null:p.baseline-latent4;p.dropout=lost;p.adherence=ad;
  p.activity=round(7+1.2*eff[g]+.11*ad+(cfg.noise==='skew'?(Math.log(1/Math.max(rand(),1e-10))-1)*4:normal(rand)*3),2);
 }
 return all.sort((a,b)=>a.id-b.id);
}
function summary(rows){return Array.from({length:3},(_,g)=>{const x=rows.filter(r=>r.group===g),valid=x.filter(r=>r.delta!==null),vals=valid.map(r=>r.delta);return{group:g,n:x.length,observed:valid.length,lost:x.length-valid.length,baselineMean:round(avg(x.map(r=>r.baseline)),2),median:round(median(vals),2),q1:round(quantile(vals,.25),2),q3:round(quantile(vals,.75),2),min:vals.length?Math.min(...vals):null,max:vals.length?Math.max(...vals):null};});}
function kw(groups){const k=groups.length,ns=groups.map(a=>a.length),vals=groups.flat(),N=vals.length;if(ns.some(n=>!n)||N<=k)return null;
 const r=ranks(vals);let st=0,start=0;for(let i=0;i<k;i++){const sum=r.slice(start,start+ns[i]).reduce((a,b)=>a+b,0);st+=sum*sum/ns[i];start+=ns[i];}
 let ties=new Map();for(const v of vals)ties.set(v,(ties.get(v)||0)+1);let adjust=1-[...ties.values()].reduce((s,t)=>s+t*t*t-t,0)/(N*N*N-N);
 let H=(12*st/(N*(N+1))-3*(N+1));H=adjust>0?Math.max(0,H/adjust):0;
 // Chi-square(df=2) survival function is exp(-H/2) exactly for the asymptotic reference.
 return{H:round(H,5),df:k-1,p:k===3?Math.exp(-H/2):null,N,correction:round(adjust,5),method:'秩和 H 检验，采用 χ²(2) 大样本近似（含并列秩校正）'};
}
function mannWhitney(a,b){let n=a.length,m=b.length,N=n+m;if(!n||!m)return null;let arr=a.concat(b),rk=ranks(arr),ra=rk.slice(0,n).reduce((x,y)=>x+y,0),U=ra-n*(n+1)/2,mean=n*m/2,ties=new Map();for(let x of arr)ties.set(x,(ties.get(x)||0)+1);let tc=[...ties.values()].reduce((s,t)=>s+t**3-t,0);let vari=n*m/12*((N+1)-tc/(N*(N-1)));let z=vari>0?Math.max(0,Math.abs(U-mean)-.5)/Math.sqrt(vari):0;return{U:round(U,3),p:vari>0?twoSided(z):1,z:round(z,3),n,m};}
function holm(ps){const o=ps.map((p,i)=>({p,i})).sort((a,b)=>a.p-b.p);let prior=0,out=Array(ps.length);o.forEach(({p,i},j)=>{prior=Math.max(prior,(o.length-j)*p);out[i]=Math.min(1,prior);});return out;}
function pairwise(rows){const arr=[0,1,2].map(g=>rows.filter(x=>x.group===g&&x.delta!==null).map(x=>x.delta));let pairs=[[0,1],[0,2],[1,2]].map(([a,b])=>({a,b,...mannWhitney(arr[a],arr[b])}));let adjusted=holm(pairs.map(x=>x.p??1));return pairs.map((p,i)=>({...p,pHolm:adjusted[i]}));}
function signedRank(diffs){let d=diffs.filter(x=>Number.isFinite(x)&&x!==0),n=d.length;if(n<3)return null;let r=ranks(d.map(Math.abs)),W=0;for(let i=0;i<n;i++)if(d[i]>0)W+=r[i];let tot=r.reduce((a,b)=>a+b,0),variance=r.reduce((a,b)=>a+b*b,0)/4;let z=Math.max(0,Math.abs(W-tot/2)-.5)/Math.sqrt(variance);return{n,W:round(W,3),z:round(z,4),p:twoSided(z),method:'Wilcoxon 符号秩检验，正态近似；位置解释须关注差值分布对称性'};}
function signTest(diffs){let x=diffs.filter(v=>v!==0&&Number.isFinite(v)),n=x.length;if(!n)return null;let k=x.filter(v=>v>0).length,s=Math.min(k,n-k);let val=0,pow=Math.pow(.5,n),term=pow;for(let i=0;i<=s;i++){if(i>0)term*=((n-i+1)/i);val+=term;}return{n,k,p:Math.min(1,2*val)};}
function spearmanPermutation(x,y,seed=2026,B=999){if(x.length<5||x.length!==y.length)return null;const rx=ranks(x),ry=ranks(y),observed=pearson(rx,ry),r=rng(seed);let hit=0;for(let b=0;b<B;b++){let yp=shuffle(ry.slice(),r);if(Math.abs(pearson(rx,yp))+1e-12>=Math.abs(observed))hit++;}return{n:x.length,rho:observed,p:(hit+1)/(B+1),B,extreme:hit};}
function bootstrapMedianDifference(a,b,seed=2026,B=599){if(a.length<5||b.length<5)return null;let r=rng(seed),out=[];for(let t=0;t<B;t++){let x=Array.from({length:a.length},()=>a[Math.floor(r()*a.length)]),y=Array.from({length:b.length},()=>b[Math.floor(r()*b.length)]);out.push(median(y)-median(x));}return{estimate:median(b)-median(a),lower:quantile(out,.025),upper:quantile(out,.975),B,method:'组间中位数差的非参数百分位Bootstrap区间，探索性'};}
function analyze(rows,seed){let groups=[0,1,2].map(g=>rows.filter(x=>x.group===g&&x.delta!==null).map(x=>x.delta));const k=kw(groups),pw=pairwise(rows),pairs=rows.filter(x=>x.group===2&&x.delta!==null),wil=signedRank(pairs.map(x=>x.delta)),sign=signTest(pairs.map(x=>x.delta)),sp=rows.filter(x=>x.delta!==null);const spe=spearmanPermutation(sp.map(x=>x.adherence),sp.map(x=>x.delta),(seed|0)+88,499);const boot=bootstrapMedianDifference(groups[0],groups[2],(seed|0)+101,399);let withWorst=rows.map(x=>({...x,delta:x.delta===null?0:x.delta}));let sensitivity=kw([0,1,2].map(g=>withWorst.filter(x=>x.group===g).map(x=>x.delta)));return{summary:summary(rows),kw:k,pairwise:pw,paired:wil,sign,spearman:spe,bootstrap:boot,sensitivity};}
const api={simulate,summary,kw,mannWhitney,holm,pairwise,signedRank,signTest,spearmanPermutation,bootstrapMedianDifference,analyze,ranks,pearson,spearman,quantile,median,round};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.NPLStats=api;
})(typeof window!=='undefined'?window:globalThis);
