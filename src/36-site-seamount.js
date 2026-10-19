/* =========================================================
   14t. Davidson Seamount, off central California: the "Octopus Garden" (~3,200 m).
   - Davidson Seamount: an extinct submarine volcano ~129 km SW of Monterey, 42 km long, 13 km wide, rising 2,280 m
     to a summit 1,250 m deep; 9–15 million years old; 237 species and 27 kinds of deep-sea coral recorded;
     part of Monterey Bay National Marine Sanctuary since 2008/2009 (Wikipedia, NOAA MBNMS).
   - Octopus Garden, on a small hill near its base (discovered 2018): 5,718 octopuses counted in 2.5 ha, 4,707 of them
     nesting females (Muusoctopus robustus, the "pearl octopus"); perhaps more than 20,000 in all. Hydrothermal springs
     warm the cracks to as much as 10.8 °C against 1.6 °C ambient; brooding lasts ~1.8 years instead of the many years
     expected in cold water. The only visible sign of the springs is a mirage-like shimmer.
     Small shrimp and predatory snails scavenge eggs and hatchlings; anemones among the mothers eat hatchlings
     and dead mothers (Barry et al. 2023, Science Advances; AAAS; CNN).
   Rendering: a patch of pillow lava (Voronoi lumps) on the flank of a knoll; mothers clustered round four springs;
   the shimmer is a screen-space ripple in the final post-processing pass (wbPass).
   ========================================================= */
const SMT={on:false,size:46,seg:230,seeps:[[0.7,0.5],[-1.5,1.3],[1.9,-1.4],[-0.5,-2.1]],top:[-9,-7]};
/* pillow lava: rounded lumps separated by cracks; on the flank of a knoll that rises to the back-left */
function smtPillow(x,z){const[d1,d2]=cell2(x*0.75+3.1,z*0.75+1.7);return Math.sqrt(sstep(0,0.42,d2-d1))*0.42*(0.7+0.6*hash3(Math.floor(x*0.75+3.1),Math.floor(z*0.75+1.7),5));}
function smtFloor(x,z){
  const r=Math.hypot(x,z),fade=sstep(23,15,r),dx=x-SMT.top[0],dz=z-SMT.top[1];
  const knoll=4.2*Math.exp(-(dx*dx+dz*dz)/(2*8.5*8.5));
  return -S.D+fade*(knoll+smtPillow(x,z)+0.06*Math.sin(x*2.7+z*1.9)*Math.sin(z*3.1));
}
const smtGeo=new THREE.PlaneGeometry(SMT.size,SMT.size,SMT.seg,SMT.seg);smtGeo.rotateX(-Math.PI/2);
smtGeo.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(smtGeo.attributes.position.count*3),3));
const smtRock=new THREE.Mesh(smtGeo,waterify(lambert(),'smtRock'));smtRock.visible=false;scene.add(smtRock);
const seepW=(x,z)=>{let w=0;for(const s of SMT.seeps){const d2=(x-s[0])**2+(z-s[1])**2;w+=Math.exp(-d2/(2*1.1*1.1));}return w;};
function paintSmt(){
  const p=smtGeo.attributes.position,c=smtGeo.attributes.color;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=smtFloor(x,z);p.setY(i,y);
    const[d1,d2]=cell2(x*0.75+3.1,z*0.75+1.7),crack=sstep(0.12,0.0,d2-d1);
    const n=0.5+0.3*Math.sin(x*5.1+z*3.3)*Math.sin(z*6.7)+0.2*Math.sin(x*17+z*13);
    let col=mixc([0.2,0.19,0.18],[0.13,0.12,0.12],n);                                   /* dark basalt */
    col=mixc(col,[0.46,0.43,0.37],crack*0.7);                                               /* pale sediment collects in the cracks */
    col=mixc(col,[0.42,0.32,0.18],Math.min(1,seepW(x,z))*crack*0.6);                        /* iron-stained cracks where the springs seep */
    const[s1]=cell2(x*6,z*6+9);if(s1<0.07)col=mixc(col,[0.5,0.48,0.44],0.5);                  /* dusting of sediment */
    c.setXYZ(i,col[0],col[1],col[2]);}
  p.needsUpdate=true;c.needsUpdate=true;smtGeo.computeVertexNormals();
}
const _sn=new THREE.Vector3();
function smtNormal(x,z){const e=0.06;_sn.set(smtFloor(x-e,z)-smtFloor(x+e,z),2*e,smtFloor(x,z-e)-smtFloor(x,z+e)).normalize();return _sn;}
/* ---- brooding pearl octopus (Muusoctopus robustus): pale lilac, arms curled down over the eggs on the rock;
   ~35 cm across. The mantle swells and relaxes as she pumps water over the eggs ---- */
const octoGeo=(()=>{const acc=Acc(),skin=(x,y,z)=>{const m=0.5+0.5*Math.sin(x*60+z*45)*Math.sin(y*70);return mixc([0.46,0.36,0.45],[0.34,0.25,0.34],m*0.7);};
  addGeo(acc,new THREE.SphereGeometry(1,18,12),M4(0,0.1,-0.07,-0.35,0,0,0.062,0.05,0.115),skin);                 /* mantle, lying back over the eggs */
  addGeo(acc,new THREE.SphereGeometry(1,14,10),M4(0,0.085,0.035,0,0,0,0.07,0.05,0.065),skin);                  /* head */
  for(const sg of[1,-1]){addGeo(acc,new THREE.SphereGeometry(1,10,8),M4(sg*0.05,0.1,0.045,0,0,0,0.016,0.018,0.016),()=>[0.62,0.55,0.58]);
    addGeo(acc,new THREE.SphereGeometry(1,8,6),M4(sg*0.066,0.102,0.056,0,0,0,0.01,0.014,0.01),()=>[0.06,0.05,0.06]);}
  /* web and arms: a low skirt, then eight arms curling down onto the rock */
  addColored(acc,loftGeo(6,32,(a,b)=>{const ph=b*6.283,lob=0.75+0.25*Math.pow(Math.abs(Math.cos(ph*4)),0.5),r=0.04+a*0.1*lob,y=0.075-a*0.06;
    const x=r*Math.cos(ph),z=r*Math.sin(ph);return[x,y,z,...skin(x,y,z)];}));
  for(let k=0;k<8;k++){const a0=k/8*6.283+0.2*Math.sin(k*2.3),L=0.2+0.05*Math.sin(k*1.7);
    addColored(acc,loftGeo(16,6,(a,b)=>{const ph=b*6.283,s=a*L,curl=sstep(0.55,1,a);
      const rr=0.06+s*0.75-curl*0.05,ang=a0+curl*0.9*Math.sin(k)*0.6,y=0.06-0.055*sstep(0,0.5,a)+0.03*curl*Math.sin(a*9);
      const cx=Math.cos(ang)*rr,cz=Math.sin(ang)*rr,w=0.014*(1-0.85*a)+0.002;
      const x=cx+Math.sin(ang)*w*Math.cos(ph),yy=y+w*Math.sin(ph)*0.8,z=cz-Math.cos(ang)*w*Math.cos(ph);
      return[x,yy,z,...mixc(skin(x,yy,z),[0.66,0.58,0.62],Math.sin(ph)<-0.3?0.6:0)];}));}
  return finishGeo(acc);})();
const octoMat=waterify(lambert(),'octoGarden',{vBegin:'{ float ph=instanceMatrix[3].x*3.7+instanceMatrix[3].z*2.9; float p=0.5+0.5*sin(uTime*1.3+ph); float m=smoothstep(0.1,0.2,position.y); transformed.xz*=1.0+0.07*p*m; transformed.y+=0.01*p*m; }'});
const octos=new THREE.InstancedMesh(octoGeo,octoMat,1100);octos.frustumCulled=false;octos.count=0;scene.add(octos);
/* ---- white anemones among the mothers, small predatory snails, and a few deep-sea corals and sponges up the knoll ---- */
const smAnemGeo=(()=>{const acc=Acc();addGeo(acc,new THREE.CylinderGeometry(0.035,0.045,0.07,10),M4(0,0.035,0),()=>[0.62,0.58,0.55]);
  for(let k=0;k<18;k++){const a=k/18*6.283,tl=0.05+0.02*(k%2);addGeo(acc,new THREE.CylinderGeometry(0.003,0.005,tl,4),M4(Math.cos(a)*0.03,0.07+tl*0.35,Math.sin(a)*0.03,Math.sin(a)*0.9,0,-Math.cos(a)*0.9),()=>[0.7,0.64,0.6]);}
  return finishGeo(acc);})();
const smAnems=new THREE.InstancedMesh(smAnemGeo,waterify(lambert(),'smAnem'),160);smAnems.frustumCulled=false;smAnems.count=0;scene.add(smAnems);
const snailGeo=(()=>{const acc=Acc();for(let k=0;k<5;k++)addGeo(acc,new THREE.SphereGeometry(1,10,8),M4(0,0.012+k*0.008,-k*0.008,0,0,0,0.024-k*0.004,0.016-k*0.002,0.026-k*0.004),()=>k%2?[0.72,0.66,0.58]:[0.62,0.55,0.48]);
  addGeo(acc,new THREE.CylinderGeometry(0.003,0.006,0.03,5),M4(0,0.01,0.03,Math.PI/2.4),()=>[0.75,0.7,0.65]);return finishGeo(acc);})();
const snails=new THREE.InstancedMesh(snailGeo,waterify(lambert(),'smSnail'),50);snails.frustumCulled=false;snails.count=0;scene.add(snails);
makeDrift('smshrimp',{n:24,size:[0.04,0.06],spd:0.06,minAb:0.05,jitter:true,geo:(()=>{const acc=Acc();
  for(let k=0;k<6;k++)addGeo(acc,new THREE.SphereGeometry(1,8,6),M4(0,0.02*Math.cos(k*0.5),0.3-k*0.12,0,0,0,0.08-k*0.008,0.08-k*0.008,0.08),()=>[0.95,0.6,0.5]);
  addGeo(acc,new THREE.CylinderGeometry(0.006,0.002,0.7,4),M4(0.04,0.08,0.6,1.3,0,0.2),()=>[0.95,0.7,0.6]);addGeo(acc,new THREE.CylinderGeometry(0.006,0.002,0.7,4),M4(-0.04,0.08,0.6,1.3,0,-0.2),()=>[0.95,0.7,0.6]);
  return finishGeo(acc);})()});
DRIFT.smshrimp.upright=false;
regPick(smtRock,'smt_rock');regPick(octos,'pearlocto');regPick(smAnems,'smanem');regPick(snails,'smsnail');regPick(DRIFT.smshrimp.mesh,'smshrimp');
let smtOk=0;
function buildSeamount(on){
  SMT.on=on;smtOn=on;smtRock.visible=on;
  if(!on){octos.count=smAnems.count=snails.count=0;smtShim(false);return;}
  paintSmt();
  /* mothers crowd round the springs, each needing a hand's breadth of rock */
  const grid=new Map(),key=(x,z)=>Math.floor(x/0.24)+','+Math.floor(z/0.24);let k=0;
  const free=(x,z)=>{const gx=Math.floor(x/0.24),gz=Math.floor(z/0.24);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const q=grid.get((gx+a)+','+(gz+b));if(q&&Math.hypot(q[0]-x,q[1]-z)<0.3)return false;}return true;};
  for(let i=0;i<30000&&k<octos.instanceMatrix.count*PERF.k;i++){const x=R(-9,9),z=R(-9,9);const w=seepW(x,z);if(rnd()>Math.min(0.9,w*w)+0.004)continue;if(!free(x,z))continue;
    const[d1,d2]=cell2(x*0.75+3.1,z*0.75+1.7);if(d2-d1<0.05&&rnd()<0.6)continue;                       /* not right in the open crack */
    grid.set(key(x,z),[x,z]);const n=smtNormal(x,z);_q.setFromUnitVectors(UP,n);_e.set(0,rnd()*6.28,0);_q.multiply(new THREE.Quaternion().setFromEuler(_e));
    _s.setScalar(R(0.85,1.15));_p.set(x,smtFloor(x,z)-0.01,z);_m.compose(_p,_q,_s);octos.setMatrixAt(k++,_m);}
  octos.count=k;octos.instanceMatrix.needsUpdate=true;smtOk=k;
  k=0;for(let i=0;i<4000&&k<smAnems.instanceMatrix.count;i++){const x=R(-7,7),z=R(-7,7);if(rnd()>seepW(x,z)*0.5+0.05||!free(x,z))continue;
    grid.set(key(x,z)+'a',[x,z]);_q.setFromUnitVectors(UP,smtNormal(x,z));_s.setScalar(R(0.7,1.3));_p.set(x,smtFloor(x,z)-0.005,z);_m.compose(_p,_q,_s);smAnems.setMatrixAt(k++,_m);}
  smAnems.count=k;smAnems.instanceMatrix.needsUpdate=true;
  k=0;for(let i=0;i<50;i++){const s=SMT.seeps[i%4],a=rnd()*6.28,r=R(0.5,2.5),x=s[0]+Math.cos(a)*r,z=s[1]+Math.sin(a)*r;
    _q.setFromUnitVectors(UP,smtNormal(x,z)).multiply(new THREE.Quaternion().setFromEuler(_e.set(0,rnd()*6.28,0)));_s.setScalar(R(0.8,1.2));_p.set(x,smtFloor(x,z),z);_m.compose(_p,_q,_s);snails.setMatrixAt(k++,_m);}
  snails.count=k;snails.instanceMatrix.needsUpdate=true;
}
/* shimmer of warm water over each spring: projected to the screen and handed to the post-processing pass */
const _sh0=new THREE.Vector3(),_sh1=new THREE.Vector3(),_sh2=new THREE.Vector3();
function smtShim(on){if(!wbPass)return;wbPass.uniforms.uShN.value=on?SMT.seeps.length:0;}
function stepSeamount(dt,t){
  if(!SMT.on||!wbPass)return;
  const P=wbPass.uniforms.uSh.value,W=wbPass.uniforms.uShW.value;let n=0;
  for(const s of SMT.seeps){const y=smtFloor(s[0],s[1]);
    _sh0.set(s[0],y+0.05,s[1]);_sh1.set(s[0]+CUR.x*S.cur*3,y+1.1,s[1]+CUR.z*S.cur*3);
    const dist=_sh0.distanceTo(camera.position);if(dist>22)continue;
    _sh2.copy(_sh0).applyMatrix4(camera.matrixWorldInverse);if(_sh2.z>-0.3)continue;
    _sh0.project(camera);_sh1.project(camera);
    P[n].set(_sh0.x*0.5+0.5,_sh0.y*0.5+0.5,_sh1.x*0.5+0.5,_sh1.y*0.5+0.5);W[n]=Math.min(0.12,0.28/dist)*Math.min(1,(22-dist)/6);n++;}
  wbPass.uniforms.uShN.value=n;wbPass.uniforms.uShT.value=t;
}
const SMT_INFO={
  smt_rock:['戴维森海山的枕状熔岩','已熄灭的海底火山 · 约 900 万–1,500 万年前形成','海底火山喷出的熔岩一遇冷水，外壳立刻凝固，里面的岩浆再把它撑破、挤出，堆成一个个“枕头”。戴维森海山长 42 km、宽 13 km，从海底拔起约 2,280 m，山顶仍在水下 1,250 m。山上记录到 237 种生物、27 类深海珊瑚，2009 年起归入蒙特雷湾国家海洋保护区。','戴维森海山 · 约 3,200 m'],
  smt_seep:['温泉','裂缝里的水最高约 10.8 °C · 周围只有 1.6 °C','海山脚下的岩石裂缝里渗出被地热加温的海水。水几乎看不出颜色，唯一的迹象是水面上方像海市蜃楼一样的“抖动”——那是温水和冷水密度不同，让光线发生折射。','戴维森海山 · 章鱼花园']
};
Object.assign(CHIM_INFO,SMT_INFO);
CAT.push(['pearlocto','珍珠章鱼（孵卵中）','Muusoctopus robustus','约 3,200 m · 戴维森海山'],['smanem','深海海葵','Actiniaria','章鱼花园'],
  ['smsnail','捕食性螺','Buccinoidea 等','章鱼花园'],['smshrimp','深海小虾','Caridea','章鱼花园']);
CAT.slice(-4).forEach(c=>CATMAP[c[0]]=c);
Object.assign(FACTS,{
  pearlocto:'雌章鱼把卵产在温泉渗出的岩缝上，然后倒伏在卵上一动不动地守护，不吃东西，直到卵孵化后死去。2018 年发现这里时，一小块 2.5 公顷的范围内就数出 5,718 只，其中 4,707 只在孵卵，整片可能超过两万只。温水让卵约 1.8 年就孵化，在冰冷的深海里要长得多。',
  smanem:'夹在孵卵的章鱼妈妈之间，吃刚孵出的小章鱼和死去的母亲，把能量留在这片“花园”里。',
  smsnail:'在章鱼窝之间爬行，吃被遗弃的卵、捕捉刚孵出的小章鱼。',
  smshrimp:'小虾在章鱼窝周围游走，捡食没有母亲守护的卵。'
});
SPECIES.push(['pearlocto','珍珠章鱼'],['smanem','深海海葵'],['smsnail','捕食性螺'],['smshrimp','深海小虾']);
