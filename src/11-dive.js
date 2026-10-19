/* =========================================================
   14c. Dive mode
   ========================================================= */
const TPROF=[[0,28.5],[60,28],[120,26],[200,20],[300,13],[400,10],[600,7],[1000,4.5],[2000,2.3],[4000,1.5],[6000,1.6],[8000,1.9],[10935,2.5]];
function tempAt(z){for(let i=1;i<TPROF.length;i++){if(z<=TPROF[i][0]){const[a,ta]=TPROF[i-1],[b,tb]=TPROF[i];return ta+(tb-ta)*(z-a)/(b-a);}}return 2.5;}
const MILESTONES=[
  [30,'30 m',$t('红光几乎被水吸收殆尽，身边的一切都变成了蓝绿色。')],
  [200,$t('200 m · 进入暮光层'),$t('阳光只剩不到 1%，植物无法再进行光合作用。这里的很多动物夜里会上浮到浅层觅食，这是地球上规模最大的动物迁徙。')],
  [332,'332 m',$t('水肺潜水的世界纪录（2014 年）。再往下，人类只能坐在耐压舱里。')],
  [1000,$t('1,000 m · 进入午夜层'),$t('这里再也没有一丝阳光。此后看到的光，除了潜水器的灯，全部来自生物自己。')],
  [2992,'2,992 m',$t('柯氏喙鲸到过这里，这是哺乳动物的下潜纪录。')],
  [3700,$t('约 3,700 m'),$t('全球海洋的平均深度。地球表面七成被海水覆盖，大部分海底都在这样的黑暗里。')],
  [3800,'3,800 m',$t('泰坦尼克号的残骸就躺在这个深度的大西洋海底。')],
  [4000,$t('4,000 m · 进入深渊层'),$t('水温约 1.5 °C，压强约 400 个大气压。几乎所有食物，都来自上方缓慢飘落的海洋雪。')],
  [6000,$t('6,000 m · 进入超深渊层'),$t('只存在于海沟之中。全世界的海沟加起来，还不到海底面积的 0.25%。')],
  [8200,$t('约 8,200 m'),$t('狮子鱼的极限。再深，鱼类体内对抗压强的分子就不够用了，这以下再也没有鱼。')],
  [8849,'8,849 m',$t('珠穆朗玛峰的高度。把它整个放进这条海沟，峰顶离海面还有两千多米。')],
  [10930,$t('10,935 m · 挑战者深渊'),$t('地球海洋的最深处。头顶的海水压强约 1,100 个大气压，相当于每平方厘米压着一吨多。')]
];
let capTimer=0;
function showCaption(title,sub,dur){$('capT').textContent=title;$('capS').textContent=sub||'';$('cap').classList.add('on');capTimer=dur||7;}
const autoSpeed=z=>z<200?5:z<1000?20:z<6000?60:z<10500?120:25;
function diveSpeed(){return DIVE.speed==='auto'?(DIVE.bh?(DIVE.z<60?2:DIVE.z<165?1:4):autoSpeed(DIVE.z)):+DIVE.speed;}
function hms(s){s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return(h?h+$t(' 小时 '):'')+(h||m?m+$t(' 分 '):'')+(h?'':x+$t(' 秒'));}
function setDiveZ(z){
  z=Math.max(2,Math.min(S.D-2.2,z));const dz=z-DIVE.z;if(!dz)return;
  camera.position.y-=dz;controls.target.y-=dz;DIVE.z=z;
  if(dz>0){let hit=null;for(const m of(DIVE.bh?BH_MS:MILESTONES))if(DIVE.lastZ<m[0]&&z>=m[0]&&!(DIVE.replay&&m[0]>=10930))hit=m;if(hit)showCaption(hit[1],hit[2],hit[0]>=10930?12:8);}
  DIVE.lastZ=z;S.temp=Math.round((DIVE.bh?bhTemp(z):tempAt(z))*10)/10;
  if(z>=S.D-2.2&&DIVE.play&&!DIVE.replay){DIVE.play=false;updDiveUI();}
}
function updDiveUI(){
  $('diveBar').hidden=!DIVE.on||!!DIVE.dvm;$('diveCta').hidden=DIVE.on||PILOT.on;$('pilotBtn').hidden=DIVE.on||PILOT.on;$('envDet').hidden=DIVE.on;$('prof').toggleAttribute('hidden',!DIVE.on||!!DIVE.dvm);$('dProg').disabled=DIVE.replay;
  $('dPlay').textContent=DIVE.replay?(DIVE.rphase==='done'?$t('已回到水面'):DIVE.play?$t('暂停'):$t('继续')):(DIVE.play?$t('暂停'):(DIVE.z>=S.D-2.3?$t('已到底'):$t('继续下潜')));
  [...$('dSpeed').children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.s===String(DIVE.speed)));
}
function diveInfo(){
  if(DIVE.replay){const k=DIVE.speed==='auto'?60:+DIVE.speed,ph={descent:$t('下潜中'),bottom:$t('在海底'),ascent:$t('上浮中'),done:$t('已回到水面')}[DIVE.rphase];
    $('dInfo').textContent=$t('2012 年 3 月 26 日 · 当地时间 ')+clockStr(DIVE.clock)+' · '+ph+$t(' · 倍速 ×')+k+(DIVE.speed==='auto'?$t('（真实时间的 60 倍）'):'');
    $('dProg').value=Math.round(DIVE.z);return;}
  if(DIVE.bh){const z=DIVE.z;$('dInfo').textContent=$t('倍速 ×')+diveSpeed()+(DIVE.speed==='auto'?$t('（在化学跃层放慢）'):'')+$t(' · 现在：')+(z<70?$t('含氧层'):z<100?$t('化学跃层，氧气迅速减少'):$t('无氧层，海水里溶有硫化氢'))+$t(' · 到洞底还有 ')+Math.round(S.D-z)+' m';if(document.activeElement!==$('dProg'))$('dProg').value=Math.round(z);return;}
  const left=(S.D-DIVE.z)/1.0;const cupH=Math.cbrt(foamV(pressAtm(DIVE.z)));
  $('dInfo').textContent=$t('挂在外面的泡沫杯：高度约原来的 ')+Math.round(cupH*100)+$t('% · 倍速 ×')+diveSpeed()+(DIVE.speed==='auto'?$t('（浅处慢、空旷处快）'):'')+$t(' · 按真实速度约 1 m/s，已下潜 ')+hms(DIVE.elapsed)+$t('，到底还要 ')+hms(left);
  if(document.activeElement!==$('dProg'))$('dProg').value=Math.round(DIVE.z);
}
function enterDive(replay){
  DIVE.bh=false;
  if(DIVE.dvm)exitDive();
  DIVE.on=true;DIVE.play=true;DIVE.z=5;DIVE.lastZ=5;DIVE.elapsed=0;DIVE.manualTorch=false;
  DIVE.replay=!!replay;DIVE.clock=0;DIVE.rphase='descent';DIVE.bt=0;DIVE.rev=new Set();WALL.cy=1e9;
  S.loc=replay?'replay':'dive';Object.assign(S,{water:'clear',temp:28.5,H:1.2,T:8,cur:0.02,dir:90,sun:70,seep:false,torch:'off'});
  for(const k in FISH)FISH[k].active=false;for(const k in JELLY)JELLY[k].active=false;for(const k in DRIFT)DRIFT[k].active=false;
  [encWS,encSW,encSQ,encSI].forEach(e=>{e.on=false;e.cool=R(2,5);});
  S.D=LOC[S.loc].D;$('dProg').max=Math.round(S.D-2);controls.target.set(0,-5,0);camera.position.set(replay?4.2:2.5,-3.6,replay?7.8:4.6);{const f=new THREE.Vector3(-4.2,0,-7.8).normalize(),r=new THREE.Vector3(-f.z,0,f.x),a=0.06;WALL.n.copy(r).multiplyScalar(Math.cos(a)).addScaledVector(f,-Math.sin(a)).normalize();}
  bubbles.forEach(b=>b.on=false);sparkAge.fill(99);
  rebuild();updDiveUI();buildProfile();updProfile();
  if(replay){rpEvents();return;}
  showCaption($t('从关岛的礁壁出发'),$t('目标：马里亚纳海沟挑战者深渊，10,935 m。真实下潜要 3 个小时左右，可在下方调整倍速或拖动深度。'),9);
}
function exitDive(){
  if(DIVE.bh){DIVE.bh=false;sulf.pts.visible=false;capTimer=0;$('cap').classList.remove('on');}
  if(DIVE.dvm){DIVE.dvm=false;$('dvmSec').hidden=true;S.night=DVM.prevNight;dglow.pts.visible=false;capTimer=0;$('cap').classList.remove('on');}
  DIVE.on=false;DIVE.play=false;[encWS,encSW,encSQ,encSI].forEach(e=>e.on=false);
  [WSH,SPW,SQD].forEach(sw=>sw.mesh.count=0);DIVE.replay=false;wall.visible=false;for(let i=0;i<NSI;i++)siph.size[i]=0;siph.g.attributes.aSize.needsUpdate=true;
  for(const k in DRIFT)setDrift(DRIFT[k],false,null);
  updDiveUI();
}

