/* NP LAB v0.5 - research decision log (local/offline; no large model claims) */
(()=>{'use strict';
const S=window.NPLStats,C=window.NPLStrategy,Studio=window.NPLStudioAPI,Bridge=window.NPLStudioBridge;
const $=id=>document.getElementById(id);
if(!S||!C||!Studio||!Bridge||!$('decision-lab'))return;
const fmt=(x,d=4)=>Number.isFinite(x)?(Math.abs(x)<1e-4?x.toExponential(2):x.toFixed(d)):'—';
const opts={complete:{mode:'complete',duplicate:false,label:'完整病例'},locf:{mode:'locf',duplicate:false,label:'LOCF'},bocf:{mode:'bocf',duplicate:false,label:'BOCF'},zero:{mode:'zero',duplicate:false,label:'错误填零'},duplicate:{mode:'complete',duplicate:true,label:'伪重复'},oracle:{mode:'oracle',duplicate:false,label:'模拟完整结局'}};
const htmlsafe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=()=>new Date().toISOString();
let study=null;
function rows(){return Studio.get().data;}
function fingerprint(ds){let h=2166136261>>>0;const source=ds.map(r=>[r.id,r.group,r.baseline,r.week2,r.week4,r.delta,r.dropout,r.latentWeek4].join('/')).join(';');for(let i=0;i<source.length;i++){h^=source.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0')+'-'+ds.length;}
function initial(){return {version:'0.5',fingerprint:fingerprint(rows()),created:time(),plan:null,a:null,b:null,audits:[],checks:null,reflection:null,events:[]};}
function log(action,details){study.events.push({time:time(),action,details:details||''});if(study.events.length>80)study.events=study.events.slice(-80);}
function safeSave(){Bridge.attachDecisionEvidence(study);render();}
function statFor(k){const d=rows(),o=opts[k];return C.analyze(d,{missing:o.mode,duplicate:o.duplicate},S);}
function publicSnapshot(k){const r=statFor(k);return {strategy:k,label:opts[k].label,fingerprint:study.fingerprint,n:r.n,uniqueN:r.uniqueN,excluded:r.excluded,substituted:r.substituted,medDiff:r.medDiff,H:r.kw?.H??null,p:r.kw?.p??null,time:time()};}
function consistent(){const fp=fingerprint(rows());return study.fingerprint===fp;}
function score(){return {plan:study.plan?(study.plan.outcome==='change'?2:0)+(study.plan.reason.length>=25?2:0):0,compare:(study.a?2:0)+(study.b?2:0),audit:2*study.audits.length,checks:study.checks?2*Number(study.checks.same===study.checks.expectedSame)+2*Number(study.checks.risk===study.checks.expectedRisk):0,reflection:study.reflection?(study.reflection.text.length>=60?2:0)+(study.reflection.caveat?1:0)+(study.reflection.uncertainty?1:0):0};}
function risk(k){if(k==='zero'||k==='duplicate')return 'invalid';if(k==='oracle')return 'reference';if(k==='locf'||k==='bocf')return 'scenario';return 'complete';}
function message(s){$('decision-status').textContent=s;}
function render(){
 const sc=score();const total=Object.values(sc).reduce((x,y)=>x+y,0);
 $('decision-total').textContent=total+'/20';$('decision-progress').style.width=total*5+'%';
 $('decision-stage-scores').innerHTML=[['研究计划',sc.plan],['方案比较',sc.compare],['数据核查',sc.audit],['判断复核',sc.checks],['研究结论',sc.reflection]].map(([k,v])=>`<div><span>${k}</span><strong>${v}/4</strong></div>`).join('');
 $('decision-fingerprint').textContent='队列编号 '+study.fingerprint;
 const snap=[study.a,study.b];
 $('decision-comparison').innerHTML=snap.some(Boolean)?`<div class="dd-compare">${snap.map((p,i)=>`<div><span>方案 ${i?'B':'A'} · ${p?htmlsafe(p.label):'未保存'}</span><strong>${p?fmt(p.p):'—'}</strong><small>P值 · ${p?'n='+p.n+' · 中位数差 '+fmt(p.medDiff,2):'请选择并保存'}</small></div>`).join('')}</div>`:'<div class="dd-placeholder">保存两个不同分析方案后，在这里比较结果。</div>';
 const a=study.a,b=study.b;
 if(a&&b){const eq=(a.p<.05)===(b.p<.05);$('decision-inference').textContent=`方案A：P = ${fmt(a.p)}（${a.p<.05?'拒绝':'不拒绝'}H₀）；方案B：P = ${fmt(b.p)}（${b.p<.05?'拒绝':'不拒绝'}H₀）。两者统计判断${eq?'一致':'不同'}。${b.strategy==='zero'||b.strategy==='duplicate'?'方案B存在不合理操作，其P值不可按有效检验解释。':''}`;}
 else $('decision-inference').textContent='先保存方案A和方案B。';
 $('decision-audit-count').textContent=`${study.audits.length}/2 项已查看`;
 $('decision-submissions').textContent=study.events.length+' 条操作';
 $('decision-timeline').innerHTML=study.events.slice(-8).reverse().map(x=>`<div><span>${new Date(x.time).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</span><strong>${htmlsafe(x.action)}</strong><small>${htmlsafe(x.details)}</small></div>`).join('')||'<div class="dd-placeholder">操作记录将在这里显示。</div>';
 $('decision-risk-status').textContent=study.checks?'已提交判断':a&&b?'等待提交判断':'完成两个方案后可作答';
 $('decision-reflection-status').textContent=study.reflection?'结论已保存 · 教师需复核文字内容':'尚未保存结论';
}
function reset(reason){study=initial();Bridge.attachDecisionEvidence(study);$('decision-audit-view').innerHTML='<div class="dd-placeholder">点击按钮查看当前模拟队列。</div>';message(reason||'已开始新的研究记录。');render();}
const saved=Bridge.getDecisionEvidence?.();study=saved&&saved.version==='0.5'&&saved.fingerprint===fingerprint(rows())?saved:initial();
if(!saved||study!==saved)Bridge.attachDecisionEvidence(study);
function submitPlan(){let outcome=$('decision-outcome').value,reason=$('decision-plan').value.trim();if(reason.length<25){message('研究计划需要至少25个字，说明结局、比较对象和方法选择理由。');return;}
 study.plan={outcome,reason,time:time()};log('记录分析计划',outcome==='change'?'以个人改善量为主要结局':'已记录所选结局');safeSave();message('分析计划已保存；文字内容需要教师复核。');}
function capture(which){if(!study.plan){message('先完成第一步：记录研究计划。');return;}const key=$(which==='a'?'decision-a-select':'decision-b-select').value;
 if(!opts[key])return;
 if(which==='b'&&!study.a){message('请先锁定方案 A。');return;}
 if(which==='b'&&study.a?.strategy===key){message('方案B必须与方案A不同。');return;}
 const snap=publicSnapshot(key);
 if(which==='a'){study.a=snap;study.b=null;study.checks=null;study.reflection=null;}
 else{study.b=snap;study.checks=null;study.reflection=null;}
 log('保存分析方案 '+which.toUpperCase(),opts[key].label+' · P='+fmt(snap.p));safeSave();message('方案'+which.toUpperCase()+'已锁定，来自相同模拟队列。');}
function audit(type){if(!study.a||!study.b){message('先保存两种分析方案，再核查数据。');return;}let d=rows(),groups=['常规干预','标准指导','综合干预'],a=[0,1,2].map(g=>d.filter(r=>r.group===g));
 let item='';if(type==='baseline'){item=a.map((x,i)=>`<tr><td>${groups[i]}</td><td>${x.length}</td><td>${fmt(x.reduce((s,z)=>s+z.baseline,0)/Math.max(1,x.length),2)}</td></tr>`).join('');$('decision-audit-view').innerHTML=`<table class="dd-table"><thead><tr><th>研究组</th><th>人数</th><th>基线评分均值</th></tr></thead><tbody>${item}</tbody></table>`;}
 else {item=a.map((x,i)=>{let n=x.filter(r=>r.dropout).length;return `<tr><td>${groups[i]}</td><td>${n}</td><td>${fmt(n/Math.max(1,x.length)*100,1)}%</td></tr>`;}).join('');$('decision-audit-view').innerHTML=`<table class="dd-table"><thead><tr><th>研究组</th><th>失访人数</th><th>失访比例</th></tr></thead><tbody>${item}</tbody></table>`;}
 if(!study.audits.includes(type))study.audits.push(type);
 log('核查'+(type==='baseline'?'基线':'失访'),type==='baseline'?'查看各组基线情况':'查看各组缺失情况');safeSave();message('核查结果已记录。');}
function checked(name){return document.querySelector(`input[name="${name}"]:checked`)?.value||'';}
function submitChecks(){if(!study.a||!study.b){message('先保存两个不同的分析方案。');return;}if(study.audits.length<2){message('先检查基线平衡和失访分布。');return;}
 let same=checked('decision-same'),rr=checked('decision-risk');if(!same||!rr){message('请完成两项判断。');return;}
 const expectedSame=((study.a.p<.05)===(study.b.p<.05))?'yes':'no',expectedRisk=risk(study.b.strategy);
 study.checks={same,risk:rr,expectedSame,expectedRisk,time:time()};
 log('提交分析判断',`显著性比较${same===expectedSame?'正确':'需修正'}；策略局限${rr===expectedRisk?'正确':'需修正'}`);
 safeSave();message('判断已评分：'+score().checks+'/4。可修改答案后重新提交。');}
function submitReflection(){if(!study.checks){message('请先提交统计判断。');return;}
 const val=$('decision-reflection').value.trim(),caveat=$('decision-caveat').checked,uncertainty=$('decision-uncertainty').checked;
 if(val.length<60){message('请填写至少60个字的研究结论，交代数据、方法、结果和局限。');return;}
 study.reflection={text:val,caveat,uncertainty,time:time()};log('保存研究结论',val.slice(0,36)+'…');safeSave();message('研究结论已保存。文字的科学准确性需教师复核。');}
function exportRecord(){const raw=JSON.parse(localStorage.getItem('npl-clinical-prototype-v1')||'{}');raw.decisionEvidence=study;
 const content=JSON.stringify({schema:'NPL-class-submission-v0.5',exported:time(),state:raw},null,2);
 const blob=new Blob([content],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='非参数统计研究记录_'+String(raw.code||'anonymous').replace(/[^\w\u4e00-\u9fa5-]/g,'_')+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);message('研究记录已下载，可交教师端导入复核。');}
$('decision-plan-save').addEventListener('click',submitPlan);
$('decision-save-a').addEventListener('click',()=>capture('a'));
$('decision-save-b').addEventListener('click',()=>capture('b'));
$('decision-audit-baseline').addEventListener('click',()=>audit('baseline'));
$('decision-audit-missing').addEventListener('click',()=>audit('missing'));
$('decision-check-submit').addEventListener('click',submitChecks);
$('decision-reflection-save').addEventListener('click',submitReflection);
$('decision-download').addEventListener('click',exportRecord);
$('decision-reset').addEventListener('click',()=>{if(confirm('重新开始研究决策记录？已保存的研究决策证据会清空，原25步成绩保留。'))reset('研究决策记录已重新开始。');});
Studio.subscribe(()=>{const fp=fingerprint(rows());if(study.fingerprint!==fp){reset('模拟队列发生变化，研究决策记录已重置；请对新数据重新执行比较。');}});
window.addEventListener('npl:stateinvalidated',()=>reset('25步实验条件已更新，研究决策记录已重置。')); 
if(study.plan){$('decision-outcome').value=study.plan.outcome;$('decision-plan').value=study.plan.reason;}
if(study.a)$('decision-a-select').value=study.a.strategy;
if(study.b)$('decision-b-select').value=study.b.strategy;
if(study.reflection){$('decision-reflection').value=study.reflection.text;$('decision-caveat').checked=study.reflection.caveat;$('decision-uncertainty').checked=study.reflection.uncertainty;}
render();message('当前队列已就绪。先记录分析计划，再保存两种统计策略。');
})();
