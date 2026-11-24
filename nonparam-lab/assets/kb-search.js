/* Deterministic offline search. Same function is exercised by evaluation.html and Node regression tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.NPLKBSearch=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
function normalize(x){return String(x??'').toLowerCase().normalize('NFKC').replace(/[\s\u3000\-–—·.,，。:：;；!！?？()（）\[\]「」『』]/g,'');}
function unique(a){return [...new Set(a)];}
function retrieve(question,knowledge,limit=4){const q=normalize(question);if(!q||q.length<2)return [];
 const scored=(knowledge||[]).map(entry=>{
  const title=normalize(entry.title),words=unique((entry.terms||[]).map(normalize).filter(x=>x.length>=2));
  let score=0,matched=[];
  if(title&&q.includes(title)){score+=14;matched.push(entry.title);}
  for(const term of words){if(q.includes(term)){score+=3+Math.min(6,term.length)*1.5;matched.push(term);}}
  // ID matches are accepted only for meaningful acronyms, not plain one-letter terms.
  const id=normalize(entry.id);if(id.length>=3&&q.includes(id)){score+=4;matched.push(entry.id);}
  // Slightly prefer specific matches over broad ones; long-term relevance matters more than chapter order.
  score+=Math.min(4,Math.max(0,unique(matched).length-1)*.7);
  return {entry,score,matched:unique(matched)};
 }).filter(x=>x.score>=5).sort((a,b)=>b.score-a.score||a.entry.title.localeCompare(b.entry.title,'zh-CN'));
 return scored.slice(0,Math.max(1,Math.min(10,limit)));
}
return {normalize,retrieve};
});
