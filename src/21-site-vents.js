/* =========================================================
   14k. Hydrothermal vents: Longqi field, Southwest Indian Ridge (~2,800 m), after Copley et al. 2016.
   Black smoke: metal sulfides precipitating as >300 °C fluid meets 2 °C seawater.
   Plume: buoyant point-source plume, radius ≈ 0.12·height, rise speed ∝ height^(-1/3), bent by the current.
   Fauna zoned outward from the fluid: shrimp, yeti crabs, scaly-foot snails → Gigantopelta, mussels → barnacles, anemones.
   ========================================================= */
const ventGroup=new THREE.Group();ventGroup.visible=false;scene.add(ventGroup);
const chimMat=waterify(lambert(),'chimney');
const CHIM=[
  {key:'chim_main',x:0,z:-1,h:6,r0:1.3,r1:0.32,smoke:0.55,seed:1},
  {key:'chim_tall',x:-9,z:-13,h:22,r0:2.1,r1:0.75,smoke:0.2,seed:2},
  {key:'chim_mound',x:-6.5,z:5,h:8,r0:3.2,r1:1.4,smoke:0,seed:3},
  {key:'chim_dead',x:9,z:6,h:9,r0:1.2,r1:0.4,smoke:0,seed:4,dead:true},
  {key:'chim_dead',x:13,z:-9,h:12,r0:1.6,r1:0.5,smoke:0,seed:5,dead:true}
];
for(let k=0;k<6;k++){const a=k/6*Math.PI*2;CHIM.push({key:'chim_hydra',x:7+Math.cos(a)*1.7,z:-5+Math.sin(a)*1.7,h:R(1.8,2.6),r0:0.5,r1:0.14,smoke:0.04,seed:10+k});}
const chimR=(c,y)=>{const u=y/c.h;return(c.r0+(c.r1-c.r0)*Math.pow(u,0.7))*(1+0.22*Math.pow(Math.max(0,Math.sin(y*2.1+c.seed*3)),8));};
function chimneyGeo(c){
  const pts=[];const N=Math.max(16,Math.round(c.h*6));
  for(let i=0;i<=N;i++){const y=i/N*c.h;pts.push(new THREE.Vector2(chimR(c,y)*(1+0.1*Math.sin(y*5.3+c.seed)),y));}
  pts.push(new THREE.Vector2(0.001,c.h));
  const g=new THREE.LatheGeometry(pts,24),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),k=1+0.12*Math.sin(a*3+y*1.7+c.seed)+0.06*Math.sin(a*7-y*3.1);p.setX(i,x*k);p.setZ(i,z*k);}
  g.computeVertexNormals();
  const acc=Acc();addGeo(acc,g,null,(x,y,z)=>{const u=y/c.h,n=0.5+0.5*Math.sin(x*4+y*3.3)*Math.sin(z*5-y*2.1);
    let col=mixc([0.07,0.065,0.06],[0.15,0.12,0.09],n);
    if(c.dead||u<0.5)col=mixc(col,[0.55,0.3,0.12],sstep(0.55,0.85,n)*(c.dead?0.8:0.6));
    if(!c.dead&&u>0.86)col=mixc(col,[0.8,0.78,0.72],sstep(0.55,0.85,n)*0.6);
    if(n>0.96)col=[0.7,0.55,0.18];return col;});
  return finishGeo(acc);
}
const chimMeshes=CHIM.map(c=>{c.y0=0;const m=new THREE.Mesh(chimneyGeo(c),chimMat);m.position.set(c.x,0,c.z);m.userData.c=c;ventGroup.add(m);return m;});
/* animals: small instanced shapes, placed by zone on chimney walls and the surrounding floor */
const VFA={};
function vfMesh(key,geo,mat,n){const m=new THREE.InstancedMesh(geo,mat,n);m.frustumCulled=false;m.count=0;ventGroup.add(m);VFA[key]=m;return m;}
const vMat=waterify(lambert(),'ventfauna');
vfMesh('scalyfoot',(()=>{const acc=Acc();addGeo(acc,new THREE.SphereGeometry(1,10,8),M4(0,0.55,0,0.3,0,0,0.8,0.62,0.95),(x,y,z)=>(Math.sin(Math.atan2(z,x)*3+y*8)>0.6?[0.22,0.2,0.19]:[0.4,0.37,0.33]));
  addGeo(acc,new THREE.BoxGeometry(1.4,0.35,1.5),M4(0,0.15,0.1),(x,y,z)=>(Math.sin(x*30)*Math.sin(z*30)>0.2?[0.05,0.05,0.06]:[0.14,0.13,0.13]));return finishGeo(acc);})(),vMat,700);
vfMesh('rimicaris',(()=>{const acc=Acc(),c=()=>[0.96,0.82,0.74];addGeo(acc,new THREE.SphereGeometry(1,10,6),M4(0,0.25,0.15,0,0,0,0.28,0.24,0.55),c);
  addGeo(acc,new THREE.SphereGeometry(1,8,5),M4(0,0.2,-0.45,0,0,0,0.16,0.12,0.4),c);addGeo(acc,triGeo([0,0.2,-0.8, 0.22,0.2,-1.05, -0.22,0.2,-1.05],true),null,c);
  for(const s of[1,-1])for(let k=0;k<4;k++)addGeo(acc,new THREE.CylinderGeometry(0.02,0.015,0.45,3),M4(s*0.22,0.05,0.25-k*0.15,0,0,s*1.0),c);
  return finishGeo(acc);})(),vMat,160);
vfMesh('kiwa',(()=>{const acc=Acc(),c=(x,y,z)=>(Math.sin(x*40)*Math.sin(z*40+y*30)>0.3?[0.98,0.96,0.9]:[0.88,0.84,0.78]);
  addGeo(acc,new THREE.SphereGeometry(1,12,8),M4(0,0.3,0,0,0,0,0.5,0.3,0.62),c);
  for(const s of[1,-1]){for(let k=0;k<3;k++)addGeo(acc,new THREE.CylinderGeometry(0.04,0.03,0.9,4),M4(s*0.75,0.18,-0.25+k*0.25,0,0,s*1.1),c);
    addGeo(acc,new THREE.CylinderGeometry(0.11,0.08,1.1,6),M4(s*0.55,0.35,0.75,1.2,s*0.5,0),c);
    for(let h=0;h<10;h++)addGeo(acc,new THREE.CylinderGeometry(0.012,0.012,0.22,3),M4(s*(0.45+h*0.03),0.42+R(-0.05,0.05),0.45+h*0.07,R(-1,1),0,R(-1,1)),()=>[1,0.98,0.94]);}
  return finishGeo(acc);})(),vMat,14);
vfMesh('giga',(()=>{const acc=Acc();addGeo(acc,new THREE.SphereGeometry(1,12,8),M4(0,0.45,0,0,0,0,1,0.5,1.1),(x,y,z)=>mixc([0.36,0.27,0.2],[0.6,0.48,0.36],sstep(-0.3,0.6,Math.sin(Math.atan2(z,x)*2+Math.hypot(x,z)*9))));
  addGeo(acc,new THREE.SphereGeometry(1,8,5),M4(0,0.12,0.1,0,0,0,0.85,0.15,1.0),()=>[0.75,0.6,0.5]);return finishGeo(acc);})(),vMat,320);
vfMesh('ventmussel',musselGeo,urchinMat,240);
vfMesh('barnacle',(()=>{const acc=Acc();addGeo(acc,new THREE.CylinderGeometry(0.16,0.2,1,8),M4(0,0.5,0),()=>[0.5,0.4,0.32]);
  addGeo(acc,new THREE.ConeGeometry(0.32,0.7,6),M4(0,1.3,0),(x,y)=>mixc([0.92,0.9,0.85],[0.75,0.72,0.66],sstep(1.0,1.6,y)));return finishGeo(acc);})(),vMat,280);
vfMesh('ventanem',(()=>{const acc=Acc();addGeo(acc,new THREE.CylinderGeometry(0.3,0.35,0.6,10),M4(0,0.3,0),()=>[0.95,0.92,0.88]);
  for(let k=0;k<16;k++){const a=k/16*Math.PI*2;addGeo(acc,new THREE.CylinderGeometry(0.03,0.05,0.55,4),M4(Math.cos(a)*0.28,0.75,Math.sin(a)*0.28,Math.sin(a)*0.7,0,-Math.cos(a)*0.7),()=>[1,0.86,0.86]);}
  return finishGeo(acc);})(),vMat,70);
const shrimpS=[];
function onChimney(c,u,a,out){const y=u*c.h,r=chimR(c,y)*(1+0.12*Math.sin(a*3+y*1.7+c.seed));out.pos.set(c.x+Math.cos(a)*r,c.y0+y,c.z+Math.sin(a)*r);out.n.set(Math.cos(a),0.35,Math.sin(a)).normalize();return out;}
const _sp={pos:new THREE.Vector3(),n:new THREE.Vector3()};
function setInst(mesh,i,pos,n,sc,spin){_q.setFromUnitVectors(UP,n);_qt.setFromAxisAngle(n,spin);_q.premultiply(_qt);_s.setScalar(sc);_m.compose(pos,_q,_s);mesh.setMatrixAt(i,_m);}
let ventOn=false,ventBase=0;
function buildVent(on){
  ventOn=on;ventGroup.visible=on;if(!on)return;
  let mn=0,n=0;for(const c of CHIM){mn+=floorY(c.x,c.z);n++;}ventBase=mn/n;ventGroup.position.set(0,ventBase-0.25,0);
  CHIM.forEach((c,i)=>{c.y0=floorY(c.x,c.z)-ventGroup.position.y-0.35;chimMeshes[i].position.y=c.y0;});
  const live=CHIM.filter(c=>!c.dead&&c.smoke>0),act=CHIM.filter(c=>!c.dead);
  const fill=(key,count,pick)=>{const m=VFA[key];let k=0;for(let i=0;i<count;i++){const r=pick(i);if(!r)continue;setInst(m,k++,r.pos,r.n,r.s,rnd()*6.28);}m.count=k;m.instanceMatrix.needsUpdate=true;};
  fill('scalyfoot',700,i=>{const c=live[i%live.length];onChimney(c,R(0.5,0.93),rnd()*6.28,_sp);return{pos:_sp.pos.clone(),n:_sp.n.clone(),s:R(0.035,0.05)};});
  fill('kiwa',14,i=>{const c=live[i%2];onChimney(c,R(0.55,0.85),rnd()*6.28,_sp);return{pos:_sp.pos.clone(),n:_sp.n.clone(),s:R(0.1,0.14)};});
  fill('giga',320,i=>{const c=act[i%act.length];onChimney(c,R(0.12,0.55),rnd()*6.28,_sp);return{pos:_sp.pos.clone(),n:_sp.n.clone(),s:R(0.04,0.06)};});
  const ring=(c,d0,d1)=>{const a=rnd()*6.28,d=c.r0+R(d0,d1),x=c.x+Math.cos(a)*d,z=c.z+Math.sin(a)*d;return{pos:new THREE.Vector3(x,floorY(x,z)-ventGroup.position.y+0.02,z),n:new THREE.Vector3(R(-0.2,0.2),1,R(-0.2,0.2)).normalize()};};
  fill('ventmussel',240,i=>{const c=act[i%act.length],r=ring(c,0,1.6);r.s=R(0.06,0.1);return r;});
  fill('barnacle',280,i=>{if(i<120){const c=CHIM.filter(c=>c.dead)[i%2];onChimney(c,R(0.05,0.9),rnd()*6.28,_sp);return{pos:_sp.pos.clone(),n:_sp.n.clone(),s:R(0.05,0.08)};}
    const r=ring(CHIM[0],3,8);r.s=R(0.05,0.08);return r;});
  fill('ventanem',70,i=>{const r=ring(CHIM[0],4.5,10);r.s=R(0.07,0.11);return r;});
  shrimpS.length=0;const m=VFA.rimicaris;for(let i=0;i<160;i++)shrimpS.push({c:live[i%live.length],u:R(0.8,0.98),a:rnd()*6.28,s:R(0.04,0.055),ph:rnd()*6.28});m.count=160;
}
/* black smoke */
const NSMK=3200;
const smoke=makePoints(NSMK,`varying float vA; void main(){ float r=length(gl_PointCoord-0.5)*2.0; if(r>1.0) discard;
  vec3 v=vWPos-cameraPosition; float d=length(v); vec3 T=exp(-uC*d);
  vec3 c=vec3(0.07,0.062,0.055)*(torchAt(vWPos,1.0)*1.6+lightAt(-vWPos.y)*uSky);
  c=c*T+bgCol(v/d)*(1.0-T);
  gl_FragColor=vec4(c,vA*(1.0-r*r)*clamp(T.g*1.3,0.0,1.0));`);
smoke.pts.material.vertexShader=smoke.pts.material.vertexShader.replace('attribute float aSeed;','attribute float aSeed; varying float vA;').replace('vSeed=aSeed;','vSeed=aSeed; vA=aSeed;');
smoke.pts.material.fragmentShader=smoke.pts.material.fragmentShader.replace('varying float vA;','').replace('varying float vSeed;','varying float vSeed; varying float vA;');
const SMK=[];for(let i=0;i<NSMK;i++)SMK.push({src:null,z:R(0,22),u:Math.sqrt(rnd()),phi:rnd()*6.28,w:R(0.6,1.4),seed:rnd()});
const W0=1.5;
function stepVent(dt,t){
  if(!ventOn){if(smoke.pts.visible){smoke.pts.visible=false;}return;}
  smoke.pts.visible=true;const srcs=CHIM.filter(c=>c.smoke>0),tot=srcs.reduce((a,c)=>a+c.smoke,0),gy=ventGroup.position.y;
  for(let i=0;i<NSMK;i++){const P=SMK[i];
    if(!P.src){let r=rnd()*tot;for(const c of srcs){r-=c.smoke;if(r<=0){P.src=c;break;}}P.src=P.src||srcs[0];}
    const c=P.src,zMax=c===CHIM[1]?30:c.key==='chim_hydra'?8:22;
    P.z+=W0*P.w*Math.pow(1+P.z/0.4,-1/3)*dt;P.phi+=dt*(0.4+P.seed*0.6);
    if(P.z>zMax){P.z=0;P.u=Math.sqrt(rnd());P.src=null;continue;}
    const b=0.08+0.12*P.z,rr=b*P.u*(1+0.25*Math.sin(t*1.7+P.seed*40)),bend=S.cur*P.z*1.6;
    const o=i*3;smoke.pos[o]=c.x+Math.cos(P.phi)*rr+CUR.x*bend;smoke.pos[o+1]=gy+c.y0+c.h+P.z;smoke.pos[o+2]=c.z+Math.sin(P.phi)*rr+CUR.z*bend;
    smoke.size[i]=(0.25+0.16*P.z)*(c.key==='chim_hydra'?0.5:1);smoke.sd[i]=0.8*Math.exp(-P.z/(zMax*0.5))*Math.min(1,P.z*4+0.3);}
  smoke.g.attributes.position.needsUpdate=true;smoke.g.attributes.aSize.needsUpdate=true;smoke.g.attributes.aSeed.needsUpdate=true;
  const m=VFA.rimicaris;
  for(let i=0;i<shrimpS.length;i++){const s=shrimpS[i];s.a+=Math.sin(t*0.9+s.ph)*0.15*dt;s.u=Math.min(0.98,Math.max(0.75,s.u+Math.cos(t*1.3+s.ph)*0.02*dt));
    onChimney(s.c,s.u,s.a,_sp);setInst(m,i,_sp.pos,_sp.n,s.s,s.ph+t*0.2);}
  m.instanceMatrix.needsUpdate=true;
}
const CHIM_INFO={
  chim_main:[$t('黑烟囱'),$t('热液喷口 · 约 6 m 高'),$t('海水从海底裂缝渗下去，被岩浆加热到 300 多摄氏度，溶进铁、铜、锌等金属后从这里喷出；一碰到 2 °C 的海水，金属硫化物瞬间析出，就成了“黑烟”。这里压强约 280 个大气压，海水要到约 400 °C 才会沸腾，所以热液不会沸腾。')],
  chim_tall:[$t('如意金箍棒'),$t('硫化物柱 · 20 m 以上'),$t('龙旂热液区里一根 20 多米高的硫化物柱，科考队给它起了这个名字。烟囱由析出的硫化物一层层堆起来，这么高说明这里的喷发已经持续了很久。')],
  chim_hydra:[$t('九头蛇（Hydra）'),$t('一圈六根小烟囱 · 约 2 m 高'),$t('六根小烟囱围成一圈。年轻的黑烟囱上以盲虾和铁甲蜗牛为主，老一些、只剩弥散流的烟囱则被巨螺、贻贝和藤壶占据。')],
  chim_mound:[$t('弥散流烟囱'),$t('温度较低的热液慢慢渗出'),$t('这里没有黑烟，较凉的热液从岩体缝隙里渗出，外围长满了巨螺和贻贝。')],
  ice_under:[$t('海冰底面与冰藻'),$t('海冰厚约 2 m · 水温 −1.9 °C'),$t('阳光穿过约 2 m 厚的海冰和积雪后只剩百分之几，冰底那些褐色的斑块是冰藻：硅藻等微藻生活在海冰底部和下方松散的“片状冰”里，靠这一点点光进行光合作用，是南极磷虾等动物的重要食物。'),$t('南极麦克默多湾')],
  spawn_bundle:[$t('卵精束'),$t('直径约 1–2 mm · 画面中放大约 15 倍'),$t('一个卵精束里裹着几十粒卵和成千上万个精子。卵富含脂质，比海水轻，所以卵精束会上浮；到水面后约一小时内散开，卵才和来自其他珊瑚的精子相遇。同一珊瑚自己的卵和精子大多不能互相受精。'),$t('珊瑚产卵之夜')],
  brine_surf:[$t('盐池的“湖面”'),$t('卤水与海水的分界面 · 水深约 650 m'),$t('这里的卤水含盐量约为海水的 4 倍，密度约 1.09 g/cm³，比海水重，所以沉在海底聚成一个“湖”，有清晰的湖面和湖岸，不和上面的海水混合。两层水密度只差约 6%，湖面波浪的回复力只有普通水面的约 3%，1 米长的波要 4–5 秒才起伏一次。你刚才碰到的地方会慢慢荡开一圈波纹。潜水器可以像船一样“停”在这个湖面上。'),$t('墨西哥湾 NR1 盐池')],
  brine_dead:[$t('误入卤水的动物'),$t('盐池底部'),$t('卤水几乎不含氧气，盐度又极高，游进或掉进去的动物很快就会死去，被卤水“腌”着保存下来。墨西哥湾另一个水深约 1,000 m 的盐池因此被叫作“绝望按摩池”（Jacuzzi of Despair），池边散落着这样的螃蟹和鱼。'),$t('墨西哥湾 NR1 盐池')],
  chim_dead:[$t('不再活动的硫化物烟囱'),$t('只剩矿物'),$t('热液已经停止，烟囱外层被氧化成铁锈色，柄藤壶和海葵在上面安家。龙旂热液区至少有 13 座这样不再活动的大型硫化物堆积体。')]
};

