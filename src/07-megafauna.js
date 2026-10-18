/* =========================================================
   11. Manta rays, green sea turtles, anglerfish
   ========================================================= */
function mantaGeo(){
  const acc=Acc();const NU=36,NV=18;
  const shape=(u,v)=>{const hw=0.5*Math.pow(Math.sin(Math.PI*Math.min(1,v*1.12)),0.75);const x=u*hw;const z=0.32-v*0.62-0.24*Math.pow(Math.abs(u),1.6)*hw*2;const y=0.06*Math.pow(1-u*u,2)*Math.sin(Math.PI*v);return[x,y,z];};
  for(const side of [1,-1]){
    const pos=[],idx=[];
    for(let j=0;j<=NV;j++)for(let i=0;i<=NU;i++){const u=i/NU*2-1,v=j/NV;const[x,y,z]=shape(u,v);pos.push(x,side>0?y:-y*0.5,z);}
    for(let j=0;j<NV;j++)for(let i=0;i<NU;i++){const a=j*(NU+1)+i,b=a+1,c=a+NU+1,d=c+1;if(side>0)idx.push(a,c,b,b,c,d);else idx.push(a,b,c,b,d,c);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
    addGeo(acc,g,null,side>0?(x,y,z)=>{const ax=Math.abs(x);const patch=sstep(0.06,0.0,Math.abs(ax-0.17)-0.06)*sstep(0.06,0.0,Math.abs(z-0.12)-0.05);return mixc([0.1,0.11,0.13],[0.75,0.76,0.78],patch*0.8);}
      :(x,y,z)=>{const sp=(Math.sin(x*70)*Math.sin(z*60)>0.93&&Math.abs(x)<0.15)?1:0;const edge=sstep(0.38,0.5,Math.abs(x));return mixc(mixc([0.93,0.94,0.95],[0.1,0.1,0.12],sp),[0.2,0.2,0.22],edge*0.8);});
  }
  addGeo(acc,new THREE.CylinderGeometry(0.004,0.008,0.32,5),M4(0,0,-0.45,Math.PI/2),()=>[0.1,0.1,0.12]);
  for(const s of [1,-1])addGeo(acc,new THREE.BoxGeometry(0.02,0.07,0.09),M4(s*0.07,-0.01,0.33,0,0,s*0.3),()=>[0.12,0.12,0.14]);
  return finishGeo(acc);
}
const mantaG=mantaGeo();
const mantas=[0,1].map(i=>{
  const mat=waterify(lambert({side:THREE.DoubleSide}),'manta',{uniforms:{uFlap:{value:0}},vHead:'uniform float uFlap;',
    vBegin:'{ float ax=abs(position.x)*2.0; transformed.y+=0.13*pow(ax,1.6)*sin(uFlap-ax*1.3); }'});
  const m=new THREE.Mesh(mantaG,mat);m.scale.setScalar(i?3.0:3.8);m.visible=false;scene.add(m);
  m.userData={R:i?11:8,w:(i?-1:1)*0.09,th:i?2:0,h:i?3.5:5,ph:rnd()*6};
  m.material.onBeforeCompile=(orig=>sh=>{orig(sh);m.userData.u=sh.uniforms.uFlap;})(m.material.onBeforeCompile);
  return m;
});
let mantaOn=false;
function stepMantas(dt,t){
  if(!mantaOn)return;const fy=-S.D;
  mantas.forEach(m=>{const u=m.userData;u.th+=u.w*dt;
    const y=(DIVE.on?controls.target.y+u.h-3:Math.min(fy+u.h,-2.0))+0.5*Math.sin(t*0.2+u.ph);
    m.position.set(Math.cos(u.th)*u.R,y,Math.sin(u.th)*u.R);
    const hx=-Math.sin(u.th)*Math.sign(u.w),hz=Math.cos(u.th)*Math.sign(u.w);
    m.rotation.set(0,Math.atan2(hx,hz),0);m.rotateZ(-0.22*Math.sign(u.w));
    if(m.userData.u)m.userData.u.value=t*2*Math.PI/4.5+u.ph;});
}

/* green sea turtle (Chelonia mydas) */
const turtleMat=waterify(lambert(),'turtle',{defines:{CAUSTICS:''}});
function makeTurtle(){
  const g=new THREE.Group();
  const shellAcc=Acc();
  const sg=new THREE.SphereGeometry(1,28,16);
  addGeo(shellAcc,sg,M4(0,0,0,0,0,0,0.42,0.15,0.5),(x,y,z)=>{if(y<-0.02)return[0.88,0.82,0.62];
    const sc=0.5+0.5*Math.sin(x*28)*Math.sin(z*22+Math.sin(x*15));const streak=0.5+0.5*Math.sin(Math.atan2(x,z)*9+Math.hypot(x,z)*18);
    return mixc(mixc([0.42,0.3,0.14],[0.62,0.48,0.22],streak),[0.2,0.14,0.07],sstep(0.85,1,sc)*0.8);});
  addGeo(shellAcc,new THREE.SphereGeometry(1,14,10),M4(0,0.01,0.6,0,0,0,0.11,0.09,0.14),(x,y,z)=>(Math.sin(x*90)*Math.sin(z*80)>0.6?[0.85,0.8,0.6]:[0.42,0.38,0.25]));
  g.add(new THREE.Mesh(finishGeo(shellAcc),turtleMat));
  const flipAcc=Acc();addGeo(flipAcc,new THREE.SphereGeometry(1,14,8),M4(0.27,0,-0.05,0,0.3,0,0.3,0.025,0.1),(x,y,z)=>(Math.sin(x*60)*Math.sin(z*70)>0.5?[0.8,0.76,0.58]:[0.36,0.32,0.22]));
  const flipG=finishGeo(flipAcc);
  const rearAcc=Acc();addGeo(rearAcc,new THREE.SphereGeometry(1,10,6),M4(0.1,0,-0.03,0,0,0,0.12,0.02,0.08),()=>[0.36,0.32,0.22]);const rearG=finishGeo(rearAcc);
  const pivots=[];
  for(const s of [1,-1]){
    const pv=new THREE.Object3D();pv.position.set(s*0.3,-0.02,0.25);const f=new THREE.Mesh(flipG,turtleMat);f.scale.x=s;pv.add(f);g.add(pv);pivots.push(pv);
    const pr=new THREE.Object3D();pr.position.set(s*0.26,-0.03,-0.38);const r=new THREE.Mesh(rearG,turtleMat);r.scale.x=s;pr.add(r);g.add(pr);pivots.push(pr);
  }
  g.userData.pv=pivots;g.visible=false;scene.add(g);return g;
}
const turtles=[makeTurtle(),makeTurtle()];
turtles[0].userData.o={R:7,w:0.06,th:1,h:2.2,ph:0};turtles[1].userData.o={R:10.5,w:-0.045,th:4,h:1.3,ph:2};
let turtleOn=false;
function stepTurtles(dt,t){
  if(!turtleOn)return;const fy=-S.D;
  turtles.forEach(g=>{const o=g.userData.o;o.th+=o.w*dt;
    const x=Math.cos(o.th)*o.R+2,z=Math.sin(o.th)*o.R-1,y=Math.min((DIVE.on?controls.target.y+o.h-2:fy+o.h)+0.4*Math.sin(t*0.25+o.ph),-1.5);
    g.position.set(x,y,z);const hx=-Math.sin(o.th)*Math.sign(o.w),hz=Math.cos(o.th)*Math.sign(o.w);
    g.rotation.set(0.05*Math.sin(t*0.4+o.ph),Math.atan2(hx,hz),-0.1*Math.sign(o.w));
    const ph=t*2*Math.PI/3.2+o.ph,pv=g.userData.pv;
    for(let k=0;k<4;k++){const s=k<2?1:-1,front=k%2===0;
      if(front){pv[k].rotation.set(0,s*0.35*Math.cos(ph),s*-0.6*Math.sin(ph));}
      else pv[k].rotation.set(0,s*0.25*Math.sin(ph*0.5),0);}
  });
}

/* deep-sea anglerfish (Melanocetus) with glowing esca */
const anglerGeo=buildFishGeo({h:0.7,w:0.55,tailH:0.16,dorsal:0.05,anal:0.04,col:(x,y,z,f)=>mixc([0.12,0.1,0.1],[0.05,0.04,0.04],sstep(-0.3,0.4,y/0.7))});
const anglerMat=waterify(lambert({side:THREE.DoubleSide}),'angler');
const anglers=[0,1,2].map(i=>{const g=new THREE.Group();g.add(new THREE.Mesh(anglerGeo,anglerMat));
  const st=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.01,0.35,4),anglerMat);st.position.set(0,0.62,0.32);st.rotation.x=0.9;g.add(st);
  g.scale.setScalar(R(0.16,0.22));g.visible=false;g.userData={a:rnd()*6.28,r:R(1.5,4),h:R(0.6,2),ph:rnd()*6};scene.add(g);return g;});
let anglerOn=false;
const lureLocal=new THREE.Vector3(0,0.75,0.45);

