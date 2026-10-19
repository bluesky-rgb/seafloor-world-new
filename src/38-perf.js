/* =========================================================
   Performance mode switch (state PERF is set up in 02-renderer). The light mode lowers the pixel ratio to 1,
   turns bloom off and plants/places about 45 % of the densest instanced life (seagrass, barnacles, mussels,
   octopuses, Melosira). Unless the visitor has chosen, the first seconds are timed and a slow device is switched.
   ========================================================= */
function applyPerf(low,save,init){
  PERF.low=low;PERF.k=low?0.45:1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,low?1:1.75));
  if(bloom)bloom.enabled=!low;if(!init)resize();
  [...$('perfSeg').children].forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.p==='low')===low)));
  if(save){PERF.user=low?'low':'high';try{localStorage.setItem('seafloor-perf',PERF.user);}catch(e){}}
  if(PERF.ready)rebuild();
}
$('perfSeg').addEventListener('click',e=>{const p=e.target.dataset.p;if(!p)return;applyPerf(p==='low',true);});
function stepPerf(rdt){
  if(PERF.done||PERF.user||document.hidden)return;
  PERF.t0+=rdt;if(PERF.t0<3)return;PERF.samp.push(rdt);
  if(PERF.t0>10){PERF.done=true;const s=PERF.samp.sort((a,b)=>a-b),med=s[s.length>>1];
    if(med>0.045&&!PERF.low){applyPerf(true,false);showCaption('已切换到流畅模式','画面较卡，已自动降低分辨率和重复生物的数量。可以在控制台“时间与照明”下面改回高画质。',8);}}
}
applyPerf(PERF.low,false,true);PERF.ready=true;   /* resize() runs later in the main loop setup */
