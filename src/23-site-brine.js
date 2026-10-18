/* =========================================================
   14m. Brine pool NR1, Green Canyon, northern Gulf of Mexico (~650 m), after MacDonald 1996 and the 2014 Nautilus dives.
   Brine ~4x seawater salinity (~120 psu upper layer), density ~1.09 vs 1.027 g/cm3: it pools in a funnel-shaped depression
   on top of a low mound, <2 m deep over most of its area and much deeper where methane bubbles out.
   Interfacial waves feel a reduced gravity g'=g(r2-r1)/(r2+r1) ~0.3 m/s2: deep-water dispersion w^2=g'k, so they are slow.
   A band of methane mussels (Bathymodiolus childressi) rings the shore.
   ========================================================= */
const BR={ax:5.5,az:9,zc:0,L:1.8,rim:2.25,D:1.45,base:0,gE:9.81*(1092-1027)/(1092+1027),rings:[],ri:0,acc:0,next:2};
function brineQ(x,z){return Math.hypot(x/BR.ax,(z-BR.zc)/BR.az);}
function brineH(q,x,z){
  if(q<1){let h=BR.L-BR.D*sstep(1,0.72,q);const f=sstep(0.2,0,q);h-=2.4*f*f;return h+0.06*(fbm(x*0.6+3,z*0.6)-0.5)*sstep(0.95,0.8,q);}
  const n=(fbm(x*0.32+7,z*0.32+1)-0.5)*0.5*sstep(1.15,1.5,q)*(1-sstep(1.9,2.4,q));
  return (BR.L+(BR.rim-BR.L)*sstep(1,1.28,q))*(1-sstep(1.35,2.4,q))+n-0.03*sstep(2.0,2.4,q);
}
function brineFloor(x,z){const q=brineQ(x,z);if(q>=2.4)return floorY0(x,z);const w=1-sstep(1.6,2.4,q);return floorY0(x,z)*(1-w)+BR.base*w+brineH(q,x,z);}
const brineGroup=new THREE.Group();brineGroup.visible=false;scene.add(brineGroup);
const brTerrGeo=new THREE.PlaneGeometry(BR.ax*5,BR.az*5,150,240);brTerrGeo.rotateX(-Math.PI/2);
brTerrGeo.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(brTerrGeo.attributes.position.count*3),3));
const brTerr=new THREE.Mesh(brTerrGeo,waterify(lambert(),'brineTerr'));brineGroup.add(brTerr);
const brMus=new THREE.InstancedMesh(musselGeo,urchinMat,4000);brMus.frustumCulled=false;brMus.count=0;brineGroup.add(brMus);
const deadCrabGeo=(()=>{const acc=Acc(),c=()=>[0.92,0.66,0.52];
  addGeo(acc,new THREE.SphereGeometry(1,12,8),M4(0,0.1,0,0,0,0,0.5,0.2,0.42),c);
  for(const sg of[1,-1]){for(let k=0;k<4;k++)addGeo(acc,new THREE.CylinderGeometry(0.03,0.02,0.75,4),M4(sg*0.62,0.08,-0.25+k*0.17,0.15,0,sg*1.25),c);
    addGeo(acc,new THREE.SphereGeometry(1,8,6),M4(sg*0.32,0.1,0.55,0,sg*0.4,0,0.1,0.07,0.22),c);}
  return finishGeo(acc);})();
const brDead=new THREE.InstancedMesh(deadCrabGeo,waterify(lambert(),'brineDead'),10);brDead.frustumCulled=false;brDead.count=0;brineGroup.add(brDead);
const brFish=new THREE.InstancedMesh(FISH.rockfish.mesh.geometry,waterify(lambert({side:THREE.DoubleSide}),'brineFish'),2);brFish.frustumCulled=false;brFish.count=0;brineGroup.add(brFish);
{const c=new THREE.Color();for(let i=0;i<2;i++)brFish.setColorAt(i,c.setRGB(0.75,0.72,0.68));}
/* the brine surface: slow interfacial waves + ripple rings, Fresnel with n_brine/n_sea~1.013, a turbid brine body */
const BR_WAVE=`uniform vec4 uRing[8]; uniform float uGE;
float brineWave(vec2 p){ float h=0.0;
  vec2 d1=normalize(vec2(1.0,0.3)),d2=normalize(vec2(-0.4,1.0)),d3=normalize(vec2(0.7,-0.8));
  float k1=6.2832/2.2,k2=6.2832/1.3,k3=6.2832/0.8;
  h+=0.018*sin(k1*dot(d1,p)-sqrt(uGE*k1)*uTime);
  h+=0.010*sin(k2*dot(d2,p)-sqrt(uGE*k2)*uTime+1.7);
  h+=0.005*sin(k3*dot(d3,p)-sqrt(uGE*k3)*uTime+4.1);
  { vec2 d4=normalize(vec2(-0.9,-0.35)); float k4=6.2832/0.35; h+=0.0022*sin(k4*dot(d4,p)-sqrt(uGE*k4)*uTime+0.6)*(0.6+0.4*sin(p.x*0.7+p.y*0.4)); }
  for(int i=0;i<8;i++){ vec4 r=uRing[i]; float age=uTime-r.z; if(age<0.0||age>40.0||r.w<=0.0) continue;
    float kr=6.2832/0.7, cp=sqrt(uGE/kr), cg=0.5*cp; float d=length(p-r.xy);
    float w=0.35+0.06*age; float env=exp(-pow((d-cg*age)/w,2.0));
    h+=r.w*exp(-age/12.0)*env*cos(kr*d-sqrt(uGE*kr)*age)/sqrt(1.0+2.0*d); }
  return h; }`;
const brSurfMat=new THREE.ShaderMaterial({uniforms:Object.assign({},U,{uRing:{value:Array.from({length:8},()=>new THREE.Vector4(0,0,-99,0))},uGE:{value:BR.gE},uEll:{value:new THREE.Vector3(BR.ax,BR.az,BR.zc)},uLR:{value:new THREE.Vector2(BR.L,BR.rim)}}),
  transparent:true,depthWrite:false,
  vertexShader:'uniform float uTime; varying vec3 vWPos; varying vec2 vP; '+BR_WAVE+' void main(){ vec3 p=position; vP=p.xz; p.y+=brineWave(p.xz); vec4 wp=modelMatrix*vec4(p,1.0); vWPos=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }',
  fragmentShader:WATER_PARS+BR_WAVE+`
  uniform vec3 uEll; uniform vec2 uLR; varying vec2 vP;
  float shoreRel(vec2 p){ float q=length(vec2(p.x/uEll.x,(p.y-uEll.z)/uEll.y)); if(q<1.0) return -9.0;
    return (uLR.x+(uLR.y-uLR.x)*smoothstep(1.0,1.28,q))*(1.0-smoothstep(1.35,2.4,q))-uLR.x; }
  vec3 shoreCol(vec2 p){ float q=length(vec2(p.x/uEll.x,(p.y-uEll.z)/uEll.y));
    float sp=0.5+0.5*sin(p.x*41.0)*sin(p.y*37.0);
    vec3 sed=vec3(0.42,0.4,0.36), mus=mix(vec3(0.1,0.07,0.04),vec3(0.42,0.33,0.2),sp*sp);
    return mix(sed,mus,smoothstep(1.3,1.12,q)); }
  void main(){
    float q=length(vec2(vP.x/uEll.x,(vP.y-uEll.z)/uEll.y)); if(q>1.0) discard;
    float e=0.04, h0=brineWave(vP), hx=brineWave(vP+vec2(e,0.0)), hz=brineWave(vP+vec2(0.0,e)), hx2=brineWave(vP-vec2(e,0.0)), hz2=brineWave(vP-vec2(0.0,e));
    vec3 N=normalize(vec3(-(hx-hx2)/(2.0*e),1.0,-(hz-hz2)/(2.0*e)));
    float lap=(hx+hx2+hz+hz2-4.0*h0)/(e*e);
    vec3 V=normalize(cameraPosition-vWPos); float ci=max(dot(N,V),1e-3), n=1.0127;
    float ct=sqrt(max(1.0-(1.0-ci*ci)/(n*n),0.0)); float rs=(ci-n*ct)/(ci+n*ct), rp=(n*ci-ct)/(n*ci+ct); float Fr=0.5*(rs*rs+rp*rp);
    vec3 tE=torchAt(vWPos,ci);
    float lens=clamp(1.0-lap*0.35,0.5,1.8);
    vec3 murk=vec3(0.3,0.31,0.32)*tE*0.42*lens;
    vec3 rd=reflect(-V,N); vec3 refl=bgCol(rd);
    { float y0=vWPos.y; for(int i=1;i<=16;i++){ float t=float(i)*0.45; vec3 P=vWPos+rd*t; if(P.y-y0>3.0) break;
        if(P.y-y0<shoreRel(P.xz)){ vec3 tl=torchAt(P,0.8); vec3 T2=exp(-uC*t); refl=shoreCol(P.xz)*tl*T2+refl*(1.0-T2); break; } } }
    vec3 c=mix(murk,refl,clamp(Fr*1.5,0.0,1.0));
    float d=length(vWPos-cameraPosition); vec3 T=exp(-uC*d); c=c*T+bgCol(-V)*(1.0-T);
    float a=mix(0.5,0.9,smoothstep(0.99,0.78,q)); a=max(a,clamp(Fr*1.5,0.0,1.0));
    gl_FragColor=vec4(c,a);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
  }`});
const brSurfGeo=new THREE.PlaneGeometry(BR.ax*2.1,BR.az*2.1,120,190);brSurfGeo.rotateX(-Math.PI/2);brSurfGeo.translate(0,0,BR.zc);
const brSurf=new THREE.Mesh(brSurfGeo,brSurfMat);brSurf.frustumCulled=false;brSurf.renderOrder=2;brineGroup.add(brSurf);
function brineRing(x,z,amp){const r=brSurfMat.uniforms.uRing.value[BR.ri];BR.ri=(BR.ri+1)%8;r.set(x,z,U.uTime.value,amp);}
function buildBrine(on){
  brineOn=on;brineGroup.visible=on;rocks.children.forEach(m=>m.visible=true);if(!on)return;
  BR.base=floorY0(0,BR.zc);
  const p=brTerrGeo.attributes.position,c=brTerrGeo.attributes.color;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),q=brineQ(x,z),y=brineFloor(x,z);p.setY(i,y);
    const n1=fbm(x*0.5+11,z*0.5+3),n2=fbm(x*1.7,z*1.7+5);
    let col=mixc([0.44,0.42,0.38],[0.36,0.34,0.31],n1);
    col=mixc(col,[0.6,0.58,0.52],sstep(0.55,0.75,n2)*sstep(1.08,1.3,q)*(1-sstep(1.7,2.1,q)));
    const mat=sstep(0.5,0.68,n1+0.2*Math.sin(x*2.1)*Math.cos(z*1.7))*sstep(1.02,1.12,q)*(1-sstep(1.35,1.6,q));
    col=mixc(col,n2>0.5?[0.95,0.94,0.9]:[0.9,0.6,0.3],mat*0.9);
    col=mixc(col,[0.15,0.12,0.09],sstep(1.27,1.05,q)*sstep(0.95,1.0,q));
    if(q<1)col=mixc([0.2,0.2,0.19],[0.28,0.27,0.25],n2);
    c.setXYZ(i,col[0],col[1],col[2]);}
  p.needsUpdate=true;c.needsUpdate=true;brTerrGeo.computeVertexNormals();brTerrGeo.computeBoundingSphere();
  brSurf.position.y=BR.base+BR.L;
  let k=0;const cc=new THREE.Color();
  for(let tries=0;tries<20000&&k<4000;tries++){const a=rnd()*6.28,q=0.985+Math.pow(rnd(),1.7)*0.27;
    if(rnd()>0.55+0.45*Math.sin(a*5+1.3)*Math.sin(a*3)&&q>1.12)continue;
    const x=Math.cos(a)*BR.ax*q,z=BR.zc+Math.sin(a)*BR.az*q;
    _q.setFromEuler(_e.set(R(-0.9,0.9),rnd()*6.28,R(-0.9,0.9)));_s.setScalar(R(0.05,0.072));_p.set(x,brineFloor(x,z)+0.03,z);_m.compose(_p,_q,_s);brMus.setMatrixAt(k,_m);
    const t=R(0.45,0.85);brMus.setColorAt(k,cc.setRGB(t,t*R(0.92,1.05),t));k++;}
  brMus.count=k;brMus.instanceMatrix.needsUpdate=true;if(brMus.instanceColor)brMus.instanceColor.needsUpdate=true;
  for(let i=0;i<10;i++){const a=R(-0.6,2.2)+(i%2)*3.1,q=R(0.8,0.93),x=Math.cos(a)*BR.ax*q,z=BR.zc+Math.sin(a)*BR.az*q;
    _q.setFromEuler(_e.set(R(-0.4,0.4)+(i%3===0?Math.PI:0),rnd()*6.28,R(-0.4,0.4)));_s.setScalar(R(0.07,0.1));_p.set(x,brineFloor(x,z)+0.04,z);_m.compose(_p,_q,_s);brDead.setMatrixAt(i,_m);}
  brDead.count=10;brDead.instanceMatrix.needsUpdate=true;
  for(let i=0;i<2;i++){const a=i?2.6:-0.3,q=0.86,x=Math.cos(a)*BR.ax*q,z=BR.zc+Math.sin(a)*BR.az*q;
    _q.setFromEuler(_e.set(0,rnd()*6.28,Math.PI/2*0.9));_s.setScalar(0.3);_p.set(x,brineFloor(x,z)+0.06,z);_m.compose(_p,_q,_s);brFish.setMatrixAt(i,_m);}
  brFish.count=2;brFish.instanceMatrix.needsUpdate=true;if(brFish.instanceColor)brFish.instanceColor.needsUpdate=true;
  rocks.children.forEach(m=>{if(brineQ(m.position.x,m.position.z)<2.6)m.visible=false;});
}
function stepBrine(dt,t){
  if(!brineOn)return;
  BR.next-=dt;if(BR.next<=0){BR.next=R(1.2,4.5);const x=R(-0.35,0.35),z=BR.zc+R(-0.35,0.35),y=BR.base+BR.L-0.02,n=2+Math.floor(rnd()*6);
    for(let i=0;i<n;i++)emitBubble(x+R(-0.08,0.08),y,z+R(-0.08,0.08),1.5e-3,4.5e-3);brineRing(x,z,0.012+0.004*n);}
}

