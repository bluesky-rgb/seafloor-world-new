/* =========================================================
   14zd. Xincun Lagoon, Lingshui, Hainan: seagrass meadow at the mangrove fringe (~1.6 m).
   - Xincun and neighbouring Li'an lagoons: China's first special protected area for seagrass beds (2007);
     seagrasses Thalassia hemprichii and Enhalus acoroides (Biodiversity Science 2024 review, after Guo et al. 2023);
     a mangrove national wetland park of ~958 ha lies in the same lagoon (Xinhua 2025).
   - Enhalus acoroides: strap leaves 30–150 cm; male flowers detach and float up, pollinating female flowers at the surface.
   - Seagrass: ~0.2 % of the sea floor, ~10 % of ocean carbon storage (UNEP).
   - Dugongs (which graze seagrass) are functionally extinct in China: 788 fishers interviewed, no verified sighting since 2000
     (Lin, Turvey et al. 2022, Royal Society Open Science).
   - Fringe: Rhizophora stylosa with arching prop roots (oysters and barnacles near the waterline),
     Avicennia pencil-like pneumatophores; juvenile fish shelter among the roots; seahorses cling to seagrass;
     upside-down jellyfish (Cassiopea) lie bell-down so their symbiotic algae get light.
   ========================================================= */
const MANG={on:false,size:50,seg:200,bankX:-3.5};
/* nearly flat lagoon mud, rising into a bank under the mangroves on the left (x < -3.5) */
function mangFloor(x,z){return -S.D+0.04*Math.sin(x*0.9+1)*Math.cos(z*0.7)+0.025*Math.sin(x*2.3+z*1.9)+0.85*sstep(MANG.bankX,MANG.bankX-6,x+0.6*Math.sin(z*0.35));}
const mangGeo=new THREE.PlaneGeometry(MANG.size,MANG.size,MANG.seg,MANG.seg);mangGeo.rotateX(-Math.PI/2);
mangGeo.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(mangGeo.attributes.position.count*3),3));
const mangMud=new THREE.Mesh(mangGeo,waterify(lambert(),'mangMud',{defines:{CAUSTICS:''}}));mangMud.visible=false;scene.add(mangMud);
const meadow=(x,z)=>sstep(MANG.bankX+0.5,MANG.bankX+3,x)*sstep(0.25,0.55,0.5+0.35*Math.sin(x*0.42+1.3)*Math.cos(z*0.38)+0.25*Math.sin(x*1.1-z*0.9));
function paintMang(){
  const p=mangGeo.attributes.position,c=mangGeo.attributes.color;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,mangFloor(x,z));
    const n=0.5+0.3*Math.sin(x*3.1+z*2.2)*Math.sin(z*4.3)+0.2*Math.sin(x*11+z*9);
    let col=mixc([0.5,0.45,0.36],[0.4,0.36,0.29],n);                                         /* grey-brown lagoon mud */
    col=mixc(col,[0.66,0.62,0.52],sstep(MANG.bankX+2,MANG.bankX+6,x)*0.45*(1-meadow(x,z)));  /* sandier towards open water */
    col=mixc(col,[0.3,0.25,0.18],sstep(MANG.bankX,MANG.bankX-3,x)*0.6);                     /* dark, leaf-litter mud under the trees */
    const[h1]=cell2(x*4+7,z*4);if(h1<0.05)col=mixc(col,[0.15,0.13,0.1],0.8);                 /* crab and worm burrows */
    const[s1]=cell2(x*9,z*9+3);if(s1<0.06&&x>MANG.bankX)col=mixc(col,[0.86,0.84,0.78],0.6);    /* shell fragments */
    c.setXYZ(i,col[0],col[1],col[2]);}
  p.needsUpdate=true;c.needsUpdate=true;mangGeo.computeVertexNormals();
}
/* ---- Rhizophora stylosa prop roots: arching from the trunk (above the water) down into the mud ---- */
const mangTrees=[];(function(){for(let i=0;i<14;i++)mangTrees.push([R(-9.5,-5.6),-19+i*2.9+R(-0.8,0.8)]);})();
/* built when the site is entered, so the root ends reach the actual mud at the site's depth */
function makeRootGeo(){const acc=Acc();rnd();
  for(const t of mangTrees){const[tx,tz]=t;const n=Math.floor(R(24,34)*Math.max(0.6,PERF.k));
    for(let k=0;k<n;k++){const a=k/n*6.283+R(-0.2,0.2),rr=R(1.0,2.3),h0=R(0.15,0.9);
      const gx=tx+Math.cos(a)*rr,gz=tz+Math.sin(a)*rr;
      const p0=new THREE.Vector3(tx+Math.cos(a)*0.12,h0,tz+Math.sin(a)*0.12),p2=new THREE.Vector3(gx,mangFloor(gx,gz),gz),p1=new THREE.Vector3(tx+Math.cos(a)*rr*0.55,h0+R(0.3,0.7),tz+Math.sin(a)*rr*0.55);
      const curve=new THREE.QuadraticBezierCurve3(p0,p1,p2);
      const g=new THREE.TubeGeometry(curve,18,R(0.03,0.05),6,false);
      /* sink the end into the mud; colour: bark, with an oyster/barnacle band around the waterline */
      const P=g.attributes.position;for(let q=0;q<P.count;q++){if(Math.hypot(P.getX(q)-gx,P.getZ(q)-gz)<0.15)P.setY(q,P.getY(q)-0.12);}
      /* secondary roots dropping straight down from the arch: the tangle that shelters juvenile fish */
      for(let s2=0;s2<3;s2++){if(rnd()<0.4)continue;const pt=curve.getPoint(R(0.35,0.7));const fx=pt.x+R(-0.1,0.1),fz=pt.z+R(-0.1,0.1);
        const c2=new THREE.LineCurve3(pt,new THREE.Vector3(fx,mangFloor(fx,fz)-0.1,fz));addGeo(acc,new THREE.TubeGeometry(c2,4,R(0.015,0.022),5,false),null,rootCol);}
      addGeo(acc,g,null,rootCol);}
    addGeo(acc,new THREE.CylinderGeometry(0.11,0.14,2.5,8),M4(tx,1.0,tz),()=>[0.24,0.2,0.16]);}
  return finishGeo(acc);}
/* dark bark above the water; a pale band of oysters and barnacles around the waterline; below it a film of algae, sponges and silt */
function rootCol(x,y,z){const band=sstep(-0.9,-0.6,y-0)*sstep(0.05,-0.15,y),n=0.5+0.5*Math.sin(x*60+y*45)*Math.sin(z*55);
  let b=mixc([0.11,0.085,0.065],[0.07,0.055,0.045],0.5+0.5*Math.sin(y*40+x*13));
  b=mixc(b,mixc([0.16,0.17,0.08],[0.3,0.2,0.1],sstep(0.3,0.8,0.5+0.5*Math.sin(x*23-z*17+y*9))),sstep(-0.55,-0.85,y)*0.75);
  return mixc(b,[0.5,0.47,0.4],band*0.8*sstep(0.62,0.9,n));}
const mangRoots=new THREE.Mesh(new THREE.BufferGeometry(),waterify(lambert(),'mangRoot',{defines:{CAUSTICS:''}}));mangRoots.visible=false;scene.add(mangRoots);
/* the canopy seen from below: a dark mass blocking the sky over the trees */
const canopyGeo=(()=>{const acc=Acc();for(const t of mangTrees)addGeo(acc,new THREE.SphereGeometry(1,10,6),M4(t[0],0.9,t[1],0,0,0,3.4,0.8,3.4),()=>[0.12,0.18,0.1]);return finishGeo(acc);})();
const mangCanopy=new THREE.Mesh(canopyGeo,waterify(lambert(),'mangCanopy'));mangCanopy.visible=false;scene.add(mangCanopy);
/* Avicennia pneumatophores: pencil-like breathing roots sticking up from the mud */
const pneuGeo=(()=>{const g=new THREE.CylinderGeometry(0.006,0.011,1,5);g.translate(0,0.5,0);const acc=Acc();addGeo(acc,g,null,(x,y)=>mixc([0.36,0.32,0.26],[0.58,0.54,0.46],y));return finishGeo(acc);})();
const pneus=new THREE.InstancedMesh(pneuGeo,urchinMat,500);pneus.frustumCulled=false;pneus.count=0;scene.add(pneus);
/* oysters on the roots near the waterline */
const oysterGeo=(()=>{const g=new THREE.SphereGeometry(1,8,5),P=g.attributes.position;for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i);P.setXYZ(i,x*(1+0.2*Math.sin(z*5)),y*0.35,z*1.3);}
  g.computeVertexNormals();const acc=Acc();addGeo(acc,g,null,(x,y,z)=>mixc([0.55,0.52,0.46],[0.75,0.72,0.66],0.5+0.5*Math.sin(x*12+z*9)));return finishGeo(acc);})();
const oysters=new THREE.InstancedMesh(oysterGeo,urchinMat,260);oysters.frustumCulled=false;oysters.count=0;scene.add(oysters);

/* ---- seagrass: one strap per instance; per-instance yaw and length let the shader bend every blade
   the same way in world space with the waves and the current ---- */
function sgBladeGeo(curl,width){const g=new THREE.PlaneGeometry(1,1,1,10);g.translate(0,0.5,0);const P=g.attributes.position;
  for(let i=0;i<P.count;i++){const y=P.getY(i);P.setX(i,P.getX(i)*width*(1-0.55*Math.pow(y,3)));P.setZ(i,curl*y*y);}g.computeVertexNormals();
  const acc=Acc();addGeo(acc,g,null,(x,y)=>mixc([0.22,0.36,0.14],[0.42,0.48,0.22],Math.pow(y,1.5)));                 /* paler, epiphyte-dusted tips */
  const out=finishGeo(acc);return out;}
const SG_V='attribute float aYaw; attribute float aLen; attribute float aPh;';
const SG_B=`{ float t=position.y, cy=cos(aYaw), sy=sin(aYaw);
  vec2 w=uFlow*0.32+vec2(0.09*sin(uTime*1.6+aPh),0.06*cos(uTime*1.2+aPh*1.7));
  vec2 l=vec2(cy*w.x-sy*w.y, sy*w.x+cy*w.y);                    /* world bend rotated into the blade's own frame */
  float k=t*t*min(aLen,1.2);
  transformed.x+=l.x*k; transformed.z+=l.y*k; transformed.y*=1.0-0.25*dot(w,w)*t; }`;
function seagrassMesh(key,n,curl,width){
  const g=sgBladeGeo(curl,width);['aYaw','aLen','aPh'].forEach(a=>g.setAttribute(a,new THREE.InstancedBufferAttribute(new Float32Array(n),1)));
  const m=new THREE.InstancedMesh(g,waterify(lambert({side:THREE.DoubleSide}),key,{vHead:SG_V,vBegin:SG_B,defines:{CAUSTICS:''}}),n);
  m.frustumCulled=false;m.count=0;m.userData.width=width;scene.add(m);return m;}
const enhalus=seagrassMesh('enhalus',6500,0.04,0.016),thalassia=seagrassMesh('thalassia',11000,0.12,0.009);
function plantBlades(m,n,lenR,clump,dens){
  n=Math.round(n*PERF.k);
  const yaw=m.geometry.attributes.aYaw.array,len=m.geometry.attributes.aLen.array,ph=m.geometry.attributes.aPh.array;let k=0;
  for(let tries=0;tries<n*6&&k<n;tries++){const x=R(MANG.bankX,12),z=R(-11,11);if(rnd()>dens(x,z))continue;
    const c=Math.floor(R(clump[0],clump[1]+1)),base=rnd()*6.28;
    for(let j=0;j<c&&k<n;j++){const L=R(lenR[0],lenR[1]),yw=base+R(-0.6,0.6),bx=x+R(-0.03,0.03),bz=z+R(-0.03,0.03);
      _q.setFromEuler(_e.set(R(-0.12,0.12),yw,R(-0.12,0.12)));_s.set(1,L,1);_p.set(bx,mangFloor(bx,bz)-0.01,bz);_m.compose(_p,_q,_s);m.setMatrixAt(k,_m);
      yaw[k]=yw;len[k]=L;ph[k]=rnd()*6.28+bx*0.7;k++;}}
  m.count=k;m.instanceMatrix.needsUpdate=true;['aYaw','aLen','aPh'].forEach(a=>m.geometry.attributes[a].needsUpdate=true);
}
/* Enhalus male flowers floating at the surface */
const flowerGeo=(()=>{const acc=Acc();addGeo(acc,new THREE.SphereGeometry(1,6,4),M4(0,0,0,0,0,0,1,0.5,1),()=>[0.95,0.94,0.9]);return finishGeo(acc);})();
const flowers=new THREE.InstancedMesh(flowerGeo,urchinMat,320);flowers.frustumCulled=false;flowers.count=0;scene.add(flowers);
const flowerP=new Float32Array(320*2);

/* ---- seahorse (Hippocampus kuda), ~14 cm: curled tail, upright trunk, head bent forward with a tube snout ---- */
const seahorseGeo=(()=>{
  const spine=s=>{if(s<0.35){const a=(0.35-s)/0.35*5.2;const r=0.03*(0.35-s)/0.35+0.012;return[0,-0.045-r*Math.sin(a)+0.012,0.012+r*(Math.cos(a)-1)+0.02*(0.35-s)];}
    if(s<0.8){const u=(s-0.35)/0.45;return[0,-0.04+u*0.09,0.02*Math.sin(u*Math.PI)*-1];}
    const u=(s-0.8)/0.2;return[0,0.05+0.02*Math.sin(u*1.4),0.02*u+0.035*u*u];};
  const rad=s=>s<0.35?0.003+0.009*(s/0.35):s<0.8?0.012+0.008*Math.sin((s-0.35)/0.45*Math.PI):0.011*(1-0.6*sstep(0.9,1,s))+0.003;
  const acc=Acc();
  addColored(acc,loftGeo(70,10,(a,b)=>{const p=spine(a),ph=b*6.283,r=rad(a),q=spine(Math.min(1,a+0.01)),dy=q[1]-p[1],dz=q[2]-p[2],dl=Math.hypot(dy,dz)||1;
    const ny=-dz/dl,nz=dy/dl;const x=r*Math.cos(ph)*0.8,yy=p[1]+ny*r*Math.sin(ph)*(1+0.15*Math.sin(a*120)),zz=p[2]+nz*r*Math.sin(ph)*(1+0.15*Math.sin(a*120));
    return[x,yy,zz,...mixc([0.62,0.5,0.28],[0.38,0.28,0.16],0.5+0.5*Math.sin(a*90))];}));
  const hd=spine(0.97);addGeo(acc,new THREE.CylinderGeometry(0.0035,0.004,0.035,6),M4(0,hd[1]+0.004,hd[2]+0.02,Math.PI/2.4),()=>[0.5,0.38,0.22]);  /* snout */
  addGeo(acc,new THREE.ConeGeometry(0.005,0.012,5),M4(0,spine(0.86)[1]+0.012,spine(0.86)[2]-0.004),()=>[0.55,0.42,0.24]);                     /* coronet */
  for(const sg of[1,-1])addGeo(acc,new THREE.SphereGeometry(0.003,6,4),M4(sg*0.007,spine(0.93)[1]+0.002,spine(0.93)[2]),()=>[0.05,0.05,0.04]);
  addGeo(acc,triGeo([0,-0.01,-0.012, 0,0.01,-0.024, 0,0.025,-0.016]),null,()=>[0.66,0.58,0.4]);                                             /* dorsal fin */
  return finishGeo(acc);})();
const seahorses=[];
for(let i=0;i<4;i++){const m=new THREE.Mesh(seahorseGeo,waterify(lambert({side:THREE.DoubleSide}),'seahorse'));m.visible=false;scene.add(m);regPick(m,'seahorse');seahorses.push(m);}
/* ---- upside-down jellyfish (Cassiopea): bell on the mud, frilly oral arms up; pulses slowly ---- */
const cassioGeo=(()=>{const acc=Acc();
  addColored(acc,loftGeo(10,24,(a,b)=>{const ph=b*6.283,r=0.1*Math.sin(Math.PI*0.5*Math.min(1,a*1.05))+0.002;const rim=1+0.06*Math.sin(ph*16)*sstep(0.8,1,a);
    return[r*rim*Math.cos(ph),0.012*(1-a*a),r*rim*Math.sin(ph),...mixc([0.5,0.46,0.3],[0.62,0.6,0.42],sstep(0.7,1,a))];}));
  for(let k=0;k<8;k++){const a=k/8*6.283;for(let j=0;j<4;j++){const r=0.015+j*0.016,h=0.012+0.018*j*(1-j/5);
    addGeo(acc,new THREE.SphereGeometry(0.013-j*0.002,6,4),M4(Math.cos(a)*r,h,Math.sin(a)*r,0,a,0,1,0.7,1.2),()=>(j%2?[0.42,0.5,0.34]:[0.55,0.6,0.62]));}}
  return finishGeo(acc);})();
const cassioMat=waterify(lambert(),'cassio',{vHead:'',vBegin:'{ float ph=instanceMatrix[3].x*3.1+instanceMatrix[3].z*1.7; float p=0.5+0.5*sin(uTime*2.6+ph); transformed.xz*=1.0+0.08*p*smoothstep(0.05,0.1,length(position.xz)); }'});
const cassios=new THREE.InstancedMesh(cassioGeo,cassioMat,10);cassios.frustumCulled=false;cassios.count=0;scene.add(cassios);

regPick(mangRoots,'rhizophora');regPick(mangCanopy,'rhizophora');regPick(pneus,'avicennia');regPick(oysters,'oyster');regPick(enhalus,'enhalus');regPick(thalassia,'thalassia');
regPick(flowers,'enhalus_flower');regPick(cassios,'cassiopea');regPick(mangMud,'mang_mud');
function buildMangrove(on){
  MANG.on=on;mangOn=on;[mangMud,mangRoots,mangCanopy].forEach(m=>m.visible=on);seahorses.forEach(m=>m.visible=on);
  if(!on){pneus.count=oysters.count=enhalus.count=thalassia.count=flowers.count=cassios.count=0;return;}
  paintMang();
  if(MANG.rootD!==S.D){mangRoots.geometry.dispose();mangRoots.geometry=makeRootGeo();MANG.rootD=S.D;}
  let k=0;for(let i=0;i<500;i++){const t=mangTrees[i%mangTrees.length],a=rnd()*6.28,r=R(2.2,5),x=t[0]+Math.cos(a)*r,z=t[1]+Math.sin(a)*r;if(x>MANG.bankX+1.2)continue;
    _q.setFromEuler(_e.set(R(-0.08,0.08),0,R(-0.08,0.08)));_s.set(1,R(0.12,0.3),1);_p.set(x,mangFloor(x,z)-0.02,z);_m.compose(_p,_q,_s);pneus.setMatrixAt(k++,_m);}
  pneus.count=k;pneus.instanceMatrix.needsUpdate=true;
  /* oysters along the roots between ~0.15 and 0.75 m below the surface */
  const rp=mangRoots.geometry.attributes.position;k=0;for(let i=0;i<20000&&k<260;i++){const q=Math.floor(rnd()*rp.count);const y=rp.getY(q);if(y>-0.15||y<-0.75)continue;
    _q.setFromEuler(_e.set(rnd()*6,rnd()*6,rnd()*6));_s.setScalar(R(0.02,0.035));_p.set(rp.getX(q),y,rp.getZ(q));_m.compose(_p,_q,_s);oysters.setMatrixAt(k++,_m);}
  oysters.count=k;oysters.instanceMatrix.needsUpdate=true;
  plantBlades(enhalus,6500,[0.35,1.1],[3,6],(x,z)=>meadow(x,z)*0.95);
  plantBlades(thalassia,11000,[0.1,0.3],[2,4],(x,z)=>Math.max(meadow(x,z)*0.7,sstep(MANG.bankX+1,MANG.bankX+4,x)*0.45));
  k=0;for(let i=0;i<320;i++){const x=R(MANG.bankX+1,16),z=R(-16,16);flowerP[i*2]=x;flowerP[i*2+1]=z;k++;}flowers.count=k;
  k=0;for(let i=0;i<10;i++){let x,z,n=0;do{x=R(MANG.bankX+0.8,8);z=R(-7,7);n++;}while(meadow(x,z)>0.3&&n<40);
    _q.setFromEuler(_e.set(0,rnd()*6.28,0));_s.setScalar(R(0.8,1.3));_p.set(x,mangFloor(x,z)+0.005,z);_m.compose(_p,_q,_s);cassios.setMatrixAt(k++,_m);}
  cassios.count=k;cassios.instanceMatrix.needsUpdate=true;
  seahorses.forEach((m,i)=>{let x,z,n=0;do{x=R(MANG.bankX+2,7);z=R(-5,5);n++;}while(meadow(x,z)<0.6&&n<60);m.userData={x,z,y:mangFloor(x,z)+R(0.12,0.3),ph:rnd()*6,yaw:rnd()*6.28};m.scale.setScalar(R(0.9,1.15));});
  stepMangrove(0,0);
}
function stepMangrove(dt,t){
  if(!MANG.on)return;
  /* floating male flowers drift with the current and the waves, wrapping round the meadow */
  for(let i=0;i<flowers.count;i++){let x=flowerP[i*2],z=flowerP[i*2+1];orbital(x,-0.05,t,_u);x+=(_u.x*0.25+CUR.x*S.cur)*dt;z+=(_u.z*0.25+CUR.z*S.cur)*dt;
    if(x>16)x=MANG.bankX+1;if(x<MANG.bankX+1)x=16;if(z>16)z=-16;if(z<-16)z=16;flowerP[i*2]=x;flowerP[i*2+1]=z;
    _q.identity();_s.setScalar(0.006);_p.set(x,-0.015+0.01*Math.sin(t*2+i),z);_m.compose(_p,_q,_s);flowers.setMatrixAt(i,_m);}
  flowers.instanceMatrix.needsUpdate=true;
  /* seahorses hold on and sway with the seagrass */
  seahorses.forEach(m=>{const u=m.userData;const sw=0.06*U.uFlow.value.x+0.04*Math.sin(t*1.3+u.ph);
    m.position.set(u.x+sw*0.15,u.y,u.z);m.rotation.set(0.1*Math.sin(t*0.9+u.ph),u.yaw+0.2*Math.sin(t*0.3+u.ph),sw);});
}
const MANG_INFO={
  enhalus_flower:[$t('海菖蒲的雄花'),$t('直径约几毫米 · 漂在水面上'),$t('海菖蒲是开花植物。雄花成熟后脱离植株浮上水面，像一粒粒白色小泡沫随水漂动；雌花长在长柄上伸到水面，两者在水面相遇完成授粉。'),$t('新村潟湖')],
  mang_mud:[$t('潟湖软泥'),$t('细颗粒淤泥 · 富含有机质'),$t('红树林和海草的叶片落下、腐烂，连同潮水带来的细泥一起沉积下来，把大量碳埋进泥里，几百上千年都不会释放。那些小洞是蟹和蠕虫的洞穴，白色碎屑是贝壳。'),$t('新村潟湖')]
};
Object.assign(CHIM_INFO,MANG_INFO);
CAT.push(['enhalus',$t('海菖蒲'),'Enhalus acoroides',$t('潮间带至约 4 m')],['thalassia',$t('泰来草'),'Thalassia hemprichii',$t('潮间带至浅海')],
  ['rhizophora',$t('红海榄'),'Rhizophora stylosa',$t('红树林 · 潮间带')],['avicennia',$t('白骨壤'),'Avicennia marina',$t('红树林 · 潮间带')],
  ['oyster',$t('牡蛎'),'Ostreidae',$t('潮间带 · 红树林根上')],['seahorse',$t('大海马'),'Hippocampus kuda',$t('海草床 · 浅海')],['cassiopea',$t('仙后水母（倒立水母）'),'Cassiopea',$t('红树林与海草床浅水')]);
CAT.slice(-7).forEach(c=>CATMAP[c[0]]=c);
Object.assign(FACTS,{
  enhalus:$t('世界上最大的海草之一，带状叶片长 30–150 cm，靠粗壮的地下茎扎在软泥里抵御风浪和潮流。'),
  thalassia:$t('叶片较短而弯，常和海菖蒲混生。海草不是海藻，而是从陆地回到海里的开花植物，有根、茎、叶，靠地下茎在泥里蔓延。'),
  rhizophora:$t('一根根弯曲的支柱根把树干撑在潮间带的软泥上，也挡住了风浪。根间是小鱼小虾躲避捕食者的“育儿所”。'),
  avicennia:$t('从泥里竖起一根根铅笔似的呼吸根，在缺氧的淤泥里给根系通气。'),
  oyster:$t('附着在被潮水淹没的根和石头上，靠过滤海水里的浮游生物为生，同时帮助净化水质。'),
  seahorse:$t('用尾巴缠住海草，靠伪装和吸管一样的嘴吸食小型甲壳动物。海马由雄性的育儿袋孵育后代。'),
  cassiopea:$t('倒着躺在泥上、口腕朝上，因为体内共生的藻类要晒太阳进行光合作用；被惊扰时会放出带刺细胞的黏液。')
});
SPECIES.push(['enhalus',$t('海菖蒲')],['thalassia',$t('泰来草')],['rhizophora',$t('红海榄')],['avicennia',$t('白骨壤')],['oyster',$t('牡蛎')],['seahorse',$t('大海马')],['cassiopea',$t('倒立水母')]);
