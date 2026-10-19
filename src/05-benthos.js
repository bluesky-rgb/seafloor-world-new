/* =========================================================
   6. Kelp (buoyant chains in wave/current flow)
   ========================================================= */
/* Macrocystis: each holdfast sends up many fronds, with a blade (on a gas bladder) at every node; 5 fronds × 64 holdfasts here */
const KN=18,NK=320,KBLADES=NK*(KN-1)*2;let NKA=NK;
const kelpMat=waterify(lambert({side:THREE.DoubleSide}),'kelp',{
  lit:'gl_FragColor.rgb+=diffuseColor.rgb*vec3(1.0,0.8,0.38)*uDay*(0.6+2.6*pow(max(dot(vdir,uSunDir),0.0),2.0));'});
const bladeGeo=(()=>{const g=new THREE.PlaneGeometry(1,1,1,7);g.translate(0,0.5,0);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),w=Math.pow(Math.sin(Math.PI*Math.min(1,y*1.05+0.04)),0.6);p.setX(i,x*w);p.setZ(i,0.05*Math.sin(y*26)*Math.abs(x)*2);}
  g.computeVertexNormals();const acc=Acc();addGeo(acc,g,null,(x,y)=>mixc([0.55,0.4,0.12],[0.72,0.55,0.18],y));
  addGeo(acc,new THREE.SphereGeometry(0.09,6,4),M4(0,-0.02,0,0,0,0,1,1.5,1),()=>[0.75,0.62,0.25]);return finishGeo(acc);})();
const stipeGeo=(()=>{const c=new THREE.CylinderGeometry(0.014,0.018,1,5,1,true);c.translate(0,0.5,0);const acc=Acc();addGeo(acc,c,null,()=>[0.45,0.33,0.1]);return finishGeo(acc);})();
const kelp=new THREE.InstancedMesh(bladeGeo,kelpMat,KBLADES);kelp.frustumCulled=false;scene.add(kelp);kelp.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
const stipes=new THREE.InstancedMesh(stipeGeo,kelpMat,NK*(KN-1));stipes.frustumCulled=false;scene.add(stipes);stipes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
const kRoot=[];for(let s=0;s<NK;s+=5){const a=rnd()*6.28,r=1.4+Math.sqrt(rnd())*12.5;for(let k=0;k<5&&s+k<NK;k++)kRoot.push({x:Math.cos(a)*r+R(-0.2,0.2),z:Math.sin(a)*r+R(-0.2,0.2),tw:rnd()*6.28});}
/* shuffle so a reduced (smooth-mode) count still spreads over the whole forest */
for(let i=kRoot.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[kRoot[i],kRoot[j]]=[kRoot[j],kRoot[i]];}
const kP=new Float32Array(NK*KN*3),kQ=new Float32Array(NK*KN*3);
let kSeg=1,kelpOn=false;
function buildKelp(on){
  kelpOn=on;kelp.visible=on;stipes.visible=on;if(!on)return;
  const L=Math.min(S.D*1.2,40);kSeg=L/(KN-1);NKA=Math.round(NK*Math.max(0.5,PERF.k));
  for(let s=0;s<NKA;s++){
    const Rt=kRoot[s];let x=Rt.x,y=floorY(Rt.x,Rt.z),z=Rt.z;const dx=Math.cos(Rt.tw),dz=Math.sin(Rt.tw);
    for(let i=0;i<KN;i++){
      if(i>0){if(y+kSeg<-0.06)y+=kSeg;else{x+=dx*kSeg;z+=dz*kSeg;}}
      const o=(s*KN+i)*3;kP[o]=kQ[o]=x;kP[o+1]=kQ[o+1]=y;kP[o+2]=kQ[o+2]=z;
    }
  }
  for(let i=0;i<200;i++)stepKelp(1/60,i/60);
}
function stepKelp(dt,t){
  if(!kelpOn)return;const fy=-S.D;
  for(let s=0;s<NKA;s++){
    for(let i=1;i<KN;i++){
      const o=(s*KN+i)*3,px=kP[o],py=kP[o+1],pz=kP[o+2];
      const vx=(px-kQ[o])/dt,vy=(py-kQ[o+1])/dt,vz=(pz-kQ[o+2])/dt;
      orbital(px,py,t,_u);
      const rx=_u.x-vx,ry=_u.y-vy,rz=_u.z-vz,m=Math.hypot(rx,ry,rz);
      const ax=9*rx*m,ay=1.3*(i/(KN-1)*0.6+0.4)+9*ry*m,az=9*rz*m;
      kQ[o]=px;kQ[o+1]=py;kQ[o+2]=pz;
      kP[o]=px+vx*dt*0.985+ax*dt*dt;kP[o+1]=py+vy*dt*0.985+ay*dt*dt;kP[o+2]=pz+vz*dt*0.985+az*dt*dt;
    }
    for(let it=0;it<6;it++){
      for(let i=1;i<KN;i++){
        const a=(s*KN+i-1)*3,b=(s*KN+i)*3;
        const dx=kP[b]-kP[a],dy=kP[b+1]-kP[a+1],dz=kP[b+2]-kP[a+2];
        const len=Math.hypot(dx,dy,dz)||1e-6,df=(len-kSeg)/len;
        if(i===1){kP[b]-=dx*df;kP[b+1]-=dy*df;kP[b+2]-=dz*df;}
        else{const h=df*0.5;kP[a]+=dx*h;kP[a+1]+=dy*h;kP[a+2]+=dz*h;kP[b]-=dx*h;kP[b+1]-=dy*h;kP[b+2]-=dz*h;}
      }
      for(let i=1;i<KN;i++){const o=(s*KN+i)*3;if(kP[o+1]>-0.06)kP[o+1]=-0.06;if(kP[o+1]<fy+0.02)kP[o+1]=fy+0.02;}
    }
  }
}
const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_qt=new THREE.Quaternion();
const _kside=new THREE.Vector3(),_bd=new THREE.Vector3(),_tmp=new THREE.Vector3();
function drawKelp(t){
  if(!kelpOn)return;let n=0,m=0;
  for(let s=0;s<NKA;s++)for(let i=1;i<KN;i++){
    const a=(s*KN+i-1)*3,b=(s*KN+i)*3;
    _a.set(kP[a],kP[a+1],kP[a+2]);_b.set(kP[b],kP[b+1],kP[b+2]);
    _d.subVectors(_b,_a);const len=_d.length();_d.divideScalar(len||1);
    _q.setFromUnitVectors(UP,_d);_s.set(1,len,1);_m.compose(_a,_q,_s);stipes.setMatrixAt(m++,_m);
    orbital(_b.x,_b.y,t,_u);
    for(let j=0;j<2;j++){
      const ang=kRoot[s].tw+i*2.1+j*Math.PI;
      _tmp.set(Math.cos(ang),0,Math.sin(ang));_kside.crossVectors(_d,_tmp).cross(_d).normalize().negate();
      _bd.copy(_d).multiplyScalar(0.7).addScaledVector(_kside,0.75);_bd.x+=_u.x*1.5;_bd.z+=_u.z*1.5;_bd.normalize();
      _q.setFromUnitVectors(UP,_bd);_qt.setFromAxisAngle(UP,ang);_q.multiply(_qt);
      const L=0.5+0.35*((s*7+i*3+j)%5)/4;_s.set(0.15,L,0.15);
      _m.compose(_b,_q,_s);kelp.setMatrixAt(n++,_m);
    }
  }
  kelp.count=n;stipes.count=m;kelp.instanceMatrix.needsUpdate=true;stipes.instanceMatrix.needsUpdate=true;
}

/* =========================================================
   7. Corals: branching, massive, plate, soft (light- and temperature-limited)
   ========================================================= */
function branchCoralGeo(){
  const acc=Acc();const cyl=new THREE.CylinderGeometry(0.018,0.026,1,5,1,true);cyl.translate(0,0.5,0);
  function grow(base,dir,len,depth){
    const q=new THREE.Quaternion().setFromUnitVectors(UP,dir),w=1-depth*0.14;
    addGeo(acc,cyl,new THREE.Matrix4().compose(base,q,new THREE.Vector3(w,len,w)),depth>=4?()=>[1.35,1.3,1.4]:null);
    const end=base.clone().addScaledVector(dir,len);
    if(depth>=4)return;
    const n=rnd()<0.65?2:3;
    for(let i=0;i<n;i++){const d=dir.clone().add(new THREE.Vector3((rnd()-.5)*1.2,0.3+rnd()*0.35,(rnd()-.5)*1.2)).normalize();grow(end,d,len*(0.72+rnd()*0.14),depth+1);}
  }
  for(let i=0;i<5;i++){const a=i/5*6.28+rnd();grow(new THREE.Vector3(Math.cos(a)*0.06,0,Math.sin(a)*0.06),new THREE.Vector3(Math.cos(a)*0.5,1,Math.sin(a)*0.5).normalize(),0.22,0);}
  return finishGeo(acc);
}
function massiveCoralGeo(){
  const g=new THREE.SphereGeometry(1,40,20,0,Math.PI*2,0,Math.PI/2),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const groove=Math.sin(Math.atan2(x,z)*14+y*9+Math.sin(y*12+x*6)*1.5),s=1+0.035*groove;p.setXYZ(i,x*s,y*s*0.62,z*s);}
  g.computeVertexNormals();const acc=Acc();addGeo(acc,g,null);return finishGeo(acc);
}
function plateCoralGeo(){
  const plate=new THREE.CylinderGeometry(1,0.9,0.05,32,1),pp=plate.attributes.position;
  for(let i=0;i<pp.count;i++){const x=pp.getX(i),z=pp.getZ(i);pp.setY(i,pp.getY(i)+0.06*Math.sin(Math.atan2(x,z)*5)*Math.hypot(x,z));}
  plate.computeVertexNormals();
  const acc=Acc();addGeo(acc,new THREE.CylinderGeometry(0.07,0.12,0.4,8,1),M4(0,0.2,0));addGeo(acc,plate,M4(0,0.42,0));return finishGeo(acc);
}
function softCoralGeo(){
  const acc=Acc();const cyl=new THREE.CylinderGeometry(0.035,0.05,1,6,1,true);cyl.translate(0,0.5,0);
  const bud=new THREE.IcosahedronGeometry(0.06,0);
  function grow(base,dir,len,depth){
    addGeo(acc,cyl,new THREE.Matrix4().compose(base,new THREE.Quaternion().setFromUnitVectors(UP,dir),new THREE.Vector3(1-depth*0.2,len,1-depth*0.2)),()=>[1,1,1]);
    const end=base.clone().addScaledVector(dir,len);
    if(depth>=3){for(let k=0;k<5;k++)addGeo(acc,bud,M4(end.x+R(-.06,.06),end.y+R(-.03,.06),end.z+R(-.06,.06),R(0,3),R(0,3),0,R(0.7,1.2)),()=>[1.25,1.25,1.25]);return;}
    for(let i=0;i<3;i++){const d=dir.clone().add(new THREE.Vector3((rnd()-.5)*1.4,0.3,(rnd()-.5)*1.4)).normalize();grow(end,d,len*0.72,depth+1);}
  }
  grow(new THREE.Vector3(),UP.clone(),0.32,0);
  return finishGeo(acc);
}
/* Bleaching (driven by real heat stress, see 50-live-ocean.js): uBleach 0..1 turns tissue pale until the white skeleton shows,
   uDead 0..1 covers dead colonies with a grey-green film of turf algae. Susceptibility differs by growth form (aKind: branching
   most, massive least) and from colony to colony; upper, sunlit surfaces go first. */
const CORALU={uBleach:{value:0},uDead:{value:0}};
const coralMat=waterify(lambert(),'coral',{defines:{CAUSTICS:'',FLUO:''},uniforms:CORALU,
  vHead:'attribute float aKind; varying float vSus; uniform float uBleach; uniform float uDead;',
  vBegin:`{ float hh=0.5;
  #ifdef USE_INSTANCING
    hh=fract(sin(dot(instanceMatrix[3].xz,vec2(12.9898,78.233)))*43758.5453);
  #endif
    vSus=aKind*(0.6+0.8*hh);
    vFluo*=1.0-0.9*clamp(uBleach*vSus+uDead,0.0,1.0); }`,   /* the fluorescent host pigments fade as the colony bleaches */
  fHead:'varying float vSus; uniform float uBleach; uniform float uDead;',
  fColor:`if(uBleach+uDead>0.001){ float n=0.5+0.5*sin(vWPos.x*7.0+sin(vWPos.z*5.0)*2.0)*sin(vWPos.z*6.3+vWPos.y*9.0);
    float up=smoothstep(-0.2,0.8,vWNrm.y);
    float b=clamp(uBleach*vSus*(0.7+0.5*up)+(n-0.5)*0.4*uBleach,0.0,1.0);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.94,0.93,0.88),smoothstep(0.12,0.85,b));
    float dd=clamp(uDead*vSus*1.2+(n-0.5)*0.5*uDead,0.0,1.0);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.36,0.37,0.27),smoothstep(0.3,0.8,dd)); }`});
const NCOR=120;
const BOMMIE=[[0.3,0.4],[2,-1],[-4,2],[5,4],[-2,-6],[7,-4],[-7,-3],[0,6],[-6,7]];
const CORAL={
  branch:{sus:1.25,geo:branchCoralGeo(),s:[0.7,1.5],pal:[[0.72,0.56,0.4],[0.6,0.42,0.66],[0.86,0.55,0.6],[0.48,0.6,0.8],[0.8,0.66,0.42]],fluo:[[0.2,1,0.35],[0.1,0.9,0.8],[1,0.35,0.3],[0.3,1,0.5]]},
  massive:{sus:0.6,geo:massiveCoralGeo(),s:[0.35,1.1],pal:[[0.7,0.56,0.37],[0.5,0.36,0.24],[0.53,0.64,0.38],[0.78,0.7,0.36],[0.63,0.47,0.31]],fluo:[[0.3,1,0.3],[1,0.45,0.15],[1,0.3,0.45]]},
  plate:{sus:1.0,geo:plateCoralGeo(),s:[0.5,1.3],pal:[[0.55,0.42,0.27],[0.69,0.56,0.41],[0.48,0.56,0.35],[0.42,0.35,0.28]],fluo:[[0.25,1,0.4],[1,0.35,0.2],[0.2,0.85,1]]},
  soft:{sus:0.9,geo:softCoralGeo(),s:[0.8,1.6],pal:[[0.95,0.4,0.62],[0.75,0.35,0.85],[1,0.55,0.35],[0.95,0.85,0.9]],fluo:[[1,0.3,0.25],[0.2,0.9,0.4]]}
};
for(const k in CORAL){
  const c=CORAL[k],fl=new Float32Array(NCOR*3);
  const mesh=new THREE.InstancedMesh(c.geo,coralMat,NCOR);mesh.frustumCulled=false;
  const col=new THREE.Color();c.spots=[];
  for(let i=0;i<NCOR;i++){
    let x,z;if(rnd()<0.72){const b=BOMMIE[Math.floor(rnd()*BOMMIE.length)];x=b[0]+R(-1,1)*R(0,2.6);z=b[1]+R(-1,1)*R(0,2.6);}
    else{const a=rnd()*6.28,r=3+Math.sqrt(rnd())*16;x=Math.cos(a)*r;z=Math.sin(a)*r;}
    if(Math.hypot(x-6,z-11)<2.5){x-=4;}
    c.spots.push({x,z,s:R(c.s[0],c.s[1]),rot:rnd()*6.28,tilt:(rnd()-0.5)*0.25});
    /* living stony-coral tissue is dark (symbiotic algae): reflectance roughly 0.1-0.3, so the palette is darkened and a little
       more saturated; bleached skeleton (0.9) then stands out the way it does on a real reef. Soft corals keep their colours. */
    const pc0=c.pal[Math.floor(rnd()*c.pal.length)],dk=k==='soft'?1:0.58,mean=(pc0[0]+pc0[1]+pc0[2])/3;
    const pc=pc0.map(v=>(mean+(v-mean)*(k==='soft'?1:1.35))*dk);mesh.setColorAt(i,col.setRGB(pc[0],pc[1],pc[2]));
    const f=c.fluo[Math.floor(rnd()*c.fluo.length)],fk=R(0.5,1);fl[i*3]=f[0]*fk;fl[i*3+1]=f[1]*fk;fl[i*3+2]=f[2]*fk;
  }
  c.geo.setAttribute('aFluo',new THREE.InstancedBufferAttribute(fl,3));
  c.geo.setAttribute('aKind',new THREE.Float32BufferAttribute(new Float32Array(c.geo.attributes.position.count).fill(c.sus),1));
  mesh.count=0;scene.add(mesh);c.mesh=mesh;
}
let coralForm='';
function buildCoral(on,lf){
  let n={branch:0,massive:0,plate:0,soft:0};coralForm='';
  if(on){
    if(lf>=0.15){n={branch:100,massive:60,plate:18,soft:26};coralForm=$t('枝状、块状珊瑚为主，夹杂软珊瑚');}
    else if(lf>=0.03){n={branch:24,massive:50,plate:56,soft:48};coralForm=$t('块状、盘状珊瑚混生，软珊瑚增多');}
    else{n={branch:0,massive:16,plate:70,soft:50};coralForm=$t('以盘状珊瑚和软珊瑚为主');}
  }
  for(const k in CORAL){
    const c=CORAL[k];c.mesh.count=n[k];
    for(let i=0;i<n[k];i++){const s=c.spots[i];
      const flat=(k==='plate'&&lf<0.03)?1.35:1;
      _e.set(s.tilt,s.rot,s.tilt*0.5);_q.setFromEuler(_e);
      _s.set(s.s*flat,s.s*(k==='plate'?1/flat:1),s.s*flat);_p.set(s.x,floorY(s.x,s.z)-0.03,s.z);
      _m.compose(_p,_q,_s);c.mesh.setMatrixAt(i,_m);}
    c.mesh.instanceMatrix.needsUpdate=true;
  }
}

/* =========================================================
   8. Anemones (Heteractis magnifica) and giant clams (Tridacna maxima)
   ========================================================= */
const ANEM=[{x:2.6,z:1.8,c:[0.75,0.15,0.55]},{x:-3.2,z:-0.8,c:[0.45,0.2,0.75]},{x:4.8,z:-4.2,c:[0.85,0.25,0.25]},{x:-1.4,z:4.6,c:[0.3,0.45,0.85]}];
const NT=170;
const anemBaseGeo=(()=>{const acc=Acc();addGeo(acc,new THREE.CylinderGeometry(0.24,0.3,0.16,22),M4(0,0.08,0));addGeo(acc,new THREE.CircleGeometry(0.25,22),M4(0,0.161,0,-Math.PI/2),()=>[0.75,0.65,0.45]);return finishGeo(acc);})();
const anemBaseMat=waterify(lambert(),'anembase',{defines:{CAUSTICS:''}});
const anemBases=ANEM.map(a=>{const m=new THREE.Mesh(anemBaseGeo,anemBaseMat.clone());m.material.color.setRGB(a.c[0],a.c[1],a.c[2]);m.visible=false;scene.add(m);return m;});
anemBases.forEach(m=>{m.material.onBeforeCompile=anemBaseMat.onBeforeCompile;m.material.customProgramCacheKey=anemBaseMat.customProgramCacheKey;});
const tentGeo=(()=>{const acc=Acc();const c=new THREE.CylinderGeometry(0.006,0.011,1,5,1,true);c.translate(0,0.5,0);
  addGeo(acc,c,null,(x,y)=>mixc([0.55,0.5,0.28],[0.8,0.85,0.5],y));addGeo(acc,new THREE.SphereGeometry(0.012,6,4),M4(0,1,0),()=>[0.95,0.8,0.75]);return finishGeo(acc);})();
const tentPh=new Float32Array(ANEM.length*NT);for(let i=0;i<tentPh.length;i++)tentPh[i]=rnd()*6.28;
tentGeo.setAttribute('aPhase',new THREE.InstancedBufferAttribute(tentPh,1));
const tentMat=waterify(lambert(),'tent',{
  vHead:'attribute float aPhase;',
  vBegin:`float h=clamp(position.y,0.0,1.0);
    vec2 sw=uFlow*0.9+0.22*vec2(sin(uTime*1.6+aPhase),cos(uTime*1.25+aPhase*1.7));
    transformed.xz+=sw*h*h*0.35;`,
  emit:'emit+=vec3(0.25,1.0,0.35)*smoothstep(0.55,1.0,vLocal.y)*(tE.b*2.0+0.03*lightAt(-vWPos.y).b*uSky);'
});
const tents=new THREE.InstancedMesh(tentGeo,tentMat,ANEM.length*NT);tents.frustumCulled=false;tents.visible=false;scene.add(tents);
let anemOn=false;
function buildAnem(on){
  anemOn=on;tents.visible=on;anemBases.forEach(b=>b.visible=on);if(!on)return;
  ANEM.forEach((a,k)=>{
    const y=floorY(a.x,a.z);anemBases[k].position.set(a.x,y-0.02,a.z);
    for(let i=0;i<NT;i++){
      const r=0.3*Math.sqrt(rnd()),th=rnd()*6.28,tilt=0.15+1.0*(r/0.3);
      _e.set(Math.sin(th)*tilt*-1,0,Math.cos(th)*tilt*-1,'XYZ');
      _q.setFromEuler(new THREE.Euler(-Math.sin(th)*tilt,0,Math.cos(th)*tilt*-1));
      _s.set(1,R(0.07,0.11),1);_p.set(a.x+Math.cos(th)*r,y+0.14,a.z+Math.sin(th)*r);
      _m.compose(_p,_q,_s);tents.setMatrixAt(k*NT+i,_m);
    }
  });
  tents.instanceMatrix.needsUpdate=true;
}

/* giant clams */
const CLAMS=[{x:1.2,z:-2.6},{x:-4.5,z:2.2},{x:6.2,z:1.0},{x:-2.0,z:-5.5},{x:3.6,z:5.2},{x:-6.4,z:-2.8}];
const CLAM_PAL=[[0.1,0.45,1.0],[0.08,0.8,0.75],[0.3,0.85,0.25],[0.55,0.25,0.9],[0.15,0.6,1.0],[0.75,0.6,0.2]];
const shellGeo=(()=>{const g=new THREE.SphereGeometry(1,36,12,0,Math.PI*2,Math.PI/2,Math.PI/2),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x);const s=1+0.07*Math.abs(Math.sin(a*7));p.setXYZ(i,x*s,y*s,z*s);}
  g.computeVertexNormals();const acc=Acc();addGeo(acc,g,M4(0,0,0,0,0,0,0.5,0.24,0.22),(x,y)=>mixc([0.92,0.9,0.84],[0.62,0.6,0.55],sstep(0,-0.2,y)));return finishGeo(acc);})();
const mantleGeoBase=(()=>{const g=new THREE.CircleGeometry(1,48,0,Math.PI*2);g.rotateX(-Math.PI/2);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),r=Math.hypot(x,z),a=Math.atan2(z,x);p.setY(i,0.06*r*Math.sin(a*9)+0.05*(1-r*r));}
  g.computeVertexNormals();return g;})();
const shellMat=waterify(lambert(),'shell',{defines:{CAUSTICS:''}});
const mantleMat=waterify(lambert(),'mantle',{
  fColor:`{ float sp=smoothstep(0.55,0.8,sin(vLocal.x*38.0+sin(vLocal.z*20.0)*2.0)*sin(vLocal.z*30.0+vLocal.x*9.0));
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.02,0.12,0.35)+diffuseColor.rgb*0.3,sp*0.8);
    float slit=smoothstep(0.08,0.03,length(vLocal.xz*vec2(1.0,2.6)));
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.05),slit); }`,
  lit:'gl_FragColor.rgb*=0.75+0.9*pow(1.0-abs(dot(nrmW,vdir)),2.0);'
});
const clamObjs=CLAMS.map((c,i)=>{
  const grp=new THREE.Group();const sh=new THREE.Mesh(shellGeo,shellMat);grp.add(sh);
  const acc=Acc();const pal=CLAM_PAL[i%CLAM_PAL.length];
  addGeo(acc,mantleGeoBase,M4(0,0.005,0,0,0,0,0.47,1,0.2),(x,y,z)=>{const r=Math.hypot(x/0.47,z/0.2);return mixc(pal,[0.85,0.8,0.5],sstep(0.85,1.0,r)*0.6);});
  const mm=new THREE.Mesh(finishGeo(acc),mantleMat);grp.add(mm);
  grp.rotation.set(R(-0.15,0.15),rnd()*6.28,R(-0.15,0.15));grp.scale.setScalar(R(0.5,0.75));grp.visible=false;scene.add(grp);return grp;
});
let clamOn=false;
function buildClams(on){clamOn=on;clamObjs.forEach((g,i)=>{g.visible=on;if(on){const c=CLAMS[i];g.position.set(c.x,floorY(c.x,c.z)+0.04,c.z);}});}

/* =========================================================
   9. Sea fans (gorgonians / deep-sea bamboo coral), sponges, urchins, stars
   ========================================================= */
function fanGeo(H){
  const acc=Acc();const cyl=new THREE.CylinderGeometry(1,1,1,5,1,true);cyl.translate(0,0.5,0);
  function br(x,y,ang,len,r,depth){
    const x1=x+Math.sin(ang)*len,y1=y+Math.cos(ang)*len;
    const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-ang);
    addGeo(acc,cyl,new THREE.Matrix4().compose(new THREE.Vector3(x,y,0),q,new THREE.Vector3(r,len,r)),null,{aT:()=>depth/7});
    if(depth>=7||len<0.02)return;
    const sp=0.3+rnd()*0.3;
    br(x1,y1,Math.max(-1.25,ang-sp),len*R(0.72,0.86),r*0.78,depth+1);
    br(x1,y1,Math.min(1.25,ang+sp),len*R(0.72,0.86),r*0.78,depth+1);
    if(rnd()<0.25)br(x1,y1,ang,len*0.7,r*0.7,depth+1);
  }
  br(0,0,0,H*0.18,0.02,0);
  return finishGeo(acc);
}
const FANHIT={uFanHit:{value:new THREE.Vector4(0,0,0,-99)}};
const fanMat=waterify(lambert({side:THREE.DoubleSide}),'fan',{uniforms:FANHIT,
  vHead:'attribute float aT; varying float vT;',vBegin:'vT=aT;',fHead:'varying float vT; uniform float uDeepFan; uniform vec4 uFanHit;',
  emit:`{ float w=fract(uTime*0.11+vWPos.x*0.07+vWPos.z*0.05); float band=smoothstep(0.1,0.0,abs(vT-w*1.6+0.3));
        emit+=uDeepFan*vec3(0.15,0.55,1.0)*band*0.8*step(0.55,fract(uTime*0.031+vWPos.x*0.13));
        float age=uTime-uFanHit.w, dd=length(vWPos-uFanHit.xyz);
        emit+=uDeepFan*vec3(0.15,0.55,1.0)*2.5*smoothstep(0.1,0.0,abs(dd-age*0.2))*exp(-age/3.0)*step(0.0,age)*step(dd,2.0); }`
});
const FANS=[];
for(let i=0;i<9;i++){
  const H=R(0.7,1.7),g=fanGeo(H);const m=new THREE.Mesh(g,fanMat.clone());
  m.material.onBeforeCompile=fanMat.onBeforeCompile;m.material.customProgramCacheKey=fanMat.customProgramCacheKey;
  const a=rnd()*6.28,r=R(5,16);m.userData={x:Math.cos(a)*r,z:Math.sin(a)*r,ph:rnd()*6.28};m.visible=false;scene.add(m);FANS.push(m);
}
let fanOn=false;
function buildFans(on){
  fanOn=on;const deep=S.D>200,trop=S.temp>=18;
  const pal=ROST.on?[[0.92,0.2,0.22],[0.98,0.45,0.5],[0.95,0.9,0.85]]:deep?[[0.94,0.92,0.86],[0.95,0.78,0.78],[0.9,0.88,0.8]]:trop?[[0.85,0.18,0.15],[0.55,0.2,0.65],[0.95,0.72,0.2]]:[[0.95,0.35,0.15],[0.9,0.45,0.2],[0.95,0.6,0.25]];
  U.uDeepFan.value=deep&&!ROST.on?1:0;
  const garden=S.loc==='slope';
  FANS.forEach((m,i)=>{m.visible=on;if(!on)return;const u=m.userData,g=garden&&SLOPE_GARDEN[i];
    const x=g?g[0]:u.x,z=g?g[1]:u.z;
    m.position.set(x,floorY(x,z)-0.02,z);m.scale.setScalar(g?g[2]:1);const c=pal[i%pal.length];m.material.color.setRGB(c[0],c[1],c[2]);
    /* the fan's plane faces the current (its normal is along the flow) so it sieves the most water */
    u.yaw=Math.atan2(CUR.x,CUR.z)+(g?g[3]:0);m.rotation.set(0,u.yaw,0);});
}
/* northern South China Sea slope, 600 m: deep-sea bamboo corals grow in clusters ("coral gardens") on hard ground of the slope,
   so at this site the fans are gathered into one garden in front of the camera instead of being scattered. [x, z, scale, yaw jitter] */
const SLOPE_GARDEN=[[-0.5,-0.9,1.3,0.1],[1.0,-1.9,1.15,-0.2],[-2.0,-2.3,1.45,0.15],[2.5,-0.9,0.8,0.3],[-1.4,0.7,0.7,-0.25],
  [0.3,-3.7,1.6,0.05],[-3.3,-0.7,1.05,-0.1],[2.7,-3.0,1.25,0.2],[-1.0,-5.3,1.7,-0.15]];
/* glass sponges (Euplectella-type lattice vases) */
const spongeGeo=(()=>{const pts=[];for(let i=0;i<=16;i++){const t=i/16;pts.push(new THREE.Vector2(0.12+0.1*Math.sin(t*2.6)+0.06*t,t));}
  const g=new THREE.LatheGeometry(pts,28);const acc=Acc();addGeo(acc,g,null,()=>[0.92,0.9,0.8]);return finishGeo(acc);})();
const spongeMat=waterify(lambert({side:THREE.DoubleSide}),'sponge',{fColor:`{ vec2 g=vec2(atan(vLocal.z,vLocal.x)*4.4563,vLocal.y*14.0);
  vec2 f=abs(fract(g)-0.5); float lat=min(f.x,f.y); float dg=abs(fract((g.x+g.y)*0.5)-0.5); float dg2=abs(fract((g.x-g.y)*0.5)-0.5);
  if(lat>0.09&&dg>0.07&&dg2>0.07&&vLocal.y<0.97) discard; }`});
const sponges=new THREE.InstancedMesh(spongeGeo,spongeMat,10);sponges.frustumCulled=false;sponges.count=0;scene.add(sponges);
function buildSponges(on){sponges.count=on?10:0;if(!on)return;
  const garden=S.loc==='slope';
  for(let i=0;i<10;i++){const a=i*2.4+0.7,r=garden?1.6+i*0.5:3+i*1.3;const x=Math.cos(a)*r+(garden?-0.4:0),z=Math.sin(a)*r-(garden?1.8:0);_q.setFromEuler(_e.set(R(-0.1,0.1),rnd()*6,R(-0.1,0.1)));const h=R(0.3,0.9);_s.set(h*0.9,h,h*0.9);_p.set(x,floorY(x,z)-0.02,z);_m.compose(_p,_q,_s);sponges.setMatrixAt(i,_m);}
  sponges.instanceMatrix.needsUpdate=true;}

function urchinGeo(spine,col){
  const acc=Acc();addGeo(acc,new THREE.SphereGeometry(1,12,8),M4(0,0,0,0,0,0,1,0.75,1),()=>col);
  const cone=new THREE.ConeGeometry(0.05,1,4);cone.translate(0,0.5,0);
  const N=110;for(let i=0;i<N;i++){const y=1-2*(i+0.5)/N;if(y<-0.3)continue;const r=Math.sqrt(1-y*y),th=i*2.39996;
    const d=new THREE.Vector3(Math.cos(th)*r,y*0.75,Math.sin(th)*r).normalize();
    addGeo(acc,cone,new THREE.Matrix4().compose(d.clone().multiplyScalar(0.8),new THREE.Quaternion().setFromUnitVectors(UP,d),new THREE.Vector3(spine/8,spine,spine/8)),()=>col);}
  return finishGeo(acc);
}
const urchinMat=waterify(lambert(),'urchin',{defines:{CAUSTICS:''}});
const urchinT=new THREE.InstancedMesh(urchinGeo(1.2,[0.42,0.12,0.5]),urchinMat,48);
const urchinD=new THREE.InstancedMesh(urchinGeo(4.2,[0.06,0.05,0.07]),urchinMat,16);
[urchinT,urchinD].forEach(m=>{m.frustumCulled=false;m.count=0;scene.add(m);});
function placeOnFloor(mesh,n,spread,sc,cluster){
  mesh.count=n;for(let i=0;i<n;i++){let x,z;
    if(cluster){const r0=rocks.children[i%rocks.children.length];x=r0.position.x+R(-1.4,1.4);z=r0.position.z+R(-1.4,1.4);}
    else{const a=rnd()*6.28,r=R(1.5,spread);x=Math.cos(a)*r;z=Math.sin(a)*r;}
    _q.setFromEuler(_e.set(0,rnd()*6.28,0));_s.setScalar(R(sc[0],sc[1]));_p.set(x,floorY(x,z)+0.01,z);_m.compose(_p,_q,_s);mesh.setMatrixAt(i,_m);}
  mesh.instanceMatrix.needsUpdate=true;
}
const starGeo=(()=>{const sh=new THREE.Shape();for(let i=0;i<=40;i++){const a=i/40*Math.PI*2,r=0.38+0.62*Math.pow(Math.abs(Math.cos(a*2.5)),1.6);const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)sh.moveTo(x,y);else sh.lineTo(x,y);}
  const g=new THREE.ExtrudeGeometry(sh,{depth:0.1,bevelEnabled:true,bevelThickness:0.08,bevelSize:0.08,bevelSegments:2,curveSegments:4});g.rotateX(-Math.PI/2);g.computeVertexNormals();
  const acc=Acc();addGeo(acc,g,null);return finishGeo(acc);})();
const starMat=waterify(lambert(),'star',{defines:{CAUSTICS:''}});
const stars=new THREE.InstancedMesh(starGeo,starMat,24);stars.frustumCulled=false;stars.count=0;scene.add(stars);
let starPalKey='';
function buildStars(on){
  if(!on){stars.count=0;return;}
  const trop=S.temp>=18,key=ICE.on?'a':trop?'t':'c';
  if(key!==starPalKey){starPalKey=key;const c=new THREE.Color();
    const pal=ICE.on?[[0.92,0.12,0.1],[0.85,0.2,0.12],[0.95,0.3,0.15]]:trop?[[0.15,0.4,0.95],[0.15,0.4,0.95],[0.9,0.25,0.15]]:[[0.95,0.4,0.15],[0.85,0.2,0.18],[0.55,0.25,0.6],[0.95,0.6,0.2]];
    stars.count=24;for(let i=0;i<24;i++){const p=pal[i%pal.length];stars.setColorAt(i,c.setRGB(p[0],p[1],p[2]));}stars.instanceColor.needsUpdate=true;}
  placeOnFloor(stars,trop?10:22,15,trop?[0.1,0.14]:[0.07,0.11],false);
}
stars.setColorAt(0,new THREE.Color(1,1,1));

/* cold-seep community: mussel bed, tubeworms */
const musselGeo=(()=>{const acc=Acc();addGeo(acc,new THREE.SphereGeometry(1,10,6),M4(0,0,0,0,0,0,0.5,0.22,1),(x,y)=>mixc([0.3,0.22,0.12],[0.12,0.08,0.05],sstep(-0.1,0.2,y)));return finishGeo(acc);})();
const mussels=new THREE.InstancedMesh(musselGeo,urchinMat,160);mussels.frustumCulled=false;mussels.count=0;scene.add(mussels);
const tubeGeo=(()=>{const acc=Acc();const c=new THREE.CylinderGeometry(0.012,0.016,1,6,1,true);c.translate(0,0.5,0);addGeo(acc,c,null,(x,y)=>mixc([0.75,0.7,0.6],[0.9,0.88,0.8],y));
  addGeo(acc,new THREE.ConeGeometry(0.03,0.07,8,1,true),M4(0,1.03,0,Math.PI),()=>[0.9,0.12,0.1]);return finishGeo(acc);})();
const tubes=new THREE.InstancedMesh(tubeGeo,urchinMat,70);tubes.frustumCulled=false;tubes.count=0;scene.add(tubes);
function buildSeep(on){
  mussels.count=on?160:0;tubes.count=on?70:0;if(!on)return;
  for(let i=0;i<160;i++){const a=rnd()*6.28,r=Math.sqrt(rnd())*2.6;const x=SEEP.x+Math.cos(a)*r,z=SEEP.z+Math.sin(a)*r;
    _q.setFromEuler(_e.set(R(-0.6,0.6),rnd()*6.28,R(-0.6,0.6)));_s.setScalar(R(0.07,0.12));_p.set(x,floorY(x,z)+0.03,z);_m.compose(_p,_q,_s);mussels.setMatrixAt(i,_m);}
  for(let i=0;i<70;i++){const cx=SEEP.x+(i<35?2.8:-2.2),cz=SEEP.z+(i<35?1.2:2.0);const x=cx+R(-0.4,0.4),z=cz+R(-0.4,0.4);
    _q.setFromEuler(_e.set(R(-0.35,0.35),0,R(-0.35,0.35)));_s.set(1,R(0.4,1.0),1);_p.set(x,floorY(x,z),z);_m.compose(_p,_q,_s);tubes.setMatrixAt(i,_m);}
  mussels.instanceMatrix.needsUpdate=true;tubes.instanceMatrix.needsUpdate=true;
}

