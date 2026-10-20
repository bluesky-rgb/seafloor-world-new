/* =========================================================
   15. Optics, habitat logic, rebuild
   ========================================================= */
function updateOptics(){
  const w=WATER[S.water],zenA=(90-S.sun)*Math.PI/180,zenW=Math.asin(Math.sin(zenA)/N_WATER);
  OPT.mu0=Math.cos(zenW);OPT.zenW=zenW;
  OPT.sunDir.set(Math.sin(zenW)*0.8,Math.cos(zenW),Math.sin(zenW)*0.6).normalize();
  for(let i=0;i<3;i++){const a=w.a[i],b=w.b[i];OPT.K[i]=Math.sqrt(a*a+0.256*a*b)/OPT.mu0;OPT.c[i]=a+b;}
  U.uK.value.set(...OPT.K);U.uC.value.set(...OPT.c);
  U.uWater.value.set(...[0,1,2].map(i=>0.6*w.b[i]/(w.a[i]+w.b[i])));
  U.uSunDir.value.copy(OPT.sunDir);sunLight.position.copy(OPT.sunDir).multiplyScalar(100);
  U.uShaft.value=(S.night?0:1)*(0.1+1.3*Math.sqrt(w.b[1]/0.4))*Math.min(1,0.4+S.H/1.5)*(S.loc==='ice'?0.32:1);
}
const H={};let habKey='';
function rebuild(){
  solveWave();CUR.x=Math.cos(S.dir*Math.PI/180);CUR.z=Math.sin(S.dir*Math.PI/180);updateOptics();
  buildBrine(S.loc==='brine'&&!DIVE.on);buildIce(S.loc==='ice'&&!DIVE.on);buildRost(S.loc==='rost'&&!DIVE.on);buildTruk(S.loc==='truk'&&!DIVE.on);buildAbyss(S.loc==='abyss'&&!DIVE.on);buildMangrove(S.loc==='mangrove'&&!DIVE.on);buildArctic(S.loc==='arctic'&&!DIVE.on);buildSeamount(S.loc==='seamount'&&!DIVE.on);buildIntertidal(S.loc==='nanji'&&!DIVE.on);
  const F=-S.D,lf=light(S.D,1),day=!S.night;
  const sky=(day?1:0.02)*(ICE.on?ICE.T:1);U.uSky.value=sky;U.uDay.value=day?1:0;
  sunLight.intensity=1.5*sky;sunLight.color.setRGB(day?1:0.75,day?1:0.85,1);hemi.intensity=0.65*sky;
  U.uTorch.value=S.torch==='off'?0:(DIVE.on?2.6:1);U.uTorchCol.value.set(...(S.torch==='blue'?[0.08,0.28,1.6]:[1.1,1.0,0.88]));

  H.coral=habTemp()>=18&&lf>=0.01&&S.D<=150&&!TRUK.on&&!MANG.on&&!TIDE.on;
  H.kelp=habTemp()<=20&&habTemp()>=3&&S.D<=35&&lf>=0.01&&!TIDE.on;
  H.anem=H.coral&&habTemp()>=20&&S.D<=40&&lf>=0.1;
  H.clam=H.coral&&habTemp()>=22&&S.D<=20&&lf>=0.2;
  H.fan=S.cur>=0.03&&S.D>=3&&!MANG.on&&!ARC.on&&!TIDE.on;
  H.sponge=(S.D>=400&&S.D<=7000&&!brineOn&&!ABY.on)||ICE.on;
  H.holo=S.D>=6000&&!DIVE.replay;H.xeno=H.holo||ABY.on;
  H.urchinT=habTemp()<18&&S.D<=200&&!ARC.on;
  H.urchinD=habTemp()>=18&&S.D<=70&&!MANG.on&&!TIDE.on;
  H.star=S.D<=200&&!MANG.on&&!ARC.on&&!TIDE.on;
  H.seep=S.seep&&S.D>=800;

  const hab=MANG.on?'mangrove':TIDE.on?'intertidal':SMT.on?'seamount':ABY.on?'abyss':ROST.on?'cwc':ICE.on?'ant':S.loc==='bluehole'?'anox':S.loc==='vent'&&!DIVE.on?'vent':S.D>=6000?'hadal':S.D>200?'deep':H.coral?'reef':habTemp()<18?'temperate':'warm';
  const key=hab+(H.seep?'s':'');
  if(key!==habKey){habKey=key;paintFloor(hab);paintRocks(hab);}
  floor.position.y=F-(ABY.on||SMT.on||TIDE.on?0.3:MANG.on?2.5:0);rocks.children.forEach(m=>m.position.y=F+m.userData.base);rocks.visible=!DIVE.replay&&!ABY.on&&!MANG.on&&!SMT.on&&!TIDE.on;

  const um=floorOrbitalMax(),uc1=S.cur*curProfile(1);S.ripKind='';
  if(hab!=='deep'&&um>=uc1&&um>0.1){const d0=2*um/W.w;U.uRipL.value=d0<0.44?Math.max(0.62*d0,0.08):0.134;U.uRipAmp.value=Math.min(1,(um-0.1)/0.1);U.uRipDir.value.set(1,0);S.ripKind='wave';}
  else if(hab!=='deep'&&uc1>0.2){U.uRipL.value=0.25;U.uRipAmp.value=Math.min(1,(uc1-0.2)/0.15);U.uRipDir.value.set(CUR.x,CUR.z);S.ripKind='current';}
  else U.uRipAmp.value=0;
  U.uCaustAmp.value=Math.min(1,S.H/1.2);

  buildCoral(H.coral,lf);buildKelp(H.kelp);buildAnem(H.anem);buildClams(H.clam);buildFans(H.fan);buildSponges(H.sponge);
  if(H.urchinT)placeOnFloor(urchinT,48,0,[0.04,0.06],true);else urchinT.count=0;
  if(H.urchinD)placeOnFloor(urchinD,16,14,[0.05,0.07],false);else urchinD.count=0;
  buildStars(H.star);buildSeep(H.seep);buildHadal(H.holo);buildWhaleFall(S.loc==='whalefall'&&!DIVE.on);buildVent(S.loc==='vent'&&!DIVE.on);if(wfOn)paintFloor(hab);
  $('wfSec').hidden=!wfOn;
  zoneUpdate();
  rayRange=Math.max(4,Math.min(14,2.8/OPT.c[1]));for(let i=0;i<NR;i++){rayX[i]=camera.position.x+R(-1,1)*rayRange;rayZ[i]=camera.position.z+R(-1,1)*rayRange;}
  for(const k in FISH)FISH[k].forceRespawn=false;
  readouts();
}
const ZR={hammer:[10,300],lantern:[200,1200],hatchet:[200,1000],snail:[6000,8200],moon:[0,150],comb:[0,4000],atolla:[400,4000],cucumber:[500,5000],vampire:[600,1300],gulper:[500,3000],dumbo:[1000,7000]};
function zoneUpdate(){
  const dive=DIVE.on,F=-S.D,lf=light(S.D,1);
  if(dive){
    const z=DIVE.z,inz=k=>z>=ZR[k][0]&&z<=ZR[k][1];
    Object.assign(H,{manta:z<=80,turtle:z<=60,whaleshark:z<=150,hammer:inz('hammer'),moon:inz('moon'),nettle:false,comb:inz('comb'),atolla:inz('atolla'),
      lantern:inz('lantern'),hatchet:inz('hatchet'),sperm:z<=2000,squid:z>=300&&z<=1000,siph:z>=300&&z<=1000,vampire:inz('vampire'),gulper:inz('gulper'),
      cucumber:inz('cucumber'),angler:z>=700&&z<=4000,dumbo:inz('dumbo'),snail:inz('snail'),amphi:S.D>=6000&&S.D-z<70,
      sardine:false,chromis:false,anthias:false,butterfly:false,snapper:false,parrot:false,clown:false,rockfish:false,hagfish:false,sleeper:false,osedax:false,crab:false,rimicaris:false,kiwa:false,scalyfoot:false,giga:false,ventmussel:false,barnacle:false,ventanem:false,krill:false,salp:false,childressi:false,acropora:false,icefish:false,borch:false,seal:false,pycno:false,icealgae:false,redfish:false,lophelia:false,geodia:false,acesta:false,dendro:false});
    ['psychro','seapig','tripod','rattail','ophiuroid','hyalonema','enhalus','thalassia','rhizophora','avicennia','oyster','seahorse','cassiopea','narwhal','beluga','polarcod','apherusa','melosira','pearlocto','smanem','smsnail','smshrimp','tetraclita','capitulum','mytilus','littorina','sargassum','tanem','heliocidaris'].forEach(k=>H[k]=false);
    if(DIVE.dvm)dvmH();
    if(DIVE.bh)bhH();
  }else{
    H.krill=false;H.salp=false;H.childressi=S.loc==='brine';H.acropora=S.loc==='spawn';
    H.manta=habTemp()>=20&&S.D>=6&&S.D<=120&&lf>=0.01;H.turtle=habTemp()>=18&&S.D>=4&&S.D<=60;H.angler=S.D>=700;
    H.sardine=!H.coral&&habTemp()<=24&&S.D<=200&&S.D>=5;H.chromis=H.coral&&lf>=0.15;H.anthias=H.coral;H.butterfly=H.coral&&S.D<=60;
    H.snapper=H.coral&&S.D<=80;H.parrot=H.coral&&S.D<=30;H.clown=H.anem;H.rockfish=H.kelp||(habTemp()<=16&&S.D>=8&&S.D<=150);
    H.lantern=S.D>=200&&S.D<=1200;H.hatchet=S.D>=200&&S.D<=1000;H.moon=S.D<=150&&habTemp()>=6;H.nettle=habTemp()<=20&&S.D<=100;H.atolla=S.D>=400;H.comb=true;
    H.whaleshark=habTemp()>=22&&S.D>=8&&S.D<=200;H.hammer=habTemp()>=20&&S.D>=15&&S.D<=300;
    H.sperm=S.D>=300&&S.D<=2000;H.squid=S.D>=300&&S.D<=1000;H.siph=S.D>=300&&S.D<=1000;
    H.vampire=S.D>=600&&S.D<=1300;H.gulper=S.D>=500&&S.D<=3000;H.cucumber=S.D>=500&&S.D<=5000;H.dumbo=S.D>=1000&&S.D<=7000;
    H.snail=S.D>=6000&&S.D<=8200;H.amphi=S.D>=6000;
    {const st=wfStages(WF.t),w=S.loc==='whalefall';H.hagfish=w&&st.scav>0.05;H.sleeper=w&&st.scav>0.3;H.osedax=w&&st.enrich>0.1;H.crab=w;}
    H.dendro=TRUK.on;H.baitfish=TRUK.on||MANG.on;H.jack=TRUK.on;H.lionfish=TRUK.on;if(TRUK.on){H.manta=false;H.whaleshark=false;H.hammer=false;}
    ['psychro','seapig','tripod','rattail','ophiuroid','hyalonema'].forEach(k=>H[k]=ABY.on);
    ['enhalus','thalassia','rhizophora','avicennia','oyster','seahorse','cassiopea'].forEach(k=>H[k]=MANG.on);
    H.redfish=ROST.on;H.lophelia=ROST.on;H.geodia=ROST.on;H.acesta=ROST.on;
    if(ICE.on){Object.assign(H,{sardine:false,rockfish:false,nettle:false,manta:false,turtle:false,hammer:false,whaleshark:false,moon:false,krill:true,icefish:true,borch:true,seal:!S.night,pycno:true,icealgae:true});}
    else Object.assign(H,{icefish:false,borch:false,seal:false,pycno:false,icealgae:false});
    ['narwhal','beluga','polarcod','apherusa','melosira'].forEach(k=>H[k]=ARC.on);
    ['pearlocto','smanem','smsnail','smshrimp'].forEach(k=>H[k]=SMT.on);
    ['tetraclita','capitulum','mytilus','littorina','sargassum','tanem','heliocidaris'].forEach(k=>H[k]=TIDE.on);
    if(TIDE.on)Object.assign(H,{sardine:false,turtle:false,baitfish:true});
    if(ARC.on)Object.assign(H,{icealgae:true,sardine:false,rockfish:false,nettle:false,moon:false,comb:false,lantern:false,hatchet:false,sperm:false,squid:false,siph:false,atolla:false});
    {const v=S.loc==='vent';['rimicaris','kiwa','scalyfoot','giga','ventmussel','barnacle','ventanem'].forEach(k=>H[k]=v);}
  }
  mantaOn=H.manta;mantas.forEach(m=>m.visible=mantaOn);
  turtleOn=H.turtle;turtles.forEach(g=>g.visible=turtleOn);
  anglerOn=H.angler;anglers.forEach(g=>g.visible=anglerOn);if(!anglerOn){for(let i=0;i<3;i++)lure.size[i]=0;lure.g.attributes.aSize.needsUpdate=true;}
  const C=controls.target,near=(ry,dy)=>({cx:C.x,cy:C.y+dy,cz:C.z,rx:9,ry:ry,rz:9});
  const keep=(o,box)=>(dive&&o.active&&o.box)?o.box:box;
  if(dive){
    for(const k of['hammer','lantern','hatchet','snail']){const sp=FISH[k];sp.zr=ZR[k];setSchool(sp,H[k],keep(sp,near(k==='hammer'?4:2.5,k==='hammer'?-6:-1)));}
    for(const k of['sardine','chromis','anthias','butterfly','snapper','parrot','clown','rockfish','redfish','baitfish','jack','lionfish'])setSchool(FISH[k],false,null);
    for(const k in JELLY){const J=JELLY[k];J.zr=ZR[k]||[0,11000];setJelly(J,!!H[k],keep(J,near(4,-1)));}
    for(const k in DRIFT){const D=DRIFT[k];D.zr=k==='amphi'?[S.D-70,S.D]:ZR[k];setDrift(D,!!H[k],keep(D,k==='amphi'?{cx:C.x,cy:F+1.5,cz:C.z,rx:7,ry:1.4,rz:7}:near(2.5,-1)));}
    if(DIVE.dvm)dvmCounts();
    if(DIVE.bh)bhSchools();
  }else{
  const br=CORAL.branch.spots[0];
  setSchool(FISH.sardine,H.sardine,{cx:-4,cy:Math.min(F+Math.max(3,S.D*0.5),-2.5),cz:4,rx:3.5,ry:Math.min(2,S.D*0.18),rz:3.5});
  setSchool(FISH.chromis,H.chromis,{cx:br.x*0.5,cy:F+1.2,cz:br.z*0.5,rx:2.5,ry:0.6,rz:2.5});
  setSchool(FISH.anthias,H.anthias,{cx:1,cy:F+2.2,cz:0,rx:5.5,ry:1.2,rz:5.5});
  setSchool(FISH.butterfly,H.butterfly,{cx:0,cy:F+0.9,cz:0,rx:11,ry:0.5,rz:11});
  setSchool(FISH.snapper,H.snapper,{cx:BOMMIE[0][0]+1,cy:F+1.6,cz:BOMMIE[0][1],rx:2.2,ry:0.8,rz:2.2});
  setSchool(FISH.parrot,H.parrot,{cx:0,cy:F+0.9,cz:0,rx:9,ry:0.5,rz:9});
  setSchool(FISH.clown,H.clown,null,ANEM.map(a=>({x:a.x,y:floorY(a.x,a.z)+0.3,z:a.z})));
  setSchool(FISH.rockfish,H.rockfish,{cx:0,cy:Math.min(F+4,-2),cz:0,rx:10,ry:Math.min(3,S.D/3),rz:10});
  setSchool(FISH.lantern,H.lantern,{cx:0,cy:F+4,cz:0,rx:11,ry:3,rz:11});
  setSchool(FISH.redfish,!!H.redfish,{cx:0,cy:F+1.6,cz:0,rx:8,ry:0.9,rz:8});
  if(TRUK.on){const D=TRUK.Hh,b=trukW(38,D+3.5,0),j=trukW(30,D+6,4),l=trukW(-56,D+3.6,0),a=trukW(42,D+6,0),u=trukW(20,D+1,0);
    setSchool(FISH.baitfish,true,{cx:b.x,cy:b.y,cz:b.z,rx:5,ry:1.6,rz:5});setSchool(FISH.jack,true,{cx:j.x,cy:j.y,cz:j.z,rx:11,ry:2.5,rz:11});
    setSchool(FISH.lionfish,true,{cx:l.x,cy:l.y,cz:l.z,rx:3,ry:0.6,rz:3});setSchool(FISH.anthias,true,{cx:a.x,cy:a.y,cz:a.z,rx:3,ry:3,rz:3});
    setSchool(FISH.butterfly,true,{cx:u.x,cy:u.y,cz:u.z,rx:8,ry:0.6,rz:5});}
  else{['jack','lionfish'].forEach(k=>setSchool(FISH[k],false,null));
    /* juvenile fish shelter among the mangrove roots */
    setSchool(FISH.baitfish,MANG.on||TIDE.on,MANG.on?{cx:MANG.bankX-1.5,cy:-0.75,cz:0,rx:2.2,ry:0.35,rz:6}:TIDE.on?{cx:3,cy:-2.2,cz:0,rx:4,ry:0.8,rz:6}:null);}
  setSchool(FISH.hammer,H.hammer,{cx:0,cy:Math.min(F+9,-6),cz:0,rx:14,ry:3,rz:14});
  setSchool(FISH.hatchet,H.hatchet,{cx:0,cy:F+6,cz:0,rx:11,ry:4,rz:11});
  setSchool(FISH.snail,H.snail,{cx:0,cy:F+2,cz:0,rx:8,ry:1.5,rz:8});
  const jb={cx:0,cy:Math.min(F+S.D*0.5,F+7),cz:0,rx:13,ry:Math.min(S.D*0.45,6),rz:13};
  for(const k in JELLY)setJelly(JELLY[k],!!H[k],jb);
  for(const k in DRIFT)setDrift(DRIFT[k],!!H[k],k==='smshrimp'?{cx:0,cy:floorY(0,0)+0.15,cz:0,rx:5,ry:0.1,rz:5}:k==='polarcod'?{cx:ARC.ex-3,cy:-ARC.h-0.5,cz:0,rx:6,ry:0.3,rz:8}:k==='apherusa'?{cx:ARC.ex-2,cy:-ARC.h-0.15,cz:0,rx:3,ry:0.05,rz:3}:ICE.on&&k==='krill'?{cx:0,cy:-ICE.h-1.3,cz:0,rx:6,ry:0.8,rz:6}:k==='borch'?{cx:ICE.hx,cy:-ICE.h-0.5,cz:ICE.hz,rx:7,ry:0.25,rz:7}:k==='icefish'?{cx:0,cy:floorY(0,0)+0.3,cz:0,rx:7,ry:0.2,rz:7}:k==='amphi'?{cx:0,cy:F+1.5,cz:0,rx:7,ry:1.4,rz:7}:k==='hagfish'?{cx:0,cy:floorY(0,0)+0.5,cz:0,rx:4,ry:0.45,rz:8}:{cx:0,cy:F+3,cz:0,rx:10,ry:2.5,rz:10});
  }
  const z=zEff();
  diverOn=!dive&&(S.D<=60||ARC.on)&&!MANG.on;
  sparkleOn=S.night&&z<=150;deepFlashOn=z>=150;
  rays.visible=!S.night&&(dive?z<200:(ARC.on||(lf>0.002&&S.D<=200)));
  if(bloom){const glow=S.night||z>200;bloom.strength=glow?0.7:0.3;bloom.threshold=glow?0.7:0.85;bloom.radius=glow?0.35:0.3;}
  if(dive&&!DIVE.manualTorch){const want=z>(DIVE.bh?55:250)?'white':'off';if(S.torch!==want){S.torch=want;U.uTorch.value=want==='off'?0:2.6;U.uTorchCol.value.set(1.1,1.0,0.88);
    [...$('torchSeg').children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===S.torch));}}
}
function applyDepth(newD){
  const old=S.D;S.D=newD;const dy=old-newD;
  camera.position.y+=dy;controls.target.y+=dy;
  for(let i=0;i<NS;i++)snow.pos[i*3+1]+=dy;
  for(const k in FISH){const sp=FISH[k];if(sp.active)for(let i=0;i<sp.n;i++)sp.p[i*3+1]+=dy;}
  for(const k in JELLY){const J=JELLY[k];if(J.active){for(let i=0;i<J.n;i++)J.p[i*3+1]+=dy;J.resetT=true;}}
  bubbles.forEach(b=>b.on=false);sparkAge.fill(99);
  rebuild();
}

