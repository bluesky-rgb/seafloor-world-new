/* =========================================================
   14l. Diel vertical migration: open North Pacific (subtropical gyre, ~22.75° N like Station ALOHA), equinox.
   Surface light from solar elevation (twilight from typical illuminance: ~400 lx at sunset, ~3 lx at -6°, ~0.01 lx at -12°).
   Each migrant tracks its preferred light level (isolume): z*(t)=z_day+ln(E(t))/K_blue, clamped to [z_night,z_day],
   with a swimming-speed limit. Hatchetfish stay put (weak migrators) for contrast.
   ========================================================= */
const DVM={t:17.5,rate:0.1,play:true,lat:22.75,z:50,tab:{},prevNight:false,lastSun:-99,cv:null};
const KB=(()=>{const a=WATER.clear.a[2],b=WATER.clear.b[2];return Math.sqrt(a*a+0.256*a*b);})();
const LOGE=[[-90,-8.3],[-18,-8.0],[-12,-7.1],[-6,-4.5],[-3,-3.4],[0,-2.4],[5,-1.35],[10,-0.95],[20,-0.55],[40,-0.2],[60,-0.07],[90,0]];
function sunElev(h){const H=(h-12)*15*Math.PI/180,la=DVM.lat*Math.PI/180;return Math.asin(Math.cos(la)*Math.cos(H))*180/Math.PI;}
function surfE(h){const e=sunElev(h);for(let i=1;i<LOGE.length;i++){if(e<=LOGE[i][0]){const[a,la]=LOGE[i-1],[b,lb]=LOGE[i];return Math.pow(10,la+(lb-la)*(e-a)/(b-a));}}return 1;}
const MIG={
  lantern:{zd:450,zn:40,w:[36,30],v:8,sv:1.0},
  krill:{zd:320,zn:20,w:[28,38],v:3,sv:0.12},
  salp:{zd:650,zn:15,w:[40,40],v:4,sv:0.03}
};
(function buildTables(){
  for(const k in MIG){const g=MIG[k],T=new Float32Array(1440);let z=g.zd;
    for(let d=0;d<3;d++)for(let m=0;m<1440;m++){const E=surfE(m/60),zs=Math.min(g.zd,Math.max(g.zn,g.zd+Math.log(E)/KB));
      z+=Math.max(-g.v,Math.min(g.v,zs-z));if(d===2)T[m]=z;}
    DVM.tab[k]=T;}
})();
function migZ(k,h){const T=DVM.tab[k],m=((h*60)%1440+1440)%1440,i=Math.floor(m),f=m-i;return T[i]*(1-f)+T[(i+1)%1440]*f;}
function migW(k,zc){const g=MIG[k];return g.w[1]+(g.w[0]-g.w[1])*(zc-g.zn)/(g.zd-g.zn);}
function migDens(k,z,h){const zc=migZ(k,h),w=migW(k,zc);return Math.exp(-0.5*Math.pow((z-zc)/w,2));}
const HATCH=[300,500];
function hatchDens(z){return z<HATCH[0]?Math.exp(-0.5*Math.pow((z-HATCH[0])/35,2)):z>HATCH[1]?Math.exp(-0.5*Math.pow((z-HATCH[1])/35,2)):1;}
function hhmm(h){h=((h%24)+24)%24;const m=Math.floor(h*60+1e-6);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}

/* krill (Euphausiidae): ~2–3 cm, rows of blue photophores */
makeDrift('krill',{n:260,size:[0.024,0.034],spd:0.07,minAb:0.5,jitter:true,geo:(()=>{const acc=Acc(),c=[0.9,0.72,0.66],g0={aGlow:()=>0},g1={aGlow:()=>1};
    for(let k=0;k<6;k++)addGeo(acc,new THREE.SphereGeometry(1,7,5),M4(0,0.02*Math.cos(k*0.5),0.32-k*0.13,0,0,0,0.1,0.11-k*0.008,0.09),(x,y)=>y>0.03?[0.95,0.55,0.5]:c,g0);
    addGeo(acc,triGeo([0,0.02,-0.44, 0.1,0.02,-0.62, -0.1,0.02,-0.62],true),null,()=>c,g0);
    for(const sg of[1,-1]){addGeo(acc,new THREE.SphereGeometry(0.04,6,4),M4(sg*0.07,0.05,0.4),()=>[0.05,0.05,0.06],g0);
      addGeo(acc,new THREE.CylinderGeometry(0.006,0.006,0.5,3),M4(sg*0.04,0.06,0.62,1.3,0,sg*0.15),()=>c,g0);
      for(let k=0;k<3;k++)addGeo(acc,new THREE.SphereGeometry(0.018,5,4),M4(sg*0.06,-0.07,0.18-k*0.16),()=>[0.6,0.8,1],g1);}
    for(let k=0;k<5;k++)addGeo(acc,new THREE.CylinderGeometry(0.008,0.006,0.16,3),M4(0,-0.1,0.25-k*0.1,0.3,0,0),()=>c,g0);
    return finishGeo(acc);})(),
  emit:'emit+=vec3(0.15,0.5,1.0)*vGlow*(0.4+1.6*smoothstep(0.8,0.97,fract(uTime*0.07+vPh*0.53)));'});
/* salp chains (Salpa aspera): transparent barrel zooids linked in a chain, each with an orange-brown gut */
makeDrift('salp',{n:9,size:[0.8,1.2],spd:0.05,minAb:1,geo:(()=>{const acc=Acc(),g0={aGlow:()=>0};
    for(let k=0;k<9;k++){const z=0.42-k*0.105,a=(k%2?0.35:-0.35);
      const b=new THREE.CylinderGeometry(0.038,0.045,0.085,10,1,true);b.rotateX(Math.PI/2);
      addGeo(acc,b,M4(Math.sin(k*0.7)*0.02,0,z,0,a,0),()=>[0.78,0.88,0.92],g0);
      addGeo(acc,new THREE.SphereGeometry(0.014,6,5),M4(Math.sin(k*0.7)*0.02,-0.02,z-0.02),()=>[0.75,0.42,0.18],g0);}
    return finishGeo(acc);})(),
  vb:'transformed.x+=sin(aPhase*0.8+position.z*3.0)*0.04;'});
{const m=DRIFT.salp.mesh.material;m.transparent=true;m.opacity=0.55;m.depthWrite=false;}

function dvmLight(){
  const E=surfE(DVM.t),el=sunElev(DVM.t),night=el<-6;
  if(night!==S.night){S.night=night;rebuild();}
  const sky=Math.max(E,0.015),day=Math.min(1,Math.max(0,(el+2)/10));
  U.uSky.value=sky;U.uDay.value=day;sunLight.intensity=1.5*sky;hemi.intensity=0.65*sky;
  sunLight.color.setRGB(el<6?1:1,el<6?0.8+0.2*Math.max(0,el)/6:1,el<6?0.62+0.38*Math.max(0,el)/6:1);
  const s=Math.max(8,Math.round(el));if(s!==DVM.lastSun){DVM.lastSun=s;S.sun=s;updateOptics();}
  U.uShaft.value=(0.1+1.3*Math.sqrt(WATER.clear.b[1]/0.4))*Math.min(1,0.4+S.H/1.5)*day;
}
function dvmH(){
  const z=DIVE.z,h=DVM.t;DVM.d={lantern:migDens('lantern',z,h),krill:migDens('krill',z,h),salp:migDens('salp',z,h),hatchet:hatchDens(z)};
  H.lantern=DVM.d.lantern>0.06;H.krill=DVM.d.krill>0.06;H.salp=DVM.d.salp>0.06;H.hatchet=DVM.d.hatchet>0.2;
  H.manta=false;H.turtle=false;H.amphi=false;H.snail=false;
}
/* bioluminescent glints of the migrating layer: lanternfish photophores and krill flashes, scattered through the water around you.
   Each point is lit only if the layer is at its depth (density at that point) and the water there is dark enough to see it. */
const NG=2600,dglow=makePoints(NG,`void main(){ float r=length(gl_PointCoord-0.5)*2.0; if(r>1.0) discard;
  float k=fract(vSeed*7.31); float fl=k<0.5?(0.55+0.45*sin(uTime*(0.8+k*2.0)+vSeed*40.0)):smoothstep(0.86,0.99,fract(uTime*(0.12+0.1*k)+vSeed*13.0))*2.2;
  float d=length(vWPos-cameraPosition); vec3 c=vec3(0.18,0.55,1.0)*fl*exp(-uC*d)*(1.0-r*r)*1.5;
  gl_FragColor=vec4(c,1.0);`,THREE.AdditiveBlending);
const GL=[];for(let i=0;i<NG;i++)GL.push({x:R(-22,22),y:R(-45,45),z:R(-22,22),g:i%3===0?'krill':'lantern',u:rnd()});
dglow.pts.visible=false;
function dvmGlow(){
  const on=!!DIVE.dvm;dglow.pts.visible=on;if(!on)return;const c=controls.target,E=surfE(DVM.t);
  for(let i=0;i<NG;i++){const P=GL[i],o=i*3;
    let x=P.x,z=P.z;dglow.pos[o]=c.x+x;dglow.pos[o+2]=c.z+z;const wy=-DIVE.z+P.y;dglow.pos[o+1]=Math.min(-0.5,wy);
    const dep=-wy,amb=light(dep,2)*E,dark=1-Math.min(1,Math.max(0,(Math.log10(amb+1e-14)+5.5)/2));
    const den=dep>0?migDens(P.g,dep,DVM.t):0,vis=P.u<den*0.85&&dark>0.02;
    dglow.size[i]=vis?(P.g==='krill'?0.05:0.07)*dark:0;dglow.sd[i]=(i*0.6180339)%1;}
  dglow.g.attributes.position.needsUpdate=true;dglow.g.attributes.aSize.needsUpdate=true;dglow.g.attributes.aSeed.needsUpdate=true;
}
function dvmCounts(){
  FISH.lantern.zr=[0,1200];FISH.hatchet.zr=HATCH;DRIFT.krill.zr=[0,1200];DRIFT.salp.zr=[0,1200];
  const cnt=(n,d)=>Math.max(1,Math.round(n*Math.min(1,d*1.4)));
  if(H.lantern)FISH.lantern.mesh.count=cnt(FISH.lantern.n,DVM.d.lantern);
  if(H.hatchet)FISH.hatchet.mesh.count=cnt(FISH.hatchet.n,DVM.d.hatchet);
  if(H.krill)DRIFT.krill.mesh.count=cnt(DRIFT.krill.n,DVM.d.krill);
  if(H.salp)DRIFT.salp.mesh.count=cnt(DRIFT.salp.n,DVM.d.salp);
  dvmGlow();
}
/* echogram: what a 38 kHz echosounder would draw over 24 h (relative volume backscatter, dB) */
const ECHO={W:288,H:170,top:12,left:26,zmax:1000,img:null};
function drawEchoBase(){
  const cv=$('echo');if(!cv)return;const pr=Math.min(2,window.devicePixelRatio||1);
  const W=ECHO.W,Hh=ECHO.H;cv.width=W*pr;cv.height=Hh*pr;const g=cv.getContext('2d');g.setTransform(pr,0,0,pr,0,0);
  const pw=W-ECHO.left-4,ph=Hh-ECHO.top-16,id=g.createImageData(Math.round(pw*pr),Math.round(ph*pr));
  const stops=[[-30,[8,22,32]],[-23,[22,58,120]],[-16,[30,120,200]],[-10,[40,170,110]],[-6,[225,210,60]],[-3,[240,140,45]],[0,[214,52,46]]];
  const col=v=>{if(v<=stops[0][0])return stops[0][1];for(let i=1;i<stops.length;i++)if(v<=stops[i][0]){const[a,ca]=stops[i-1],[b,cb]=stops[i],f=(v-a)/(b-a);return ca.map((c,j)=>c+(cb[j]-c)*f);}return stops[stops.length-1][1];};
  for(let x=0;x<id.width;x++){const h=x/id.width*24;
    const zc={};for(const k in MIG){zc[k]=migZ(k,h);}
    for(let y=0;y<id.height;y++){const z=y/id.height*ECHO.zmax;let s=0.004*Math.exp(-z/25)+1e-4;
      for(const k in MIG){const w=migW(k,zc[k]);s+=MIG[k].sv*Math.exp(-0.5*Math.pow((z-zc[k])/w,2));}
      s+=0.04*hatchDens(z);const n=0.6+0.8*hash2(x*7+3,y*13+5);
      const c=col(10*Math.log10(s*n));const o=(y*id.width+x)*4;id.data[o]=c[0];id.data[o+1]=c[1];id.data[o+2]=c[2];id.data[o+3]=255;}}
  ECHO.img=id;ECHO.pr=pr;ECHO.pw=pw;ECHO.ph=ph;
}
function drawEcho(){
  const cv=$('echo');if(!cv||!ECHO.img)return;const g=cv.getContext('2d'),pr=ECHO.pr,L=ECHO.left,T=ECHO.top,pw=ECHO.pw,ph=ECHO.ph;
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);g.putImageData(ECHO.img,Math.round(L*pr),Math.round(T*pr));g.setTransform(pr,0,0,pr,0,0);
  for(let x=0;x<pw;x++){const el=sunElev(x/pw*24);g.fillStyle=el>0?'rgba(255,214,120,'+(0.35+0.5*Math.min(1,el/30))+')':el>-12?'rgba(120,140,190,'+(0.25+0.3*(el+12)/12)+')':'rgba(40,50,80,.5)';g.fillRect(L+x,T-7,1,4);}
  g.font='9px '+getComputedStyle(document.body).getPropertyValue('--f-mono');g.fillStyle='#86a7ae';g.textAlign='right';
  for(let z=0;z<=1000;z+=200){const y=T+z/ECHO.zmax*ph;g.fillText(String(z),L-3,y+3);g.fillRect(L-2,y,2,0.6);}
  g.textAlign='center';for(let h=0;h<=24;h+=6){const x=L+h/24*pw;g.fillText(String(h).padStart(2,'0')+':00',Math.min(Math.max(x,L+12),L+pw-12),T+ph+11);}
  const cx=L+((DVM.t%24)/24)*pw,cy=T+Math.min(1,DIVE.z/ECHO.zmax)*ph;
  g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=1;g.beginPath();g.moveTo(cx,T-8);g.lineTo(cx,T+ph);g.stroke();
  g.setLineDash([3,3]);g.strokeStyle='rgba(98,212,227,.95)';g.beginPath();g.moveTo(L,cy);g.lineTo(L+pw,cy);g.stroke();g.setLineDash([]);
  g.fillStyle='#62d4e3';g.beginPath();g.arc(cx,cy,3.2,0,6.283);g.fill();
}
function dvmNote(){
  const h=DVM.t,el=sunElev(h),zl=migZ('lantern',h),vl=(migZ('lantern',h+1/60)-zl);
  const phase=el>20?$t('白天'):el>0?(h<12?$t('清晨'):$t('傍晚')):el>-12?(h<12?$t('黎明'):$t('黄昏')):$t('夜里');
  const mv=Math.abs(vl)<0.3?$t('停在那里'):(vl<0?$t('正以约 ')+Math.abs(vl).toFixed(1)+$t(' m/min 上升'):$t('正以约 ')+vl.toFixed(1)+$t(' m/min 下沉'));
  $('dvmNote').innerHTML='<b>'+phase+$t('</b> · 水面光照约为正午的 ')+pct(surfE(h))+$t('。灯笼鱼层在约 <b>')+Math.round(zl)+$t(' m</b>，')+mv+$t('；磷虾层约 ')+Math.round(migZ('krill',h))+$t(' m，樽海鞘约 ')+Math.round(migZ('salp',h))+$t(' m。银斧鱼不迁移，一直留在 300–500 m。');
  $('dvmTV').textContent=hhmm(h);$('dvmZV').textContent=Math.round(DIVE.z)+' m';
  if(document.activeElement!==$('sDvmT'))$('sDvmT').value=Math.round(((h%24)+24)%24*60)%1440;
  if(document.activeElement!==$('sDvmZ'))$('sDvmZ').value=Math.round(DIVE.z);
  [...$('dvmRate').children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.r==='pause'?!DVM.play:(DVM.play&&+b.dataset.r===DVM.rate)));
}
function enterDVM(){
  DVM.prevNight=S.night;DIVE.dvm=true;DIVE.on=true;DIVE.play=false;DIVE.replay=false;DIVE.manualTorch=false;DIVE.elapsed=0;WALL.cy=1e9;
  S.loc='dvm';const L=LOC.dvm;Object.assign(S,{water:L.water,temp:L.temp,H:L.H,T:L.T,cur:L.cur,dir:L.dir,sun:L.sun,seep:false,torch:'off'});
  for(const k in FISH)FISH[k].active=false;for(const k in JELLY)JELLY[k].active=false;for(const k in DRIFT)DRIFT[k].active=false;
  [encWS,encSW,encSQ,encSI].forEach(e=>{e.on=false;e.cool=R(4,9);});
  S.D=L.D;DIVE.z=DVM.z;DIVE.lastZ=DVM.z;controls.target.set(0,-DVM.z,0);camera.position.set(3.2,-DVM.z+0.9,5.6);
  bubbles.forEach(b=>b.on=false);sparkAge.fill(99);DVM.lastSun=-99;S.night=sunElev(DVM.t)<-6;
  rebuild();dvmLight();updDiveUI();$('dvmSec').hidden=false;drawEchoBase();drawEcho();dvmNote();
  showCaption($t('地球上规模最大的迁移'),$t('每天黄昏，暮光层里数以十亿计的灯笼鱼、磷虾和樽海鞘从几百米深处升到表层觅食，天亮前再沉回去。你现在悬停在 ')+Math.round(DVM.z)+$t(' m，看着它们到来。'),10);
}
function stepDVM(rdt){
  if(!DIVE.dvm)return;
  if(DVM.play){DVM.t=(DVM.t+DVM.rate*rdt)%24;}
  dvmLight();
}

