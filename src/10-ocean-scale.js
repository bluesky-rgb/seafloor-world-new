/* =========================================================
   14b. Ocean scale: giants, deep drifters, hadal floor life
   ========================================================= */
const DIVE={on:false,play:false,speed:'auto',z:5,lastZ:5,elapsed:0,manualTorch:false,zoneT:0,infoT:0,replay:false,clock:0,rphase:'',bt:0,rev:new Set()};
const zEff=()=>DIVE.on?DIVE.z:S.D;
const camZ=()=>Math.max(-camera.position.y,0);

/* single animated swimmer (one-instance InstancedMesh so it shares the fish shader path) */
function makeSwimmer(key,geo,o){
  const ph=new Float32Array(1);geo.setAttribute('aPhase',new THREE.InstancedBufferAttribute(ph,1));
  const mat=waterify(lambert({side:THREE.DoubleSide}),key,Object.assign({vHead:'attribute float aPhase;'},o||{}));
  const mesh=new THREE.InstancedMesh(geo,mat,1);mesh.frustumCulled=false;mesh.count=0;scene.add(mesh);
  return{mesh,ph,geo};
}
function poseSwimmer(sw,pos,dir,scale){
  _d.copy(dir).normalize();_m.lookAt(_d,ORIGIN,UP);_q.setFromRotationMatrix(_m);_s.setScalar(scale);
  _m.compose(pos,_q,_s);sw.mesh.setMatrixAt(0,_m);sw.mesh.instanceMatrix.needsUpdate=true;sw.geo.attributes.aPhase.needsUpdate=true;
}
/* encounter: a large animal emerges from the haze, passes the viewer and fades away */
function Enc(cfg){this.cfg=cfg;this.on=false;this.cool=R(2,6);this.pos=new THREE.Vector3();this.p0=new THREE.Vector3();this.dir=new THREE.Vector3();this.s=0;this.py=0;this.yOff=0;this.tt=0;this.phase='';this.dist=0;}
/* start ahead of the viewer: crossing the view at distance `fwd`, or (bearing mode) approaching along a line of sight */
Enc.prototype.start=function(){
  const c=camera.position,tg=controls.target,cf=this.cfg;let fx=tg.x-c.x,fz=tg.z-c.z;const fl=Math.hypot(fx,fz)||1;fx/=fl;fz/=fl;
  const lit=!S.night&&light(camZ(),1)>3e-3,fwd=lit?R(cf.fwd[0],cf.fwd[1]):R(cf.fwdDark[0],cf.fwdDark[1]),sd=rnd()<0.5?-1:1;
  const sx=-fz*sd,sz=fx*sd;
  this.p0.set(c.x+fx*fwd+sx*cf.R0,0,c.z+fz*fwd+sz*cf.R0);this.dir.set(-sx,0,-sz);
  let b=R(-0.4,0.4);
  if(wall.visible){const n=WALL.n,off=R(3,9);this.p0.set(c.x+fx*cf.R0+n.x*off,0,c.z+fz*cf.R0+n.z*off);this.dir.set(-fx,0,-fz);
    b=Math.abs(b)+0.1;if((fx*Math.cos(b)-fz*Math.sin(b))*n.x+(fx*Math.sin(b)+fz*Math.cos(b))*n.z<0)b=-b;}
  this.bx=fx*Math.cos(b)-fz*Math.sin(b);this.bz=fx*Math.sin(b)+fz*Math.cos(b);
  this.s=0;this.tt=0;this.phase='in';this.dist=cf.R0;this.yOff=R(cf.y[0],cf.y[1]);this.on=true;this.pos.copy(this.p0);this.py=this.yTarget();
};
Enc.prototype.stop=function(){this.on=false;this.cool=R(this.cfg.cool[0],this.cfg.cool[1]);};
Enc.prototype.yTarget=function(){const cf=this.cfg;let y=(cf.yAbs!==undefined?cf.yAbs:controls.target.y)+this.yOff;y=Math.max(y,floorY(this.pos.x,this.pos.z)+cf.minAb);return Math.min(y,-cf.minAb*0.5-0.6);};

/* whale shark (Rhincodon typus). Normalised length 1 (tail z=-0.5 .. snout z=+0.5).
   Broad, flattened head with a wide terminal mouth; three ridges along each flank; large first dorsal,
   crescent-shaped tail (upper lobe longer). Dark blue-grey back with the "checkerboard" of pale spots
   between pale vertical stripes (spots smaller and denser on the head); white belly. */
function whaleSharkGeo(){
  const acc=Acc();
  /* blunt, rounded snout (nose cap over the last 10%), thin caudal peduncle, head wider than tall */
  const nose=a=>a>0.9?Math.sqrt(Math.max(0,1-Math.pow((a-0.9)/0.1,2))):1;
  const W=a=>0.006+0.1*Math.pow(sstep(0,0.55,a),0.8)*nose(a)*(1+0.1*sstep(0.6,0.88,a));
  const Hh=a=>0.006+0.085*Math.pow(sstep(0,0.5,a),0.8)*nose(a)*(1-0.4*sstep(0.62,0.95,a));
  const body=loftGeo(140,56,(a,b)=>{
    const phi=b*Math.PI*2,c=Math.cos(phi),sn=Math.sin(phi),z=-0.5+a;
    let w=W(a),h=Hh(a);
    /* flattened, slightly squared head; belly flatter than back */
    const sq=sstep(0.6,0.95,a)*0.35;let x=w*Math.sign(c)*Math.pow(Math.abs(c),1-sq),y=h*Math.sign(sn)*Math.pow(Math.abs(sn),1-sq*0.5)*(sn<0?0.85:1);
    /* three lateral ridges per side on the trunk */
    const ridge=sstep(0.25,0.4,a)*sstep(0.85,0.7,a);
    for(const ra of[0.35,0.75,1.15]){const d=Math.abs(Math.abs(Math.atan2(sn,Math.abs(c)))-ra);x+=Math.sign(c)*0.006*ridge*sstep(0.12,0,d);y+=Math.sign(sn)*0.004*ridge*sstep(0.12,0,d);}
    let col;
    const belly=sstep(-0.05,-0.35,sn);
    if(belly>0.98)col=[0.88,0.89,0.88];
    else{
      const head=sstep(0.72,0.85,a);
      const fz=z*(head>0.5?95:62),fa=Math.atan2(y,x)*(head>0.5?10:7);
      const stripe=head<0.5&&Math.abs(Math.sin(z*Math.PI*30))<0.12&&a<0.8;                 /* pale vertical stripes */
      const [d1]=cell2(fz,fa);const spot=d1<(head>0.5?0.22:0.26);                            /* pale spots between them */
      col=(spot||stripe)?[0.8,0.83,0.84]:[0.17,0.22,0.28];
      col=mixc(col,[0.88,0.89,0.88],belly);
    }
    /* the mouth: a wide dark slit across the front of the snout */
    if(a>0.985&&sn<0.25&&sn>-0.55)col=[0.05,0.05,0.06];
    return[x,y,z,...col];});
  addColored(acc,body);
  /* fins: thin lofted blades, coloured like the back above and pale below */
  const fin=(pts,thk,o)=>{const n=pts.length-1;
    return loftGeo(n,8,(a,b)=>{const k=Math.min(n,Math.round(a*n)),p=pts[k],phi=b*Math.PI*2;
      const half=p[2]*0.5,t=thk*(1-0.8*a);
      return o(p[0],p[1],half*Math.cos(phi),t*Math.sin(phi),Math.sin(phi));});};
  const finCol=(x,y,z,s)=>{const[d1]=cell2(x*60,z*60);return(d1<0.2&&s>0)?[0.78,0.8,0.82]:[0.17,0.22,0.28];};
  /* first dorsal (span upward, chord along z) */
  addColored(acc,fin([[0,0,0.16],[0.04,0.01,0.13],[0.08,0.03,0.08],[0.115,0.055,0.03]],0.012,(s,dz,ch,t)=>{const z=-0.02+dz+ch,y=Hh(0.48)*0.95+s;return[t,y,z,...finCol(t,y,z,1)];}));
  /* second dorsal */
  addColored(acc,fin([[0,0,0.06],[0.03,0.01,0.03],[0.045,0.02,0.01]],0.006,(s,dz,ch,t)=>{const z=-0.24+dz+ch,y=Hh(0.26)*0.95+s;return[t,y,z,...finCol(t,y,z,1)];}));
  /* caudal fin: upper lobe longer, lower lobe shorter, crescent */
  addColored(acc,fin([[0,0,0.07],[0.06,-0.03,0.05],[0.13,-0.07,0.03],[0.2,-0.11,0.012]],0.01,(s,dz,ch,t)=>{const z=-0.5+dz+ch-0.02,y=s;return[t,y,z,...finCol(t,y,z,1)];}));
  addColored(acc,fin([[0,0,0.06],[0.05,-0.02,0.035],[0.1,-0.04,0.012]],0.008,(s,dz,ch,t)=>{const z=-0.5+dz+ch-0.02,y=-s;return[t,y,z,...finCol(t,y,z,1)];}));
  /* pectoral fins: large, swept back, slightly drooping */
  for(const sg of[1,-1])addColored(acc,fin([[0,0,0.12],[0.06,-0.02,0.1],[0.13,-0.06,0.06],[0.2,-0.1,0.02]],0.012,(s,dz,ch,t)=>{const x=sg*(W(0.62)*0.9+s),y=-Hh(0.62)*0.55-s*0.28+t,z=0.13+dz+ch;return[x,y,z,...(t>0?[0.17,0.22,0.28]:[0.85,0.86,0.86])];}));
  /* small eyes behind the mouth corners */
  for(const sg of[1,-1])addGeo(acc,new THREE.SphereGeometry(0.0055,8,6),M4(sg*W(0.94)*0.98,0.004,0.44),()=>[0.04,0.04,0.05]);
  return finishGeo(acc);
}
const WSH=makeSwimmer('whaleshark',whaleSharkGeo(),
  {vBegin:'float bt=clamp(0.15-position.z,0.0,1.0); transformed.x+=sin(aPhase-position.z*4.0)*0.15*bt*bt;'});
const encWS=new Enc({R0:34,fwd:[11,18],fwdDark:[7,10],y:[-1,3],cool:[22,40],spd:1.0,len:9.5,minAb:2.5});

/* sperm whale (Physeter macrocephalus): horizontal flukes beat up and down */
function spermGeo(){
  /* proportions after photographs: a box-like head about a third of the length with a blunt front, a narrow underslung
     lower jaw lined with white, prune-like wrinkled skin behind the head, a low dorsal hump followed by "knuckles",
     broad triangular flukes. The blowhole sits at the front, to the left. Healed squid scars streak the head. */
  const acc=Acc();
  const W=a=>a<0.3?0.012+0.05*sstep(0,0.3,a):a<0.62?0.062+0.022*sstep(0.3,0.5,a):0.084-0.008*sstep(0.62,0.9,a);
  const Hh=a=>a<0.3?0.02+0.058*sstep(0,0.3,a):a<0.62?0.078+0.018*sstep(0.3,0.5,a):0.096+0.006*sstep(0.62,0.8,a);
  const cap=a=>a>0.965?Math.sqrt(Math.max(0,1-Math.pow((a-0.965)/0.035,2))):1;
  addColored(acc,loftGeo(150,40,(a,b)=>{const ph=b*Math.PI*2,c=Math.cos(ph),sn=Math.sin(ph),z=-0.5+a;
    const n=2+1.6*sstep(0.6,0.75,a),sp=(v,k)=>Math.sign(v)*Math.pow(Math.abs(v),2/k);   /* superellipse: round body, boxy head */
    let x=W(a)*cap(a)*sp(c,n),y=Hh(a)*cap(a)*sp(sn,n)*(sn<0?0.92:1)+0.012*sstep(0.6,0.9,a);
    if(sn>0){y+=0.018*Math.exp(-Math.pow((a-0.36)/0.035,2))*Math.pow(sn,6);                                  /* dorsal hump */
      for(let k=0;k<5;k++)y+=0.006*Math.exp(-Math.pow((a-0.3+k*0.035)/0.008,2))*Math.pow(sn,8);}            /* knuckles */
    const wr=sstep(0.25,0.4,a)*sstep(0.68,0.58,a)*(0.5+0.5*Math.sin(z*420+Math.sin(ph*9)*2));                /* wrinkled skin */
    let col=mixc([0.27,0.26,0.25],[0.19,0.18,0.18],wr*0.7);
    if(a>0.62){const[d1,d2]=cell2(z*90+ph*3,y*90);if(d2-d1<0.04)col=mixc(col,[0.55,0.54,0.52],0.6);}        /* scars */
    if(a>0.6&&sn<-0.55)col=mixc(col,[0.82,0.8,0.78],sstep(-0.55,-0.85,sn)*sstep(0.6,0.66,a));              /* pale underside where the jaw tucks in */
    return[x,y,z,...col];}));
  /* lower jaw: long, narrow, rod-like, white-lipped, tucked under the head */
  addColored(acc,loftGeo(30,10,(a,b)=>{const ph=b*Math.PI*2,z=0.17+a*0.29,w=0.016*(1-0.4*a)+0.004,h=0.012*(1-0.3*a)+0.003;
    const x=w*Math.cos(ph),y=-0.088-0.004*a+h*Math.sin(ph);return[x,y,z,...(Math.sin(ph)>0.2?[0.85,0.84,0.82]:[0.6,0.58,0.56])];}));
  for(const sg of[1,-1]){addGeo(acc,new THREE.SphereGeometry(1,10,6),M4(sg*0.078,-0.06,0.2,0,sg*0.5,-sg*0.4,0.05,0.008,0.024),()=>[0.24,0.23,0.23]);   /* flippers */
    addGeo(acc,new THREE.SphereGeometry(0.006,6,4),M4(sg*0.077,-0.035,0.24),()=>[0.02,0.02,0.02]);}                                               /* small eyes far back */
  addGeo(acc,new THREE.SphereGeometry(1,8,4),M4(0.035,0.103,0.475,0,0.4,0,0.016,0.004,0.008),()=>[0.06,0.06,0.06]);                                  /* blowhole, front left */
  for(const sg of[1,-1])addColored(acc,loftGeo(14,8,(a,b)=>{const ph=b*Math.PI*2,x=sg*(0.006+0.14*a),ch=0.07*(1-0.8*a)+0.008,cz=-0.512-0.045*a;
    return[x,0.004*Math.sin(ph),cz+0.5*ch*Math.cos(ph),...[0.22,0.21,0.21]];}));
  return finishGeo(acc);
}
const SPW=makeSwimmer('sperm',spermGeo(),{vBegin:'float bt=clamp(-0.05-position.z,0.0,1.0); transformed.y+=sin(aPhase-position.z*4.0)*0.35*bt*bt;'});
const encSW=new Enc({R0:42,fwd:[13,20],fwdDark:[8,11],y:[-3,4],cool:[30,55],spd:1.5,len:15,minAb:4});

/* giant squid (Architeuthis dux): seen only at the edge of the light */
function squidGeo(){
  /* mantle ~2 m with a pair of rhomboid fins at the tip, the largest eyes in the animal kingdom (~27 cm), eight
     thick arms lined with pale suckers and two feeding tentacles ending in clubs; skin red-brown with dark chromatophores */
  const acc=Acc(),skin=(x,y,z)=>{const[d1]=cell2(z*160,Math.atan2(y,x)*6);return mixc(mixc([0.8,0.48,0.42],[0.56,0.2,0.18],sstep(-0.02,0.02,y)),[0.35,0.1,0.1],d1<0.22?0.6:0);};
  addColored(acc,loftGeo(40,16,(a,b)=>{const ph=b*Math.PI*2,z=0.27+a*0.23,r=(0.028*Math.pow(Math.sin(Math.PI*(0.08+0.6*a)),0.6))*(1-sstep(0.85,1,a)*0.9)+0.002;
    const x=r*Math.cos(ph),y=r*Math.sin(ph)*0.95;return[x,y,z,...skin(x,y,z)];}));
  for(const sg of[1,-1])addGeo(acc,triGeo([0,0,0.5, sg*0.055,0,0.455, 0,0,0.41],true),null,()=>[0.62,0.24,0.2]);
  addGeo(acc,new THREE.SphereGeometry(1,14,10),M4(0,0,0.262,0,0,0,0.026,0.024,0.03),skin);                                                        /* head */
  for(const sg of[1,-1]){addGeo(acc,new THREE.SphereGeometry(0.0145,12,8),M4(sg*0.022,0.004,0.266),()=>[0.06,0.06,0.09]);
    addGeo(acc,new THREE.SphereGeometry(0.006,8,6),M4(sg*0.035,0.006,0.27),()=>[0.75,0.78,0.8]);}                                                 /* eye shine */
  for(let k=0;k<8;k++){const a0=k/8*Math.PI*2,L=0.2+0.03*Math.sin(k);
    addColored(acc,loftGeo(18,6,(a,b)=>{const ph=b*Math.PI*2,z=0.24-a*L,sp=0.012+a*0.05,cx=Math.cos(a0)*sp,cy=Math.sin(a0)*sp,r=0.0065*(1-0.85*a)+0.0008;
      const inner=Math.cos(ph-a0-Math.PI)>0.4;const x=cx+r*Math.cos(ph),y=cy+r*Math.sin(ph);return[x,y,z,...(inner&&Math.sin(a*90)>0?[0.9,0.82,0.75]:skin(x,y,z))];}));}
  for(const sg of[1,-1])addColored(acc,loftGeo(40,5,(a,b)=>{const ph=b*Math.PI*2,z=0.24-a*0.72,cx=sg*(0.006+a*0.03),cy=-0.004-a*0.012,club=sstep(0.86,0.93,a)*sstep(1,0.97,a);
    const r=0.0022+0.006*club;const x=cx+r*Math.cos(ph),y=cy+r*Math.sin(ph)*(1-0.4*club);return[x,y,z,...(club>0.3&&Math.sin(a*400)>0?[0.9,0.8,0.72]:skin(x,y,z))];}));
  return finishGeo(acc);
}
const SQD=makeSwimmer('squid',squidGeo(),{vBegin:`{ float a=clamp((0.26-position.z)/0.75,0.0,1.0);
  transformed.x+=sin(uTime*1.1+position.z*14.0+aPhase)*0.035*a; transformed.y+=cos(uTime*0.9+position.z*11.0+aPhase*1.3)*0.03*a; }`});
const encSQ=new Enc({R0:26,fwd:[0,0],fwdDark:[0,0],y:[-2,2],cool:[28,50],len:9,minAb:2});

/* giant siphonophore (Apolemia-type colonial chain, tens of metres long): bioluminescent pulses travel along it */
const NSI=120;
const siph=makePoints(NSI,`varying float vA; void main(){ float r=length(gl_PointCoord-0.5)*2.0; if(r>1.0) discard;
  float d=length(vWPos-cameraPosition); vec3 tE=torchAt(vWPos,1.0);
  vec3 body=vec3(0.75,0.8,0.85)*(tE+lightAt(-vWPos.y)*uSky)*0.6*(1.0-r);
  gl_FragColor=vec4((vec3(0.2,0.7,1.0)*vA*2.4*(1.0-r)*(1.0-r)+body)*exp(-uC*d),1.0);`,THREE.AdditiveBlending);
siph.pts.material.vertexShader=siph.pts.material.vertexShader.replace('attribute float aSeed;','attribute float aSeed; varying float vA;').replace('vSeed=aSeed;','vSeed=aSeed; vA=aSeed;');
siph.pts.material.fragmentShader=siph.pts.material.fragmentShader.replace('varying float vA;','').replace('varying float vSeed;','varying float vSeed; varying float vA;');
const encSI=new Enc({R0:15,fwd:[9,14],fwdDark:[9,14],y:[-2,3],cool:[18,35],minAb:3});

/* generic drifting animals (InstancedMesh, wander + flow + depth-layer relocation) */
const DRIFT={};
function makeDrift(key,cfg){
  const geo=cfg.geo,n=cfg.n,ph=new Float32Array(n);for(let i=0;i<n;i++)ph[i]=rnd()*6.28;
  geo.setAttribute('aPhase',new THREE.InstancedBufferAttribute(ph,1));
  const glow=!!geo.attributes.aGlow;
  const mat=waterify(lambert({side:THREE.DoubleSide}),'dr_'+key,{
    vHead:'attribute float aPhase; varying float vPh;'+(glow?'attribute float aGlow; varying float vGlow;':''),
    vBegin:(cfg.vb||'')+'vPh=aPhase;'+(glow?'vGlow=aGlow;':''),fHead:'varying float vPh;'+(glow?'varying float vGlow;':''),emit:cfg.emit||''});
  const mesh=new THREE.InstancedMesh(geo,mat,n);mesh.frustumCulled=false;mesh.count=0;scene.add(mesh);
  const D=Object.assign({key,mesh,ph,n,p:new Float32Array(n*3),v:new Float32Array(n*3),sz:new Float32Array(n),hd:new Float32Array(n),active:false,box:null,glows:glow},cfg);
  for(let i=0;i<n;i++){D.sz[i]=R(cfg.size[0],cfg.size[1]);D.hd[i]=rnd()*6.28;}
  DRIFT[key]=D;return D;
}
function setDrift(D,on,box){
  const was=D.active;D.active=on;D.mesh.count=on?D.n:0;if(on&&(!was||!D.box))D.box=box;
  if(on&&!was){const B=D.box;for(let i=0;i<D.n;i++){const o=i*3;D.p[o]=B.cx+R(-1,1)*B.rx;D.p[o+1]=B.cy+R(-1,1)*B.ry;D.p[o+2]=B.cz+R(-1,1)*B.rz;D.v[o]=D.v[o+1]=D.v[o+2]=0;}}
}
/* in dive mode a layer's animals stay at their depth; when the viewer leaves them behind, the group reappears ahead */
function relocateBox(B,arr,n,zr){
  if(!B)return false;const c=controls.target;if(Math.abs(B.cy-c.y)<30)return false;
  let ny=c.y+(B.cy>c.y?-10:10);if(zr)ny=Math.min(-zr[0],Math.max(-zr[1],ny));
  const dy=ny-B.cy,dx=c.x-B.cx,dz=c.z-B.cz;B.cy=ny;B.cx=c.x;B.cz=c.z;
  for(let i=0;i<n;i++){arr[i*3]+=dx;arr[i*3+1]+=dy;arr[i*3+2]+=dz;}
  return true;
}
function stepDrift(D,dt,t){
  if(!D.active)return;const B=D.box;if(DIVE.on)relocateBox(B,D.p,D.n,D.zr);
  const c=controls.target,P=D.p,V=D.v;
  for(let i=0;i<D.n;i++){
    const o=i*3;D.hd[i]+=Math.sin(t*0.3+i*1.7)*0.5*dt+(D.jitter?(rnd()-0.5)*4*dt:0);
    const sp=D.spd*(D.jitter?0.4+0.6*Math.abs(Math.sin(t*2.2+i*3.1)):1);
    const tx=Math.cos(D.hd[i])*sp,tz=Math.sin(D.hd[i])*sp,ty=Math.sin(t*0.5+i*2.3)*sp*0.35+(B.cy-P[o+1])*0.04;
    V[o]+=(tx-V[o])*Math.min(1,dt*1.5);V[o+1]+=(ty-V[o+1])*Math.min(1,dt*1.5);V[o+2]+=(tz-V[o+2])*Math.min(1,dt*1.5);
    orbital(P[o],P[o+1],t,_u);
    P[o]+=(V[o]+_u.x*0.8)*dt;P[o+1]+=(V[o+1]+_u.y*0.8)*dt;P[o+2]+=(V[o+2]+_u.z*0.8)*dt;
    const fy=floorY(P[o],P[o+2])+D.minAb;if(P[o+1]<fy)P[o+1]=fy;const my=(D.maxY!==undefined?D.maxY:-0.8)-(ICE.on&&D.maxY===undefined?ICE.h+0.3:0);if(P[o+1]>my)P[o+1]=my;
    for(const k of[0,2]){const d=P[o+k]-(k?c.z:c.x),r=k?B.rz:B.rx;if(d>r)P[o+k]-=2*r;else if(d<-r)P[o+k]+=2*r;}
    if(D.upright)_q.setFromEuler(_e.set(0.12*Math.sin(t*0.7+i),D.hd[i],0.12*Math.cos(t*0.6+i)));
    else{_d.set(V[o],V[o+1]*0.5,V[o+2]);if(_d.lengthSq()<1e-6)_d.set(Math.cos(D.hd[i]),0,Math.sin(D.hd[i]));_d.normalize();_m.lookAt(_d,ORIGIN,UP);_q.setFromRotationMatrix(_m);}
    _p.set(P[o],P[o+1],P[o+2]);_s.setScalar(D.sz[i]);_m.compose(_p,_q,_s);D.mesh.setMatrixAt(i,_m);
    D.ph[i]+=dt*(D.phRate||1);
  }
  D.mesh.instanceMatrix.needsUpdate=true;D.mesh.geometry.attributes.aPhase.needsUpdate=true;
}
/* vampire squid (Vampyroteuthis infernalis) */
makeDrift('vampire',{n:4,size:[0.26,0.32],spd:0.08,minAb:1,geo:(()=>{const acc=Acc(),dk=[0.33,0.06,0.08],g0={aGlow:()=>0},g1={aGlow:()=>1};
    addGeo(acc,new THREE.SphereGeometry(1,16,12),M4(0,0,0.12,0,0,0,0.17,0.17,0.26),()=>dk,g0);
    for(const sg of[1,-1]){addGeo(acc,new THREE.SphereGeometry(1,8,6),M4(sg*0.2,0,0.28,0,0,0,0.1,0.015,0.06),()=>dk,g0);
      addGeo(acc,new THREE.SphereGeometry(0.025,6,4),M4(sg*0.13,0,0.3),()=>[0.6,0.7,0.9],g1);
      addGeo(acc,new THREE.SphereGeometry(0.05,8,6),M4(sg*0.13,0.05,0.02),()=>[0.25,0.42,0.9],g0);}
    const cone=new THREE.ConeGeometry(0.32,0.38,16,1,true);cone.rotateX(Math.PI/2);cone.translate(0,0,-0.17);
    addGeo(acc,cone,null,(x,y,z)=>mixc([0.42,0.08,0.1],[0.1,0.02,0.03],sstep(-0.05,-0.3,z)),{aGlow:(x,y,z)=>{if(z>-0.33)return 0;const a=Math.atan2(y,x)/(Math.PI/4),k=((a%1)+1)%1;return(k<0.2||k>0.8)?1:0;}});
    return finishGeo(acc);})(),
  emit:'emit+=vec3(0.15,0.55,1.0)*vGlow*(0.35+3.2*smoothstep(0.86,0.95,fract(uTime*0.11+vPh*0.37)));'});
/* dumbo octopus (Grimpoteuthis) */
makeDrift('dumbo',{n:3,size:[0.22,0.3],spd:0.06,minAb:0.6,upright:true,geo:(()=>{const acc=Acc(),pk=[0.96,0.7,0.62];
    addGeo(acc,new THREE.SphereGeometry(1,16,12,0,Math.PI*2,0,Math.PI*0.62),M4(0,0.1,0,0,0,0,0.22,0.3,0.22),()=>pk);
    const sk=new THREE.ConeGeometry(0.34,0.3,24,2,true),p=sk.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(y<0){const a=Math.atan2(z,x),k=1+0.13*Math.cos(a*8);p.setX(i,x*k);p.setZ(i,z*k);p.setY(i,y-0.05*Math.max(0,Math.cos(a*8)));}}
    sk.computeVertexNormals();addGeo(acc,sk,M4(0,-0.02,0),(x,y)=>mixc(pk,[0.86,0.5,0.48],sstep(0.05,-0.15,y)));
    for(const sg of[1,-1]){addGeo(acc,new THREE.SphereGeometry(1,10,6),M4(sg*0.28,0.2,0,0,0,sg*0.35,0.1,0.016,0.065),()=>[0.98,0.76,0.68]);
      addGeo(acc,new THREE.SphereGeometry(0.03,8,6),M4(sg*0.12,0.12,0.17),()=>[0.05,0.05,0.06]);}
    return finishGeo(acc);})(),
  vb:'{ float ex=abs(position.x); if(ex>0.19&&position.y>0.12){ transformed.y+=sin(uTime*2.6+aPhase)*0.1*(ex-0.19)/0.12; } }'});
/* gulper eel (Eurypharynx pelecanoides) with glowing tail organ */
makeDrift('gulper',{n:4,size:[0.6,0.8],spd:0.12,minAb:1,phRate:2.5,geo:(()=>{const acc=Acc(),bk=[0.06,0.06,0.07],g0={aGlow:()=>0};
    addGeo(acc,latheZ([[0.001,-0.5],[0.004,-0.42],[0.008,-0.2],[0.014,0.1],[0.025,0.3],[0.03,0.36]],10),null,()=>bk,{aGlow:(x,y,z)=>z<-0.46?1:0});
    addGeo(acc,new THREE.SphereGeometry(1,14,10),M4(0,-0.03,0.42,0,0,0,0.05,0.07,0.1),(x,y)=>y<-0.06?[0.14,0.11,0.12]:bk,g0);
    addGeo(acc,new THREE.SphereGeometry(1,10,6),M4(0,0.02,0.44,0,0,0,0.03,0.015,0.09),()=>bk,g0);
    for(const sg of[1,-1])addGeo(acc,new THREE.SphereGeometry(0.006,6,4),M4(sg*0.02,0.03,0.5),()=>[0.3,0.3,0.35],g0);
    addGeo(acc,new THREE.SphereGeometry(0.009,6,4),M4(0,0,-0.5),()=>[1,0.5,0.6],{aGlow:()=>1});
    return finishGeo(acc);})(),
  vb:'transformed.x+=sin(aPhase*3.0-position.z*11.0)*0.05*(0.55-position.z);',
  emit:'emit+=vec3(1.0,0.32,0.5)*vGlow*(1.6+0.9*sin(uTime*2.0+vPh));'});
/* hadal amphipods (Hirondellea gigas) swarming just above the trench floor */
makeDrift('amphi',{n:220,size:[0.03,0.05],spd:0.12,minAb:0.05,jitter:true,geo:(()=>{const acc=Acc();
    for(let k=0;k<6;k++)addGeo(acc,new THREE.SphereGeometry(1,7,5),M4(0,0.05*Math.cos(k*0.55),0.35-k*0.14,0,0,0,0.14,0.17-k*0.012,0.1),()=>[0.96,0.92,0.86]);
    for(const sg of[1,-1])addGeo(acc,new THREE.CylinderGeometry(0.008,0.008,0.4,3),M4(sg*0.05,0.09,0.56,1.2,0,sg*0.2),()=>[0.9,0.85,0.8]);
    return finishGeo(acc);})()});

/* hadal floor: holothurians and xenophyophores (giant single-celled foraminifera) */
const holoGeo=(()=>{const g=new THREE.SphereGeometry(1,16,10),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),b=1+0.12*Math.max(0,Math.sin(z*9)*Math.sin(Math.atan2(y,x)*5));p.setXYZ(i,x*0.34*b,y*0.24*b,z*b);}
  g.computeVertexNormals();const acc=Acc();addGeo(acc,g,null,(x,y)=>mixc([0.9,0.62,0.66],[0.7,0.4,0.48],sstep(-0.1,0.2,y)));return finishGeo(acc);})();
const holos=new THREE.InstancedMesh(holoGeo,urchinMat,28);holos.frustumCulled=false;holos.count=0;scene.add(holos);
const xenoGeo=(()=>{const g=new THREE.IcosahedronGeometry(1,2),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=0.8+0.35*Math.abs(Math.sin(x*7+y*5)*Math.sin(z*6));p.setXYZ(i,x*k,y*k*0.8,z*k);}
  g.computeVertexNormals();const acc=Acc();addGeo(acc,g,null,()=>[0.84,0.78,0.66]);return finishGeo(acc);})();
const xenos=new THREE.InstancedMesh(xenoGeo,urchinMat,44);xenos.frustumCulled=false;xenos.count=0;scene.add(xenos);
function buildHadal(on){if(on){placeOnFloor(holos,28,13,[0.15,0.3],false);placeOnFloor(xenos,44,13,[0.05,0.12],false);}else{holos.count=0;xenos.count=0;}}

function stepPass(e,sw,dt,t,allowed,hz){
  if(!allowed){e.on=false;sw.mesh.count=0;e.cool=Math.min(e.cool,4);return;}
  if(!e.on){e.cool-=dt;sw.mesh.count=0;if(e.cool>0)return;e.start();}
  e.s+=e.cfg.spd*dt;e.pos.set(e.p0.x+e.dir.x*e.s,e.py,e.p0.z+e.dir.z*e.s);e.py+=(e.yTarget()-e.py)*Math.min(1,dt*0.6);
  sw.ph[0]+=dt*2*Math.PI*hz;_a.copy(e.dir);_a.y=0.05*Math.sin(t*0.3);poseSwimmer(sw,e.pos,_a,e.cfg.len);sw.mesh.count=1;
  if(e.s>2*e.cfg.R0){e.stop();sw.mesh.count=0;}
}
function stepSquid(dt,t,allowed){
  const e=encSQ;if(!allowed){e.on=false;SQD.mesh.count=0;e.cool=Math.min(e.cool,6);return;}
  if(!e.on){e.cool-=dt;SQD.mesh.count=0;if(e.cool>0)return;e.start();}
  if(e.phase==='in'){e.dist-=1.1*dt;if(e.dist<=9){e.phase='hold';e.tt=0;}}
  else if(e.phase==='hold'){e.tt+=dt;e.dist=9+0.4*Math.sin(e.tt*0.8);if(e.tt>7)e.phase='out';}
  else{e.dist+=7*dt;if(e.dist>40){e.stop();SQD.mesh.count=0;return;}}
  const c=camera.position,bx=e.bx,bz=e.bz;e.py+=(e.yTarget()-e.py)*Math.min(1,dt);
  e.pos.set(c.x+bx*e.dist,e.py,c.z+bz*e.dist);const ang=e.phase==='out'?0.35:1.15;_a.set(bx*Math.cos(ang)-bz*Math.sin(ang),0.05*Math.sin(t*0.3),bx*Math.sin(ang)+bz*Math.cos(ang));
  SQD.ph[0]=t*0.5;poseSwimmer(SQD,e.pos,_a,e.cfg.len);SQD.mesh.count=1;
}
function stepSiph(dt,t,allowed){
  const e=encSI;
  if(!allowed||!e.on){if(!allowed){e.on=false;e.cool=Math.min(e.cool,4);}else{e.cool-=dt;if(e.cool<=0){e.start();e.tt=0;e.ang=rnd()*6.28;
      e.pos.copy(e.p0).addScaledVector(e.dir,e.cfg.R0+R(-4,4));e.ang=Math.atan2(e.dir.z,e.dir.x);}}
    if(!e.on){for(let i=0;i<NSI;i++)siph.size[i]=0;siph.g.attributes.aSize.needsUpdate=true;return;}}
  e.tt+=dt;const life=30,fade=Math.max(0,Math.min(1,e.tt/3,(life-e.tt)/3));if(e.tt>life){e.stop();return;}
  e.py+=(e.yTarget()-e.py)*Math.min(1,dt*0.5);
  let x=e.pos.x+Math.cos(e.ang)*0.12*e.tt,z=e.pos.z+Math.sin(e.ang)*0.12*e.tt,y=e.py;
  const L=NSI*0.24,wave=(t*5)%(L+10);
  for(let i=0;i<NSI;i++){const sdist=i*0.24,a=e.ang+Math.PI+0.55*Math.sin(sdist*0.11+t*0.12);
    x+=Math.cos(a)*0.24;z+=Math.sin(a)*0.24;const yy=y+1.6*Math.sin(sdist*0.08+t*0.18);
    siph.pos[i*3]=x;siph.pos[i*3+1]=yy;siph.pos[i*3+2]=z;
    siph.size[i]=(i<8?0.2:(i%4===0?0.11:0.07))*(fade>0?1:0);
    siph.sd[i]=fade*(0.12+1.4*Math.exp(-((sdist-wave)*(sdist-wave))/4)+(i<8?0.3:0));}
  siph.g.attributes.position.needsUpdate=true;siph.g.attributes.aSize.needsUpdate=true;siph.g.attributes.aSeed.needsUpdate=true;
}
function stepGiants(dt,t){
  stepPass(encWS,WSH,dt,t,!!H.whaleshark,0.33);
  stepPass(encSW,SPW,dt,t,!!H.sperm,0.22);
  stepSquid(dt,t,!!H.squid);
  stepSiph(dt,t,!!H.siph);
  stepPass(encSeal,SEAL,dt,t,!!H.seal,0.5);
}

