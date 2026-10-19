/* =========================================================
   14r. Fujikawa Maru, Truk (Chuuk) Lagoon: 133 m aircraft transport sunk 17–18 Feb 1944 in Operation Hailstone.
   Sits upright on sand at ~34 m; upper decks ~12–18 m; kingposts ~3 m below the surface, the aft mast breaks it.
   Soft corals hang from masts, booms and rails; small hard-coral clumps, sponges, tunicates; baitfish swarm the decks,
   jacks patrol, lionfish live at the stern; disassembled fighters lie in a forward hold.
   ========================================================= */
const TRUK={on:false,L:133,B:17.8,Hh:14,yaw:0.35,base:0,deck:0};
const wreck=new THREE.Group();wreck.visible=false;scene.add(wreck);
const HOLDS=[[49,8,10],[35,9,11],[21,9,11],[-27,9,11],[-41,9,10]];
const hullMat=waterify(lambert({side:THREE.DoubleSide}),'hull',{defines:{CAUSTICS:''},
  fHead:`float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
      return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}`,
  fColor:`{ vec3 q=vLocal*1.0; float a=n3(q*0.35)*0.5+n3(q*1.3)*0.3+n3(q*4.0)*0.2;
    vec3 rust=mix(vec3(0.42,0.3,0.22),vec3(0.55,0.5,0.44),smoothstep(0.35,0.7,a));
    float sp=smoothstep(0.68,0.74,n3(q*2.6+7.0)); float k=floor(n3(q*0.9+3.0)*4.0);
    vec3 spc=k<1.0?vec3(0.95,0.45,0.35):k<2.0?vec3(0.95,0.75,0.25):k<3.0?vec3(0.7,0.4,0.75):vec3(0.35,0.6,0.85);
    vec3 c=mix(rust,spc,sp*0.7);
    float tun=smoothstep(0.75,0.8,n3(q*6.0+1.0)); c=mix(c,vec3(0.6,0.8,0.55),tun*0.6);
    diffuseColor.rgb*=c*1.6; }`});
function hullGeo(){
  const L=TRUK.L/2,B=TRUK.B/2,sh=new THREE.Shape();
  sh.moveTo(-L,-B*0.55);sh.quadraticCurveTo(-L-1.5,0,-L,B*0.55);sh.lineTo(-L+8,B);sh.lineTo(L-30,B);sh.quadraticCurveTo(L-6,B*0.8,L,0);sh.quadraticCurveTo(L-6,-B*0.8,L-30,-B);sh.lineTo(-L+8,-B);sh.lineTo(-L,-B*0.55);
  for(const[hx,hw,hl]of HOLDS){const p=new THREE.Path();p.moveTo(hx-hl/2,-hw/2);p.lineTo(hx+hl/2,-hw/2);p.lineTo(hx+hl/2,hw/2);p.lineTo(hx-hl/2,hw/2);p.lineTo(hx-hl/2,-hw/2);sh.holes.push(p);}
  const g=new THREE.ExtrudeGeometry(sh,{depth:TRUK.Hh,bevelEnabled:false,curveSegments:10});
  g.rotateX(-Math.PI/2);g.computeVertexNormals();return g;
}
function addPart(geo,x,y,z,ry,col){const acc=Acc();addGeo(acc,geo,null,()=>col||[1,1,1]);const m=new THREE.Mesh(finishGeo(acc),hullMat);m.position.set(x,y,z);if(ry)m.rotation.y=ry;wreck.add(m);return m;}
const wreckHull=new THREE.Mesh((()=>{const g=hullGeo();const acc=Acc();addGeo(acc,g,null,()=>[1,1,1]);return finishGeo(acc);})(),hullMat);wreck.add(wreckHull);
const wreckParts=[];
{
  const H0=TRUK.Hh,P=(g,x,y,z,ry)=>{const m=addPart(g,x,y,z,ry);wreckParts.push(m);return m;};
  for(const[hx,hw,hl]of HOLDS){P(new THREE.BoxGeometry(hl+0.6,1.2,0.35),hx,H0+0.6,-hw/2-0.17);P(new THREE.BoxGeometry(hl+0.6,1.2,0.35),hx,H0+0.6,hw/2+0.17);
    P(new THREE.BoxGeometry(0.35,1.2,hw),hx-hl/2-0.17,H0+0.6,0);P(new THREE.BoxGeometry(0.35,1.2,hw),hx+hl/2+0.17,H0+0.6,0);
    P(new THREE.BoxGeometry(hl,0.3,hw),hx,2.0,0);}
  P(new THREE.BoxGeometry(16,7,14),-6,H0+3.5,0);P(new THREE.BoxGeometry(10,3,11),-4,H0+8.5,0);
  P(new THREE.CylinderGeometry(2.2,2.5,7,16),-15,H0+3.5,0);
  P(new THREE.BoxGeometry(12,3,15),-58,H0+1.5,0);P(new THREE.BoxGeometry(14,2.6,15),58,H0+1.3,0);
  for(const sg of[1,-1])P(new THREE.BoxGeometry(100,0.9,0.12),0,H0+0.45,sg*(TRUK.B/2-0.1));
  TRUK.masts=[[42,'mast'],[28,'king'],[-34,'mast']];
}
const mastMeshes=[];const boomSegs=[];
function buildMasts(){
  mastMeshes.forEach(m=>wreck.remove(m));mastMeshes.length=0;boomSegs.length=0;const H0=TRUK.Hh;
  for(const[x,kind]of TRUK.masts){
    const top=kind==='mast'?(-0.5-(TRUK.base+H0)):(-3-(TRUK.base+H0));const h=Math.max(4,top);
    const posts=kind==='king'?[[x,-3.5],[x,3.5]]:[[x,0]];
    for(const[px,pz]of posts){const m=addPart(new THREE.CylinderGeometry(0.28,0.42,h,10),px,H0+h/2,pz);mastMeshes.push(m);boomSegs.push([new THREE.Vector3(px,H0,pz),new THREE.Vector3(px,H0+h,pz)]);
      for(const dir of[1,-1]){const a=new THREE.Vector3(px,H0+2.5,pz),b=new THREE.Vector3(px+dir*10,H0+6.5,pz*0.6);const len=a.distanceTo(b),mid=a.clone().add(b).multiplyScalar(0.5);
        const g=new THREE.CylinderGeometry(0.16,0.2,len,8);const bm=addPart(g,mid.x,mid.y,mid.z);bm.quaternion.setFromUnitVectors(UP,b.clone().sub(a).normalize());mastMeshes.push(bm);boomSegs.push([a,b]);}}
  }
}
/* soft corals and hard-coral clumps on the wreck */
const wSoftT=new THREE.InstancedMesh(CORAL.soft.geo,coralMat,160);wSoftT.frustumCulled=false;wSoftT.count=0;wreck.add(wSoftT);
const wHardT=new THREE.InstancedMesh(CORAL.massive.geo,coralMat,50);wHardT.frustumCulled=false;wHardT.count=0;wreck.add(wHardT);
colorAll(wSoftT,[[0.98,0.45,0.65],[0.75,0.55,0.95],[1,0.55,0.3],[0.95,0.25,0.3],[1,0.6,0.7]]);
colorAll(wHardT,[[0.7,0.56,0.37],[0.53,0.64,0.38],[0.78,0.7,0.36]]);
/* fighters in hold 2 */
const zeroGeo=(()=>{const acc=Acc(),c=()=>[0.42,0.45,0.36];
  addGeo(acc,latheZ([[0.001,-4],[0.25,-3.6],[0.45,-1.5],[0.55,0.5],[0.6,2.2],[0.55,3.4],[0.3,3.6]],12),null,c);
  addGeo(acc,new THREE.BoxGeometry(12,0.14,1.9),M4(0,-0.15,1.2),c);addGeo(acc,new THREE.BoxGeometry(3.4,0.1,0.9),M4(0,0.1,-3.6),c);addGeo(acc,new THREE.BoxGeometry(0.1,1.3,1),M4(0,0.65,-3.6),c);
  return finishGeo(acc);})();
const zeros=new THREE.InstancedMesh(zeroGeo,hullMat,2);zeros.frustumCulled=false;wreck.add(zeros);
{_q.setFromEuler(_e.set(0,Math.PI/2,0.15));_s.setScalar(0.85);_p.set(35,3.3,-1.2);_m.compose(_p,_q,_s);zeros.setMatrixAt(0,_m);
 _q.setFromEuler(_e.set(0.1,Math.PI/2+0.2,-0.3));_p.set(36,3.6,2.4);_m.compose(_p,_q,_s);zeros.setMatrixAt(1,_m);}
function buildTruk(on){
  TRUK.on=on;wreck.visible=on;if(!on)return;
  TRUK.base=floorY0(0,0)-1.5;TRUK.deck=TRUK.base+TRUK.Hh;wreck.position.set(0,TRUK.base,0);wreck.rotation.y=TRUK.yaw;wreck.updateMatrixWorld(true);
  buildMasts();mastMeshes.forEach(m=>{if(!PICK.includes(m))regPick(m,'wreck');});
  let k=0;for(let i=0;i<160;i++){const sgm=boomSegs[i%boomSegs.length],t=rnd(),p=sgm[0].clone().lerp(sgm[1],t);const dir=new THREE.Vector3(R(-1,1),R(-1,0.2),R(-1,1)).normalize();
    p.addScaledVector(dir,0.25);_q.setFromUnitVectors(UP,dir.clone().multiplyScalar(-1).add(new THREE.Vector3(0,-0.5,0)).normalize().multiplyScalar(-1));_s.setScalar(R(0.25,0.55));_m.compose(p,_q,_s);wSoftT.setMatrixAt(k++,_m);}
  wSoftT.count=k;wSoftT.instanceMatrix.needsUpdate=true;
  k=0;for(let i=0;i<50;i++){const x=R(-50,55),z=R(-7.5,7.5);if(HOLDS.some(([hx,hw,hl])=>Math.abs(x-hx)<hl/2+0.6&&Math.abs(z)<hw/2+0.6))continue;if(x>-15&&x<3)continue;
    _q.setFromEuler(_e.set(0,rnd()*6.28,0));_s.setScalar(R(0.3,0.8));_p.set(x,TRUK.Hh-0.05,z);_m.compose(_p,_q,_s);wHardT.setMatrixAt(k++,_m);}
  wHardT.count=k;wHardT.instanceMatrix.needsUpdate=true;
  rocks.children.forEach(m=>{const lx=m.position.x*Math.cos(TRUK.yaw)-m.position.z*Math.sin(TRUK.yaw);if(Math.abs(lx)<75)m.visible=false;});
}
const TRUK_INFO={
  wreck:[$t('富士川丸'),$t('日本海军飞机运输舰 · 长 133 m · 1944 年沉没'),$t('1938 年建成的货船，后被日本海军征用来运输飞机。1944 年 2 月 17–18 日，美军航母舰载机对特鲁克泻湖发动“冰雹行动”，击沉 45 艘以上的舰船、摧毁近 300 架飞机，富士川丸被鱼雷击中后沉没。它直立着坐在约 34 m 深的沙底上，八十多年后成了一座人工鱼礁。'),$t('特鲁克泻湖')],
  zero:[$t('货舱里的战斗机'),$t('2 号货舱 · 拆解状态'),$t('前部货舱里至今躺着至少 9 架拆解的日本战斗机，其中 8 架是零式，另有 1 架是现存唯一的九六式舰载战斗机。'),$t('特鲁克泻湖')]
};
Object.assign(CHIM_INFO,TRUK_INFO);
function trukW(x,y,z){const c=Math.cos(TRUK.yaw),s=Math.sin(TRUK.yaw);return{x:x*c+z*s,y:TRUK.base+y,z:-x*s+z*c};}

