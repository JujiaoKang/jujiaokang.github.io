/* Strategy sandbox: compare statistical choices on precisely the same simulated cohort. */
(()=>{'use strict';
const S=window.NPLStats,C=window.NPLStrategy,Studio=window.NPLStudioAPI,Bridge=window.NPLStudioBridge;
const $=id=>document.getElementById(id);
if(!S||!C||!Studio||!$('strategy-lab'))return;
const names=['常规干预','标准指导','综合干预'];
const f=(n,d=3)=>Number.isFinite(n)?Number(n).toFixed(d):'—';
const ptext=p=>p==null?'—':p<.0001?p.toExponential(2):p.toFixed(4);
const safe=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
let selected={missing:'complete',duplicate:false},current=null,base=null,oracle=null,data=[],cfg={},repToken=0,chartType='p';
function modeText(mode){return C.MODES[mode].label;}
function getParams(){return {...selected};}
function simState(){const s=Studio.get();data=s.data;cfg=s.cfg;return s;}
function compare(){simState();base=C.analyze(data,{missing:'complete',duplicate:false},S);oracle=C.analyze(data,{missing:'oracle',duplicate:false},S);current=C.analyze(data,selected,S);return current;}
function setNote(status){$('strategy-status').textContent=status;}
function describe(){let s=[];
 if(cfg.allocation==='severity')s.push('当前按基线病情分配处理组，组间基线差异可能与干预效果混杂。');
 if(cfg.dropout==='mnar')s.push('当前设置为 MNAR，完整病例分析可能存在与潜在结局相关的选择偏差。');
 else if(cfg.dropout==='mar')s.push('当前设置为 MAR，完整病例分析不自动保证无偏。');
 if(current.duplicate)s.push('重复计入同一受试者不是增加独立样本量；所得 P 值不具有有效的独立样本检验解释。');
 if(current.mode==='zero')s.push('未知结局被人为设为疼痛0分，此处理没有数据依据。');
 if(current.mode==='oracle')s.push('模拟器可以读取未观察的潜在4周结果；真实临床研究不能这样操作。');
 if(['locf','bocf'].includes(current.mode))s.push('此方案是特定情景假设，不是已验证的缺失数据估计方法。');
 if(!s.length)s.push('对照基于同一批模拟受试者，观察值、分组与随机种子保持不变。');
 return s;
}
function chartP(){const values=[{t:'完整病例',p:base.kw?.p,c:'#58ddea'},{t:modeText(current.mode)+(current.duplicate?' ×2':''),p:current.kw?.p,c:'#c5a0ff'},{t:'模拟完整结局',p:oracle.kw?.p,c:'#ffbd83'}];
 const W=670,H=170,x0=130,x1=626,cap=6,x=p=>x0+Math.min(cap,-Math.log10(Math.max(p??1,1e-12)))/cap*(x1-x0);
 const alpha=x(.05),text=[];
 text.push(`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="不同策略的P值比较，横轴为负对数P值">`);
 for(let z=0;z<=6;z++){let px=x0+(x1-x0)*z/6;text.push(`<line x1="${px}" y1="19" x2="${px}" y2="137" stroke="#284561" stroke-dasharray="3 5"/><text x="${px}" y="157" text-anchor="middle" fill="#769bb9" font-size="11">${z}</text>`);}
 text.push(`<line x1="${alpha}" y1="14" x2="${alpha}" y2="139" stroke="#ffcf96" stroke-width="1.6" stroke-dasharray="5 4"/><text x="${Math.min(alpha+5,570)}" y="12" fill="#ffc88c" font-size="11">α = 0.05</text>`);
 values.forEach((r,i)=>{let y=44+i*39,val=x(r.p);text.push(`<text x="122" y="${y+4}" text-anchor="end" fill="#a4c5dc" font-size="12">${safe(r.t)}</text><rect x="${x0}" y="${y-8}" width="${Math.max(2,val-x0)}" height="16" fill="${r.c}" fill-opacity=".5" rx="4"/><circle cx="${val}" cy="${y}" r="6" fill="${r.c}" stroke="#0b1b2b" stroke-width="2"/><text x="${Math.min(val+11,612)}" y="${y-12}" fill="${r.c}" font-size="12" font-weight="700">${ptext(r.p)}</text>`);});
 return text.join('')+'<text x="380" y="169" font-size="10" fill="#7696af">−log₁₀(P) → 越靠右表示P值越小</text></svg>';
}
function chartEffect(){const vals=[{t:'完整病例',v:base.medDiff,c:'#58ddea'},{t:modeText(current.mode)+(current.duplicate?' ×2':''),v:current.medDiff,c:'#c5a0ff'},{t:'模拟完整结局',v:oracle.medDiff,c:'#ffbd83'}];
 const W=670,H=162,range=4,zero=378,scale=85,text=[`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="三种分析方案的中位数差比较">`];
 for(let t=-4;t<=3;t++){let x=zero+t*scale;text.push(`<line x1="${x}" x2="${x}" y1="10" y2="128" stroke="${t===0?'#7fa0bb':'#284561'}" stroke-dasharray="3 5"/><text x="${x}" y="151" text-anchor="middle" fill="#7292b0" font-size="11">${t}</text>`);}
 vals.forEach((r,i)=>{let y=38+i*39;let end=zero+Math.min(3,Math.max(-4,r.v??0))*scale,left=Math.min(zero,end),width=Math.abs(end-zero);text.push(`<text x="125" y="${y+4}" text-anchor="end" fill="#a4c5dc" font-size="12">${safe(r.t)}</text><rect x="${left}" y="${y-9}" width="${width}" height="18" rx="4" fill="${r.c}" fill-opacity=".58"/><circle cx="${end}" cy="${y}" r="5" fill="${r.c}"/><text x="${Math.max(130,Math.min(640,end+10))}" y="${y-12}" fill="${r.c}" font-size="11">${f(r.v,2)}</text>`);});
 return text.join('')+'</svg>';
}
function missingRows(){const missing=data.filter(x=>x.delta===null).slice(0,6);
 if(!missing.length)return '<div class="as-no-missing">当前模拟队列没有失访者。可提高失访率观察处理差异。</div>';
 const value=p=>{if(current.mode==='complete')return '排除';if(current.mode==='bocf')return '0';if(current.mode==='locf')return String(p.baseline-p.week2);if(current.mode==='oracle')return String(p.baseline-p.latentWeek4);return String(p.baseline);};
 return `<div class="as-tablewrap"><table class="as-table"><thead><tr><th>对象</th><th>组别</th><th>基线</th><th>2周</th><th>4周</th><th>当前改善量</th></tr></thead><tbody>${missing.map(r=>`<tr><td>#${r.id}</td><td>${names[r.group]}</td><td>${r.baseline}</td><td>${r.week2}</td><td class="as-missing">缺失</td><td class="as-imputed">${value(r)}</td></tr>`).join('')}</tbody></table></div>`;
}
function draw(){compare();const primary=current.kw?.p,bp=base.kw?.p;
 $('as-n').textContent=String(current.n);
 $('as-n-label').textContent=current.duplicate?'表面观测数（含重复）':'本次分析记录数';
 $('as-p').textContent=ptext(primary);$('as-h').textContent=f(current.kw?.H,3);$('as-median').textContent=f(current.medDiff,2);
 $('as-delta-n').textContent=current.duplicate?`实际独立对象 ${current.uniqueN} · 伪重复 ${current.n-current.uniqueN}`:`失访 ${current.missing} · 情景填补 ${current.substituted}`;
 $('as-baseline').textContent=f(current.baselineGap,2);
 $('as-p').classList.toggle('as-signif',primary!=null&&primary<.05);
 $('as-narrative').innerHTML=describe().map(s=>`<p>${safe(s)}</p>`).join('');
 $('as-plot').innerHTML=chartType==='p'?chartP():chartEffect();
 document.querySelectorAll('[data-as-chart]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.asChart===chartType)));
 $('as-comparison').innerHTML=`<div class="as-compare-grid"><div><span>完整病例基准</span><strong>${ptext(bp)}</strong><small>n = ${base.n} · 中位数差 ${f(base.medDiff,2)}</small></div><div><span>当前策略</span><strong>${ptext(primary)}</strong><small>n = ${current.n} · 中位数差 ${f(current.medDiff,2)}</small></div><div><span>模拟完整结局</span><strong>${ptext(oracle.kw?.p)}</strong><small>n = ${oracle.n} · 中位数差 ${f(oracle.medDiff,2)}</small></div></div>`;
 const pairs=current.pairs||[];
 $('as-pairs').innerHTML=pairs.length?`<div class="as-tablewrap"><table class="as-table"><thead><tr><th>组间比较</th><th>原始P</th><th>Holm校正P</th></tr></thead><tbody>${pairs.map(r=>`<tr><td>${names[r.a]} vs ${names[r.b]}</td><td>${ptext(r.p)}</td><td class="${r.pHolm<.05?'as-imputed':''}">${ptext(r.pHolm)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="as-no-missing">数据不足，无法计算。</div>';
 $('as-individual').innerHTML=missingRows();
 $('as-policy').textContent=C.MODES[current.mode].explain;
 $('as-policy-tag').textContent=C.MODES[current.mode].tag;
 $('as-config').textContent=`种子 ${cfg.seed} · ${cfg.dropout.toUpperCase()} · 失访基础率 ${Math.round(cfg.dropoutRate*100)}% · ${cfg.allocation==='severity'?'按病情分组':cfg.allocation==='simple'?'完全随机':'区组随机'}`;
 $('as-duplicate').checked=current.duplicate;$('as-missing').value=current.mode;
 if(primary!=null&&bp!=null&&((primary<.05)!==(bp<.05)))$('as-changed').textContent='统计判断发生变化';else $('as-changed').textContent='对比同一批模拟数据';
}
function applyPreset(x){selected={missing:x==='zero'?'zero':x==='locf'?'locf':'complete',duplicate:x==='double'};repToken++;$('as-rep-results').classList.add('hidden');$('as-rep-empty').classList.remove('hidden');draw();setNote('已切换策略；两个统计结果基于同一批模拟受试者。');}
function update(){selected.missing=$('as-missing').value;selected.duplicate=$('as-duplicate').checked;repToken++;$('as-rep-results').classList.add('hidden');$('as-rep-empty').classList.remove('hidden');draw();setNote('分析策略已更新。');}
function dl(name,body,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([body],{type:type||'application/json;charset=utf-8'}));a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function save(){const explanation=$('as-conclusion').value.trim();if(explanation.length<12){setNote('请先写下至少12个字的分析结论，再保存。');$('as-conclusion').focus();return;}
 const evidence={created:new Date().toISOString(),config:{...cfg},analysis:{...selected},baseline:{n:base.n,kwP:base.kw?.p,medDiff:base.medDiff},selected:{n:current.n,kwP:current.kw?.p,medDiff:current.medDiff},oracle:{n:oracle.n,kwP:oracle.kw?.p,medDiff:oracle.medDiff},comment:explanation};
 Bridge.attachEvidence(evidence);
 dl('统计策略对照记录_seed'+cfg.seed+'.json',JSON.stringify(evidence,null,2));
 setNote('对照结果已保存，并加入综合实验报告；已下载JSON记录。');
}
function repeat(){repToken++;const token=repToken,B=120,c={...cfg},opt={...selected};let i=0,valid=0,acc={base:0,candidate:0,oracle:0},diff=[],baseDiff=[],candDiff=[],oracleDiff=[];
 $('as-rep-btn').disabled=true;$('as-rep-btn').textContent='模拟中 · 0/120';$('as-rep-empty').classList.add('hidden');$('as-rep-results').classList.remove('hidden');
 const tick=()=>{
  if(token!==repToken){$('as-rep-btn').disabled=false;$('as-rep-btn').textContent='重复实验 120 次';return;}
  for(let j=0;j<12&&i<B;j++,i++){
   const seed=((c.seed+104729*(i+1))>>>0)||1, cohort=S.simulate({...c,seed});
   const a=C.analyze(cohort,{missing:'complete',duplicate:false},S),b=C.analyze(cohort,opt,S),o=C.analyze(cohort,{missing:'oracle',duplicate:false},S);
   if(a.kw&&b.kw&&o.kw){valid++;acc.base+=a.kw.p<.05?1:0;acc.candidate+=b.kw.p<.05?1:0;acc.oracle+=o.kw.p<.05?1:0;diff.push(b.medDiff-o.medDiff);baseDiff.push(a.medDiff-o.medDiff);}
  }
  $('as-rep-btn').textContent=`模拟中 · ${i}/${B}`;
  if(i<B){setTimeout(tick,15);return;}
  $('as-rep-btn').disabled=false;$('as-rep-btn').textContent='重新运行 120 次';
  const percent=n=>valid?(100*n/valid).toFixed(1)+'%':'—',mean=C.mean;
  $('as-rep-results').innerHTML=`<div class="as-repeat-cards"><div><span>完整病例 · P＜0.05</span><strong>${percent(acc.base)}</strong></div><div><span>当前方案 · P＜0.05</span><strong>${percent(acc.candidate)}</strong></div><div><span>完整结局 · P＜0.05</span><strong>${percent(acc.oracle)}</strong></div></div><div class="as-bias"><span>与模拟完整结局的平均中位数差偏离</span><strong>基准 ${f(mean(baseDiff),3)} / 当前 ${f(mean(diff),3)}</strong></div><p>同一设置下重复生成 ${valid} 组独立队列。这里的“偏离”是相对于每次模拟完整数据的估计差异，不等于总体参数的严格偏差估计。${c.effectScale===0?'真实组间效应差设为0，可以观察第一类错误率的模拟近似。':'真实组间效应差不为0，可以观察不同策略的拒绝比例。'}</p>`;
  setNote(`已完成 ${valid} 次成对策略比较。`);
 };
 tick();
}
$('as-missing').addEventListener('change',update);
$('as-duplicate').addEventListener('change',update);
for(const b of document.querySelectorAll('[data-as-preset]'))b.addEventListener('click',()=>applyPreset(b.dataset.asPreset));
for(const b of document.querySelectorAll('[data-as-chart]'))b.addEventListener('click',()=>{chartType=b.dataset.asChart;draw();});
$('as-save').addEventListener('click',save);
$('as-rep-btn').addEventListener('click',repeat);
Studio.subscribe(()=>{repToken++;selected={missing:'complete',duplicate:false};$('as-rep-results').classList.add('hidden');$('as-rep-empty').classList.remove('hidden');draw();setNote('模拟队列已变化，策略对照已重新计算。');});
draw();setNote('选择一种处理策略，直接比较统计后果。');
})();
