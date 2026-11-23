(() => {
  'use strict';
  const key = 'npl-clinical-prototype-v1';
  let state = null;
  try { state = JSON.parse(localStorage.getItem(key)); } catch (_) {}
  const done = state?.grades ? Object.values(state.grades).filter(v => v && v.completed).length : 0;
  const score = state?.grades ? Object.values(state.grades).reduce((a,v) => a + (Number(v?.score)||0),0):0;
  const progress = document.getElementById('homeProgressText');
  const scoreEl = document.getElementById('homeScore');
  if(progress) progress.textContent = done ? `已完成 ${done} / 25 步 · 可继续上次实验` : '查看本设备的实验进度与成绩。';
  if(scoreEl) scoreEl.textContent = `${score} / 100`;
})();
