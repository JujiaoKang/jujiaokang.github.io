(()=>{'use strict';
 const path=location.pathname.toLowerCase();
 const inLabs=/\/labs\//.test(path);
 const root=inLabs?'../':'./';
 const file=path.split('/').pop()||'index.html';
 const active=file==='clinical-lab.html'?'clinical':file==='advanced-lab.html'?'advanced':file==='teacher.html'||file==='evaluation.html'?'teacher':file==='kendall-tau-lab.html'?'kendall':file==='theil-sen-lab.html'?'theil':file==='spearman-rank-lab.html'||file==='spearman-null-lab.html'?'spearman':'home';
 const oldHeader=document.querySelector('body > header')||document.querySelector('header');
 let fullscreen=null;
 if(oldHeader){fullscreen=oldHeader.querySelector('#fullscreen, #fullScreen, #full');oldHeader.remove();}
 const items=[
  ['home','首页','index.html'],
  ['clinical','综合实验','clinical-lab.html'],
  ['spearman','Spearman','labs/spearman-rank-lab.html'],
  ['kendall','Kendall τ','labs/kendall-tau-lab.html'],
  ['theil','Theil–Sen','labs/theil-sen-lab.html'],
  ['advanced','进阶工作台','advanced-lab.html'],
  ['teacher','教师中心','teacher.html']
 ];
 const header=document.createElement('header');header.className='nplab-header';
 const inner=document.createElement('div');inner.className='nplab-header-inner';
 const brand=document.createElement('a');brand.className='nplab-brand';brand.href=root+'index.html';brand.innerHTML='<span class="nplab-mark">N<span>·</span>P</span><span class="nplab-brand-copy">非参数统计实验室<small>NONPARAMETRIC STATISTICS LAB</small></span>';
 const nav=document.createElement('nav');nav.className='nplab-nav';nav.setAttribute('aria-label','实验室主导航');
 for(const [key,label,url] of items){const a=document.createElement('a');a.href=root+url;a.textContent=label;if(key===active){a.classList.add('active');a.setAttribute('aria-current','page');}nav.append(a);}
 const actions=document.createElement('div');actions.className='nplab-actions';
 if(fullscreen){fullscreen.className='nplab-fullscreen';actions.append(fullscreen);}
 inner.append(brand,nav,actions);header.append(inner);document.body.insertBefore(header,document.body.firstChild);
 if(!document.querySelector('body > footer')){const foot=document.createElement('footer');foot.className='nplab-page-footer';
  foot.innerHTML='<span>NP·LAB / 非参数统计数字实验室</span><span>统计结果用于教学演示；实际研究须结合设计、假设与数据质量解释。</span>';
  document.body.append(foot);}
})();
