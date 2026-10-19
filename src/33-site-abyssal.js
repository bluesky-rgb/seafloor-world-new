/* =========================================================
   14zc. Abyssal plain, Clarion-Clipperton Zone (central Pacific), ~4,100 m, ~1.5 °C.
   - CCZ: ~6 million km² between the Clarion and Clipperton fracture zones, 4,000–6,000 m deep (Bonifácio et al. 2021).
   - Polymetallic nodules: potato- to lettuce-sized, grow ~10–100 mm per million years, ~15 kg/m² on average
     in the CCZ (World Ocean Review 3). They are the only hard substrate, so many sessile animals live on them.
   - 5,578 species recorded, ~88–92 % undescribed (Rabone et al. 2023, Current Biology).
   - 1979 mining test: an ~100 t collector cleared an ~8 m wide strip of nodules and left two furrows; in 2023,
     44 years later, the tracks looked almost unchanged, xenophyophores and small mobile fauna had partly returned,
     large sessile animals had barely recovered (Jones et al. 2025, Nature). The track here is drawn after that description.
   - Fauna: elasipodid holothurians leaving feeding trails (Psychropotes longicauda, Scotoplanes), tripod fish
     (Bathypterois) standing on fin rays facing the current, abyssal grenadier (Coryphaenoides armatus) swimming head-down,
     brittle stars, stalked glass sponges on nodules, xenophyophores.
   ========================================================= */
const ABY={on:false,size:40,seg:250,ang:0.32,u0:6.5,hw:4};
/* track coordinates: u across the mining track, v along it */
const abyUV=(x,z)=>[x*Math.cos(ABY.ang)+z*Math.sin(ABY.ang),-x*Math.sin(ABY.ang)+z*Math.cos(ABY.ang)];
function abyDisp(x,z){
  const[u,v]=abyUV(x,z),d=Math.abs(u-ABY.u0);
  if(d>ABY.hw+0.9)return 0;
  let y=0;
  if(d<ABY.hw)y-=0.03;                                                        /* scraped strip */
  const fr=sstep(ABY.hw-1.5,ABY.hw-1.25,d)*sstep(ABY.hw,ABY.hw-0.2,d);        /* the two furrows along the edges */
  y-=fr*(0.09+0.025*Math.sin(v*2*Math.PI/0.5));                               /* with tread marks */
  y+=sstep(ABY.hw,ABY.hw+0.25,d)*sstep(ABY.hw+0.9,ABY.hw+0.45,d)*0.06;         /* spoil berm pushed out to the sides */
  return y;
}
const abySurf=(x,z)=>floorY(x,z)+0.015+abyDisp(x,z);
const inTrack=(x,z)=>Math.abs(abyUV(x,z)[0]-ABY.u0)<ABY.hw;
/* sea-cucumber feeding trails: meandering random walks; each animal sits at the end of its own trail */
const abyTrails=[];
(function(){for(let i=0;i<5;i++){const a0=rnd()*6.28,r0=R(1.5,9);let x=Math.cos(a0)*r0,z=Math.sin(a0)*r0,h=rnd()*6.28;const pts=[[x,z]];
  const n=Math.floor(R(60,110));for(let k=0;k<n;k++){h+=R(-0.35,0.35)+0.12*Math.sin(k*0.15+i);x+=Math.cos(h)*0.08;z+=Math.sin(h)*0.08;pts.push([x,z]);}
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;pts.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);z0=Math.min(z0,p[1]);z1=Math.max(z1,p[1]);});
  abyTrails.push({pts,bb:[x0-0.2,x1+0.2,z0-0.2,z1+0.2],head:h});}})();
function trailDist(x,z){let best=9;for(const t of abyTrails){const b=t.bb;if(x<b[0]||x>b[1]||z<b[2]||z>b[3])continue;
  const P=t.pts;for(let k=1;k<P.length;k++){const ax=P[k-1][0],az=P[k-1][1],bx=P[k][0]-ax,bz=P[k][1]-az,l2=bx*bx+bz*bz;
    const s=Math.max(0,Math.min(1,((x-ax)*bx+(z-az)*bz)/l2)),d=Math.hypot(x-ax-bx*s,z-az-bz*s);if(d<best)best=d;}}return best;}
/* the high-resolution sediment patch */
const abyGeo=new THREE.PlaneGeometry(ABY.size,ABY.size,ABY.seg,ABY.seg);abyGeo.rotateX(-Math.PI/2);
abyGeo.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(abyGeo.attributes.position.count*3),3));
const abyFloor=new THREE.Mesh(abyGeo,waterify(lambert(),'abyFloor'));abyFloor.visible=false;scene.add(abyFloor);
function paintAby(){
  const p=abyGeo.attributes.position,c=abyGeo.attributes.color;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i);p.setY(i,abySurf(x,z));
    const n=0.5+0.25*Math.sin(x*1.3+Math.sin(z*0.7))*Math.cos(z*1.1)+0.25*Math.sin(x*7.1+z*5.3)*Math.sin(z*6.7);
    let col=mixc([0.46,0.38,0.29],[0.37,0.31,0.24],n);
    const tr=inTrack(x,z);
    const far=sstep(9.5,11,Math.hypot(x,z));                                                    /* beyond the modelled nodules, a faint mottling stands in for them */
    if(!tr){const[d1]=cell2(x*3,z*3);col=mixc(col,[0.2,0.17,0.13],sstep(0.35,0.2,d1)*0.55*far);}
    else col=mixc(col,[0.52,0.45,0.35],0.35);
    const dsp=abyDisp(x,z);if(dsp<-0.05)col=mixc(col,[0.3,0.25,0.19],0.5);
    const td=trailDist(x,z);if(td<0.06){col=mixc(col,[0.53,0.46,0.36],0.65*sstep(0.06,0.03,td));                 /* a fresh feeding trail */
      col=mixc(col,[0.4,0.33,0.25],0.4*sstep(0.02,0.0,Math.abs(td-0.035)));}
    const[h1]=cell2(x*2.3+40,z*2.3);if(h1<0.03)col=mixc(col,[0.2,0.17,0.13],0.8);                                /* burrow openings */
    c.setXYZ(i,col[0],col[1],col[2]);}
  p.needsUpdate=true;abyGeo.computeVertexNormals();
  /* only the lamp lights this depth, and lamp shading hardly depends on slope, so bake a little relief shading into the colour:
     furrow floors and walls darker, berm crests lighter */
  const nr=abyGeo.attributes.normal;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),d=abyDisp(x,z);if(d===0)continue;
    const k=(0.55+0.45*Math.pow(Math.max(0,nr.getY(i)),6))*(d<-0.05?0.8:1)*(d>0.02?1.12:1);c.setXYZ(i,c.getX(i)*k,c.getY(i)*k,c.getZ(i)*k);}
  c.needsUpdate=true;
}
/* polymetallic nodules: knobbly, half-buried */
const noduleGeo=(()=>{const g=new THREE.SphereGeometry(1,9,6,0,Math.PI*2,0,Math.PI*0.62),P=g.attributes.position;
  for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i),k=1+0.13*Math.sin(x*5+z*3)*Math.sin(y*6+x*2)+0.06*Math.sin(z*11);P.setXYZ(i,x*k*1.15,y*k*0.75,z*k);}
  g.computeVertexNormals();const acc=Acc();addGeo(acc,g,null,(x,y,z)=>mixc([0.1,0.085,0.07],[0.2,0.16,0.12],sstep(0.3,0.8,y)*0.6+0.4*sstep(0.6,1,Math.sin(x*9)*Math.sin(z*8))));return finishGeo(acc);})();
const nodules=new THREE.InstancedMesh(noduleGeo,urchinMat,2600);nodules.frustumCulled=false;nodules.count=0;scene.add(nodules);
/* xenophyophores: giant single-celled protists with fragile, lumpy agglutinated tests */
const xenoAGeo=(()=>{const acc=Acc();for(let k=0;k<6;k++){const a=k*1.05;addGeo(acc,new THREE.SphereGeometry(1,8,6),M4(Math.cos(a)*0.35*(k%2+0.5),0.25+0.2*(k%3),Math.sin(a)*0.35,0,a,0.4,0.42,0.3,0.42),()=>[0.52,0.47,0.39]);}return finishGeo(acc);})();
const xenoA=new THREE.InstancedMesh(xenoAGeo,urchinMat,50);xenoA.frustumCulled=false;xenoA.count=0;scene.add(xenoA);
/* brittle stars: small disc, five long thin arms */
const ophGeo=(()=>{const acc=Acc();addGeo(acc,new THREE.CylinderGeometry(0.12,0.12,0.04,10),M4(0,0.02,0),()=>[0.58,0.53,0.47]);
  for(let k=0;k<5;k++){const a=k/5*6.283+0.3;for(let s=0;s<6;s++){const r=0.15+s*0.13,b=a+0.25*Math.sin(s*0.9+k);addGeo(acc,new THREE.CylinderGeometry(0.022*(1-s/7),0.028*(1-s/7),0.14,4),
    M4(Math.cos(b)*r,0.015,Math.sin(b)*r,Math.PI/2,0,-b+Math.PI/2),()=>[0.55,0.5,0.44]);}}return finishGeo(acc);})();
const ophs=new THREE.InstancedMesh(ophGeo,urchinMat,60);ophs.frustumCulled=false;ophs.count=0;scene.add(ophs);
/* stalked glass sponges (Hyalonema-like): a tuft of glassy anchor spicules, an ovoid body on top; attached to nodules */
const hyaloGeo=(()=>{const acc=Acc();addGeo(acc,new THREE.CylinderGeometry(0.012,0.02,1,6),M4(0,0.5,0),()=>[0.62,0.62,0.6]);
  addColored(acc,loftGeo(16,14,(a,b)=>{const t=a,ph=b*6.283,r=0.11*Math.pow(Math.sin(Math.PI*Math.min(1,t*1.05)),0.8)+0.01;const y=1+0.24*t;
    const lip=t>0.85?0.6:1;return[r*Math.cos(ph),y,r*Math.sin(ph)*lip,...mixc([0.68,0.68,0.65],[0.55,0.55,0.52],0.5+0.5*Math.sin(ph*6+t*10))];}));
  return finishGeo(acc);})();
const hyalos=new THREE.InstancedMesh(hyaloGeo,urchinMat,12);hyalos.frustumCulled=false;hyalos.count=0;scene.add(hyalos);
/* Psychropotes longicauda: translucent, yellowish, with a tall dorsal sail at the rear; ~40 cm (normalised length 1) */
const psychroMat=waterify(lambert({side:THREE.DoubleSide}),'psychro',{uniforms:{uCrawl:{value:0}},vHead:'uniform float uCrawl;',
  vBegin:'{ float w=sin(uCrawl*1.3-position.z*9.0); transformed.y+=0.012*w*smoothstep(0.0,0.08,position.y+0.1); transformed.x*=1.0+0.04*w; }'});
const psychroGeo=(()=>{const acc=Acc();
  addColored(acc,loftGeo(40,24,(a,b)=>{const z=-0.5+a,ph=b*6.283,w=0.16*Math.pow(Math.sin(Math.PI*Math.min(1,0.03+a*0.97)),0.55),h=0.1*Math.pow(Math.sin(Math.PI*Math.min(1,0.03+a*0.97)),0.6);
    const s=Math.sin(ph),x=w*Math.cos(ph)*(s<0?1.15:1),y=s>=0?h*s:-0.02*Math.pow(-s,0.5);
    const col=mixc([0.5,0.38,0.21],[0.38,0.27,0.18],0.5+0.5*Math.sin(z*30)*Math.cos(x*40));return[x,y+0.03,z,...col];}));
  /* the dorsal sail (a fused pair of papillae), rising from the rear */
  addColored(acc,loftGeo(16,10,(a,b)=>{const ph=b*6.283,t=a;const y=0.1+0.42*t,z=-0.28+0.06*t-0.12*t*t,half=0.13*(1-0.55*t)+0.02,th=0.014*(1-0.6*t);
    return[th*Math.sin(ph),y,z+half*Math.cos(ph),...mixc([0.46,0.35,0.21],[0.34,0.24,0.17],t)];}));
  for(let k=0;k<12;k++){const s=k%2?1:-1,z=0.35-Math.floor(k/2)*0.12;addGeo(acc,new THREE.SphereGeometry(0.02,6,4),M4(s*0.17,0.0,z,0,0,0,1,0.6,1.4),()=>[0.55,0.43,0.28]);}  /* brim of tube feet */
  return finishGeo(acc);})();
const psychros=[];
/* Scotoplanes (sea pig): ~12 cm, pinkish, plump; several pairs of leg-like tube feet and two pairs of dorsal papillae */
const seapigGeo=(()=>{const acc=Acc();
  addColored(acc,loftGeo(24,20,(a,b)=>{const z=-0.5+a,ph=b*6.283,r=0.22*Math.pow(Math.sin(Math.PI*Math.min(1,0.04+a*0.96)),0.5);
    const s=Math.sin(ph);return[r*Math.cos(ph)*1.05,(s>=0?r*s*1.05:r*s*0.55)+0.2,z,...mixc([0.68,0.46,0.46],[0.58,0.34,0.36],0.5+0.5*s)];}));
  for(let k=0;k<12;k++){const s=k%2?1:-1,z=0.3-Math.floor(k/2)*0.12;addGeo(acc,new THREE.CylinderGeometry(0.025,0.035,0.14,6),M4(s*0.15,0.07,z,0,0,s*0.3),()=>[0.62,0.42,0.42]);}
  for(const s of[1,-1]){addGeo(acc,new THREE.CylinderGeometry(0.012,0.03,0.28,6),M4(s*0.06,0.5,0.32,0.35,0,s*0.25),()=>[0.64,0.44,0.44]);
    addGeo(acc,new THREE.CylinderGeometry(0.01,0.025,0.18,6),M4(s*0.07,0.46,0.18,0.1,0,s*0.3),()=>[0.64,0.44,0.44]);}
  return finishGeo(acc);})();
const seapigMat=waterify(lambert(),'seapig');
const seapigs=[];
/* tripod fish (Bathypterois): stands on elongated pelvic and caudal fin rays, faces into the current */
const tripodGeo=(()=>{const acc=Acc();
  addColored(acc,loftGeo(30,16,(a,b)=>{const z=-0.5+a,ph=b*6.283,w=0.06*Math.pow(Math.sin(Math.PI*Math.min(1,0.05+a*0.95)),0.7),h=0.075*Math.pow(Math.sin(Math.PI*Math.min(1,0.05+a*0.95)),0.7);
    return[w*Math.cos(ph),h*Math.sin(ph),z,...mixc([0.22,0.2,0.2],[0.12,0.11,0.11],0.5+0.5*Math.sin(ph))];}));
  const ray=(x0,y0,z0,x1,y1,z1)=>{const a=new THREE.Vector3(x0,y0,z0),b=new THREE.Vector3(x1,y1,z1),d=b.clone().sub(a),L=d.length();
    addGeo(acc,new THREE.CylinderGeometry(0.004,0.006,L,4),new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5),new THREE.Quaternion().setFromUnitVectors(UP,d.normalize()),new THREE.Vector3(1,1,1)),()=>[0.18,0.17,0.17]);};
  for(const s of[1,-1]){ray(s*0.03,-0.06,0.05,s*0.12,-0.62,0.28);ray(s*0.04,0.02,0.22,s*0.32,0.28,-0.25);ray(s*0.04,0.02,0.22,s*0.3,0.32,-0.15);}   /* pelvic stilts; pectoral feelers held up and back */
  ray(0,-0.02,-0.5,0,-0.62,-0.85);                                                                                                                    /* caudal stilt */
  addGeo(acc,triGeo([0,0.02,-0.45, 0,0.12,-0.62, 0,-0.08,-0.62]),null,()=>[0.16,0.15,0.15]);
  for(const s of[1,-1])addGeo(acc,new THREE.SphereGeometry(0.008,6,4),M4(s*0.04,0.03,0.4),()=>[0.05,0.05,0.05]);
  return finishGeo(acc);})();
const tripodMat=waterify(lambert({side:THREE.DoubleSide}),'tripod');
const tripods=[];
/* abyssal grenadier (Coryphaenoides armatus): big head, tapering "rat tail", swims slowly head-down near the bottom */
const rattailGeo=(()=>{const acc=Acc();
  addColored(acc,loftGeo(40,16,(a,b)=>{const z=-0.5+a,ph=b*6.283,e=Math.pow(sstep(0,0.75,a),1.4)*(a>0.93?Math.sqrt(Math.max(0,1-Math.pow((a-0.93)/0.07,2))):1);
    const w=0.006+0.07*e,h=0.006+0.09*e;return[w*Math.cos(ph),h*Math.sin(ph),z,...mixc([0.3,0.28,0.27],[0.2,0.19,0.18],0.5+0.5*Math.sin(ph))];}));
  addGeo(acc,triGeo([0,0.08,0.25, 0,0.2,0.18, 0,0.08,0.1]),null,()=>[0.3,0.28,0.27]);
  addGeo(acc,triGeo([0,0.06,0.08, 0,0.09,-0.4, 0,0.006,-0.5]),null,()=>[0.32,0.3,0.28]);
  addGeo(acc,triGeo([0,-0.07,0.06, 0,-0.09,-0.4, 0,-0.006,-0.5]),null,()=>[0.32,0.3,0.28]);
  for(const s of[1,-1])addGeo(acc,new THREE.SphereGeometry(0.022,8,6),M4(s*0.045,0.035,0.4),()=>[0.08,0.08,0.1]);
  addGeo(acc,new THREE.CylinderGeometry(0.002,0.003,0.06,4),M4(0,-0.08,0.44,0.4),()=>[0.4,0.38,0.36]);
  return finishGeo(acc);})();
const rattailMat=waterify(lambert({side:THREE.DoubleSide}),'rattail',{uniforms:{uSwim:{value:0}},vHead:'uniform float uSwim;',
  vBegin:'{ float bt=clamp(0.25-position.z,0.0,1.0); transformed.x+=sin(uSwim-position.z*7.0)*0.08*bt*bt; }'});
const rattails=[];
function abyMesh(geo,mat,key,s){const m=new THREE.Mesh(geo,mat);m.scale.setScalar(s);m.visible=false;scene.add(m);regPick(m,key);return m;}
for(let i=0;i<abyTrails.length;i++)psychros.push(abyMesh(psychroGeo,psychroMat,'psychro',R(0.32,0.45)));
for(let i=0;i<6;i++)seapigs.push(abyMesh(seapigGeo,seapigMat,'seapig',R(0.1,0.14)));
for(let i=0;i<3;i++)tripods.push(abyMesh(tripodGeo,tripodMat,'tripod',R(0.32,0.38)));
for(let i=0;i<2;i++)rattails.push(abyMesh(rattailGeo,rattailMat,'rattail',R(0.7,0.9)));
regPick(nodules,'nodule');regPick(xenoA,'xeno');regPick(ophs,'ophiuroid');regPick(hyalos,'hyalonema');regPick(abyFloor,'aby_floor');
const abyAll=[...psychros,...seapigs,...tripods,...rattails];
function abyPlace(mesh,i,x,z,s,yOff,tilt){_q.setFromEuler(_e.set(tilt?R(-tilt,tilt):0,rnd()*6.28,tilt?R(-tilt,tilt):0));_s.setScalar(s);_p.set(x,abySurf(x,z)+(yOff||0),z);_m.compose(_p,_q,_s);mesh.setMatrixAt(i,_m);}
function buildAbyss(on){
  ABY.on=on;abyFloor.visible=on;abyAll.forEach(m=>m.visible=on);
  if(!on){nodules.count=xenoA.count=ophs.count=hyalos.count=0;return;}
  paintAby();abyFloor.position.y=0;
  const keep=[];let k=0;
  for(let n=0;n<8000&&k<2600;n++){const a=rnd()*6.28,r=Math.sqrt(rnd())*10.5,x=Math.cos(a)*r,z=Math.sin(a)*r;
    if(inTrack(x,z)&&rnd()>0.02)continue;const s=R(0.02,0.06)*(rnd()<0.1?1.6:1);abyPlace(nodules,k++,x,z,s,-s*0.3,0.3);keep.push([x,z,s]);}
  nodules.count=k;nodules.instanceMatrix.needsUpdate=true;
  k=0;for(let i=0;i<50;i++){const a=rnd()*6.28,r=R(0.8,12),x=Math.cos(a)*r,z=Math.sin(a)*r;abyPlace(xenoA,k++,x,z,R(0.05,0.11),0,0.1);}xenoA.count=k;xenoA.instanceMatrix.needsUpdate=true;
  k=0;for(let i=0;i<60;i++){const a=rnd()*6.28,r=R(0.5,11),x=Math.cos(a)*r,z=Math.sin(a)*r;abyPlace(ophs,k++,x,z,R(0.05,0.08),0.004,0.05);}ophs.count=k;ophs.instanceMatrix.needsUpdate=true;
  /* glass sponges only on nodules outside the track (sessile megafauna has barely returned to it) */
  k=0;for(const nd of keep){if(k>=12)break;if(nd[2]<0.045||Math.hypot(nd[0],nd[1])<1.5||rnd()<0.6)continue;abyPlace(hyalos,k++,nd[0],nd[1],R(0.28,0.5),nd[2]*0.3,0.12);}hyalos.count=k;hyalos.instanceMatrix.needsUpdate=true;
  psychros.forEach((m,i)=>{const t=abyTrails[i],P=t.pts[t.pts.length-1];m.userData={x:P[0],z:P[1],h:t.head,ph:rnd()*6};});
  const g0=[-2.2,2.4];seapigs.forEach((m,i)=>{m.userData={x:g0[0]+R(-0.7,0.7),z:g0[1]+R(-0.7,0.7),ph:rnd()*6};});
  [[-4,-3],[1.8,-5],[-6.5,1.5]].forEach((p,i)=>{tripods[i].userData={x:p[0],z:p[1],ph:rnd()*6};});
  rattails.forEach((m,i)=>{m.userData={R:R(3.5,6),th:rnd()*6.28,w:(i?-1:1)*R(0.05,0.07),h:R(0.5,1.1),ph:rnd()*6};});
  stepAbyss(0,0);
}
const ABY_INFO={
  nodule:[$t('锰结核（多金属结核）'),$t('直径约 4–12 cm · 每百万年只长 1–10 cm'),$t('以鲨鱼牙齿、贝壳碎片等为核心，从海水和沉积物孔隙水里一层层析出锰、铁的氧化物，并富集镍、钴、铜。克拉里昂-克利珀顿区平均每平方米约有 15 kg。在一片软泥里，结核是难得的硬底，海绵、珊瑚、海葵等很多固着动物只能长在它们上面。'),$t('克拉里昂-克利珀顿区 · 约 4,100 m')],
  minetrack:[$t('1979 年采矿试验的车辙'),$t('宽约 8 m · 44 年后几乎没有变化'),$t('1979 年，一台约 100 吨重的集矿机在这一海区做了太平洋最早的工业深海采矿试验：清走一条约 8 m 宽的结核，压出两道深沟。2023 年科学家重访，车辙看起来和刚压出时差不多；巨型单细胞生物和小型活动动物已部分回来，但很多动物数量仍然偏少，固着在海底的大型动物几乎没有恢复（Jones 等，Nature，2025）。画面中的车辙按论文描述示意。'),$t('克拉里昂-克利珀顿区 · 约 4,100 m')]
};
ABY_INFO.abysed=[$t('深海软泥'),$t('沉积物积累得极慢 · 水温约 1.5 °C'),$t('深海平原铺着细软的软泥，主要是从上方几千米慢慢飘落的“海洋雪”和微小的浮游生物骨骼。海参等动物一边爬一边吞食它，身后留下取食痕迹；那些小黑点是穴居动物的洞口。'),$t('克拉里昂-克利珀顿区 · 约 4,100 m')];
Object.assign(CHIM_INFO,ABY_INFO);
function stepAbyss(dt,t){
  if(!ABY.on)return;
  if(psychroMat.userData.u)psychroMat.userData.u.value=t;
  if(rattailMat.userData.u)rattailMat.userData.u.value=t*2*Math.PI/1.8;
  /* sea cucumbers creep forward a few millimetres a second (sped up ~10× so the motion is visible) */
  psychros.forEach(m=>{const u=m.userData;u.x+=Math.cos(u.h)*0.004*dt;u.z+=Math.sin(u.h)*0.004*dt;u.h+=0.02*Math.sin(t*0.05+u.ph)*dt;
    m.position.set(u.x,abySurf(u.x,u.z),u.z);m.rotation.set(0,Math.atan2(Math.cos(u.h),Math.sin(u.h)),0);});
  /* sea pigs face into the current, where food-laden water comes from */
  const hc=Math.atan2(-CUR.x,-CUR.z);
  seapigs.forEach(m=>{const u=m.userData;u.x-=CUR.x*0.002*dt;u.z-=CUR.z*0.002*dt;m.position.set(u.x,abySurf(u.x,u.z)+0.005*Math.abs(Math.sin(t*1.2+u.ph)),u.z);m.rotation.set(0,hc+0.3*Math.sin(u.ph),0.04*Math.sin(t*1.2+u.ph));});
  tripods.forEach(m=>{const u=m.userData;m.position.set(u.x,abySurf(u.x,u.z)+0.62*m.scale.x,u.z);m.rotation.set(0.02*Math.sin(t*0.4+u.ph),hc,0.015*Math.sin(t*0.3+u.ph));});
  rattails.forEach(m=>{const u=m.userData;u.th+=u.w*dt;const x=Math.cos(u.th)*u.R,z=Math.sin(u.th)*u.R;
    m.position.set(x,abySurf(x,z)+u.h+0.1*Math.sin(t*0.3+u.ph),z);const hx=-Math.sin(u.th)*Math.sign(u.w),hz=Math.cos(u.th)*Math.sign(u.w);
    m.rotation.set(0.5,Math.atan2(hx,hz),0,'YXZ');});      /* head-down posture */
}
[psychroMat,rattailMat].forEach(mt=>{const o=mt.onBeforeCompile;mt.onBeforeCompile=sh=>{o(sh);mt.userData.u=sh.uniforms.uCrawl||sh.uniforms.uSwim;};});
/* field guide entries, facts, species list */
CAT.push(['psychro',$t('长尾蝶参'),'Psychropotes longicauda',$t('深海平原 · 深渊层')],['seapig',$t('海猪'),'Scotoplanes',$t('深海平原 · 深渊层')],
  ['tripod',$t('三脚架鱼（深海狗母鱼）'),'Bathypterois',$t('约 900–4,700 m')],['rattail',$t('深海长尾鳕'),'Coryphaenoides armatus',$t('约 2,000–4,700 m')],
  ['ophiuroid',$t('深海蛇尾'),'Ophiuroidea',$t('深海平原')],['hyalonema',$t('有柄玻璃海绵'),$t('Hyalonema 等'),$t('深海平原 · 长在结核上')]);
CAT.slice(-6).forEach(c=>CATMAP[c[0]]=c);
Object.assign(FACTS,{
  psychro:$t('身体半透明，背后竖着一面高高的“尾帆”，外号“橡皮软糖松鼠”。它一边在海底爬一边吞食沉积物，身后留下长长的取食痕迹：海底那些弯弯曲曲的浅色带子就是这样来的。'),
  seapig:$t('用几对鼓胀的管足在海底“行走”，常常成群出现，面朝水流吃沉积物里的有机碎屑。'),
  tripod:$t('用两根腹鳍鳍条和一根尾鳍鳍条把身体撑离海底，面朝水流一动不动，等着漂来的小动物。它雌雄同体，找不到配偶时可以自体受精。'),
  rattail:$t('深海里最常见的鱼之一：大头、细长的“鼠尾”，常头朝下贴着海底慢慢游，靠嗅觉寻找落到海底的动物尸体。'),
  ophiuroid:$t('深海平原上数量最多的大型动物之一，靠五条细长的腕划动着移动。'),
  hyalonema:$t('用一束长长的玻璃质骨针固定在锰结核上。2016 年科学家在夏威夷外海 4,000 多米处发现一种幽灵般的白色章鱼，把卵产在死去海绵的柄上，而这些海绵只能长在结核这样的硬底上。')
});
SPECIES.push(['psychro',$t('长尾蝶参')],['seapig',$t('海猪')],['tripod',$t('三脚架鱼')],['rattail',$t('深海长尾鳕')],['ophiuroid',$t('深海蛇尾')],['hyalonema',$t('有柄玻璃海绵')]);
