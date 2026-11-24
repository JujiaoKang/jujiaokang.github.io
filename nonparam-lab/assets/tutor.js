/* NP LAB v0.7 | verified local knowledge retrieval and current-data audit. */
(()=>{'use strict';
const K=window.NPLTutorKnowledge||[],KB=window.NPLKBSearch,S=window.NPLStats,C=window.NPLStrategy,St=window.NPLStudioAPI,B=window.NPLStudioBridge;
const $=id=>document.getElementById(id),safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!$('tutor-lab')||!K.length||!S||!St||!C)return;
const STATE_KEY='npl-clinical-prototype-v1',API_KEY='npl-tutor-endpoint';
const f=(n,d=3)=>Number.isFinite(n)?(Math.abs(n)<.0001&&n!==0?n.toExponential(2):n.toFixed(d)):'—';
const groups=['常规管理','App指导','混合干预'];
let tab='diagnose',pending=false,record=null;
const stamp=()=>new Date().toISOString();
function fp(rows){let h=2166136261>>>0;const src=rows.map(r=>[r.id,r.group,r.baseline,r.week2,r.week4,r.delta,r.dropout,r.latentWeek4].join('/')).join(';');for(let i=0;i<src.length;i++){h^=src.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0')+'-'+rows.length;}
function study(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')}catch(e){return {}}}
function context(){const {cfg,data}=St.get(),ss=study(),d=ss.decisionEvidence||null;
 let a=C.analyze(data,{missing:'complete',duplicate:false},S),counts=groups.map((_,g)=>{let x=data.filter(r=>r.group===g),used=x.filter(r=>r.delta!==null);return {n:x.length,complete:used.length,lost:x.length-used.length,meanBaseline:x.length?x.reduce((sum,r)=>sum+r.baseline,0)/x.length:null}});
 const b=d?.b&&d?.b.fingerprint===fp(data)?{name:d.b.label,strategy:d.b.strategy,n:d.b.n,p:d.b.p}:null;
 const aa=d?.a&&d?.a.fingerprint===fp(data)?{name:d.a.label,strategy:d.a.strategy,n:d.a.n,p:d.a.p}:null;
 return {fingerprint:fp(data),cfg:{n:+cfg.n,effectScale:+cfg.effectScale,allocation:cfg.allocation,noise:cfg.noise,dropout:cfg.dropout,dropoutRate:+cfg.dropoutRate,seed:+cfg.seed},group:counts,total:data.length,complete:counts.reduce((s,z)=>s+z.complete,0),lost:counts.reduce((s,z)=>s+z.lost,0),kw:{p:a.kw?.p??null,H:a.kw?.H??null,n:a.n,medDiff:a.medDiff},selected:{a:aa,b},report:d?.reflection?.text||'',plan:d?.plan?.reason||'',progress:Object.values(ss.grades||{}).filter(x=>x?.completed).length,score:Object.values(ss.grades||{}).reduce((s,x)=>s+(+x.score||0),0)};
}
function sources(ids){return ids.map(id=>K.find(k=>k.id===id)).filter(Boolean);}
function recommend(q,limit=4){return KB?KB.retrieve(q,K,limit).map(x=>x.entry):[];}

function diagnose(c){const findings=[],add=(severity,title,detail,refs)=>findings.push({severity,title,detail,refs});
 if(c.cfg.allocation==='severity')add('high','分组与基线严重程度混杂','当前采用按病情分组；组间初始疼痛可能不同，因此组间差异不能直接解释为方案效果。',['design']);
 if(c.cfg.dropout==='mnar')add('high','存在非随机失访机制','本次模拟的失访与潜在未观察结局有关。仅分析完整病例可能发生选择偏差；可以用模拟完整结局作教学参照。',['missing']);
 else if(c.cfg.dropout==='mar')add('mid','失访依赖已观察信息','当前为MAR设定。完整病例分析可能受基线等已观察变量影响，不能简单认为“删除失访者无影响”。',['missing']);
 if(c.cfg.dropoutRate>=.3)add('mid','失访率较高',`基础失访率设置为${Math.round(c.cfg.dropoutRate*100)}%，实际本次失访${c.lost}/${c.total}人；建议对照缺失敏感性分析。`,['missing']);
 if(c.cfg.noise==='heavy')add('mid','重尾数据需谨慎解释','存在极端观测风险。应比较稳健分布统计量，且秩检验仍依赖研究设计和样本独立性。',['nonparam','kw']);
 if(c.total<60)add('mid','小样本推断的不确定性','当前样本规模较小。Kruskal–Wallis此处采用大样本近似，建议结合重复抽样和合理的置换检验进行理解。',['kw','resample']);
 if(c.selected.b?.strategy==='duplicate')add('high','伪重复导致独立性破坏',`方案B重复计算同一人的观测，表面n=${c.selected.b.n}，没有产生新的独立受试者；其P值不能作为有效证据。`,['design','paired']);
 if(c.selected.b?.strategy==='zero')add('high','缺失值被错误设为零','方案B将未知的疼痛评分写作“0分”，等同于擅自赋予最佳结局，可能制造虚假改善。',['missing']);
 if(['locf','bocf'].includes(c.selected.b?.strategy))add('mid','填补策略依赖额外假设','LOCF/BOCF是人为结局情景，不能自动等同于无偏处理；与完整病例的差异应作为敏感性提示。',['missing']);
 if(c.selected.b&&c.selected.a&&Number.isFinite(c.selected.a.p)&&Number.isFinite(c.selected.b.p)&&((c.selected.a.p<.05)!==(c.selected.b.p<.05)))add('high','两种策略改变了显著性判断',`方案A P=${f(c.selected.a.p,4)}，方案B P=${f(c.selected.b.p,4)}。先检查分析单位、缺失处理和有效性，再解释P值差异。`,['pvalue','missing']);
 if(c.cfg.effectScale===0)add('ok','零效应模拟','模型预设真实组间差异为零。重复实验中P<0.05的比例可用于观察第一类错误表现；不能根据单次显著结果推断模型设定被改变。',['power']);
 if(!c.selected.a)add('ok','尚未锁定分析策略','可先在“研究决策”保存A/B分析，助手会自动检查方案差异与统计前提。',['design','kw']);
 if(!findings.length)add('ok','基本分析条件已记录','目前未发现设定层面的明显违规操作；这不代表研究结论自动有效，还需检查样本独立性、分布和缺失。',['kw','report']);
 return findings;
}
function review(c){let out=[],txt=c.report.trim(),src=['report','h0'];
 if(!txt)return {headline:'尚未提交研究结论',items:['先到“研究决策 → 研究结论”写出方法、结果和局限，再返回审阅。'],refs:sources(src)};
 if(txt.length<60)out.push('研究结论过短，建议明确分析对象、方法、数值结果和局限。');
 if(!/Kruskal|Wallis|kw|检验|mann|秩|统计/i.test(txt))out.push('尚未清楚说明主要使用的统计方法。');
 if(!/p\s*[=＜<>≤≥]|p值|显著/i.test(txt))out.push('建议给出实际P值，而不只写“有差异”或“有效”。');
 if(!/缺失|失访|混杂|假设|局限|偏差|不可|不等于/.test(txt))out.push('建议说明缺失、独立性、模型设定或研究设计方面的局限。');
 if(/接受[了]?原假设|证明.{0,12}无差异|完全没有差异/.test(txt))out.push('不能拒绝H₀不等于证明没有差异，建议修改结论语言。');
 if(/证明.{0,12}(治疗|疗法|方案).{0,8}有效|相关.{0,7}因果|一定.{0,6}有效/.test(txt))out.push('统计显著与观察性相关不自动证明干预具有因果疗效。');
 if(c.selected.b?.strategy==='zero'||c.selected.b?.strategy==='duplicate'){
  if(!/错误|无效|伪重复|填零|独立|不能|偏差/.test(txt))out.push('方案B包含错误分析操作，应明确指出该P值不构成有效推断。');
  src.push('missing','design');
 }
 if(c.selected.a&&c.selected.b){const pa=c.selected.a.p,pb=c.selected.b.p;
  if(!txt.includes(f(pa,4))&&!txt.includes(f(pa,3)))out.push('建议补充方案A的实际P值（'+f(pa,4)+'），并说明这是同一模拟队列的分析结果。');
  if(!txt.includes(f(pb,4))&&!txt.includes(f(pb,3)))out.push('建议补充方案B的实际P值（'+f(pb,4)+'），并解释两种策略的不同。');
 }
 if(out.length===0)out.push('基本报告要素已覆盖。请继续核查效应量的定义、统计假设与数值是否一致；此检查不代替教师对科学准确性的复核。');
 return {headline:out.length===1&&out[0].startsWith('基本')?'报告结构较完整':'报告建议修改 '+out.length+' 项',items:out,refs:sources(src)};
}
function answer(q,c){const hit=recommend(q),similar=/(当前|我的|现在|这批|这个实验|此时|为什么|数据|结论)/.test(q);
 const items=hit.length?hit.map(x=>x.body):['课程知识库没有完全匹配的条目。可以改问“为什么不能把失访记为0”“三组比较该用什么检验”或“P值应如何解释”。'];
 const links=hit.length?hit:[];
 if(hit.length&&similar&&c.selected.a&&c.selected.b)items.unshift(`当前方案A：${c.selected.a.name}，P=${f(c.selected.a.p,4)}；方案B：${c.selected.b.name}，P=${f(c.selected.b.p,4)}。请结合下述统计前提解释差异。`);
 else if(hit.length&&similar&&Number.isFinite(c.kw.p))items.unshift(`当前模拟队列：${c.total}人，失访${c.lost}人，完整病例Kruskal–Wallis P=${f(c.kw.p,4)}。`);
 return {headline:'课程知识检索',items,refs:links};
}
function renderResult(r,mode='local'){
 const list=r.items.map(s=>`<li>${safe(s)}</li>`).join('');
 const s=[...new Map((r.refs||[]).map(x=>[x.id,x])).values()];
 $('tutor-result').innerHTML=`<h3>${safe(r.headline)}</h3><ol>${list}</ol><div class="tutor-row"><span class="minor">${mode==='online'?'在线模型回答 · 请核对':'本地知识库与规则诊断'}</span>${s.slice(0,4).map(x=>`<span class="tutor-source" title="${safe(x.title)}">${safe(x.source)}</span>`).join('')}</div>`;
}
function renderDiag(c){const a=diagnose(c),rank={high:0,mid:1,ok:2};a.sort((x,y)=>rank[x.severity]-rank[y.severity]);
 renderResult({headline:`当前队列 · ${a.filter(x=>x.severity==='high').length}项重点问题`,items:a.map(x=>(x.severity==='high'?'【重要】':x.severity==='mid'?'【关注】':'【提示】')+x.title+'：'+x.detail),refs:sources([...new Set(a.flatMap(x=>x.refs))])});
 return {headline:'当前实验诊断',items:a.map(x=>x.title+'：'+x.detail),refs:sources([...new Set(a.flatMap(x=>x.refs))])};
}
function save(kind,response,c){const summary={version:'0.7',fingerprint:c.fingerprint,time:stamp(),kind,headline:response.headline,items:response.items.slice(0,12).map(x=>String(x).slice(0,400)),sources:(response.refs||[]).map(x=>x.source).slice(0,4),method:'本地课程知识与规则检查'};
 record=summary;B?.attachAssistantEvidence?.(summary);
 $('tutor-record').textContent='最近记录：'+new Date(summary.time).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})+' · '+summary.kind;
}
function renderLibrary(){
 const q=$('kb-query').value.trim(),chapter=$('kb-chapter').value;
 const relevant=q?recommend(q,40):K;
 const rows=relevant.filter(k=>chapter==='all'||k.chapter===chapter);
 $('kb-count').textContent=`${rows.length} 项 · 知识库共 ${K.length} 项`;
 $('kb-list').innerHTML=rows.length?rows.map(k=>`<details class="kb-entry"><summary><span class="kb-tag">${safe(k.chapter)}</span><strong>${safe(k.title)}</strong></summary><p>${safe(k.body)}</p><small>${safe(k.source)}${k.kind==='实验延伸'?' · 实验拓展':''}</small><button type="button" class="kb-use" data-kb-id="${safe(k.id)}">提问此知识点</button></details>`).join(''):'<p class="kb-nomatch">当前没有匹配条目，请尝试方法名称或章节关键词。</p>';
 $('kb-list').querySelectorAll('[data-kb-id]').forEach(b=>b.addEventListener('click',()=>{const item=K.find(k=>k.id===b.dataset.kbId);if(!item)return;selectTab('ask');$('tutor-question').value=item.title+'适用于什么数据？需要注意哪些统计前提？';execute();}));
}
function initLibrary(){const chapters=[...new Set(K.map(k=>k.chapter))];for(const ch of chapters){const opt=document.createElement('option');opt.value=ch;opt.textContent=ch;$('kb-chapter').append(opt);}
 $('kb-query').addEventListener('input',renderLibrary);$('kb-chapter').addEventListener('change',renderLibrary);renderLibrary();}
function endpointUrl(){const v=$('tutor-endpoint').value.trim();try{const u=new URL(v);if(u.protocol==='https:'||(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))return u;}catch{}return null;}
async function checkOnline(){const u=endpointUrl();if(!u){$('tutor-config-state').textContent='请输入HTTPS服务地址。';return;}
 const health=new URL(u.toString());health.pathname='/health';health.search='';
 $('tutor-health').disabled=true;$('tutor-config-state').textContent='正在检查连接…';try{const c=new AbortController();const timeout=setTimeout(()=>c.abort(),6000);try{const r=await fetch(health.href,{signal:c.signal});const obj=await r.json();if(!r.ok||obj?.status!=='ok')throw Error(obj.error||'服务不可用');$('tutor-config-state').textContent=obj.modelConfigured?'在线服务已连接 · 模型已配置':'在线服务已连接 · 尚未配置模型密钥';}finally{clearTimeout(timeout);}}
 catch(e){$('tutor-config-state').textContent='连接未成功：'+(e.name==='AbortError'?'超时':'检查服务地址或跨域设置');}finally{$('tutor-health').disabled=false;}}
function selectTab(s){tab=s;for(const b of document.querySelectorAll('[data-tutor-tab]')){b.classList.toggle('active',b.dataset.tutorTab===s);b.setAttribute('aria-selected',b.dataset.tutorTab===s?'true':'false');}
 const help={diagnose:'读取当前模拟队列与分析策略，检查统计前提。',review:'按课程要求检查已提交的研究结论，提出修改建议。',ask:'输入统计问题，检索对应课程内容。',library:'按章节检索课程知识。'};
 $('tutor-label').textContent=help[s];$('tutor-question').hidden=s!=='ask';$('kb-tools').hidden=s!=='library';$('tutor-run').hidden=s==='library';$('tutor-use-report').hidden=s==='library';$('tutor-run').textContent=s==='diagnose'?'诊断当前实验':s==='review'?'审阅研究结论':'检索课程知识';if(s==='library')renderLibrary();
}
function setStats(c){$('tutor-n').textContent=String(c.total);$('tutor-lost').textContent=String(c.lost);$('tutor-p').textContent=f(c.kw.p,4);$('tutor-step').textContent=c.progress+'/25';$('tutor-method').textContent=c.selected.b?.name||'完整病例';$('tutor-context').textContent=`种子 ${c.cfg.seed} · ${c.cfg.noise==='heavy'?'重尾':c.cfg.noise==='skew'?'偏态':'对称'} · ${c.cfg.dropout.toUpperCase()}`;}
function execute(){if(pending)return;const c=context();setStats(c);let response;
 if(tab==='library'){renderLibrary();return;}if(tab==='diagnose')response=renderDiag(c);else if(tab==='review'){response=review(c);renderResult(response);}else{const q=$('tutor-question').value.trim();if(!q){$('tutor-status').textContent='请输入要查询的统计问题。';$('tutor-question').focus();return;}response=answer(q,c);renderResult(response);}
 save(tab,response,c);$('tutor-status').textContent='已核对当前模拟数据；自动诊断与文字检查不计入课程成绩。';
}
async function online(){if(pending)return;const parsed=endpointUrl(),u=parsed?.href||'',q=$('tutor-question').value.trim();
 if(!parsed){$('tutor-status').textContent='请先配置HTTPS服务地址（本地调试可用localhost）。';return;}
 const c=context();const question=q||'请诊断当前模拟实验设计、统计前提和报告存在的主要问题。';
 const summary={cfg:c.cfg,group:c.group,total:c.total,complete:c.complete,lost:c.lost,kw:c.kw,selected:c.selected,report:c.report.slice(0,1800),plan:c.plan.slice(0,900)};
 const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),16000);pending=true;$('tutor-online').disabled=true;$('tutor-online').textContent='查询中…';$('tutor-status').textContent='在线查询仅发送匿名统计摘要和你输入的内容；不发送原始个体数据。';
 try{const reply=await fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:question.slice(0,700),mode:tab,summary}),signal:ctrl.signal});
  const result=await reply.json().catch(()=>({}));if(!reply.ok)throw Error(result.error||'请求失败（'+reply.status+'）');if(typeof result.answer!=='string'||!result.answer.trim())throw Error('返回内容为空');
  const refs=(Array.isArray(result.sources)?result.sources:[]).map(id=>K.find(x=>x.id===id)).filter(Boolean);
  const response={headline:'统计助教 · 在线回答',items:[result.answer.slice(0,5000)],refs};renderResult(response,'online');
  $('tutor-status').textContent='在线回答已返回；请核对课程知识与当前统计输出。';
  record={version:'0.7',fingerprint:c.fingerprint,time:stamp(),kind:'online',headline:response.headline,items:response.items,sources:refs.map(x=>x.source),method:'在线模型回答（未自动评分）'};
  B?.attachAssistantEvidence?.(record);
 }catch(err){$('tutor-status').textContent='在线查询未完成：'+(err.name==='AbortError'?'响应超时':err.message)+'。本地诊断仍可用。';}
 finally{clearTimeout(timeout);pending=false;$('tutor-online').disabled=false;$('tutor-online').textContent='在线追问';}
}
for(const b of document.querySelectorAll('[data-tutor-tab]'))b.addEventListener('click',()=>selectTab(b.dataset.tutorTab));
$('tutor-run').addEventListener('click',execute);$('tutor-online').addEventListener('click',online);$('tutor-health').addEventListener('click',checkOnline);initLibrary();
$('tutor-endpoint').value=localStorage.getItem(API_KEY)||'';
$('tutor-endpoint').addEventListener('change',()=>{const v=$('tutor-endpoint').value.trim();localStorage.setItem(API_KEY,v);$('tutor-config-state').textContent=v?'已保存服务地址（不包含模型密钥）':'当前仅使用本地功能';});
$('tutor-config-state').textContent=$('tutor-endpoint').value?'已保存服务地址（不包含模型密钥）':'当前仅使用本地功能';
for(const b of document.querySelectorAll('[data-tutor-question]'))b.addEventListener('click',()=>{selectTab('ask');$('tutor-question').value=b.dataset.tutorQuestion;execute();});
$('tutor-use-report').addEventListener('click',()=>{selectTab('review');execute();});
const last=study().assistantEvidence;const c0=context();if(['0.6','0.7'].includes(last?.version)&&last.fingerprint===c0.fingerprint){record=last;$('tutor-record').textContent='最近记录：'+new Date(last.time).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})+' · '+last.kind;}
let lastfp=c0.fingerprint;
St.subscribe(()=>{const c=context();setStats(c);if(lastfp!==c.fingerprint){lastfp=c.fingerprint;record=null;$('tutor-record').textContent='队列已更新 · 请重新诊断';$('tutor-result').innerHTML='<h3>队列已变化</h3><p>重新运行诊断，避免沿用旧数据的结论。</p>';B?.attachAssistantEvidence?.(null);}});
window.addEventListener('npl:stateinvalidated',()=>{record=null;$('tutor-record').textContent='实验条件已更新 · 请重新诊断';B?.attachAssistantEvidence?.(null);});
setStats(c0);selectTab('diagnose');
window.NPLTutorTest={context,diagnose,review,answer,recommend,fp};
})();
