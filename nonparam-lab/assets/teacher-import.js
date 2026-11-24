/* Local teacher review. Files never leave the browser. */
(()=>{'use strict';
const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key='npl-clinical-prototype-v1';let local={};try{local=JSON.parse(localStorage.getItem(key)||'{}')}catch(e){}
const names=['研究计划','方案对照','数据核查','统计判断','研究结论'];
const decide=e=>{if(!e||e.version!=='0.5')return {score:0,sub:[],valid:false};
 const checks=e.checks||{},r=e.reflection||{};const sub=[e.plan?(e.plan.outcome==='change'?2:0)+(String(e.plan.reason||'').length>=25?2:0):0,(e.a?2:0)+(e.b?2:0),2*(e.audits?.length||0),e.checks?2*Number(checks.same===checks.expectedSame)+2*Number(checks.risk===checks.expectedRisk):0,e.reflection?(String(r.text||'').length>=60?2:0)+Number(!!r.caveat)+Number(!!r.uncertainty):0];return {score:sub.reduce((a,b)=>a+b,0),sub,valid:true};};
const stepscore=s=>Object.values(s.grades||{}).reduce((v,g)=>v+Number(g?.score||0),0);
const count=s=>Object.values(s.grades||{}).filter(g=>g?.completed).length;
const ev=(s)=>s.decisionEvidence;
function recordHtml(s){let e=ev(s),calc=decide(e);
 const tutor=s.assistantEvidence;const tutorHtml=['0.6','0.7'].includes(tutor?.version)?`<div class="ri-detailgrid" style="margin-top:12px"><div class="ri-span"><strong>统计助教记录 · 仅供教师复核</strong><p>${esc(tutor.headline||'已检查')}</p><ul>${(tutor.items||[]).slice(0,6).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p>${(tutor.sources||[]).map(esc).join('；')}</p><small>${esc(tutor.method||'')}</small></div></div>`:'';if(!calc.valid)return '<div class="ri-empty">暂无研究决策记录。请在综合实验中完成“研究决策”模块。</div>';
 return `<div class="ri-scorecards">${names.map((name,i)=>`<div><span>${name}</span><strong>${calc.sub[i]}/4</strong></div>`).join('')}</div><div class="ri-detailgrid"><div><strong>研究方案</strong><p>${esc(e.plan?.reason||'未提交')}</p></div><div><strong>分析策略</strong><p>A：${esc(e.a?.label||'未保存')} ${e.a?'P='+Number(e.a.p).toFixed(4):''}<br>B：${esc(e.b?.label||'未保存')} ${e.b?'P='+Number(e.b.p).toFixed(4):''}</p></div><div class="ri-span"><strong>研究结论 · 教师复核</strong><p>${esc(e.reflection?.text||'未提交')}</p></div></div>${tutorHtml}<p class="ri-foot">研究决策为20分过程完成度，文字推断是否正确需要教师人工复核。成绩尚未上传服务器。</p>`;}
$('localResearch').innerHTML=recordHtml(local);$('researchScoreVal').textContent=decide(ev(local)).score+'/20';
let imported=[],selected=-1;
function dl(name,content,type){const u=URL.createObjectURL(new Blob([content],{type:type||'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2500);}
function csv(rows){return '\ufeff'+rows.map(row=>row.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(',')).join('\r\n');}
function renderTable(){const t=$('class-table'),tbody=t.querySelector('tbody');tbody.innerHTML=imported.map((o,i)=>`<tr><td>${i+1}</td><td>${esc(o.code)}</td><td>${count(o.state)}/25</td><td>${stepscore(o.state)}/100</td><td>${decide(ev(o.state)).score}/20</td><td>${esc(o.review||'待复核')}</td><td><button type="button" class="ri-mini-btn" data-record="${i}">查看</button></td></tr>`).join('');
 $('import-count').textContent=String(imported.length);$('class-empty').hidden=imported.length>0;t.hidden=!imported.length;
 for(const b of tbody.querySelectorAll('[data-record]'))b.addEventListener('click',()=>select(Number(b.dataset.record)));}
function select(i){selected=i;const x=imported[i];if(!x)return;$('class-inspect').hidden=false;$('class-inspect-title').textContent='复核记录 · '+x.code;
 $('class-inspect-body').innerHTML=recordHtml(x.state);$('review-status').value=x.review||'待复核';$('review-comment').value=x.comment||'';}
$('class-files').addEventListener('change',async e=>{const files=Array.from(e.target.files||[]);let ok=0,fail=[];
 for(const file of files.slice(0,200)){
  if(file.size>5e6){fail.push(file.name+' (文件过大)');continue;}
  try{let body=JSON.parse(await file.text()),state=body?.state||body;if(!state||typeof state!=='object'||!state.grades||!state.cfg)throw Error('记录格式不符');
   const code=String(state.code||'匿名-'+(imported.length+1)).slice(0,80);let entry={code,state,filename:file.name,review:'待复核',comment:''};
   const found=imported.findIndex(x=>x.code===code);if(found>=0)imported[found]={...entry,review:imported[found].review,comment:imported[found].comment};else imported.push(entry);ok++;
  }catch(err){fail.push(file.name+' ('+err.message+')');}
 }
 renderTable();$('class-import-status').textContent=`已读取 ${ok} 份记录；${fail.length} 份未导入。${fail.length?fail.slice(0,3).join('、'):''}`;e.target.value='';});
$('review-save').addEventListener('click',()=>{if(selected<0)return;imported[selected].review=$('review-status').value;imported[selected].comment=$('review-comment').value.trim();renderTable();$('class-import-status').textContent='复核意见已保存在本页内存；请导出汇总CSV，关闭页面后不会自动保存。';});
$('class-export').addEventListener('click',()=>{if(!imported.length){$('class-import-status').textContent='先导入学生记录。';return;}
 const rows=[['实验编号','完成步数','原25步得分(100)','研究决策过程分(20)','研究计划(4)','方案比较(4)','数据核查(4)','判断复核(4)','研究结论(4)','教师复核状态','教师评语','原始文件']];
 for(const x of imported){let a=decide(ev(x.state));rows.push([x.code,count(x.state),stepscore(x.state),a.score,...(a.valid?a.sub:[0,0,0,0,0]),x.review,x.comment,x.filename]);}
 dl('非参数统计班级实验汇总.csv',csv(rows),'text/csv;charset=utf-8');});
$('class-clear').addEventListener('click',()=>{if(confirm('清空当前页面导入的班级记录？请确认已经导出汇总结果。')){imported=[];selected=-1;$('class-inspect').hidden=true;renderTable();$('class-import-status').textContent='已清空本次导入的记录。';}});
renderTable();
})();
