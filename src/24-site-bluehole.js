/* =========================================================
   14n. Sansha Yongle Blue Hole ("Dragon Hole"), Yongle Atoll, Paracel Islands: ~301 m deep (300.89 m in 2016),
   ~130 m across at the mouth, ~32 m at the bottom; shaped like a ballet shoe with bends at ~77 m and ~158 m.
   Water: oxic 0–70 m, chemocline 70–100 m, anoxic with hydrogen sulfide below ~100 m (sulfide rising to ~150 m).
   Sulfur-oxidizing bacteria dominate 100–140 m and particulate organic carbon peaks near 150 m, so the redox
   layer is a turbid band. Temperature ~30 °C at the surface, ~15 °C at the bottom (thermoclines 13–20 m, 70–150 m).
   ========================================================= */
const BH_TPROF=[[0,30],[13,29.6],[20,27.8],[70,26.2],[150,16.2],[301,15.4]];
function bhTemp(z){for(let i=1;i<BH_TPROF.length;i++){if(z<=BH_TPROF[i][0]){const[a,ta]=BH_TPROF[i-1],[b,tb]=BH_TPROF[i];return ta+(tb-ta)*(z-a)/(b-a);}}return 15.4;}
function bhHaze(z){return Math.exp(-0.5*Math.pow((z-125)/20,2))+0.25*Math.exp(-0.5*Math.pow((z-152)/10,2));}
function bhO2(z){return z<70?1:1-sstep(70,100,z);}
function bhH2S(z){return sstep(85,150,z);}
const BH_MS=[
  [13,'13 m · 温跃层','往下水温开始降低。洞口附近的珊瑚和二十多种鱼都生活在上面这几十米里。'],
  [70,'70 m · 进入化学跃层','氧气开始迅速减少。洞里的水几乎不和外面的海水交换，下层的氧气一旦用完就得不到补充。'],
  [77,'约 77 m · 洞道转折','龙洞的形状像一只芭蕾舞鞋：在 76–78 m 和约 158 m 处各有一次大的转折。'],
  [100,'100 m · 氧气耗尽','从这里往下，海水里没有溶解氧，却富含硫化氢。鱼、藻类都无法生存，只剩下微生物。'],
  [118,'约 100–150 m · 浑浊的细菌层','硫氧化细菌在 100–140 m 占到微生物的约九成，悬浮的有机颗粒在约 150 m 最多，海水在这里发浑。'],
  [158,'约 158 m · 第二次转折','再往下是均匀、静止、无氧的老水，水温稳定在约 15 °C。'],
  [298,'约 301 m · 龙洞底部','2016 年测得 300.89 m，是当时已知最深的蓝洞（现已知墨西哥的 Taam Ja\' 蓝洞至少 420 m）。洞底沉积的有机碳最老约 6,800 年。']
];
/* suspended particles of the turbid redox layer (bacteria, sulfur colloids, organic flakes), lit by the lamps */
const NSU=2200,sulf=makePoints(NSU,`void main(){ float r=length(gl_PointCoord-0.5)*2.0; if(r>1.0) discard;
  vec3 tE=torchAt(vWPos,1.0)*4.0; vec3 a=vec3(0.95,0.92,0.78);
  vec3 c=waterPath(a,vWPos)+a*tE*exp(-uC*length(vWPos-cameraPosition));
  gl_FragColor=vec4(c,(1.0-r)*0.7);`);
const SUP=[];for(let i=0;i<NSU;i++)SUP.push({x:R(-9,9),y:R(-14,14),z:R(-9,9),s:0.006+rnd()*rnd()*0.02});
sulf.pts.visible=false;
function stepBH(dt,t){
  if(!DIVE.bh){if(sulf.pts.visible)sulf.pts.visible=false;return;}
  sulf.pts.visible=true;const c=controls.target;
  for(let i=0;i<NSU;i++){const P=SUP[i],o=i*3;P.y-=0.004*dt;P.x+=Math.sin(t*0.2+i)*0.01*dt;
    let wy=c.y+P.y;if(wy-c.y<-14){P.y+=28;wy+=28;}
    sulf.pos[o]=c.x+P.x;sulf.pos[o+1]=Math.min(-0.5,wy);sulf.pos[o+2]=c.z+P.z;const h=bhHaze(-wy);
    sulf.size[i]=h>0.05?P.s*(0.4+0.8*h):0;sulf.sd[i]=0.5;}
  sulf.g.attributes.position.needsUpdate=true;sulf.g.attributes.aSize.needsUpdate=true;
  /* local water optics: scattering rises sharply inside the turbid layer, tinted toward pale yellow-grey */
  const hz=bhHaze(DIVE.z),w=WATER.clear,tint=[1+0.25*hz,1+0.12*hz,1-0.15*hz];
  const cc=[0,1,2].map(i=>w.a[i]+w.b[i]*(1+16*hz));U.uC.value.set(cc[0],cc[1],cc[2]);
  U.uWater.value.set(...[0,1,2].map(i=>0.6*w.b[i]*(1+16*hz)/cc[i]*tint[i]));
  const z=DIVE.z;U.uSky.value=(S.night?0.02:1)*Math.exp(-0.004*z-3.2*sstep(95,155,z));
}
function bhH(){
  const z=DIVE.z;
  Object.assign(H,{manta:false,turtle:z<25,whaleshark:false,hammer:false,moon:z<60,comb:z<70,atolla:false,lantern:false,hatchet:false,sperm:false,squid:false,siph:false,
    vampire:false,gulper:false,cucumber:false,angler:false,dumbo:false,snail:false,amphi:false,
    snapper:z<45,anthias:z<35,butterfly:z<30,parrot:z<20,chromis:z<20});
}
function bhSchools(){
  const C=controls.target,b=(ry,dy,r)=>({cx:C.x+2,cy:C.y+dy,cz:C.z,rx:r||5,ry,rz:r||5});
  const keep=(sp,box)=>sp.active&&sp.box?sp.box:box;
  [['snapper',1,0],['anthias',1.2,0.5],['butterfly',1.5,-0.5],['parrot',1.2,-1],['chromis',0.8,0]].forEach(([k,ry,dy])=>{const sp=FISH[k];sp.zr=[0,70];setSchool(sp,!!H[k],keep(sp,b(ry,dy)));});
}
function buildProfileBH(){
  const D=S.D,y=z=>PROF.top+z/D*PROF.h,svg=$('prof'),cx=z=>48+(z<77?0:z<158?(z-77)/81*9:9),hw=z=>5+17*Math.pow(1-z/D,1.3);
  let L='',Rr='';for(let z=0;z<=D;z+=6){L+=(cx(z)-hw(z)).toFixed(1)+','+y(z).toFixed(1)+' ';}for(let z=D;z>=0;z-=6){Rr+=(cx(z)+hw(z)).toFixed(1)+','+y(z).toFixed(1)+' ';}
  let h='<defs><linearGradient id="bhg" x1="0" y1="0" x2="0" y2="1">'+
    '<stop offset="0" stop-color="#3fb3d2"/><stop offset="'+(70/D)+'" stop-color="#14627a"/><stop offset="'+(100/D)+'" stop-color="#3a4d47"/>'+
    '<stop offset="'+(125/D)+'" stop-color="#8a8466"/><stop offset="'+(160/D)+'" stop-color="#2a2236"/><stop offset="1" stop-color="#140f1c"/></linearGradient></defs>';
  h+='<polygon points="'+L+Rr+'" fill="url(#bhg)" stroke="rgba(217,236,239,.55)" stroke-width="0.7"/>';
  for(let k=0;k<=300;k+=50)h+='<line x1="6" x2="10" y1="'+y(k)+'" y2="'+y(k)+'" stroke="rgba(120,190,205,.5)"/><text x="5" y="'+(y(k)+3)+'" class="pt" text-anchor="end">'+k+'</text>';
  [[35,'含氧'],[85,'化学跃层'],[125,'浑浊细菌层'],[220,'无氧 · 硫化氢'],[296,'约 301 m']].forEach(([z,t])=>{h+='<text x="'+(cx(z)+hw(z)+3)+'" y="'+(y(z)+3)+'" class="pl">'+t+'</text>';});
  h+='<text x="5" y="'+(PROF.top-4)+'" class="pt" text-anchor="end">m</text>';
  h+='<g id="profMe"><line x1="18" x2="66" y1="0" y2="0" stroke="#62d4e3" stroke-width="1.4"/><circle cx="48" cy="0" r="3.2" fill="#62d4e3"/></g>';
  svg.innerHTML=h;
}
function enterBH(){
  DIVE.on=true;DIVE.bh=true;DIVE.dvm=false;DIVE.play=true;DIVE.z=4;DIVE.lastZ=4;DIVE.elapsed=0;DIVE.manualTorch=false;DIVE.replay=false;WALL.cy=1e9;
  S.loc='bluehole';const L=LOC.bluehole;Object.assign(S,{water:L.water,temp:L.temp,H:L.H,T:L.T,cur:L.cur,dir:L.dir,sun:L.sun,seep:false,torch:'off'});
  for(const k in FISH)FISH[k].active=false;for(const k in JELLY)JELLY[k].active=false;for(const k in DRIFT)DRIFT[k].active=false;
  [encWS,encSW,encSQ,encSI].forEach(e=>{e.on=false;e.cool=R(2,5);});
  S.D=L.D;$('dProg').max=Math.round(S.D-2);controls.target.set(0,-4,0);camera.position.set(2.5,-2.8,4.6);
  {const f=new THREE.Vector3(-2.5,0,-4.6).normalize(),r=new THREE.Vector3(-f.z,0,f.x),a=0.32;WALL.n.copy(r).multiplyScalar(Math.cos(a)).addScaledVector(f,-Math.sin(a)).normalize();}
  bubbles.forEach(b=>b.on=false);sparkAge.fill(99);
  rebuild();updDiveUI();buildProfileBH();updProfile();
  showCaption('三沙永乐龙洞','西沙永乐环礁上的一口海底竖井，深约 301 m，洞口宽约 130 m。上面几十米是热闹的珊瑚礁，100 m 以下的海水里没有氧气。',9);
}

