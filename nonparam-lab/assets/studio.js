/* Nonparametric Lab · interactive simulation studio. Browser-only; no personal data. */
(()=>{'use strict';
const S=window.NPLStats, Bridge=window.NPLStudioBridge, el=id=>document.getElementById(id);
if(!S||!Bridge||!el('simulation-studio'))return;
const NAMES=['常规管理','App指导','混合干预'], COLORS=['#55c9ff','#b29aff','#ffbf83'];
const start=Bridge.getCfg();
const standard={allocation:'block',n:30,effect:'low',effectScale:.7,noise:'skew',dropout:'mar',dropoutRate:.15,seed:2026};
let cfg={...standard,...start}, reference=null, currData=[], currKW=null, currStats=[], powerData=null, tab='points', lastAction='';
const studioSubscribers=new Set();
window.NPLStudioAPI={get:()=>({cfg:{...cfg},data:currData.map(r=>({...r}))}),subscribe(fn){studioSubscribers.add(fn);return()=>studioSubscribers.delete(fn)}};
const rt=(n,d=2)=>Number.isFinite(n)?n.toFixed(d):'—';
const ptxt=p=>p==null?'—':p<.0001?p.toExponential(2):p.toFixed(4);
const safe=t=>String(t??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
const nobs=d=>d.filter(x=>x.delta!==null);
const points=group=>currData.filter(x=>x.group===group&&x.delta!==null).map(x=>x.delta);
const bw={w:840,h:330,L:53,R:25,T:32,B:57};
const yRange=[-7,11];
const xp=(v,a,b)=>bw.L+(v-a)/(b-a)*(bw.w-bw.L-bw.R);
const yp=v=>bw.h-bw.B-(v-yRange[0])/(yRange[1]-yRange[0])*(bw.h-bw.T-bw.B);
function showStatus(message){el('studio-status').textContent=message;}
function stdC(){return{...cfg,n:Math.round(Number(cfg.n)),effectScale:Number(cfg.effectScale),dropoutRate:Number(cfg.dropoutRate),seed:Math.round(Number(cfg.seed))};}
function stat(){const groups=[0,1,2].map(g=>points(g));return S.kw(groups);}
function compute(){
 const c=stdC();currData=S.simulate(c);currKW=stat();currStats=S.summary(currData);const observed=currData.filter(x=>x.delta!==null).map(x=>x.delta);if(observed.length){yRange[0]=Math.min(-2,Math.floor(Math.min(...observed))-1);yRange[1]=Math.max(5,Math.ceil(Math.max(...observed))+1);}
 let medDiff=currStats[2].median===null||currStats[0].median===null?null:currStats[2].median-currStats[0].median;
 return {cfg:{...c},data:currData.map(x=>({...x})),kw:currKW,summary:currStats.map(x=>({...x})),total:currData.length,observed:nobs(currData).length,lost:currData.filter(x=>x.dropout).length,medDiff};
}
function drawAxes(){let t=[];const {L,R,T,B,w,h}=bw;
 for(let k=Math.ceil(yRange[0]/2)*2;k<=yRange[1];k+=2){let y=yp(k);t.push(`<line x1="${L}" x2="${w-R}" y1="${y}" y2="${y}" class="sg-grid"/><text x="${L-11}" y="${y+4}" text-anchor="end" class="sg-tick">${k}</text>`);}
 t.push(`<line x1="${L}" x2="${w-R}" y1="${h-B}" y2="${h-B}" class="sg-axis"/>`);
 t.push(`<text x="${L}" y="18" class="sg-axis-label">疼痛改善量 · 基线−第4周</text>`);
 return t;
}
function drawPoints(){let t=drawAxes();const x=[185,420,655];
 for(let g=0;g<3;g++){
  const d=points(g),box=d.length?{q1:S.quantile(d,.25),q3:S.quantile(d,.75),md:S.median(d),min:Math.min(...d),max:Math.max(...d)}:null;
  if(box){const c=COLORS[g];
   t.push(`<line x1="${x[g]}" x2="${x[g]}" y1="${yp(box.max)}" y2="${yp(box.min)}" stroke="${c}" stroke-opacity=".72" stroke-width="2"/>`);
   t.push(`<rect x="${x[g]-39}" y="${yp(box.q3)}" width="78" height="${Math.max(2,yp(box.q1)-yp(box.q3))}" rx="7" fill="${c}" fill-opacity=".19" stroke="${c}" stroke-opacity=".9" stroke-width="1.8"/>`);
   t.push(`<line x1="${x[g]-39}" x2="${x[g]+39}" y1="${yp(box.md)}" y2="${yp(box.md)}" stroke="${c}" stroke-width="3"/>`);
   for(let i=0;i<d.length;i++){const offset=((i*37+g*17)%93)-46,cy=yp(d[i]);t.push(`<circle cx="${x[g]+offset}" cy="${cy}" r="${d.length>90?2:2.8}" fill="${c}" fill-opacity=".62"><title>${NAMES[g]}，改善量 ${d[i]}</title></circle>`);}
  }
  t.push(`<text x="${x[g]}" y="${bw.h-19}" text-anchor="middle" class="sg-group">${NAMES[g]}</text>`);
  t.push(`<text x="${x[g]}" y="${bw.h-40}" text-anchor="middle" class="sg-amount">n = ${d.length}</text>`);
 }
 return t;
}
function drawECDF(){let t=[];let x0=75,x1=bw.w-35,y0=yp(9),y1=yp(-5);
 t.push(`<text x="${bw.L}" y="18" class="sg-axis-label">经验分布 F(x) · 改善量</text>`);
 for(let g=0;g<3;g++){
  let vals=points(g).sort((a,b)=>a-b);if(!vals.length)continue;
  let d=`M ${x0} ${y1}`;let old=x0;
  for(let i=0;i<vals.length;i++){let xx=x0+(vals[i]-yRange[0])/(yRange[1]-yRange[0])*(x1-x0),yy=y1-(i+1)/vals.length*(y1-y0);xx=Math.max(x0,Math.min(x1,xx));d+=` L ${xx.toFixed(2)} ${(y1-i/vals.length*(y1-y0)).toFixed(2)} L ${xx.toFixed(2)} ${yy.toFixed(2)}`;old=xx;}
  d+=` L ${x1} ${y0}`;
  t.push(`<path d="${d}" fill="none" stroke="${COLORS[g]}" stroke-width="2.8" stroke-linejoin="round"/>`);
 }
 t.push(`<rect x="${x0}" y="${y0}" width="${x1-x0}" height="${y1-y0}" rx="3" fill="none" stroke="#365172"/>`);
 for(let i=0;i<=4;i++){let v=i/4,yy=y1-v*(y1-y0);t.push(`<text x="${x0-12}" y="${yy+4}" class="sg-tick" text-anchor="end">${rt(v,2)}</text>`);}
 for(let i=Math.ceil(yRange[0]/2)*2;i<=yRange[1];i+=2){let xx=x0+(i-yRange[0])/(yRange[1]-yRange[0])*(x1-x0);t.push(`<text x="${xx}" y="${bw.h-34}" class="sg-tick" text-anchor="middle">${i}</text>`);}
 return t;
}
function drawTrajectory(){const t=[];
 const w=bw.w,h=bw.h,x=[170,420,670],y=v=>h-65-v/10*(h-100);
 for(let v=0;v<=10;v+=2){let yy=y(v);t.push(`<line x1="80" x2="${w-30}" y1="${yy}" y2="${yy}" class="sg-grid"/><text x="68" y="${yy+4}" class="sg-tick" text-anchor="end">${v}</text>`);}
 let arr=currData.filter(z=>z.group===2&&z.week4!==null).slice(0,24);
 arr.forEach((p,i)=>{const opacity=.28+i%7*.04;const color=COLORS[2];t.push(`<path d="M${x[0]} ${y(p.baseline)} L${x[1]} ${y(p.week2)} L${x[2]} ${y(p.week4)}" fill="none" stroke="${color}" stroke-width="1.7" stroke-opacity="${opacity}"/>`);});
 ['基线','第2周','第4周'].forEach((lab,i)=>t.push(`<text x="${x[i]}" y="${h-24}" text-anchor="middle" class="sg-group">${lab}</text>`));
 t.push(`<text x="57" y="18" class="sg-axis-label">混合干预组 · 前24位完整病例的疼痛评分轨迹</text>`);
 return t;
}
function draw(){let all=tab==='ecdf'?drawECDF():tab==='trajectory'?drawTrajectory():drawPoints();el('studio-svg').innerHTML=all.join('');
 for(const b of document.querySelectorAll('[data-studio-tab]'))b.setAttribute('aria-selected',String(b.dataset.studioTab===tab));
}
function chartLegend(){el('studio-legend').innerHTML=NAMES.map((name,i)=>`<span><i style="background:${COLORS[i]}"></i>${name}</span>`).join('');}
function renderSummary(r){
 el('st-people').textContent=String(r.observed);
 el('st-lost').textContent=`${r.lost} / ${r.total}`;
 el('st-pval').textContent=ptxt(r.kw?.p);
 el('st-effect').textContent=r.medDiff===null?'—':`${r.medDiff>0?'+':''}${rt(r.medDiff,2)}`;
 el('st-pval').classList.toggle('hot',r.kw?.p<.05);
 el('studio-metrics-foot').textContent=`Kruskal–Wallis H = ${rt(r.kw?.H,3)}（χ²近似） · 数据来自独立随机模拟`;
 el('studio-distribution').textContent=({'normal':'对称误差','skew':'偏态误差','heavy':'重尾误差'})[cfg.noise];
 el('studio-base').textContent=`n = ${cfg.n} / 组 · 真实效应差 ${rt(+cfg.effectScale,2)} · 失访基础率 ${Math.round(cfg.dropoutRate*100)}%`;
}
function compare(r){const left=reference;
 if(!left){el('studio-compare').innerHTML=`<div class="sg-empty">点击“保存为方案 A”，将当前设置作为比较基准。</div>`;return;}
 const rows=[['完整病例',left.observed,r.observed,x=>String(x)],['失访人数',left.lost,r.lost,x=>String(x)],['中位数差',left.medDiff,r.medDiff,x=>x==null?'—':rt(x,2)],['KW P 值',left.kw?.p,r.kw?.p,ptxt]];
 el('studio-compare').innerHTML=`<div class="sg-compare-head"><span>方案 A · 锁定</span><span>方案 B · 当前</span></div><div class="sg-compare-rows">${rows.map(([label,a,b,fn])=>`<div class="sg-comparison"><small>${label}</small><span>${fn(a)}</span><strong>${fn(b)}</strong></div>`).join('')}</div><div class="sg-compare-foot">A：n=${left.cfg.n}，效应差=${rt(left.cfg.effectScale)}　·　B：n=${r.cfg.n}，效应差=${rt(r.cfg.effectScale)}</div>`;
}
function readCfg(){cfg.n=+el('studio-n').value;cfg.effectScale=+el('studio-effect').value;cfg.dropoutRate=+el('studio-drop').value/100;cfg.seed=+el('studio-seed').value||2026;cfg.noise=el('studio-noise').value;cfg.allocation=el('studio-alloc').value;cfg.dropout=el('studio-missing').value;cfg.effect=cfg.effectScale===0?'zero':cfg.effectScale<1?'low':'medium';}
function writeCfg(){el('studio-n').value=String(cfg.n);el('studio-effect').value=String(cfg.effectScale);el('studio-drop').value=String(Math.round(cfg.dropoutRate*100));el('studio-seed').value=String(cfg.seed);el('studio-noise').value=cfg.noise;el('studio-alloc').value=cfg.allocation;el('studio-missing').value=cfg.dropout;
 updateLabels();}
function updateLabels(){el('studio-n-value').textContent=cfg.n+' 人 / 组';el('studio-effect-value').textContent=rt(+cfg.effectScale,2);el('studio-drop-value').textContent=Math.round(cfg.dropoutRate*100)+'%';}
function recalc(message){let r=compute();renderSummary(r);draw();compare(r);powerData=null;el('studio-power-results').classList.add('hidden');el('studio-reps-placeholder').classList.remove('hidden');if(message)showStatus(message);for(const fn of studioSubscribers){try{fn(r)}catch(e){console.error("Studio subscriber error",e)}}return r;}
function randomSeed(){cfg.seed=Math.max(1,Math.floor(Math.random()*2100000000));writeCfg();recalc('已重新抽样；实验条件不变。');}
function saveRef(){reference=compute();compare(reference);showStatus('方案 A 已锁定。调整参数即可与当前方案比较。');}
function reset(){cfg={...standard};reference=null;writeCfg();recalc('参数已恢复。');}
function apply(){if(!confirm('将这组参数应用到综合实验，并重置第6—25步现有成绩和分析结果。确定继续吗？'))return;
 Bridge.applyCfg(stdC());showStatus('参数已应用。请从左侧第6步继续完成实验。');}
function generatePower(){let B=240,nHit=0,ps=[],c=stdC();let t=performance.now();
 for(let b=0;b<B;b++){const seed=((c.seed+104729*(b+1))>>>0)||1;const data=S.simulate({...c,seed}),groups=[0,1,2].map(g=>data.filter(x=>x.group===g&&x.delta!==null).map(x=>x.delta)),res=S.kw(groups);
 if(res){ps.push(res.p);if(res.p<.05)nHit++;}}
 const realB=ps.length,ratio=realB?nHit/realB:NaN;
 powerData={B:realB,rate:ratio};
 const z=[0,0,0,0,0,0,0,0,0,0];ps.forEach(p=>{z[Math.min(9,Math.floor(p*10))]++;});
 const max=Math.max(1,...z),bars=z.map((v,i)=>`<div class="sg-p-bin"><div style="height:${Math.max(2,75*v/max)}px;background:${i===0?'#56d8d6':'#6489fb'}"></div><small>${i===0?'0':(i/10).toFixed(1)}</small></div>`).join('');
 el('studio-power-results').innerHTML=`<div class="sg-power-metrics"><div><span>${c.effectScale===0?'第一类错误率估计':'检验拒绝比例'}</span><strong>${realB?(ratio*100).toFixed(1)+'%':'—'}</strong></div><div><span>重复实验</span><strong>${realB}次</strong></div></div><div class="sg-pchart">${bars}</div><p>每次重新生成一个独立模拟样本，以 P＜0.05 统计拒绝比例。使用KW的χ²近似；${c.effectScale===0?'当前设置为零效应。':'当前设置为非零效应。'}并非精确功效计算。</p>`;
 el('studio-power-results').classList.remove('hidden');el('studio-reps-placeholder').classList.add('hidden');showStatus(`已完成 ${realB} 次独立重复模拟。`);
}
function dl(name,content,type='text/plain;charset=utf-8'){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function exportCSV(){let rows=['id,group,baseline,week2,week4,delta,dropout,adherence'];for(let r of currData)rows.push([r.id,NAMES[r.group],r.baseline,r.week2,r.week4??'',r.delta??'',r.dropout?1:0,r.adherence].join(','));dl('模拟研究数据_seed'+cfg.seed+'.csv','\uFEFF'+rows.join('\n'),'text/csv;charset=utf-8');showStatus('已导出当前模拟数据。');}
let timer=0;
for(const id of ['studio-n','studio-effect','studio-drop','studio-noise','studio-alloc','studio-missing','studio-seed'])el(id).addEventListener(id.includes('noise')||id.includes('alloc')||id.includes('missing')?'change':'input',()=>{readCfg();updateLabels();window.clearTimeout(timer);timer=window.setTimeout(()=>recalc('预览已更新。当前设置尚未写入25步实验。'),40);});
el('studio-sample').addEventListener('click',randomSeed);
el('studio-lock').addEventListener('click',saveRef);
el('studio-restore').addEventListener('click',reset);
el('studio-apply').addEventListener('click',apply);
el('studio-reps').addEventListener('click',generatePower);
el('studio-export').addEventListener('click',exportCSV);
for(const b of document.querySelectorAll('[data-studio-tab]'))b.addEventListener('click',()=>{tab=b.dataset.studioTab;draw();});
writeCfg();chartLegend();recalc('可直接拖动参数。所有结果均由模拟数据计算。');
})();
