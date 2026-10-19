/* =========================================================
   14s. Arctic floe edge: Eclipse Sound near Pond Inlet, Nunavut (~72.8° N), late May – June.
   Land-fast ice about 1.8 m thick ends at a ragged edge; beyond it lies open water hundreds of metres deep.
   Under the ice only a few percent of the sunlight gets through, browned by the spring bloom of ice algae,
   with strands of Melosira arctica hanging down; polar cod and ice amphipods live just below the ice.
   Pods of narwhal and beluga travel along the edge, surfacing in the open water to breathe.
   The edge is a curve x = arcEdge(z); the same function is in the water shader (iceEdge) so that light,
   bubbles, the camera and the animals all agree on where the ice is.
   ========================================================= */
const ARC={on:false,h:1.8,ex:0,Ta:0.03,pod:null,cool:0,next:'beluga'};
const arcEdge=z=>ARC.ex+0.8*Math.sin(z*0.23+0.7)+0.35*Math.sin(z*0.71+2.1)+0.15*Math.sin(z*1.9);
const underArcIce=(x,z)=>ARC.on&&x<arcEdge(z);
const arcGroup=new THREE.Group();arcGroup.visible=false;scene.add(arcGroup);
U.uIce.value.set(ARC.ex,ARC.Ta,ARC.h,0);
const ARC_NOISE=`float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
  float fb(vec2 p){return n2(p)*0.5+n2(p*2.1+3.1)*0.3+n2(p*4.7+7.7)*0.2;}`;
/* ---- underside of the fast ice: gentle relief, patchy snow on top (more or less light), browned by ice algae ---- */
const arcRel=(x,z)=>0.08*Math.sin(x*0.31+Math.sin(z*0.2))*Math.sin(z*0.27)+0.03*Math.sin(x*1.3+z*0.9);   /* gentle relief of the ice underside */
const arcIceGeo=(()=>{const g=new THREE.PlaneGeometry(130,130,130,130).rotateX(Math.PI/2);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i)-63,z=p.getZ(i);p.setXYZ(i,x,arcRel(x,z),z);}
  g.computeVertexNormals();return g;})();
const arcIceMat=new THREE.ShaderMaterial({uniforms:U,side:THREE.DoubleSide,
  vertexShader:'varying vec3 vWPos; void main(){ vec4 wp=modelMatrix*vec4(position,1.0); vWPos=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }',
  fragmentShader:WATER_PARS+ARC_NOISE+`
  void main(){
    float de=iceEdge(vWPos.z)-vWPos.x; if(de<0.0) discard;
    float snow=fb(vWPos.xz*0.07); float tr=mix(1.7,0.35,smoothstep(0.3,0.72,snow));          /* thin snow lets more light through */
    float alg=0.55+0.45*smoothstep(0.3,0.78,fb(vWPos.xz*0.5+5.0));                            /* spring bloom: most of the underside is browned */
    vec3 ice=vec3(0.6,0.85,1.0)*tr; ice=mix(ice,ice*vec3(0.6,0.4,0.13),alg);
    ice*=1.0+0.35*(fb(vWPos.xz*3.0)-0.5);
    vec3 c=ice*uIce.y*1.6;
    c+=vec3(0.45,0.8,1.0)*lightAt(uIce.z)*0.22*exp(-de/0.9);                                 /* near the edge light also leaks in sideways */
    c*=uSky;
    float d=length(vWPos-cameraPosition); vec3 T=exp(-uC*d); c=c*T+bgCol(normalize(vWPos-cameraPosition))*(1.0-T);
    gl_FragColor=vec4(c,1.0);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
  }`});
const arcIce=new THREE.Mesh(arcIceGeo,arcIceMat);arcIce.frustumCulled=false;arcGroup.add(arcIce);
/* ---- the edge itself: a vertical wall of ice from the waterline down to the underside, with the algae band at its foot ---- */
const arcWallGeo=(()=>{const nz=600,ny=10,pos=[],idx=[],vy=[];
  for(let i=0;i<=nz;i++){const z=-60+120*i/nz;for(let j=0;j<=ny;j++){const y=0.3-(0.3+ARC.h+0.12)*j/ny;
    const x=arcEdge(z)-0.02-0.12*Math.abs(Math.sin(z*2.3+y*1.7))*(j/ny);pos.push(x,y,z);vy.push(y);}}
  for(let i=0;i<nz;i++)for(let j=0;j<ny;j++){const a=i*(ny+1)+j,b=a+1,c=a+ny+1,d=c+1;idx.push(a,b,c,b,d,c);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;})();
const arcWall=new THREE.Mesh(arcWallGeo,new THREE.ShaderMaterial({uniforms:U,side:THREE.DoubleSide,
  vertexShader:'varying vec3 vWPos; void main(){ vec4 wp=modelMatrix*vec4(position,1.0); vWPos=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }',
  fragmentShader:WATER_PARS+ARC_NOISE+`
  void main(){
    float y=vWPos.y, dep=max(-y,0.0);
    float g=fb(vec2(vWPos.z*1.4,y*5.0));
    vec3 c=mix(vec3(0.35,0.7,0.95),vec3(0.85,0.97,1.0),g)*lightAt(dep)*0.38;                    /* lit by the open water it faces */
    float band=smoothstep(-${(ARC.h-0.18).toFixed(2)},-${(ARC.h-0.04).toFixed(2)},-y);                  /* ice algae in the bottom few cm */
    c=mix(c,vec3(0.32,0.2,0.07)*lightAt(dep)*0.5,band*(0.6+0.4*g));
    c*=uSky;
    float d=length(vWPos-cameraPosition); vec3 T=exp(-uC*d); c=c*T+bgCol(normalize(vWPos-cameraPosition))*(1.0-T);
    gl_FragColor=vec4(c,1.0);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
  }`}));
arcWall.frustumCulled=false;arcGroup.add(arcWall);
/* ---- loose ice: rafted blocks under the edge, floating pans and brash in the open lead ---- */
const arcBlockGeo=(()=>{const g=new THREE.IcosahedronGeometry(0.6,2),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+0.18*Math.sin(x*5+z*3)*Math.sin(y*6+1)+0.08*Math.sin(x*11+y*9);p.setXYZ(i,x*k,Math.max(-0.5,Math.min(0.5,y*k*1.3)),z*k);}
  g.computeVertexNormals();const acc=Acc();addGeo(acc,g,null,(x,y,z)=>y<-0.4?[0.75,0.68,0.55]:[0.85,0.95,1.0]);return finishGeo(acc);})();
const arcBlockMat=waterify(lambert(),'arcblock',{emit:'emit+=diffuseColor.rgb*vec3(0.45,0.78,1.0)*0.12*lightAt(-vWPos.y)*uSky*iceSh(vWPos);'});
const arcBlocks=new THREE.InstancedMesh(arcBlockGeo,arcBlockMat,120);arcBlocks.frustumCulled=false;arcBlocks.count=0;scene.add(arcBlocks);
const arcFloat=[];   /* floating pieces: {x,z,s:[sx,sy,sz],yaw,draft} */
/* ---- Melosira arctica: chains of diatom cells hanging from the ice as slimy golden-brown strands, up to ~1 m and more ---- */
const melGeo=(()=>{const acc=Acc();
  addColored(acc,loftGeo(18,5,(a,b)=>{const ph=b*6.283,r=0.011*(1+0.35*Math.sin(a*70))*(1-0.5*a)+0.003;
    const wob=0.07*Math.sin(a*6.5)*a+0.012*Math.sin(a*31),wz=0.05*Math.sin(a*4.3+1)*a;return[r*Math.cos(ph)+wob,-a,r*Math.sin(ph)+wz,...mixc([0.75,0.58,0.24],[0.55,0.42,0.16],0.5+0.5*Math.sin(a*40))];}));
  return finishGeo(acc);})();
const melFlow=new THREE.Vector2();
const melMat=waterify(lambert({side:THREE.DoubleSide}),'melosira',{uniforms:{uMelF:{value:melFlow}},emit:'emit+=diffuseColor.rgb*vec3(1.0,0.9,0.7)*0.5*uSky*lightAt(-vWPos.y)*iceSh(vWPos);',vHead:'uniform vec2 uMelF;',
  vBegin:'{ float L=length(instanceMatrix[1].xyz); float k=-position.y*L; float ph=instanceMatrix[3].x*1.7+instanceMatrix[3].z*2.3; transformed.xz+=(uMelF*0.5+vec2(sin(uTime*0.55+ph),cos(uTime*0.45+ph*1.3))*0.05)*k*k; }'});
const mels=new THREE.InstancedMesh(melGeo,melMat,1400);mels.frustumCulled=false;mels.count=0;scene.add(mels);
/* ---- polar cod (Boreogadus saida): 10–20 cm, big eyes, live in cracks and pockets right under the ice ---- */
makeDrift('polarcod',{n:26,size:[0.11,0.19],spd:0.07,minAb:1,maxY:-ARC.h-0.13,geo:buildFishGeo({h:0.15,w:0.085,tailH:0.11,dorsal:0.06,anal:0.06,eye:0.035,
  col:(x,y,z,f)=>{if(f)return[0.42,0.4,0.34];const sp=Math.sin(x*90+z*70)*Math.sin(z*60-y*80)>0.7;return mixc([0.85,0.86,0.84],sp?[0.22,0.2,0.16]:[0.42,0.4,0.33],sstep(-0.02,0.07,y));}})});
/* ---- ice amphipod (Apherusa glacialis): ~1.5 cm, translucent with orange-red pigment, grazes the ice algae ---- */
makeDrift('apherusa',{n:40,size:[0.012,0.018],spd:0.03,minAb:1,maxY:-ARC.h-0.1,jitter:true,geo:(()=>{const acc=Acc();
  for(let k=0;k<7;k++){const a=-0.42+k*0.13,y=0.06*Math.cos(a*2.4);addGeo(acc,new THREE.SphereGeometry(1,8,6),M4(0,y,a,0,0,0,0.09-k*0.004,0.1,0.09),()=>k%2?[0.95,0.45,0.2]:[0.9,0.8,0.72]);}
  addGeo(acc,new THREE.CylinderGeometry(0.008,0.004,0.35,4),M4(0.04,0.05,0.55,1.2,0,0.3),()=>[0.9,0.7,0.6]);
  addGeo(acc,new THREE.CylinderGeometry(0.008,0.004,0.35,4),M4(-0.04,0.05,0.55,1.2,0,-0.3),()=>[0.9,0.7,0.6]);
  return finishGeo(acc);})()});
DRIFT.apherusa.upright=false;

/* ---- toothed whales of the floe edge. Normalised length 1 (z = -0.5 tail … +0.5 head), flukes beat up and down ---- */
function whaleBody(r,col,o){
  return loftGeo(120,36,(a,b)=>{const phi=b*Math.PI*2,c=Math.cos(phi),sn=Math.sin(phi),z=-0.5+a,rr=r(a);
    const w=0.55+0.45*sstep(0.1,0.4,a);                                                      /* tail stock flattened side to side */
    let x=rr*w*c,y=rr*sn*(sn<0?0.9:1);
    y+=(o.ridge||0)*sstep(0.28,0.38,a)*sstep(0.58,0.46,a)*Math.pow(Math.max(sn,0),14);          /* low dorsal ridge instead of a fin */
    if(a<0.12)y+=0.02*Math.pow(Math.max(sn,0),6)*sstep(0.12,0.02,a);                           /* keel on the tail stock */
    return[x,y,z,...col(x,y,z,sn,a)];});
}
function addFlukes(acc,span,chord,sweep,col){
  for(const sg of[1,-1])addColored(acc,loftGeo(16,10,(a,b)=>{const ph=b*Math.PI*2,x=sg*(0.006+span*a);
    const ch=chord*(1-0.72*Math.pow(a,1.5))+0.006,cz=-0.512-sweep*a*a,th=0.011*(1-0.75*a)+0.0015;
    const z=cz+0.5*ch*Math.cos(ph),y=th*Math.sin(ph);return[x,y,z,...col(x,y,z,Math.sin(ph))];}));
}
function addFlippers(acc,len,wid,z,col){
  for(const sg of[1,-1])addGeo(acc,new THREE.SphereGeometry(1,12,6),M4(sg*(0.09+len*0.7),-0.06,z,0.1,sg*0.6,-sg*0.35,len,0.009,wid),col);
}
/* narwhal (Monodon monoceros): mottled dark-grey back on a pale belly; males carry the tusk, a spiralled upper-left tooth */
function narwhalGeo(male){
  const acc=Acc();
  const r=a=>{const fr=a>0.84?Math.sqrt(Math.max(0,1-Math.pow((a-0.84)/0.16,2))):1;
    return(a<0.6?0.012+0.1*Math.pow(sstep(0,0.6,a),0.85):0.112-0.012*sstep(0.6,0.84,a))*fr+0.002;};
  /* base shading only: dark back, pale belly. The blotches are drawn per pixel in the shader (NARW_SPOTS) */
  const col=(x,y,z,sn,a)=>mixc([0.17,0.18,0.2],[0.8,0.8,0.78],sstep(0.25,-0.6,sn));
  addColored(acc,whaleBody(r,col,{ridge:0.012}));
  for(const sg of[1,-1])addGeo(acc,new THREE.SphereGeometry(0.007,6,4),M4(sg*0.085,-0.022,0.41),()=>[0.02,0.02,0.02]);
  addGeo(acc,new THREE.SphereGeometry(1,8,4),M4(0,0.095,0.37,0,0,0,0.012,0.004,0.008),()=>[0.05,0.05,0.06]);   /* blowhole */
  addFlippers(acc,0.04,0.022,0.29,()=>[0.2,0.21,0.23]);
  addFlukes(acc,0.14,0.095,0.07,(x,y,z,s)=>s>0?[0.18,0.19,0.21]:[0.5,0.51,0.52]);
  if(male){const L=0.46,g=new THREE.CylinderGeometry(0.0025,0.011,L,10,24);g.rotateX(Math.PI/2);g.translate(0.016,-0.012,0.49+L/2);
    addGeo(acc,g,M4(0,0,0,0.03,-0.03,0),(x,y,z)=>{const an=Math.atan2(y+0.012,x-0.016),s=Math.sin(an+z*140);   /* left-handed spiral grooves */
      return mixc([0.86,0.82,0.7],[0.6,0.55,0.42],(s>0.55?0.8:0)+0.6*sstep(0.65,0.5,z));});}
  return finishGeo(acc);
}
/* beluga (Delphinapterus leucas): white adults, grey young; big soft melon, short beak, a flexible neck and broad paddle flippers */
function belugaGeo(){
  const acc=Acc();
  const r=a=>{let v=0.012+0.11*Math.pow(sstep(0,0.55,a),0.85);v-=0.026*sstep(0.6,0.8,a);
    const fr=a>0.86?Math.sqrt(Math.max(0,1-Math.pow((a-0.86)/0.14,2))):1;return v*fr+0.002;};
  const col=(x,y,z,sn,a)=>{const s=0.03*Math.sin(z*90+x*50);return[0.88+s,0.89+s,0.84+s];};
  addColored(acc,whaleBody(r,col,{ridge:0.016}));
  addGeo(acc,new THREE.SphereGeometry(1,18,12),M4(0,0.02,0.44,0,0,0,0.078,0.076,0.08),()=>[0.9,0.9,0.86]);       /* melon */
  addGeo(acc,new THREE.SphereGeometry(1,12,8),M4(0,-0.035,0.495,0,0,0,0.042,0.027,0.04),()=>[0.86,0.86,0.82]);   /* beak */
  addGeo(acc,new THREE.TorusGeometry(0.035,0.0025,4,16,Math.PI),M4(0,-0.04,0.5,Math.PI/2,0,Math.PI),()=>[0.55,0.52,0.5]);  /* mouth line */
  for(const sg of[1,-1])addGeo(acc,new THREE.SphereGeometry(0.007,6,4),M4(sg*0.078,-0.01,0.425),()=>[0.03,0.03,0.03]);
  addGeo(acc,new THREE.SphereGeometry(1,8,4),M4(0,0.09,0.385,0,0,0,0.012,0.004,0.008),()=>[0.4,0.4,0.4]);
  addFlippers(acc,0.05,0.032,0.31,()=>[0.86,0.86,0.82]);
  addFlukes(acc,0.13,0.09,0.06,()=>[0.86,0.86,0.82]);
  return finishGeo(acc);
}
/* narwhal mottling: cellular blotches in model space, pale on the dark back and dark on the pale belly; none on the tusk */
const NARW_SPOTS=`
  vec3 nh3(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return fract(sin(p)*43758.5453);}
  float ncel(vec3 p){vec3 i=floor(p),f=fract(p);float d=8.0;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)for(int z=-1;z<=1;z++){vec3 g=vec3(float(x),float(y),float(z));d=min(d,length(g+nh3(i+g)-f));}return d;}`;
const NARW_FCOL=`{ vec3 q=vLocal*vec3(40.0,40.0,24.0); q+=0.6*sin(q.yzx*0.9+q.zxy*0.4);
    float sp=smoothstep(0.55,0.3,ncel(q)+0.22*ncel(q*2.7+3.0))*smoothstep(0.1,0.5,ncel(q*0.21+7.0));
    float lum=dot(diffuseColor.rgb,vec3(0.33));
    float k=vLocal.z>0.495?1.0:mix(mix(2.3,0.5,smoothstep(0.25,0.6,lum)),1.0,smoothstep(0.42,0.5,vLocal.z)*0.6);
    diffuseColor.rgb*=mix(1.0,k,sp); }`;
function podMesh(key,geo,n,o){
  const ph=new Float32Array(n);geo.setAttribute('aPhase',new THREE.InstancedBufferAttribute(ph,1));
  const mat=waterify(lambert({side:THREE.DoubleSide}),key,{vHead:'attribute float aPhase;',fHead:(o&&o.fHead)||'',fColor:(o&&o.fColor)||'',
    vBegin:'float bt=clamp(-0.1-position.z,0.0,1.0); transformed.y+=sin(aPhase-position.z*5.0)*0.4*bt*bt;'});
  const m=new THREE.InstancedMesh(geo,mat,n);m.frustumCulled=false;scene.add(m);
  const c=new THREE.Color(1,1,1);for(let i=0;i<n;i++)m.setColorAt(i,c);m.count=0;m.userData.ph=ph;return m;   /* colours before count=0: the buffer is sized from count */
}
const NARM=podMesh('narwhalM',narwhalGeo(true),3,{fHead:NARW_SPOTS,fColor:NARW_FCOL}),NARF=podMesh('narwhalF',narwhalGeo(false),4,{fHead:NARW_SPOTS,fColor:NARW_FCOL}),BELU=podMesh('beluga',belugaGeo(),6);
/* a pod travels along the edge in the open water; members keep loose station, and each comes up to breathe now and then */
function startPod(sp,near){
  const c=controls.target,dir=rnd()<0.5?1:-1,P={sp,dir,zc:c.z-dir*(near?7:40),end:c.z+dir*40,lane:near?R(2.6,3.4):R(3,5.5),y0:near?R(-3.3,-2.7):R(-4.2,-2.8),v:sp==='narwhal'?1.6:1.2,m:[]};
  const add=(mesh,s,dx,dy,dz,grey)=>{const i=P.m.filter(q=>q.mesh===mesh).length;if(i>=mesh.instanceMatrix.count)return null;
    const q={mesh,i,s,dx,dy,dz,ph:rnd()*6.28,hz:(sp==='narwhal'?0.55:0.45)*Math.sqrt(4.2/s),surf:R(3,25),y:P.y0+dy,pos:new THREE.Vector3()};
    mesh.setColorAt(i,_cl.setScalar(grey||1));mesh.instanceColor.needsUpdate=true;P.m.push(q);return q;};
  if(sp==='narwhal'){
    add(NARM,R(4.5,4.8),-0.6,0.3,4);add(NARM,R(4.3,4.6),1.4,-0.5,-1.5);if(rnd()<0.6)add(NARM,R(4.2,4.5),0.2,0.8,-7);
    add(NARF,R(3.8,4.1),0.8,0.2,1.5);add(NARF,R(3.7,4.0),-1.2,-0.6,-4.5);add(NARF,R(3.9,4.1),1.8,0.9,-9);
    add(NARF,1.6,1.55,0.55,1.6,0.45);                                                             /* calf, uniformly grey, beside its mother */
  }else{
    add(BELU,R(4.0,4.4),0,0,3);add(BELU,R(3.6,3.9),1.3,-0.4,-1);add(BELU,R(3.5,3.8),-1.3,0.6,-5);add(BELU,R(3.7,4.1),0.6,-0.8,-8.5);
    add(BELU,2.6,1.0,0.3,-3.2,0.72);add(BELU,1.6,2.0,0.1,-1.1,0.55);                              /* a greyish juvenile and a dark-grey calf */
  }
  [NARM,NARF,BELU].forEach(m=>m.count=P.m.filter(q=>q.mesh===m).length);
  return P;
}
const _cl=new THREE.Color();
function stepPods(dt,t){
  let P=ARC.pod;
  if(!P){ARC.cool-=dt;if(ARC.cool>0)return;P=ARC.pod=startPod(ARC.next,false);ARC.next=ARC.next==='narwhal'?'beluga':'narwhal';}
  P.zc+=P.dir*P.v*dt;
  for(const q of P.m){
    const z=P.zc+q.dz,xE=arcEdge(z);q.surf-=dt;
    let ty=P.y0+q.dy+0.3*Math.sin(t*0.35+q.ph);if(q.surf<0){ty=-0.18*q.s/4;if(q.surf<-5)q.surf=R(20,45);}
    const vy=(ty-q.y)*0.45;q.y+=vy*dt;
    const x=Math.max(xE+P.lane+q.dx,xE+0.8+q.s*0.12),dx=(arcEdge(z+P.dir*0.5)-xE)*2*P.v*P.dir;
    q.pos.set(x,q.y,z);_a.set(dx,vy,P.dir*P.v).normalize();
    q.mesh.userData.ph[q.i]+=dt*2*Math.PI*q.hz*(q.surf<0?0.6:1);
    _m.lookAt(_a,ORIGIN,UP);_q.setFromRotationMatrix(_m);_s.setScalar(q.s);_m.compose(q.pos,_q,_s);q.mesh.setMatrixAt(q.i,_m);
  }
  for(const m of[NARM,NARF,BELU]){m.instanceMatrix.needsUpdate=true;m.geometry.attributes.aPhase.needsUpdate=true;}
  if((P.zc-P.end)*P.dir>12){ARC.pod=null;ARC.cool=R(5,12);[NARM,NARF,BELU].forEach(m=>m.count=0);}
}
function podSeen(sp){const P=ARC.pod;if(!ARC.on||!P||P.sp!==sp)return false;const c=camera.position,d=seeDist(false)+3;return P.m.some(q=>q.pos.distanceTo(c)<d);}

regPick(arcIce,'arc_ice');regPick(arcWall,'arc_edge');regPick(arcBlocks,'arc_edge');regPick(mels,'melosira');
regPick(DRIFT.polarcod.mesh,'polarcod');regPick(DRIFT.apherusa.mesh,'apherusa');regPick(NARM,'narwhal');regPick(NARF,'narwhal');regPick(BELU,'beluga');
function buildArctic(on){
  ARC.on=on;arcGroup.visible=on;U.uIce.value.w=on?1:0;
  if(!on){mels.count=arcBlocks.count=0;ARC.pod=null;[NARM,NARF,BELU].forEach(m=>m.count=0);return;}
  /* Melosira in patches, densest a few metres in from the edge */
  let k=0;const cl=[];for(let i=0;i<34;i++)cl.push([R(-24,-0.6),R(-26,26),R(0.6,2.6)]);
  for(let i=0;i<1400*PERF.k;i++){const c=cl[i%cl.length],a=rnd()*6.28,rr=Math.sqrt(rnd())*c[2],z=c[1]+Math.sin(a)*rr,x=arcEdge(z)+c[0]+Math.cos(a)*rr;
    if(x>arcEdge(z)-0.3)continue;const L=0.12+1.1*Math.pow(rnd(),2.2);
    _q.identity();_s.set(1,L,1);_p.set(x,-ARC.h+arcRel(x,z)+0.03,z);_m.compose(_p,_q,_s);mels.setMatrixAt(k++,_m);}
  mels.count=k;mels.instanceMatrix.needsUpdate=true;
  /* rafted blocks frozen in under the edge, then loose pans and brash floating in the lead */
  k=0;for(let i=0;i<22;i++){const z=R(-30,30),x=arcEdge(z)-R(0.3,3),s=R(0.4,1.1);
    _q.setFromEuler(_e.set(R(-0.5,0.5),rnd()*6.28,R(-0.5,0.5)));_s.set(s*R(1,1.4),s*R(0.5,0.8),s*R(1,1.3));_p.set(x,-ARC.h+arcRel(x,z)-s*0.08,z);_m.compose(_p,_q,_s);arcBlocks.setMatrixAt(k++,_m);}
  ARC.k0=k;arcFloat.length=0;
  for(let i=0;i<6;i++)arcFloat.push({x:R(6,32),z:R(-40,40),s:[R(2.5,6),R(1.3,1.9),R(2.5,5)],yaw:rnd()*6.28,dr:0.88});      /* pans: ~90 % below the waterline */
  for(let i=0;i<45;i++)arcFloat.push({x:R(0.6,14),z:R(-35,35),s:[R(0.2,0.7),R(0.15,0.45),R(0.2,0.7)],yaw:rnd()*6.28,dr:0.85});
  ARC.pod=startPod('narwhal',true);ARC.next='beluga';ARC.cool=0;
  stepArctic(0,0);
}
function stepArctic(dt,t){
  if(!ARC.on)return;
  melFlow.set(CUR.x*S.cur*6,CUR.z*S.cur*6);
  /* floating ice drifts slowly with the current, wrapping around the view */
  let k=ARC.k0;const c=controls.target;
  for(const f of arcFloat){f.z+=CUR.z*S.cur*0.4*dt;f.x+=CUR.x*S.cur*0.15*dt;if(f.z-c.z>40)f.z-=80;if(f.z-c.z<-40)f.z+=80;
    const xE=arcEdge(f.z)+0.4+f.s[0]*0.5;if(f.x<xE)f.x=xE;
    _q.setFromEuler(_e.set(0.02*Math.sin(t*0.5+f.yaw),f.yaw,0.02*Math.cos(t*0.4+f.yaw)));_s.set(...f.s);_p.set(f.x,f.s[1]*(0.5-f.dr)+0.01*Math.sin(t*0.8+f.yaw),f.z);
    _m.compose(_p,_q,_s);arcBlocks.setMatrixAt(k++,_m);}
  arcBlocks.count=k;arcBlocks.instanceMatrix.needsUpdate=true;
  stepPods(dt,t);
}
const ARC_INFO={
  arc_ice:[$t('北极海冰的底面'),$t('约 1.8 m 厚的岸冰 · 冰底 −1.8 °C'),$t('冬天冻结、贴着海岸不动的“固定冰”。春天积雪变薄、日照变长，冰底的冰藻大量繁殖，把冰染成褐色。冰下的光只有水面的百分之几，冰藻能在只有水面约 0.02% 的光下进行光合作用。雪薄的地方更亮。'),$t('埃克利普斯海峡 · 庞德因莱特')],
  arc_edge:[$t('浮冰边缘（冰缘）'),$t('固定冰与开阔水面的交界'),$t('这一侧是连着陆地、整片不动的固定冰，另一侧是开阔水面。冰缘随季节向陆地后退。春天，冰藻、浮游植物、北极鳕和鲸都聚集在这条线上，因纽特人世代在这里狩猎。冰块底下发褐的一层就是冰藻。'),$t('埃克利普斯海峡 · 庞德因莱特')]
};
Object.assign(CHIM_INFO,ARC_INFO);
CAT.push(['narwhal',$t('一角鲸'),'Monodon monoceros',$t('北极 · 浮冰边缘和峡湾')],['beluga',$t('白鲸'),'Delphinapterus leucas',$t('北极与亚北极')],
  ['polarcod',$t('北极鳕'),'Boreogadus saida',$t('北冰洋 · 冰下')],['apherusa',$t('冰下端足类'),'Apherusa glacialis',$t('北冰洋 · 海冰底面')],['melosira',$t('北极直链藻'),'Melosira arctica',$t('北冰洋 · 海冰底面')]);
CAT.slice(-5).forEach(c=>CATMAP[c[0]]=c);
Object.assign(FACTS,{
  narwhal:$t('雄性的长牙是左上颌的一颗牙齿，螺旋生长，可达 2 m 以上，表面有多达一千万个神经末梢。成年雄性体长约 4.5 m。它们能潜到 1,500 m 以下，一次超过 25 分钟。全球约四分之三的一角鲸在加拿大海域。'),
  beluga:$t('成年白鲸全身雪白，体长可达约 4.9 m；幼崽是深灰色的，随年龄慢慢变白。颈椎没有愈合，能点头、左右转头，便于在浮冰间穿行；额头圆圆的“额隆”柔软，帮助聚焦和调整发出的声音。叫声丰富，被称为“海中金丝雀”。'),
  polarcod:$t('北极食物网的枢纽：吃冰下的端足类和桡足类，又是一角鲸、白鲸、海豹和海鸟的主要食物。幼鱼躲在海冰的缝隙里，身体里 50–90% 的碳最终来自冰藻。'),
  apherusa:$t('一辈子贴着海冰底面生活，啃食冰藻。北极鳕的幼鱼主要吃它们，冰藻的能量就这样一级级传上去。海冰减少，它们的家也在缩小。'),
  melosira:$t('一种硅藻，细胞连成长链，在冰底挂成一缕缕金褐色的“帘子”，可长到 1 m 以上。冰融化时成团快速沉到几千米深的海底，给那里的生物送去食物。2012 年海冰最少的夏天，它贡献了北冰洋中部约 45% 的初级生产。')
});
SPECIES.push(['narwhal',$t('一角鲸')],['beluga',$t('白鲸')],['polarcod',$t('北极鳕')],['apherusa',$t('冰下端足类')],['melosira',$t('北极直链藻')]);
