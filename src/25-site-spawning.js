/* =========================================================
   14o. Coral mass spawning night at Luhuitou fringing reef, Sanya, Hainan (after Frontiers in Marine Science 2024:
   22 species over 2009–2021; Acropora mostly in lunar March, starting after ~21:00 and lasting ~1 h; bundles mostly red).
   Egg-sperm bundles are positively buoyant (lipid-rich eggs); taking ~1.5 mm bundles 1 % lighter than seawater,
   the drag-limited rise is ~1 cm/s, so they reach the surface within minutes and break apart there within ~1 h.
   Shown ~15x enlarged so they are visible.
   ========================================================= */
const SPN={on:false,t:20.8,rate:10,play:true,col:[],rel:0,prevNight:false};
const NSPN=22000,spawnPts=makePoints(NSPN,`void main(){ float r=length(gl_PointCoord-0.5)*2.0; if(r>1.0) discard;
  float a=fract(vSeed); vec3 alb=mix(vec3(0.95,0.16,0.24),vec3(1.0,0.38,0.3),fract(vSeed*7.3));
  vec3 tE=torchAt(vWPos,1.0)*0.9; float d=length(vWPos-cameraPosition);
  vec3 c=waterPath(alb*0.6,vWPos)+alb*tE*exp(-uC*d);
  float hl=smoothstep(0.5,0.0,length(gl_PointCoord-vec2(0.38,0.38)));
  gl_FragColor=vec4(c*(0.8+0.5*hl),(1.0-r*r)*clamp(a*1.6,0.0,1.0));`);
spawnPts.pts.visible=false;
const SPP=[];for(let i=0;i<NSPN;i++)SPP.push({st:0,x:0,y:0,z:0,v:0,age:0,c:0});
let spNext=0;
function spawnColonies(){
  SPN.col=[];const take=(k,top,rad)=>{const c=CORAL[k];for(let i=0;i<c.mesh.count;i++){const s=c.spots[i];
    SPN.col.push({x:s.x,z:s.z,y:floorY(s.x,s.z)+top*s.s,r:rad*s.s,tr:R(21.0,21.9),n:Math.round(R(160,260)*s.s),emit:0,kind:k});}};
  take('branch',0.55,0.35);take('plate',0.46,0.8);
}
function stepSpawn(rdt,t){
  if(!SPN.on){if(spawnPts.pts.visible)spawnPts.pts.visible=false;return;}
  spawnPts.pts.visible=true;
  const dtH=SPN.play?SPN.rate*rdt/3600:0,dtS=dtH*3600;SPN.t=Math.min(24,SPN.t+dtH);const T=SPN.t;
  /* setting: in the hour before release the bundles sit in the polyp mouths, showing as a pink speckle on the colony */
  let k=0;
  for(const c of SPN.col){
    if(T<c.tr&&T>c.tr-0.75){const f=sstep(c.tr-0.75,c.tr-0.05,T),m=Math.round(14*f);
      for(let j=0;j<m&&k<700;j++){const a=j*2.39996,rr=c.r*Math.sqrt((j+0.5)/14);const P=SPP[NSPN-1-(k++)];P.st=3;P.x=c.x+Math.cos(a)*rr;P.z=c.z+Math.sin(a)*rr;P.y=c.y+0.02;}}
    if(T>=c.tr&&c.emit<c.n){const want=Math.min(c.n,Math.ceil(c.n*Math.min(1,(T-c.tr)/0.08)));
      while(c.emit<want){const P=SPP[spNext];spNext=(spNext+1)%(NSPN-700);
        const a=rnd()*6.28,rr=c.r*Math.sqrt(rnd());P.st=1;P.x=c.x+Math.cos(a)*rr;P.z=c.z+Math.sin(a)*rr;P.y=c.y+R(0,0.05);P.v=R(0.007,0.013);P.age=0;c.emit++;SPN.rel++;}}
  }
  for(let i=NSPN-700;i<NSPN-k;i++)SPP[i].st=0;
  const top=-0.12;
  for(let i=0;i<NSPN;i++){const P=SPP[i],o=i*3;
    if(P.st===1){orbital(P.x,P.y,t,_u);P.y+=P.v*dtS+_u.y*rdt*0.6;P.x+=(_u.x*0.6+CUR.x*S.cur*0.5)*rdt;P.z+=(_u.z*0.6+CUR.z*S.cur*0.5)*rdt;
      if(P.y>=top){P.y=top+R(-0.04,0.0);P.st=2;P.age=0;}}
    else if(P.st===2){P.age+=dtH;P.x+=CUR.x*S.cur*0.5*rdt+Math.sin(t*0.3+i)*0.002;P.z+=CUR.z*S.cur*0.5*rdt;if(P.age>1.2)P.st=0;}
    const vis=P.st>0;spawnPts.pos[o]=P.x;spawnPts.pos[o+1]=vis?P.y:-9999;spawnPts.pos[o+2]=P.z;
    spawnPts.size[i]=!vis?0:P.st===3?0.026:P.st===2?0.026*(1-0.5*Math.min(1,P.age)):0.026;
    spawnPts.sd[i]=(P.st===2?0.95-0.55*Math.min(1,P.age):0.95)+(i%9)*0.005;}
  spawnPts.g.attributes.position.needsUpdate=true;spawnPts.g.attributes.aSize.needsUpdate=true;spawnPts.g.attributes.aSeed.needsUpdate=true;
}
function spawnPhase(){const T=SPN.t;return T<21?'setting':T<22?'release':T<23?'rise':'slick';}
function spawnNote(){
  const T=SPN.t,ph=spawnPhase(),hm=hhmm(T);
  const txt={setting:'<b>“含卵”</b>：珊瑚虫把卵精束顶到口部，整块珊瑚表面布满粉红色的小点，随时准备释放。',
    release:'<b>释放</b>：鹿角珊瑚一丛接一丛地放出卵精束。每个卵精束直径约 1–2 mm，里面裹着几十粒卵和成千上万个精子，因为卵富含脂质，比海水轻，便慢慢往上飘。',
    rise:'<b>上浮</b>：卵精束以约每秒 1 cm 的速度上升，几分钟就能到达水面，在那里散开，卵和其他珊瑚的精子相遇受精。受精窗口只有约 2 小时。',
    slick:'<b>浮层</b>：水面聚起一层粉红色的卵层。接下来几天，受精卵发育成幼虫，随海流漂走，再找一块礁石定居。'}[ph];
  $('spNote').innerHTML=txt+' 已释放约 '+SPN.rel.toLocaleString('en-US')+' 个卵精束（画面中放大约 15 倍显示）。';
  $('spTV').textContent=hm;if(document.activeElement!==$('sSp'))$('sSp').value=Math.round((T-20)*60);
  [...$('spRate').children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.r==='pause'?!SPN.play:(SPN.play&&+b.dataset.r===SPN.rate)));
}
function spawnReset(T){SPN.t=T;SPN.rel=0;spNext=0;SPP.forEach(P=>P.st=0);SPN.col.forEach(c=>{c.emit=0;});
  /* jump forward: re-run the release history quickly so the water column matches the clock */
  if(T>21.0){const tgt=T;SPN.t=20.99;const pl=SPN.play;SPN.play=true;const r=SPN.rate;SPN.rate=600;
    while(SPN.t<tgt-1e-4){const step=Math.min(0.5,(tgt-SPN.t)*3600/600);stepSpawn(step,0);}SPN.rate=r;SPN.play=pl;}}

