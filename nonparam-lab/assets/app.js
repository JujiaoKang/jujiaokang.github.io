(()=>{'use strict';
const S=window.NPLStats,KEY='npl-clinical-prototype-v1';
const $=id=>document.getElementById(id),groups=['常规管理','App指导','混合干预'];
const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pvalue=p=>p==null?'—':p<.0001?p.toExponential(2):p.toFixed(4);
const option=(value,label)=>({value,label});
const steps=[
 {phase:1,title:'明确研究目标',prompt:'数字康复机构应当用这次实验解决什么问题？',type:'choice',options:[option('compare','比较三种管理方案对疼痛改善的分布是否存在差异'),option('predict','证明App一定能治愈所有受试者'),option('chart','只制作漂亮的统计图')],correct:'compare',hint:'把现实业务需求转化成可检验的比较问题，避免预设结论。'},
 {phase:1,title:'确定观察单位',prompt:'本研究的独立观察单位是什么？',type:'choice',options:[option('patient','一名受试者'),option('visit','一次随访记录'),option('score','某一个疼痛分数')],correct:'patient',hint:'同一个人的基线、2周、4周是相关观测，而非三个人。'},
 {phase:1,title:'定义主要结局指标',prompt:'若希望评价4周干预的疼痛改善，最合适的主要结局是？',type:'choice',options:[option('change','每人基线评分 − 第4周疼痛评分'),option('post','只比较各组第4周的总人数'),option('id','比较编号大小')],correct:'change',hint:'主要结局应事先规定，且与临床业务目标对应。'},
 {phase:1,title:'确定改善方向',prompt:'按“基线 − 第4周”定义改善量，什么代表改善更多？',type:'choice',options:[option('positive','改善量越大，疼痛下降越多'),option('negative','改善量越小，疼痛下降越多'),option('unknown','方向永远无法解释')],correct:'positive',hint:'分数从8降到5，改善量是3，不是−3。'},
 {phase:1,title:'识别研究设计',prompt:'三种方案由不同受试者分别接受，属于什么设计？',type:'choice',options:[option('parallel','三组独立的平行设计，同一个人随访构成配对数据'),option('one','把所有时间点当成独立人群'),option('crossover','所有人同时经历三种干预')],correct:'parallel',hint:'注意组间独立与同一人重复测量这两种结构可同时存在。'},
 {phase:1,title:'选择分组方案',prompt:'请选择受试者分配方法。不同分组方式会真实改变虚拟数据。',type:'cfg',key:'allocation',options:[option('block','区组平衡随机分组（推荐）'),option('simple','完全随机分组（可能出现不等组人数）'),option('severity','按基线疼痛高低顺序分组（有偏的错误设计）')],correct:'block',hint:'随机化有助于减少选择偏倚。按病情排序分组会使组别与基线严重程度混杂。'},
 {phase:1,title:'配置样本规模',prompt:'你希望每个研究组计划纳入多少人？这会改变成本与抽样波动。',type:'cfg',key:'n',options:[option('15','每组15人（总45人）'),option('30','每组30人（总90人）'),option('60','每组60人（总180人）')],hint:'不同样本量会改变结果的离散程度，但单次P值不一定随着样本量单调变化。'},
 {phase:2,title:'预设真实效应',prompt:'设定用于教学模拟的三组真实干预效应差异（学生在真实研究中并不知道真值）。',type:'cfg',key:'effect',options:[option('zero','无组间真实差异'),option('low','较小的组间差异'),option('medium','中等的组间差异')],hint:'设定零效应可观察第一类错误；设定非零效应可研究检验功效。'},
 {phase:2,title:'设置误差分布',prompt:'选择虚拟实验的误差机制。哪一种更值得你检验分析方法的稳健性？',type:'cfg',key:'noise',options:[option('normal','大致对称的随机误差'),option('skew','偏态随机误差'),option('heavy','混合重尾误差')],hint:'非参数检验并非不需要任何假设。误差分布影响数据形态与效应解释。'},
 {phase:2,title:'设置失访过程',prompt:'给出4周失访机制和失访基础概率，观察完整病例分析的敏感性。',type:'dropout',hint:'完全随机失访、依赖已观察基线的失访和依赖潜在结局的失访并不等价。'},
 {phase:2,title:'设置随机种子',prompt:'指定模拟随机种子，以便教师和同学复现同一个实验。',type:'seed',hint:'相同的参数和随机种子应生成完全相同的模拟样本。'},
 {phase:2,title:'执行虚拟随机分组与随访',prompt:'运行实验引擎，生成基线、2周、4周的受试者数据以及失访标记。',type:'action',action:'generate',hint:'这一步是真正的数据模拟，不是预先写死的一张数据表。'},
 {phase:3,title:'检查组间基线平衡',prompt:'请根据右侧各组人数和基线均值，决定是否需要开展组间可比性检查。',type:'choice',options:[option('check','检查各组人数、基线分布以及分配机制'),option('ignore','既然有随机化就完全不必检查'),option('erase','删除所有基线高的受试者')],correct:'check',hint:'随机化并不保证小样本中每一项基线指标完全相等。',requires:'data'},
 {phase:3,title:'确定缺失值处理原则',prompt:'第4周有失访者时，应该如何处理其未知的真实疼痛分数？',type:'choice',options:[option('keep','保留缺失标记，说明完整病例分析的局限并做敏感性分析'),option('zero','把未知的第4周疼痛评分一律记为0'),option('dropid','删除该受试者的所有既往记录且不说明')],correct:'keep',hint:'缺失不等于0。不能用虚构结局替代未知结局。',requires:'data'},
 {phase:3,title:'判断样本依赖关系',prompt:'若比较三种不同受试者的第4周改善量，样本结构应如何认定？',type:'choice',options:[option('independent','组间独立；组内个人的前后测量配对'),option('pairedall','三组之间全部一一配对'),option('norelate','所有记录都是同一观测值')],correct:'independent',hint:'检验方法选择先看研究设计和独立性，再看变量分布。',requires:'data'},
 {phase:3,title:'执行数据分布与异常诊断',prompt:'显示三组改善量分布箱线图、原始点及缺失统计，并观察有序评分造成的并列值。',type:'action',action:'diagnostics',hint:'对有界、有序评分的变化量，关注大量并列秩、离群点及组间形状差异。',requires:'data'},
 {phase:3,title:'定义全局检验的原假设',prompt:'三组Kruskal–Wallis检验的标准原假设是什么？',type:'choice',options:[option('same','三组改善量来自相同的总体分布'),option('mean','三组样本均值一定完全相同'),option('causal','三种治疗一定具有相同的因果效应')],correct:'same',hint:'Kruskal–Wallis通常检验分布相同；只有在分布形状等条件适宜时，才可解释为位置差异。',requires:'data'},
 {phase:3,title:'选择全局组间检验',prompt:'比较三个独立研究组的有序评分改善量，优先选择哪个秩检验？',type:'choice',options:[option('kw','Kruskal–Wallis H 检验'),option('friedman','Friedman配对区组检验'),option('sign','单样本符号检验')],correct:'kw',hint:'三组独立样本可考虑Kruskal–Wallis。重复测量则属于不同的研究问题。',requires:'data'},
 {phase:4,title:'计算全局检验统计量与P值',prompt:'调用真实统计函数，根据当前模拟数据运行Kruskal–Wallis（含并列秩校正）。',type:'action',action:'global',hint:'当前使用χ²近似；样本过小或并列值严重时应考虑精确或置换方法。',requires:'data'},
 {phase:4,title:'解释全局检验结果',prompt:'依据右侧刚计算的P值，在α=0.05下作出正确统计结论。',type:'choice',options:[option('reject','拒绝“总体分布完全相同”的原假设'),option('retain','证据不足，不能拒绝总体分布相同的原假设'),option('proved','P值证明哪种疗法一定更好')],correct:'dynamic',hint:'P值衡量零假设下当前或更极端结果的概率，不是零假设成立的概率。',requires:'global'},
 {phase:4,title:'制定事后两两比较方案',prompt:'如果探索三对干预方案差异，如何控制多重检验的家庭错误率？',type:'choice',options:[option('holm','三次Mann–Whitney检验，并采用Holm校正'),option('raw','只挑最小的P值报告，不做校正'),option('repeat','不断重复抽样直到显著')],correct:'holm',hint:'整体检验结果不能自动告诉你哪两组不同；预先说明探索性比较及多重检验控制。',requires:'global'},
 {phase:4,title:'运行两两比较与多重校正',prompt:'实际计算三对Mann–Whitney U统计量、双侧近似P值和Holm校正结果。',type:'action',action:'pairwise',hint:'Mann–Whitney并非一般意义下“中位数差”的同义词，也会受分布形状差异影响。',requires:'global'},
 {phase:4,title:'选择同一受试者前后比较方法',prompt:'单独看混合干预组的基线与4周配对观测，应考虑哪种检验？',type:'choice',options:[option('wilcoxon','Wilcoxon符号秩检验，并核查差值分布对称性'),option('mw','把同一人前后记录当作独立组做Mann–Whitney'),option('kw','把每人两个时间点当成两个独立组做Kruskal–Wallis')],correct:'wilcoxon',hint:'Wilcoxon符号秩利用成对差值，其位置推断通常要求差值对称。也可用符号检验稳健性复核。',requires:'global'},
 {phase:4,title:'运行配对检验与秩相关探索',prompt:'计算混合干预组的配对Wilcoxon和符号检验，并探索依从性与改善量的Spearman关联。',type:'action',action:'paired',hint:'依从性与改善量相关不代表依从性因果导致改善；这属于观察性关联。',requires:'global'},
 {phase:4,title:'完成敏感性分析与实验报告',prompt:'将完整病例结果与“失访者不改善”的压力情景比较，计算Bootstrap区间，并生成可导出的实验报告。',type:'action',action:'report',hint:'“失访者不改善”只是一种情景敏感性分析，不是合理且通用的缺失值插补；报告中应明确方法和局限。',requires:'global'}
];
const phaseNames={1:'模块一｜研究方案设计',2:'模块二｜数据生成机制',3:'模块三｜质量控制与方法选择',4:'模块四｜统计推断与研究决策'};
const defaultState=()=>({current:0,code:'EXP-'+String(Math.floor(Math.random()*900000+100000)),cfg:{allocation:'block',n:30,effect:'low',noise:'skew',dropout:'mar',dropoutRate:.15,seed:2026},grades:{},history:[],data:[],analysis:null,visibleChart:false,flags:{global:false,pairwise:false,paired:false,report:false},start:new Date().toISOString()});
let state=(()=>{try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&saved.cfg&&saved.grades)return{...defaultState(),...saved};}catch(e){}return defaultState();})();
let busy=false;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){console.warn('Local storage unavailable:',e.message);}}
function done(i){return Boolean(state.grades[i]?.completed);}
function doneCount(){return steps.filter((s,i)=>done(i)).length;}
function points(){return steps.reduce((s,_,i)=>s+(state.grades[i]?.score||0),0);}
function isEligible(i){if(!steps[i].requires)return true;return steps[i].requires==='global'?state.flags.global:Boolean(state.data?.length);}
function boxDesc(){let c=state.cfg;const alloc={block:'区组平衡随机',simple:'完全随机',severity:'按病情排序（有偏）'};return `设计：${alloc[c.allocation]}；计划每组 ${c.n} 人；真实效应 ${({zero:'无',low:'小',medium:'中等'})[c.effect]}；误差 ${({normal:'对称',skew:'偏态',heavy:'重尾'})[c.noise]}；失访 ${c.dropout.toUpperCase()}（基础率 ${(c.dropoutRate*100).toFixed(0)}%）；种子 ${c.seed}`;}
function currentStep(){return steps[state.current];}
function showAlert(t){$('coachAnswer').textContent=t;}
function renderNav(){const nav=$('stepNav');nav.replaceChildren();steps.forEach((s,i)=>{let b=document.createElement('button');b.type='button';b.className='step-item '+(i===state.current?'active':done(i)?'done':'');let d=document.createElement('div');d.textContent=s.title;b.innerHTML=`<span class="step-num">${done(i)?'✓':i+1}</span>`;b.appendChild(d);b.title=s.title;b.addEventListener('click',()=>go(i));nav.appendChild(b);});$('doneCount').textContent=doneCount()+'/25';$('progressFill').style.width=(doneCount()*4)+'%';}
function selectHTML(s,stored){return '<div class="options">'+s.options.map(o=>`<label class="option"><input type="radio" name="choice" value="${escapeHtml(o.value)}" ${stored===o.value?'checked':''}><span>${escapeHtml(o.label)}</span></label>`).join('')+'</div>';}
function taskSupplement(i){if(i===12&&state.data.length){return '<div class="note"><b>当前分组摘要</b>'+summaryHTML()+'</div>';}
 if(i===15&&state.data.length){return '<div class="note">提示：右侧绘制的箱线图是基于真实模拟值计算，不能使用默认的正态性结论替代判断。</div>';}
 if(i===18&&state.flags.global){return `<div class="result-cards"><div><b>${state.analysis.kw.H.toFixed(3)}</b><span>Kruskal–Wallis H</span></div><div><b>${pvalue(state.analysis.kw.p)}</b><span>双侧P值（χ²近似）</span></div><div><b>${state.analysis.kw.N}</b><span>完整病例数</span></div></div>`;}
 if(i===19&&state.flags.global){return `<div class="note">本次数据计算得到 P = <b>${pvalue(state.analysis.kw.p)}</b>，显著性水平 α = 0.05。请选择规范的表述，不要将“不拒绝”说成“证明三组相同”。</div>`;}
 if(i===21&&state.flags.pairwise)return '<div class="note">'+pairHTML()+'</div>';
 if(i===23&&state.flags.paired)return '<div class="note">'+pairResultHTML()+'</div>';
 if(i===24&&state.flags.report)return '<div class="note"><b>敏感性结果及报告已生成。</b><p>可在右侧导出报告和原始实验记录。报告基于模拟数据，不能用于临床判断。</p></div>';
 return '';
}
function renderTask(){let step=currentStep(),index=state.current,grade=state.grades[index];$('phaseLabel').textContent=phaseNames[step.phase];$('stepTitle').textContent=`第${index+1}步 · ${step.title}`;$('stepDesc').textContent='本步满分4分。完成必要选择或统计操作后，提交并查看反馈。';
 const area=$('taskArea');let html=`<div class="question">${escapeHtml(step.prompt)}</div>`;
 let old=grade?.answer;
 if(step.type==='choice'||step.type==='cfg')html+=selectHTML(step,old??(step.type==='cfg'?String(state.cfg[step.key]):''));
 else if(step.type==='dropout'){html+='<div class="fieldset"><label for="dType">失访机制</label><select id="dType" class="field"><option value="mcar">MCAR：完全随机</option><option value="mar">MAR：与已观察基线有关</option><option value="mnar">MNAR：依赖潜在未观察结局</option></select><label for="dRate">基础失访率</label><select id="dRate" class="field"><option value="0">0%</option><option value="0.15">15%</option><option value="0.35">35%</option></select></div>';}
 else if(step.type==='seed'){html+='<div class="fieldset"><label for="seedValue">随机种子（整数）</label><input id="seedValue" type="number" min="1" max="2147483647" step="1" class="field" value="'+escapeHtml(old??state.cfg.seed)+'"></div>';}
 else if(step.type==='action'){const actions={generate:'执行随机分配、随访和失访模拟',diagnostics:'运行分布诊断并显示箱线图',global:'计算Kruskal–Wallis H和P值',pairwise:'运行三对U检验并执行Holm校正',paired:'运行配对检验与Spearman置换分析',report:'执行敏感性分析并生成报告'};html+='<div class="note"><b>操作内容：</b>'+actions[step.action]+'。执行后更新数据和分析结果。</div>';}
 if(!isEligible(index))html+='<div class="alert" style="margin-top:13px">前置条件尚未满足：请先生成实验数据或完成全局检验。</div>';
 html+=taskSupplement(index);area.innerHTML=html;
 if(step.type==='dropout'){$('dType').value=old?.mechanism??state.cfg.dropout;$('dRate').value=String(old?.rate??state.cfg.dropoutRate);}
 $('feedback').classList.toggle('hidden',!grade);if(grade){$('feedback').classList.toggle('warn',grade.score<4);$('feedback').innerHTML=`<span class="tiny">已完成 · 本步得分 ${grade.score}/4 · 提交 ${grade.attempts} 次</span><p>${escapeHtml(grade.message)}</p>`;}
 $('prevBtn').disabled=index===0;$('nextBtn').disabled=index===steps.length-1;$('submitBtn').disabled=!isEligible(index)||busy;$('submitBtn').textContent=done(index)?'重新提交 / 更新本步':'提交本步操作';}
function go(index){if(index<0||index>=steps.length)return;state.current=index;persist();render();window.scrollTo({top:0,behavior:'smooth'});}
function invalidateFrom(i){for(let j=i;j<steps.length;j++)delete state.grades[j];state.data=[];state.analysis=null;state.visibleChart=false;state.flags={global:false,pairwise:false,paired:false,report:false};}
function chosen(){return document.querySelector('input[name="choice"]:checked')?.value??null;}
function submission(){const i=state.current,step=currentStep();if(!isEligible(i))return{error:'前置条件尚未满足。'};
 let answer=null,score=0,message='';
 if(step.type==='choice'||step.type==='cfg'){answer=chosen();if(answer==null)return{error:'请先选择一个方案，再提交。'};
  if(step.type==='cfg'){let next=step.key==='n'?Number(answer):answer;if(state.cfg[step.key]!==next)invalidateFrom(11);state.cfg[step.key]=next;score=4;message=step.hint+(step.key==='allocation'&&answer==='severity'?' 当前分组机制将产生设计偏差，请在基线检查中观察。':'');
   if(step.key==='allocation')score=answer==='block'?4:answer==='simple'?3:0;
  }else{let correct=step.correct==='dynamic'?state.analysis?.kw?.p<.05?'reject':'retain':step.correct;score=answer===correct?4:0;message=answer===correct?'判断与当前统计问题一致。'+step.hint:'此选择不恰当。'+step.hint;}
 }
 else if(step.type==='dropout'){let mechanism=$('dType').value,rate=Number($('dRate').value);answer={mechanism,rate};if(state.cfg.dropout!==mechanism||state.cfg.dropoutRate!==rate)invalidateFrom(11);state.cfg.dropout=mechanism;state.cfg.dropoutRate=rate;score=4;message='已更新失访数据生成机制与基础失访概率。'+step.hint;}
 else if(step.type==='seed'){answer=Number($('seedValue').value);if(!Number.isSafeInteger(answer)||answer<1||answer>2147483647)return{error:'请输入1到2147483647之间的正整数。'};if(state.cfg.seed!==answer)invalidateFrom(11);state.cfg.seed=answer;score=4;message='种子已登记，可在同样参数下复算。';}
 else if(step.type==='action'){
  answer=step.action;
  if(step.action==='generate'){state.data=S.simulate(state.cfg);state.analysis=null;state.visibleChart=false;state.flags={global:false,pairwise:false,paired:false,report:false};message=`已生成 ${state.data.length} 名模拟受试者，并模拟第4周失访。`}
  if(step.action==='diagnostics'){state.visibleChart=true;message='已完成组间分布和缺失诊断，并展示有序评分改善量的箱线图。'}
  if(step.action==='global'){state.analysis=S.analyze(state.data,state.cfg.seed);state.flags.global=true;message=`Kruskal–Wallis H=${state.analysis.kw.H.toFixed(3)}，P=${pvalue(state.analysis.kw.p)}；采用并列秩校正和χ²(2)近似。`}
  if(step.action==='pairwise'){state.flags.pairwise=true;message='已完成三次独立样本Mann–Whitney检验和Holm调整。'}
  if(step.action==='paired'){state.flags.paired=true;message='已运行配对Wilcoxon、符号检验和基于置换的Spearman相关分析。'}
  if(step.action==='report'){state.flags.report=true;message='已执行失访敏感性压力情景与Bootstrap探索性估计，并生成可导出的实验报告。'}
  score=4;
 }
 return{answer,score,message};
}
function submit(){if(busy)return;let i=state.current,r=submission();if(r.error){$('feedback').className='feedback warn';$('feedback').innerHTML='<p>'+escapeHtml(r.error)+'</p>';return;}
 const prev=state.grades[i];state.grades[i]={completed:true,score:r.score,answer:r.answer,message:r.message,attempts:(prev?.attempts||0)+1,at:new Date().toISOString()};state.history.push({step:i+1,title:steps[i].title,answer:r.answer,score:r.score,time:new Date().toISOString()});persist();render();}
function summaryHTML(){if(!state.data.length)return '';let a=S.summary(state.data);return '<table class="mini-table"><thead><tr><th>方案</th><th>人数</th><th>失访</th><th>基线均值</th><th>改善量中位数</th></tr></thead><tbody>'+a.map(x=>`<tr><td>${groups[x.group]}</td><td>${x.n}</td><td>${x.lost}</td><td>${x.baselineMean??'—'}</td><td>${x.median??'—'}</td></tr>`).join('')+'</tbody></table>';}
function pairHTML(){if(!state.analysis)return'';return '<table class="mini-table"><thead><tr><th>两两比较</th><th>U</th><th>原始P</th><th>Holm后P</th></tr></thead><tbody>'+state.analysis.pairwise.map(x=>`<tr><td>${groups[x.a]} vs ${groups[x.b]}</td><td>${x.U??'—'}</td><td>${pvalue(x.p)}</td><td>${pvalue(x.pHolm)}</td></tr>`).join('')+'</tbody></table><div class="small">Mann–Whitney双侧正态近似，含并列秩方差及连续性校正；属于探索性分析。</div>';}
function pairResultHTML(){let a=state.analysis;if(!a)return '';return `<div><b>混合干预组配对比较：</b>Wilcoxon W=${a.paired?.W??'—'}，P=${pvalue(a.paired?.p)}；符号检验P=${pvalue(a.sign?.p)}。</div><div><b>依从性×改善量：</b>Spearman ρ=${a.spearman?.rho?.toFixed(3)??'—'}，置换P=${pvalue(a.spearman?.p)}（${a.spearman?.B??'—'}次）。</div>`;}
function plotSVG(){if(!state.visibleChart||!state.data.length)return'';let arr=[0,1,2].map(g=>state.data.filter(x=>x.group===g&&x.delta!==null).map(x=>x.delta));let vals=arr.flat();if(!vals.length)return'';let min=Math.min(-1,Math.floor(Math.min(...vals))-1),max=Math.max(4,Math.ceil(Math.max(...vals))+1);const x0=67,x1=655,yt=27,yb=280,yy=v=>yb-(v-min)/(max-min)*(yb-yt),xx=g=>170+g*178;let svg=['<svg class="plot" viewBox="0 0 690 333" role="img" aria-label="三组模拟疼痛改善量的箱线图及观测点">'];for(let j=min;j<=max;j++){let y=yy(j);svg.push(`<line x1="55" x2="649" y1="${y}" y2="${y}" stroke="#e4edf7"/><text x="43" y="${y+4}" text-anchor="end" font-size="12" fill="#6d85a3">${j}</text>`);}svg.push(`<text x="15" y="153" transform="rotate(-90 15 153)" font-size="13" text-anchor="middle" fill="#587898">疼痛改善量（基线-4周）</text>`);
 arr.forEach((v,g)=>{if(!v.length)return;let q1=S.quantile(v,.25),md=S.median(v),q3=S.quantile(v,.75),low=Math.min(...v),high=Math.max(...v),x=xx(g),fill=['#2e75c7','#168f8b','#d68b3f'][g];svg.push(`<line x1="${x}" x2="${x}" y1="${yy(low)}" y2="${yy(high)}" stroke="${fill}" stroke-width="2"/><line x1="${x-19}" x2="${x+19}" y1="${yy(low)}" y2="${yy(low)}" stroke="${fill}" stroke-width="2"/><line x1="${x-19}" x2="${x+19}" y1="${yy(high)}" y2="${yy(high)}" stroke="${fill}" stroke-width="2"/><rect x="${x-38}" y="${yy(q3)}" width="76" height="${Math.max(1,yy(q1)-yy(q3))}" fill="${fill}" fill-opacity=".23" stroke="${fill}" stroke-width="2" rx="2"/><line x1="${x-38}" x2="${x+38}" y1="${yy(md)}" y2="${yy(md)}" stroke="${fill}" stroke-width="3"/>`);v.forEach((pt,i)=>{let jitter=((i*37+g*13)%39)-19;svg.push(`<circle cx="${x+jitter}" cy="${yy(pt)}" r="3.0" fill="${fill}" fill-opacity=".48"/>`);});svg.push(`<text x="${x}" y="314" text-anchor="middle" font-size="13" fill="#506d90">${groups[g]}</text>`);});svg.push('</svg>');return svg.join('');}
function renderSide(){let d=state.data,a=state.analysis,ss=d.length?S.summary(d):[];$('totalN').textContent=d.length||'—';$('lostN').textContent=d.length?d.filter(x=>x.dropout).length:'—';$('scoreNow').textContent=`${points()} / 100`;$('snapshot').textContent=boxDesc();$('summaryMini').classList.toggle('hidden',!d.length);$('summaryMini').innerHTML=d.length?'<h3 style="margin-top:15px">已生成队列</h3>'+summaryHTML():'';
 $('resultMini').classList.toggle('hidden',!state.flags.global);let s='';if(a&&state.flags.global)s+=`<h3 style="margin-top:16px">全局检验</h3><div class="statline"><span>Kruskal–Wallis H</span><strong>${a.kw.H.toFixed(3)}</strong></div><div class="statline"><span>P值（近似）</span><strong>${pvalue(a.kw.p)}</strong></div><div class="small">样本数 ${a.kw.N}，并列秩校正系数 ${a.kw.correction}</div>`;
 if(a&&state.flags.pairwise)s+='<h3 style="margin-top:15px">两两比较</h3>'+pairHTML();if(a&&state.flags.paired)s+='<h3 style="margin-top:15px">配对与关联</h3>'+pairResultHTML();if(a&&state.flags.report){s+=`<h3 style="margin-top:15px">稳健性探索</h3><div class="small">完整病例KW P=${pvalue(a.kw.p)}；失访者假设“不改善”时KW P=${pvalue(a.sensitivity?.p)}</div><div class="small">混合干预−常规组中位数差 ${a.bootstrap?.estimate??'—'}，95%百分位Bootstrap区间 [${a.bootstrap?.lower??'—'}, ${a.bootstrap?.upper??'—'}]</div>`;}$('resultMini').innerHTML=s;
 $('plotContainer').innerHTML=state.visibleChart&&d.length?plotSVG()+'<div class="small">箱线图用于描述分布；点表示观察到的个体变化值。丢失的随访值不画入。</div>':'<div class="note">第16步完成后，将显示真实生成的三组改善量箱线图及观测点。</div>';
 $('downloadGroup').classList.toggle('hidden',!state.flags.report);
}
function render(){renderNav();renderTask();renderSide();$('studentCode').value=state.code;}
function download(filename,content,mime){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type:mime||'text/plain;charset=utf-8'}));a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function reportText(){const a=state.analysis,sm=a?.summary||[];let txt=`非参数统计虚拟仿真实验报告（教学模拟）\n实验编号：${state.code}\n导出时间：${new Date().toLocaleString('zh-CN')}\n项目：数字康复疗效评价与非参数统计决策\n完成步骤：${doneCount()}/25；过程评分：${points()}/100\n\n一、研究设计\n${boxDesc()}\n干预分组：常规管理、App指导、混合干预；结局：基线−第4周疼痛评分。\n本实验使用模拟数据，不能推断真实临床效果。\n\n二、样本与缺失概况\n`;
 txt+=sm.map(x=>`${groups[x.group]}：纳入${x.n}，有第4周结局${x.observed}，失访${x.lost}，基线均值${x.baselineMean}，改善量中位数${x.median} [Q1=${x.q1}, Q3=${x.q3}]`).join('\n');
 if(a){txt+=`\n\n三、统计推断\nKruskal–Wallis H=${a.kw.H}，df=2，P=${pvalue(a.kw.p)}（χ²近似、并列秩校正）。\n`;
 txt+=a.pairwise.map(x=>`${groups[x.a]} vs ${groups[x.b]}：U=${x.U}，未调整P=${pvalue(x.p)}，Holm调整P=${pvalue(x.pHolm)}`).join('\n');
 txt+=`\n混合干预组Wilcoxon配对P=${pvalue(a.paired?.p)}，符号检验P=${pvalue(a.sign?.p)}。\n依从性与改善量：Spearman ρ=${a.spearman?.rho.toFixed(3)}，置换P=${pvalue(a.spearman?.p)}（${a.spearman?.B}次）。\n\n四、敏感性分析\n完整病例KW P=${pvalue(a.kw.p)}；将失访者设为“不改善”的压力情景KW P=${pvalue(a.sensitivity?.p)}。该情景不是正式缺失插补。\n混合干预对比常规管理的中位数差=${a.bootstrap?.estimate}，Bootstrap 95%区间=[${a.bootstrap?.lower}, ${a.bootstrap?.upper}]（${a.bootstrap?.B}次）。\n`;
 }
 txt+='\n五、教学局限\nKruskal–Wallis与Mann–Whitney采用大样本近似。Wilcoxon符号秩的标准位置解释需考虑对称性，相关不意味着因果，缺失机制可能造成选择偏差，Bootstrap区间属于探索性演示。\n\n六、操作记录\n';
 txt+=steps.map((s,i)=>{let g=state.grades[i];return `${i+1}. ${s.title} | ${g?'已完成 '+g.score+'/4分；选择='+JSON.stringify(g.answer):'未完成'}`;}).join('\n');
 return txt+'\n';}
function askCoach(query){const q=query.trim().toLowerCase(),step=currentStep();if(!q)return step.hint;
 if(/p值|p-value|显著/.test(q))return 'P值是在零假设与检验前提成立时，得到当前或更极端统计量的概率；不能解释为零假设为真的概率。非显著不等于证明无差异。';
 if(/kruskal|kw|多组|三组/.test(q))return 'Kruskal–Wallis适用于独立样本的分布比较。其原假设是多个总体分布相同。组间分布形状接近时可偏向位置解释；并列秩需校正。';
 if(/wilcoxon|配对|符号/.test(q))return '同一个人的前后变化是配对数据。Wilcoxon符号秩检验适合分析配对差值，位置解释要关注差值分布对称；符号检验可作为较弱假设的补充。';
 if(/失访|缺失|mcar|mar|mnar/.test(q))return 'MCAR表示缺失与数据无关；MAR表示缺失依赖已观察变量；MNAR表示缺失仍依赖未观察结局。完整病例分析在不同机制下可能偏倚；“失访者不改善”仅是情景敏感性分析。';
 if(/spearman|相关|秩/.test(q))return 'Spearman相关衡量变量的单调关联，计算时可对两列分别赋平均秩，再求Pearson相关。相关可能受到组别、共同原因和测量误差影响，不能证明因果。';
 if(/区组|随机化|分组/.test(q))return '随机分组有助于使组别不依赖基线因素，但小样本仍可能失衡；按基线严重程度直接分组会让干预与基线差异混在一起。';
 if(/bootstrap|置信区间|置换/.test(q))return '置换检验通过零假设下交换标签或秩次产生参考分布，前提是交换性；Bootstrap通过有放回重抽样估计统计量的抽样不确定性。两者回答的问题不同。';
 return `你当前位于“${step.title}”。${step.hint} 建议先明确研究问题、观测单位、独立性和原假设，再决定统计检验。`;
}
$('prevBtn').addEventListener('click',()=>go(state.current-1));$('nextBtn').addEventListener('click',()=>go(state.current+1));$('submitBtn').addEventListener('click',submit);
$('hintBtn').addEventListener('click',()=>showAlert(currentStep().hint));$('askBtn').addEventListener('click',()=>showAlert(askCoach($('coachQuestion').value)));$('coachQuestion').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();showAlert(askCoach($('coachQuestion').value));}});
$('studentCode').addEventListener('change',e=>{let code=e.target.value.trim();state.code=(code||state.code).slice(0,28);persist();render();});
$('exportReport').addEventListener('click',()=>download('非参数统计实验报告_'+state.code+'.txt',reportText()));
$('exportJSON').addEventListener('click',()=>download('非参数统计实验记录_'+state.code+'.json',JSON.stringify({schema:'NPL-prototype-1',exported:new Date().toISOString(),state},null,2),'application/json;charset=utf-8'));
render();
})();
