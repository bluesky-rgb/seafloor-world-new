/* =========================================================
   12. Jellyfish & comb jellies (custom translucent shader)
   ========================================================= */
const JELLY_V=`
attribute float aPhase;
uniform float uTime; uniform float uFreq; uniform float uPulse;
varying vec3 vWPos; varying vec3 vNrm; varying vec3 vLoc; varying float vPh; varying vec3 vCen;
void main(){
  vCen=(modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;
  float ph=uTime*uFreq*6.2831853+aPhase;
  float p=pow(0.5+0.5*sin(ph),3.0)*uPulse;
  vec3 pos=position; float rim=1.0-clamp(pos.y,0.0,1.0);
  pos.xz*=1.0-0.2*p*(0.3+0.7*rim); pos.y*=1.0+0.12*p;
  vLoc=position; vPh=aPhase;
  vec4 wp=modelMatrix*instanceMatrix*vec4(pos,1.0);
  vWPos=wp.xyz; vNrm=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);
  gl_Position=projectionMatrix*viewMatrix*wp;
}`;
const JELLY_F=WATER_PARS+`
uniform float uType; uniform vec3 uCol; uniform vec3 uCol2; uniform vec4 uAlarm;
varying vec3 vNrm; varying vec3 vLoc; varying float vPh; varying vec3 vCen;
void main(){
  vec3 v=vWPos-cameraPosition; float d=length(v); vec3 vd=v/d;
  vec3 n=normalize(vNrm); float fr=1.0-abs(dot(n,vd));
  vec3 inc=lightAt(-vWPos.y)*uSky*(0.75+0.5*uDay*max(dot(n,uSunDir),0.0)) + torchAt(vWPos,0.8);
  float th=atan(vLoc.z,vLoc.x); vec3 col=uCol; float a=0.2; vec3 emit=vec3(0.0);
  if(uType<0.5){
    float rr=length(vLoc.xz);
    float g=smoothstep(0.07,0.0,abs(rr-0.32))*smoothstep(0.25,0.85,cos(4.0*th));
    col=mix(uCol,uCol2,g); a=0.08+0.5*fr*fr+0.45*g+0.25*smoothstep(0.08,0.0,vLoc.y);
  } else if(uType<1.5){
    float stripe=smoothstep(0.55,1.0,cos(th*16.0));
    col=mix(uCol,uCol2,stripe*smoothstep(0.05,0.6,vLoc.y)); a=0.35+0.5*fr;
  } else if(uType<2.5){
    col=uCol*(0.55+0.45*smoothstep(0.3,0.36,vLoc.y)); a=0.6+0.35*fr;
    float al=exp(-max(uTime-uAlarm.w,0.0)/3.5)*step(uAlarm.w,uTime)*step(length(vCen-uAlarm.xyz),1.0);
    float on=max(step(0.8,fract(uTime*0.06+vPh*0.159)),step(0.05,al));
    float spots=pow(max(cos(th*8.0-uTime*7.0*on-vPh),0.0),10.0)*smoothstep(0.28,0.04,vLoc.y);
    emit=vec3(0.12,0.45,1.0)*spots*(0.35+3.0*on+5.0*al); a=max(a,spots);
  } else if(uType<3.5){
    float rows=pow(max(cos(th*8.0),0.0),28.0)*smoothstep(0.95,0.6,abs(vLoc.y));
    float hue=fract(vLoc.y*1.2-uTime*1.3+th*0.15);
    col=uCol+hsv2rgb(vec3(hue,0.85,1.0))*rows*3.0; a=0.05+0.3*fr*fr+rows*0.7;
  } else {
    float gut=smoothstep(0.3,0.05,length(vLoc.xy*vec2(1.2,1.6)))*step(abs(vLoc.z),0.8);
    float veil=smoothstep(0.55,0.95,vLoc.z)+smoothstep(-0.9,-0.6,-vLoc.z)*0.0;
    col=mix(uCol,uCol2,gut); a=0.18+0.45*fr*fr+gut*0.45+veil*0.15;
  }
  vec3 T=exp(-uC*d);
  vec3 outc=(col*inc+emit)*T;
  a=clamp(a,0.0,1.0)*clamp(T.g*1.4+0.15*step(1.5,uType)*step(uType,2.5),0.0,1.0);
  gl_FragColor=vec4(outc,a);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}`;
const bellGeo=new THREE.SphereGeometry(1,28,14,0,Math.PI*2,0,Math.PI*0.5);
const combGeo=(()=>{const g=new THREE.SphereGeometry(1,28,18);g.scale(0.62,1,0.62);return g;})();
const JELLY={
  moon:{name:'海月水母',type:0,n:12,r:[0.12,0.22],freq:0.8,pulse:1,col:[0.72,0.82,0.95],col2:[0.95,0.45,0.78],geo:bellGeo},
  nettle:{name:'太平洋金黄水母',type:1,n:7,r:[0.17,0.27],freq:0.55,pulse:1,col:[0.98,0.62,0.22],col2:[0.55,0.15,0.06],geo:bellGeo,
    tent:[{k:8,len:2.4,seg:14,col:[0.9,0.55,0.25],w:0.95},{k:4,len:1.2,seg:10,col:[0.98,0.85,0.7],w:0.35}]},
  atolla:{name:'冠水母',type:2,n:7,r:[0.06,0.1],freq:0.45,pulse:1,col:[0.55,0.03,0.04],col2:[0,0,0],geo:bellGeo,tent:[{k:1,len:0.9,seg:14,col:[0.5,0.05,0.05],w:0.9}]},
  cucumber:{name:'游泳海参',type:4,n:6,r:[0.12,0.2],freq:0.2,pulse:0,col:[0.98,0.4,0.48],col2:[0.45,0.06,0.1],geo:(()=>{const g=new THREE.SphereGeometry(1,24,14);g.scale(0.5,0.42,1);return g;})()},
  comb:{name:'栉水母',type:3,n:10,r:[0.04,0.08],freq:0.2,pulse:0,col:[0.06,0.07,0.09],col2:[0,0,0],geo:combGeo}
};
for(const key in JELLY){
  const J=JELLY[key];const ph=new Float32Array(J.n);for(let i=0;i<J.n;i++)ph[i]=rnd()*6.28;
  const geo=J.geo.clone();geo.setAttribute('aPhase',new THREE.InstancedBufferAttribute(ph,1));
  const mat=new THREE.ShaderMaterial({uniforms:Object.assign({},U,{uType:{value:J.type},uFreq:{value:J.freq},uPulse:{value:J.pulse},
      uCol:{value:new THREE.Vector3(...J.col)},uCol2:{value:new THREE.Vector3(...J.col2)},uAlarm:{value:new THREE.Vector4(0,0,0,-99)}}),
    vertexShader:JELLY_V,fragmentShader:JELLY_F,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const mesh=new THREE.InstancedMesh(geo,mat,J.n);mesh.frustumCulled=false;mesh.count=0;mesh.renderOrder=2;scene.add(mesh);
  Object.assign(J,{mesh,ph,p:new Float32Array(J.n*3),v:new Float32Array(J.n*3),R:new Float32Array(J.n),rot:new Float32Array(J.n),active:false});
  for(let i=0;i<J.n;i++){J.R[i]=R(J.r[0],J.r[1]);J.rot[i]=rnd()*6.28;}
  if(J.tent){
    let pts=0;J.tent.forEach(tc=>pts+=tc.k*tc.seg);pts*=J.n;
    const pos=new Float32Array(pts*3),prev=new Float32Array(pts*3),tt=new Float32Array(pts),col=new Float32Array(pts*3),idx=[];
    let q=0;for(let i=0;i<J.n;i++)J.tent.forEach(tc=>{for(let k=0;k<tc.k;k++){for(let s=0;s<tc.seg;s++){tt[q]=s/(tc.seg-1);col[q*3]=tc.col[0];col[q*3+1]=tc.col[1];col[q*3+2]=tc.col[2];if(s>0)idx.push(q-1,q);q++;}}});
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aT',new THREE.BufferAttribute(tt,1));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setIndex(idx);
    const lm=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,vertexColors:true,
      vertexShader:'attribute float aT; varying float vT; varying vec3 vWPos; varying vec3 vCol; void main(){ vT=aT; vCol=color; vWPos=position; gl_Position=projectionMatrix*viewMatrix*vec4(position,1.0);} ',
      fragmentShader:WATER_PARS+`varying float vT; varying vec3 vCol;
        void main(){ float d=length(vWPos-cameraPosition); vec3 inc=lightAt(-vWPos.y)*uSky+torchAt(vWPos,0.7);
          gl_FragColor=vec4(vCol*inc*exp(-uC*d),(1.0-vT)*0.7*clamp(exp(-uC.g*d)*1.4,0.0,1.0));
          #include <tonemapping_fragment>
          #include <encodings_fragment>
        }`});
    const lines=new THREE.LineSegments(g,lm);lines.frustumCulled=false;lines.visible=false;lines.renderOrder=1;scene.add(lines);
    Object.assign(J,{lines,tpos:pos,tprev:prev});
  }
}
function setJelly(J,on,box){
  const was=J.active;J.active=on;J.mesh.count=on?J.n:0;J.box=box;if(J.lines)J.lines.visible=on;
  if(on&&!was){for(let i=0;i<J.n;i++){const o=i*3;J.p[o]=box.cx+R(-1,1)*box.rx;J.p[o+1]=box.cy+R(-1,1)*box.ry;J.p[o+2]=box.cz+R(-1,1)*box.rz;J.v[o]=J.v[o+1]=J.v[o+2]=0;}
    if(J.lines)initTentacles(J);}
}
function initTentacles(J){
  let q=0;for(let i=0;i<J.n;i++){const o=i*3;J.tent.forEach(tc=>{for(let k=0;k<tc.k;k++)for(let s=0;s<tc.seg;s++){
    J.tpos[q*3]=J.tprev[q*3]=J.p[o];J.tpos[q*3+1]=J.tprev[q*3+1]=J.p[o+1]-s*tc.len/tc.seg;J.tpos[q*3+2]=J.tprev[q*3+2]=J.p[o+2];q++;}});}
}
function stepJelly(J,dt,t){
  if(!J.active)return;if(DIVE.on&&relocateBox(J.box,J.p,J.n,J.zr))J.resetT=true;const B=J.box,fy=-S.D,c=camera.position;
  for(let i=0;i<J.n;i++){
    const o=i*3,ph=t*J.freq*2*Math.PI+J.ph[i],pulse=Math.pow(0.5+0.5*Math.sin(ph),3)*J.pulse,dp=Math.cos(ph);
    if(J.pulse&&dp>0)J.v[o+1]+=pulse*0.6*dt*(J.R[i]/0.15);
    J.v[o+1]-=0.012*dt;J.v[o]*=0.98;J.v[o+1]*=0.97;J.v[o+2]*=0.98;
    if(J.p[o+1]<fy+0.8)J.v[o+1]+=0.2*dt;if(J.p[o+1]>Math.min(-0.8,B.cy+B.ry))J.v[o+1]-=0.2*dt;
    orbital(J.p[o],J.p[o+1],t,_u);
    J.p[o]+=(J.v[o]+_u.x)*dt;J.p[o+1]+=(J.v[o+1]+_u.y)*dt;J.p[o+2]+=(J.v[o+2]+_u.z)*dt;
    for(const[k,cc,r]of[[0,c.x,B.rx],[2,c.z,B.rz]]){const d=J.p[o+k]-cc;if(d>r){J.p[o+k]-=2*r;J.resetT=true;}else if(d<-r){J.p[o+k]+=2*r;J.resetT=true;}}
    J.rot[i]+=dt*0.1;
    _q.setFromEuler(_e.set(0.15*Math.sin(t*0.3+J.ph[i]),J.rot[i],0.15*Math.cos(t*0.27+J.ph[i])));_p.set(J.p[o],J.p[o+1],J.p[o+2]);_s.setScalar(J.R[i]);
    _m.compose(_p,_q,_s);J.mesh.setMatrixAt(i,_m);
  }
  J.mesh.instanceMatrix.needsUpdate=true;
  if(J.lines){if(J.resetT){initTentacles(J);J.resetT=false;}stepTentacles(J,dt,t);}
}
function stepTentacles(J,dt,t){
  const P=J.tpos,Q=J.tprev;let q=0;
  for(let i=0;i<J.n;i++){const o=i*3,r=J.R[i];
    const ph=t*J.freq*2*Math.PI+J.ph[i],cont=1-0.2*Math.pow(0.5+0.5*Math.sin(ph),3);
    J.tent.forEach(tc=>{const sl=tc.len/tc.seg;
      for(let k=0;k<tc.k;k++){const a=k/tc.k*Math.PI*2+J.rot[i];const rr=r*tc.w*cont;
        const rx=J.p[o]+Math.cos(a)*rr,ry=J.p[o+1]-r*0.05,rz=J.p[o+2]+Math.sin(a)*rr;
        P[q*3]=rx;P[q*3+1]=ry;P[q*3+2]=rz;Q[q*3]=rx;Q[q*3+1]=ry;Q[q*3+2]=rz;
        for(let s=1;s<tc.seg;s++){const z=(q+s)*3;orbital(P[z],P[z+1],t,_u);
          const px=P[z],py=P[z+1],pz=P[z+2];
          P[z]+=(px-Q[z])*0.9+(_u.x*0.5+0.02*Math.sin(t*1.3+s*0.7+k))*dt;P[z+1]+=(py-Q[z+1])*0.9-0.05*dt;P[z+2]+=(pz-Q[z+2])*0.9+(_u.z*0.5+0.02*Math.cos(t*1.1+s*0.6+k))*dt;
          Q[z]=px;Q[z+1]=py;Q[z+2]=pz;}
        for(let it=0;it<2;it++)for(let s=1;s<tc.seg;s++){const a0=(q+s-1)*3,b0=(q+s)*3;
          const dx=P[b0]-P[a0],dy=P[b0+1]-P[a0+1],dz=P[b0+2]-P[a0+2],l=Math.hypot(dx,dy,dz)||1e-6,f=(l-sl)/l;
          P[b0]-=dx*f;P[b0+1]-=dy*f;P[b0+2]-=dz*f;}
        q+=tc.seg;}
    });
  }
  J.lines.geometry.attributes.position.needsUpdate=true;
}

