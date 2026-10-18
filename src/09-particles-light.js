/* =========================================================
   13. Particles: marine snow, bubbles, bioluminescent flashes, sea sparkle, lure glow
   ========================================================= */
function pointsMat(frag,blending){
  return new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:blending||THREE.NormalBlending,
    vertexShader:'attribute float aSize; attribute float aSeed; varying vec3 vWPos; varying float vSeed; uniform float uScale; void main(){ vec4 wp=modelMatrix*vec4(position,1.0); vWPos=wp.xyz; vSeed=aSeed; vec4 mv=viewMatrix*wp; gl_Position=projectionMatrix*mv; gl_PointSize=clamp(aSize*uScale/max(-mv.z,0.01),0.0,80.0);} ',
    fragmentShader:WATER_PARS+'varying float vSeed;\n'+frag+'\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n}'});
}
function makePoints(n,frag,blend){
  const pos=new Float32Array(n*3),size=new Float32Array(n),sd=new Float32Array(n);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aSize',new THREE.BufferAttribute(size,1));g.setAttribute('aSeed',new THREE.BufferAttribute(sd,1));
  const pts=new THREE.Points(g,pointsMat(frag,blend));pts.frustumCulled=false;scene.add(pts);return{pts,pos,size,sd,g};
}
/* marine snow (lit by sun and by the torch: backscatter) */
const NS=2400,snow=makePoints(NS,`void main(){ float r=length(gl_PointCoord-0.5)*2.0; if(r>1.0) discard;
  vec3 tE=torchAt(vWPos,1.0)*5.0;
  vec3 c=waterPath(vec3(0.9,0.88,0.8),vWPos)+vec3(0.9,0.88,0.8)*tE*exp(-uC*length(vWPos-cameraPosition));
  gl_FragColor=vec4(c,(1.0-r)*0.75);`);
for(let i=0;i<NS;i++){snow.pos[i*3]=R(-10,10);snow.pos[i*3+1]=-10+R(0,20);snow.pos[i*3+2]=R(-10,10);snow.size[i]=0.004+rnd()*rnd()*0.016;snow.sd[i]=rnd();}
function stepSnow(dt,t){const c=camera.position,P=snow.pos;
  for(let i=0;i<NS;i++){const o=i*3;orbital(P[o],P[o+1],t,_u);
    P[o]+=_u.x*dt;P[o+1]+=(_u.y-0.0009)*dt;P[o+2]+=(_u.z+Math.sin(t*0.3+snow.sd[i]*40)*0.004)*dt;
    for(let k=0;k<3;k++){const d=P[o+k]-c.getComponent(k);if(d>10)P[o+k]-=20;else if(d<-10)P[o+k]+=20;}}
  snow.g.attributes.position.needsUpdate=true;}

/* bubbles: diver exhalation (shallow) or methane seep (Haima) — display size x3 */
const NB=360,bub=makePoints(NB,`void main(){ vec2 c=gl_PointCoord-0.5; float r=length(c)*2.0; if(r>1.0) discard;
  float rim=smoothstep(0.55,0.92,r)*(1.0-smoothstep(0.92,1.0,r)); float hl=smoothstep(0.32,0.0,length(c-vec2(-0.16,-0.16)));
  vec3 tE=torchAt(vWPos,1.0)*2.0;
  gl_FragColor=vec4(waterPath(vec3(1.4),vWPos)+vec3(1.4)*tE*exp(-uC*length(vWPos-cameraPosition)),clamp(rim*0.9+hl*0.9+0.06,0.0,1.0));`);
const bubbles=[];for(let i=0;i<NB;i++)bubbles.push({on:false});
let breathT=0,seepAcc=0,diverOn=false;
function emitBubble(x,y,z,rmin,rmax){const b=bubbles.find(b=>!b.on);if(!b)return;b.on=true;b.x=x;b.y=y;b.z=z;b.r0=Math.exp(Math.log(rmin)+rnd()*(Math.log(rmax)-Math.log(rmin)));b.ph=rnd()*6.28;b.P0=pressure(-y);b.stuck=0;}
function stepBubbles(dt,t){
  if(diverOn){breathT+=dt;if(breathT>4.5){breathT=0;
    playBreath();const c=camera.position;_d.copy(U.uCamDir.value).setY(0).normalize();
    for(let i=0;i<26;i++)emitBubble(c.x+_d.x*1.4+R(-0.12,0.12),c.y-0.5+R(-0.05,0.05),c.z+_d.z*1.4+R(-0.12,0.12),5e-4,5e-3);}}
  if(S.seep&&S.D>=800){seepAcc+=dt*16;while(seepAcc>=1){seepAcc--;emitBubble(SEEP.x+R(-0.2,0.2),floorY(SEEP.x,SEEP.z)+0.03,SEEP.z+R(-0.2,0.2),1.5e-3,4e-3);}}
  const top=ICE.on?-ICE.h-0.03:Math.min(-0.05,camera.position.y+25);
  for(let i=0;i<NB;i++){const b=bubbles[i];
    if(b.on){const r=b.r0*Math.cbrt(b.P0/pressure(-b.y)),v=riseSpeed(r);orbital(b.x,b.y,t,_u);
      const wob=r>9e-4?Math.min(1,(r-9e-4)/2e-3)*0.06:0;b.ph+=dt*2*Math.PI*6;
      if(ICE.on&&b.y>=top){b.y=top;b.stuck=(b.stuck||0)+dt;if(b.stuck>25){b.on=false;b.stuck=0;}}else{b.y+=(v+_u.y)*dt;b.x+=(_u.x+Math.cos(b.ph)*wob)*dt;b.z+=(_u.z+Math.sin(b.ph)*wob)*dt;if(b.y>top){if(ICE.on){b.y=top;b.stuck=0.001;}else b.on=false;}}
      bub.pos[i*3]=b.x;bub.pos[i*3+1]=b.y;bub.pos[i*3+2]=b.z;bub.size[i]=b.on?2*r*3:0;}else bub.size[i]=0;}
  bub.g.attributes.position.needsUpdate=true;bub.g.attributes.aSize.needsUpdate=true;
}

/* sparks: one pool for sea sparkle (dinoflagellates) + deep-sea flashes; own-light, only beam attenuation applies */
const NK2=1400,spark=makePoints(NK2,`varying float vA; void main(){ float r=length(gl_PointCoord-0.5)*2.0; if(r>1.0) discard;
  float d=length(vWPos-cameraPosition);
  gl_FragColor=vec4(vec3(0.15,0.55,1.0)*vA*exp(-uC*d)*(1.0-r)*(1.0-r)*3.0,1.0);`,THREE.AdditiveBlending);
spark.pts.material.vertexShader=spark.pts.material.vertexShader.replace('attribute float aSeed;','attribute float aSeed; varying float vA;').replace('vSeed=aSeed;','vSeed=aSeed; vA=aSeed;');
spark.pts.material.fragmentShader=spark.pts.material.fragmentShader.replace('varying float vA;','').replace('varying float vSeed;','varying float vSeed; varying float vA;');
const sparkAge=new Float32Array(NK2).fill(99),sparkLife=new Float32Array(NK2);let sparkNext=0;
function emitSpark(x,y,z,life,size){const i=sparkNext;sparkNext=(sparkNext+1)%NK2;spark.pos[i*3]=x;spark.pos[i*3+1]=y;spark.pos[i*3+2]=z;sparkAge[i]=0;sparkLife[i]=life;spark.size[i]=size;}
let sparkleOn=false,deepFlashOn=false;
function stepSparks(dt,t){
  if(sparkleOn){
    for(const key in FISH){const sp=FISH[key];if(!sp.active)continue;const k=sp.n*dt*(key==='sardine'?1.2:3);
      for(let e=0;e<k||rnd()<k-e;e++){const i=Math.floor(rnd()*sp.n)*3;emitSpark(sp.p[i]+R(-0.08,0.08),sp.p[i+1]+R(-0.05,0.05),sp.p[i+2]+R(-0.08,0.08),R(0.4,1.1),R(0.015,0.03));if(e>40)break;}}
    for(const key in JELLY){const J=JELLY[key];if(!J.active)continue;if(rnd()<dt*J.n*2){const i=Math.floor(rnd()*J.n)*3;emitSpark(J.p[i]+R(-0.2,0.2),J.p[i+1]-R(0,0.3),J.p[i+2]+R(-0.2,0.2),R(0.5,1),0.02);}}
    if(turtleOn)turtles.forEach(g=>{for(let e=0;e<3;e++)emitSpark(g.position.x+R(-0.5,0.5),g.position.y+R(-0.2,0.1),g.position.z+R(-0.5,0.5),R(0.5,1.2),R(0.02,0.035));});
    if(mantaOn)mantas.forEach(m=>{for(let e=0;e<6;e++)emitSpark(m.position.x+R(-1.6,1.6),m.position.y+R(-0.3,0.3),m.position.z+R(-1.6,1.6),R(0.5,1.2),R(0.02,0.04));});
    const c=camera.position;for(let e=0;e<4;e++)emitSpark(c.x+R(-6,6),c.y+R(-4,3),c.z+R(-6,6),R(0.3,0.8),R(0.012,0.025));
  }
  if(DIVE.on&&DIVE.play&&camZ()>200){const c=camera.position,k=Math.min(80,8+diveSpeed()*0.6)*dt;
    for(let e=0;e<k||rnd()<k-e;e++){const a=rnd()*6.28,r=R(1,5);emitSpark(c.x+Math.cos(a)*r,c.y+R(-3,1),c.z+Math.sin(a)*r,R(0.3,1.0),R(0.012,0.03));if(e>30)break;}}
  if(deepFlashOn){const c=camera.position;for(let e=0;e<3;e++)if(rnd()<dt*16)emitSpark(c.x+R(-12,12),c.y+R(-6,6),c.z+R(-12,12),R(0.6,2.2),R(0.03,0.07));}
  for(let i=0;i<NK2;i++){sparkAge[i]+=dt;const a=sparkAge[i],L=sparkLife[i];
    spark.sd[i]=a<L?Math.min(1,a/0.06)*Math.exp(-a/(L*0.35)):0;}
  spark.g.attributes.position.needsUpdate=true;spark.g.attributes.aSeed.needsUpdate=true;spark.g.attributes.aSize.needsUpdate=true;
}
/* angler lures */
const lure=makePoints(3,`void main(){ float r=length(gl_PointCoord-0.5)*2.0; if(r>1.0) discard;
  float d=length(vWPos-cameraPosition); float pul=0.75+0.25*sin(uTime*1.7+vSeed*20.0);
  gl_FragColor=vec4(vec3(0.35,0.85,1.0)*exp(-uC*d)*pow(1.0-r,2.0)*1.6*pul,1.0);`,THREE.AdditiveBlending);
for(let i=0;i<3;i++){lure.size[i]=0;lure.sd[i]=rnd();}
function stepAnglers(dt,t){
  if(!anglerOn)return;const fy=-S.D;
  anglers.forEach((g,i)=>{const u=g.userData;u.a+=dt*0.04;
    if(DIVE.on){const ty=controls.target.y;if(u.by===undefined||Math.abs(u.by-ty)>30)u.by=ty+(u.by!==undefined&&u.by>ty?-12:R(-4,1));
      g.position.set(controls.target.x+Math.cos(u.a)*u.r*2,u.by+0.3*Math.sin(t*0.3+u.ph),controls.target.z+Math.sin(u.a)*u.r*2);}
    else g.position.set(Math.cos(u.a)*u.r+1,fy+u.h+0.15*Math.sin(t*0.3+u.ph),Math.sin(u.a)*u.r+1);
    g.rotation.set(0,-u.a,0.05*Math.sin(t*0.5+u.ph));
    _p.copy(lureLocal).applyMatrix4(g.matrixWorld);lure.pos[i*3]=_p.x;lure.pos[i*3+1]=_p.y;lure.pos[i*3+2]=_p.z;lure.size[i]=0.12;});
  lure.g.attributes.position.needsUpdate=true;lure.g.attributes.aSize.needsUpdate=true;
}

/* =========================================================
   14. God rays (light shafts): visible because of particle scattering
   ========================================================= */
const NR=18;
const rayGeo=new THREE.PlaneGeometry(1,1,1,8);rayGeo.translate(0,-0.5,0);
const raySeed=new Float32Array(NR);for(let i=0;i<NR;i++)raySeed[i]=rnd();
rayGeo.setAttribute('aSeed',new THREE.InstancedBufferAttribute(raySeed,1));
const rayMat=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'attribute float aSeed; varying vec2 vUv; varying float vSeed; varying vec3 vWPos; void main(){ vUv=uv; vSeed=aSeed; vec4 wp=modelMatrix*instanceMatrix*vec4(position,1.0); vWPos=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }',
  fragmentShader:WATER_PARS+`uniform float uShaft; varying vec2 vUv; varying float vSeed;
    void main(){ float e=pow(sin(3.14159*vUv.x),4.0);
      float fl=0.5+0.5*sin(uTime*(0.5+vSeed*0.7)+vSeed*40.0+vUv.y*2.0);
      float d=length(vWPos-cameraPosition);
      float near=smoothstep(1.0,6.0,d);
      vec3 col=lightAt(-vWPos.y)*uShaft*e*fl*near*smoothstep(0.0,0.15,vUv.y)*exp(-uC*d);
      gl_FragColor=vec4(col,1.0);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`});
const rays=new THREE.InstancedMesh(rayGeo,rayMat,NR);rays.frustumCulled=false;rays.renderOrder=3;scene.add(rays);
const rayX=new Float32Array(NR),rayZ=new Float32Array(NR),rayW=new Float32Array(NR);
for(let i=0;i<NR;i++){rayX[i]=R(-1,1);rayZ[i]=R(-1,1);rayW[i]=R(0.6,2.6);}
let rayRange=14;
const _ax=new THREE.Vector3(),_side=new THREE.Vector3(),_fw=new THREE.Vector3(),_rm=new THREE.Matrix4();
function stepRays(dt,t){
  if(!rays.visible)return;const sd=OPT.sunDir,c=camera.position,camD=-c.y;
  const len=DIVE.on?Math.min(camD+40,170):Math.min(S.D,70)+4;
  for(let i=0;i<NR;i++){
    rayX[i]+=dt*0.15*Math.sin(t*0.1+i);const sx=rayX[i]-c.x,sz=rayZ[i]-c.z,RR=rayRange;
    if(sx>RR)rayX[i]-=2*RR;if(sx<-RR)rayX[i]+=2*RR;if(sz>RR)rayZ[i]-=2*RR;if(sz<-RR)rayZ[i]+=2*RR;
    let tx=rayX[i]+sd.x/sd.y*camD,tz=rayZ[i]+sd.z/sd.y*camD;
    if(ICE.on){const a=i*2.39996,rr=ICE.hr*0.7*Math.sqrt((i%7+0.5)/7);tx=ICE.hx+Math.cos(a)*rr;tz=ICE.hz+Math.sin(a)*rr;rayW[i]=0.7+0.25*(i%3);}
    _ax.copy(sd);_fw.set(c.x-tx,0,c.z-tz);_side.crossVectors(_ax,_fw).normalize();if(_side.lengthSq()<0.5)_side.set(1,0,0);
    _fw.crossVectors(_side,_ax).normalize();
    _rm.makeBasis(_side.clone().multiplyScalar(rayW[i]),_ax.clone().multiplyScalar(len),_fw);
    _rm.setPosition(tx,ICE.on?-ICE.h:-0.3,tz);rays.setMatrixAt(i,_rm);
  }
  rays.instanceMatrix.needsUpdate=true;
}

