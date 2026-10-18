/* =========================================================
   14zb. Exhibition mode: an automatic guided tour of the whole ocean
   ========================================================= */
const TOUR_STOPS=[
  {l:'xisha',n:'s01_xisha',d:20,t:'海洋覆盖地球 71% 的表面',s:'导览从南海西沙 10 m 深的珊瑚礁出发。珊瑚礁只占海底面积不到 1%，却养活了约四分之一的海洋物种。'},
  {l:'monterey',n:'s02_monterey',d:18,t:'巨藻林：海底的森林',s:'加州蒙特雷湾的冷水上升流带来养分，巨藻长成十几米高的森林，随涌浪整片摆动。'},
  {l:'truk',n:'s03_truk',d:20,t:'沉船变成的鱼礁',s:'富士川丸 1944 年沉没，八十年后船身已被软珊瑚和鱼群占据。十几米深处，红光已被海水吸收，一切都偏蓝绿。'},
  {l:'ice',n:'s04_ice',d:20,t:'南极海冰之下',s:'水温 −1.9 °C，海水因为含盐而不结冰。头顶两米厚的海冰只透下百分之几的阳光，冰底的冰藻是南大洋食物链的起点。'},
  {l:'spawn',n:'s05_spawn',d:24,t:'珊瑚产卵之夜',s:'一年中只有满月前后的几个夜里，珊瑚同时释放红色的卵精束，缓缓上浮，像一场倒着下的雪。'},
  {l:'rost',n:'s06_rost',d:20,t:'320 m：没有阳光的珊瑚礁',s:'挪威外海的冷水珊瑚不靠阳光，靠捕食海流带来的浮游生物。勒斯特礁全长三四十公里，是已知最大的冷水珊瑚礁。'},
  {l:'deep',n:'s07_deep',d:18,t:'1,390 m：靠甲烷生活',s:'南海海马冷泉从海底渗出甲烷，细菌把它变成养分，养活了贻贝床、管栖蠕虫和白色的细菌席。'},
  {l:'brine',n:'s08_brine',d:18,t:'650 m：海底的湖',s:'比海水重得多的卤水在海底积成湖，有湖面也有湖岸。湖里没有氧气，岸边却挤满了靠甲烷生活的贻贝。'},
  {l:'whalefall',n:'s09_whalefall',d:18,t:'1,800 m：鲸落',s:'一头鲸沉到深海，能养活一个群落几十年。科学家已在鲸落上记录到 400 多种生物。'},
  {l:'vent',n:'s10_vent',d:20,t:'2,800 m：热液喷口',s:'300 多摄氏度的热液从黑烟囱喷出。周围的盲虾和雪人蟹完全不靠阳光，靠细菌把化学能变成养分。'},
  {l:'abyss',n:'s10b_abyss',d:20,t:'4,100 m：深海平原',s:'海底铺满土豆大小的锰结核，一百万年只长 1–10 cm。这片海区已记录到五千多种动物，约九成从未被科学描述；那条没有结核的宽带，是 1979 年采矿试验留下的车辙。'},
  {l:'dive',n:'s11_dive',d:112,dive:true,t:'最后一站：马里亚纳海沟',s:'从关岛礁壁出发，一路下潜到地球海洋最深处。光、水温和生物会随深度一层层改变；左侧剖面显示你的位置。'}
];
const TOUR={on:false,i:0,t:0,paused:false,prevSpeed:0.35,pend:null,prevZ:0};
/* ---- voice-over: MiniMax clips from audio/tour/ (made by tools/gen_tts.py) ----
   Played through Web Audio: the AudioContext is unlocked by the click that starts the tour,
   after which later clips can start from the timer without another tap (mobile autoplay rules).
   No robotic browser-speech fallback: if the clips are unavailable the tour simply runs with captions. */
const NARR_INLINE=null; /* tools/build_single.py inlines narration/tour.json here */
const NARR={on:true,clips:null,lines:null,ctx:null,buf:{},src:null,playing:false,tok:0,state:'loading'};
NARR.ready=(async()=>{
  const get=u=>fetch(u,{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null);
  const [m,l]=await Promise.all([get('audio/tour/manifest.json'),NARR_INLINE||get('narration/tour.json')]);
  NARR.clips=m&&Object.keys(m).length?m:null;NARR.lines=l&&l.lines?l.lines:null;
  NARR.state=NARR.clips&&(window.AudioContext||window.webkitAudioContext)?'ok':'none';tourShow();
})();
function narrUnlock(){
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  if(!NARR.ctx){try{NARR.ctx=new C();}catch(e){return;}}
  if(NARR.ctx.state==='suspended'&&!TOUR.paused)NARR.ctx.resume().catch(()=>{});
  /* a silent one-sample buffer started inside the gesture fully unlocks iOS Safari */
  try{const b=NARR.ctx.createBuffer(1,1,22050),s=NARR.ctx.createBufferSource();s.buffer=b;s.connect(NARR.ctx.destination);s.start(0);}catch(e){}
}
function narrLoad(id){
  if(NARR.buf[id])return NARR.buf[id];
  NARR.buf[id]=fetch('audio/tour/'+id+'.mp3').then(r=>{if(!r.ok)throw new Error(r.status);return r.arrayBuffer();})
    .then(ab=>new Promise((res,rej)=>NARR.ctx.decodeAudioData(ab,res,rej)))
    .catch(e=>{NARR.buf[id]=null;throw e;});
  return NARR.buf[id];
}
const narrLine=id=>NARR.lines&&NARR.lines.find(x=>x.id===id);
function narrLen(id){return NARR.on&&NARR.state==='ok'&&NARR.clips[id]&&NARR.clips[id].ms?NARR.clips[id].ms/1000:0;}
function narrStop(){NARR.tok++;NARR.playing=false;if(NARR.src){try{NARR.src.onended=null;NARR.src.stop();}catch(e){}NARR.src=null;}}
async function narrPlay(id){
  if(!NARR.on||!id)return;narrStop();TOUR.pend=null;const tok=NARR.tok;
  if(NARR.state==='loading'){NARR.playing=true;await NARR.ready;if(tok!==NARR.tok)return;NARR.playing=false;}
  if(NARR.state!=='ok'||!NARR.clips[id]||!NARR.ctx)return;
  NARR.playing=true;
  let buf;try{buf=await narrLoad(id);}catch(e){NARR.playing=false;NARR.state='fail';tourShow();return;}
  if(tok!==NARR.tok)return;
  const s=NARR.ctx.createBufferSource();s.buffer=buf;s.connect(NARR.ctx.destination);
  s.onended=()=>{if(NARR.src===s){NARR.src=null;NARR.playing=false;}};
  NARR.src=s;s.start(0);
  /* fetch what comes next so it starts without a gap */
  const nx=TOUR_STOPS[TOUR.i+1];if(nx)narrLoad(nx.n).catch(()=>{});
  if(TOUR_STOPS[TOUR.i].dive&&NARR.lines)NARR.lines.forEach(l=>{if(l.depth||l.id==='bottom'||l.id==='end')narrLoad(l.id).catch(()=>{});});
}
function narrBusy(){return NARR.playing;}
function narrPause(p){if(!NARR.ctx)return;(p?NARR.ctx.suspend():NARR.ctx.resume()).catch(()=>{});}
const stopDur=st=>Math.max(st.d,st.dive?0:narrLen(st.n)+4);
const tourTotal=()=>TOUR_STOPS.reduce((a,b)=>a+stopDur(b),0);
function tourShow(){
  const st=TOUR_STOPS[TOUR.i];
  $('tourI').textContent=(TOUR.i+1)+' / '+TOUR_STOPS.length;$('tourN').textContent=LOC[st.l].name;
  $('tourPause').textContent=TOUR.paused?'继续':'暂停';$('tourPrev').disabled=TOUR.i===0;
  $('tourNext').textContent=TOUR.i===TOUR_STOPS.length-1?'结束':'下一站';
  $('tourVoice').hidden=NARR.state==='none';
  $('tourVoice').textContent=NARR.state==='fail'?'语音讲解：加载失败':'语音讲解：'+(NARR.on?'开':'关');
  $('tourVoice').setAttribute('aria-pressed',String(NARR.on));$('tourVoice').title='MiniMax 语音合成的讲解配音';
}
function goStop(i){
  TOUR.i=Math.max(0,Math.min(TOUR_STOPS.length-1,i));TOUR.t=0;
  const st=TOUR_STOPS[TOUR.i];
  if(st.l!=='spawn'&&S.night&&!SPN.on){S.night=false;}
  applyLocation(st.l);
  if(st.dive){DIVE.play=false;updDiveUI();$('diveBar').hidden=true;}
  showCaption(st.t,st.s,st.dive?9:Math.min(stopDur(st)-2,14));
  TOUR.prevZ=0;narrPlay(st.n);
  tourShow();updSite();
}
function startTour(){
  if(VR.on)exitVR();if(PILOT.on)exitPilot();
  for(const id of['help','sofar','welcome','press','mapOv','card'])$(id).hidden=true;
  narrUnlock();
  TOUR.on=true;TOUR.paused=false;TOUR.prevSpeed=controls.autoRotateSpeed;controls.autoRotateSpeed=0.9;lastTouch=-1e9;
  document.body.classList.add('tour');$('tourBar').hidden=false;
  if(S.night&&!SPN.on){S.night=false;}
  goStop(0);
}
function exitTour(msg){
  if(!TOUR.on)return;TOUR.on=false;narrStop();TOUR.pend=null;if(msg)narrPlay('end');
  controls.autoRotateSpeed=TOUR.prevSpeed;document.body.classList.remove('tour');$('tourBar').hidden=true;
  updDiveUI();
  showCaption(msg?'导览结束':'已退出展览模式',msg||'现在可以自由探索：拖动画面看四周，点击生物看它是谁，控制台里还有蓝洞、昼夜迁移等场景。',8);
}
function stepTour(rdt){
  if(TOUR.paused)return;
  const st=TOUR_STOPS[TOUR.i];TOUR.t+=rdt;
  if(st.dive&&DIVE.on){
    /* descent keyframes (time s, depth m), interpolated in log-depth; spaced so each spoken milestone finishes before the next */
    const KF=[[0,5],[18,30],[30,200],[42,1000],[54,4000],[64,6000],[76,8849],[90,S.D-2.2]];
    let k=1;while(k<KF.length-1&&TOUR.t>KF[k][0])k++;
    const a=KF[k-1],b=KF[k],f=Math.max(0,Math.min(1,(TOUR.t-a[0])/(b[0]-a[0])));
    setDiveZ(Math.exp(Math.log(a[1])+(Math.log(b[1])-Math.log(a[1]))*f));const u=TOUR.t>=90?1:0;
    if(NARR.lines)for(const l of NARR.lines)if(l.depth&&TOUR.prevZ<l.depth&&DIVE.z>=l.depth)TOUR.pend=l.id;
    TOUR.prevZ=DIVE.z;
    if(TOUR.pend&&!narrBusy())narrPlay(TOUR.pend);
    if(u>=1&&!TOUR.bottom){TOUR.bottom=true;if(narrBusy())TOUR.pend='bottom';else narrPlay('bottom');showCaption('10,935 m：地球海洋最深处','这里的压力超过 1,000 个大气压，水温只有 2 °C 多。即使到了今天，人类对深海的了解仍然非常有限。',14);}
  }else{TOUR.bottom=false;
    /* a gentle push-in toward the subject while the camera circles */
    const off=_vv.copy(camera.position).sub(controls.target),len=off.length();
    if(len>controls.minDistance+1)camera.position.copy(controls.target).addScaledVector(off,1-0.012*Math.min(rdt,0.1));
  }
  const before=TOUR_STOPS.slice(0,TOUR.i).reduce((a,b)=>a+stopDur(b),0);
  $('tourP').style.width=Math.min(100,(before+TOUR.t)/tourTotal()*100)+'%';
  if(TOUR.t>=stopDur(st)){if(TOUR.i<TOUR_STOPS.length-1)goStop(TOUR.i+1);else exitTour('你从 10 m 的珊瑚礁一路走到了 10,935 m 的海沟底。现在可以自由探索：控制台里还有蓝洞、昼夜垂直迁移等场景，也可以开着水下机器人四处看看。');}
}
$('tourBtn').addEventListener('click',startTour);
$('welTour').addEventListener('click',startTour);
$('tourX').addEventListener('click',()=>exitTour());
$('tourPause').addEventListener('click',()=>{TOUR.paused=!TOUR.paused;narrPause(TOUR.paused);tourShow();});
$('tourBar').addEventListener('pointerdown',()=>{if(NARR.ctx&&NARR.ctx.state==='suspended'&&!TOUR.paused)NARR.ctx.resume().catch(()=>{});});
$('tourVoice').addEventListener('click',()=>{narrUnlock();if(NARR.state==='fail'){NARR.state='ok';NARR.on=true;}else NARR.on=!NARR.on;if(NARR.on)narrPlay(TOUR_STOPS[TOUR.i].n);else narrStop();tourShow();});
$('tourPrev').addEventListener('click',()=>{TOUR.bottom=false;goStop(TOUR.i-1);});
$('tourNext').addEventListener('click',()=>{if(TOUR.i===TOUR_STOPS.length-1)exitTour();else{TOUR.bottom=false;goStop(TOUR.i+1);}});

