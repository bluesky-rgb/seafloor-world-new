/* =========================================================
   14i. Whale fall (gray whale carcass, after MBARI observations in Monterey Canyon).
   Succession after Smith & Baco (2003): mobile scavengers (flesh gone within ~2 yr, 40–60 kg/day),
   enrichment opportunists (~2 yr, Osedax on exposed bone), sulfophilic stage (decades: bacterial mats, mussels).
   ========================================================= */
const WF={t:0.25};
function wfStages(t){
  const scav=t<0.1?1:t<2?1-(t-0.1)/1.9:0;
  const enrich=t<0.3?t/0.3*0.5:t<1?0.5+0.5*(t-0.3)/0.7:t<4?1:t<10?1-(t-4)/6:0;
  const sulfo=t<1.2?0:t<6?(t-1.2)/4.8:t<50?1:Math.max(0.35,1-(t-50)/60);
  return{scav:Math.max(0,scav),enrich:Math.max(0,enrich),sulfo};
}
function fmtYears(t){if(t<1/12)return Math.max(1,Math.round(t*52))+' 周';if(t<1)return Math.round(t*12)+' 个月';if(t<10)return t.toFixed(1).replace(/\.0$/,'')+' 年';return Math.round(t)+' 年';}
const wfGroup=new THREE.Group();wfGroup.visible=false;scene.add(wfGroup);
const bonePts=[];
const boneGeo=(()=>{
  const acc=Acc(),bone=()=>[0.9,0.87,0.78],cyl=new THREE.CylinderGeometry(1,1,1,8,1);
  const seg=(a,b,r)=>{const d=new THREE.Vector3().subVectors(b,a),L=d.length();addGeo(acc,cyl,new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5),new THREE.Quaternion().setFromUnitVectors(UP,d.normalize()),new THREE.Vector3(r,L,r)),bone);};
  const sx=t=>0.25*Math.sin(t*2.2);
  for(let i=0;i<44;i++){const z=-6.2+i*0.235,t=i/43,r=0.05+0.15*Math.sin(Math.PI*Math.min(1,t*1.1+0.05)),y=0.2,x=sx(t);
    seg(new THREE.Vector3(x,y,z-0.09),new THREE.Vector3(x,y,z+0.09),r);
    if(i>6)seg(new THREE.Vector3(x,y,z),new THREE.Vector3(x,y+r*1.6,z-0.05),r*0.22);
    seg(new THREE.Vector3(x-r*2.2,y,z),new THREE.Vector3(x+r*2.2,y,z),r*0.18);
    bonePts.push([x,y+r,z]);}
  for(let k=0;k<13;k++){const z0=0.6+k*0.26,x0=sx((z0+6.2)/10.3),L=1.4+0.6*Math.sin(Math.PI*k/12);
    for(const s of[1,-1]){let prev=new THREE.Vector3(x0,0.2,z0);
      for(let j=1;j<=6;j++){const u=j/6,p=new THREE.Vector3(x0+s*L*Math.sin(u*1.4),0.2+0.15*Math.sin(u*Math.PI)-0.12*u,z0-0.5*u*u);seg(prev,p,0.045*(1-u*0.4));bonePts.push([p.x,p.y+0.04,p.z]);prev=p;}}}
  addGeo(acc,new THREE.SphereGeometry(1,16,10),M4(0.3,0.32,5.3,0.05,0,0,0.9,0.35,1.5),bone);
  for(let i=0;i<24;i++)bonePts.push([0.3+R(-0.6,0.6),0.62,5.3+R(-1.2,1.2)]);
  for(const s of[1,-1]){let prev=new THREE.Vector3(0.3+s*0.5,0.12,4.0);for(let j=1;j<=6;j++){const u=j/6,p=new THREE.Vector3(0.3+s*(0.5+0.3*Math.sin(u*Math.PI)+0.4*u),0.12,4.0+2.8*u);seg(prev,p,0.07);prev=p;}}
  for(const s of[1,-1])addGeo(acc,new THREE.SphereGeometry(1,10,6),M4(0.3+s*1.0,0.12,2.8,0,s*0.4,0,0.45,0.05,0.35),bone);
  return finishGeo(acc);
})();
const WFU={uOse:{value:0},uMat:{value:0}};
const boneMat=waterify(lambert(),'bone',{uniforms:WFU,fHead:'uniform float uOse; uniform float uMat;',
  fColor:`{ float pn=0.5+0.5*sin(vLocal.x*9.0+sin(vLocal.z*7.0)*2.0)*sin(vLocal.z*11.0+vLocal.y*13.0+sin(vLocal.x*5.0));
    float pm=0.5+0.5*sin(vLocal.z*3.1+sin(vLocal.x*4.3)*1.7)*sin(vLocal.x*5.7+vLocal.y*6.1+1.3);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.85,0.2,0.24),uOse*smoothstep(0.3,0.55,pn));
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.97,0.95,0.86),uMat*smoothstep(0.25,0.6,pm));
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.25,0.22,0.2),uMat*0.35*(1.0-smoothstep(0.1,0.4,pm))); }`});
const bones=new THREE.Mesh(boneGeo,boneMat);wfGroup.add(bones);
const fleshGeo=(()=>{const g=latheZ([[0.001,-0.5],[0.02,-0.45],[0.05,-0.3],[0.075,-0.1],[0.08,0.1],[0.07,0.3],[0.05,0.42],[0.02,0.49],[0.001,0.5]],22);
  const acc=Acc();addGeo(acc,g,M4(0,0,0,0,0,0,1,0.75,1),(x,y,z)=>{const n=0.5+0.5*Math.sin(x*60+z*40)*Math.sin(y*50);return mixc([0.44,0.36,0.36],[0.62,0.42,0.42],n*0.6);});return finishGeo(acc);})();
const flesh=new THREE.Mesh(fleshGeo,waterify(lambert(),'flesh'));flesh.scale.set(13,13,13);flesh.position.set(0.25,0.45,-0.3);wfGroup.add(flesh);
/* Osedax: feathery red plumes on the bones (1–2 cm each) */
const osedaxGeo=(()=>{const acc=Acc();addGeo(acc,new THREE.CylinderGeometry(0.004,0.005,0.03,4),M4(0,0.015,0),()=>[0.9,0.85,0.7]);
  for(let k=0;k<4;k++)addGeo(acc,new THREE.SphereGeometry(1,5,4),M4(Math.cos(k*1.57)*0.01,0.038,Math.sin(k*1.57)*0.01,Math.sin(k*1.57)*0.5,0,-Math.cos(k*1.57)*0.5,0.006,0.016,0.006),()=>[0.95,0.2,0.25]);return finishGeo(acc);})();
const osedax=new THREE.InstancedMesh(osedaxGeo,waterify(lambert(),'osedax'),900);osedax.frustumCulled=false;osedax.count=0;wfGroup.add(osedax);
for(let i=0;i<900;i++){const b=bonePts[i%bonePts.length];_q.setFromEuler(_e.set(R(-0.5,0.5),rnd()*6,R(-0.5,0.5)));_s.setScalar(R(1,1.8));_p.set(b[0]+R(-0.12,0.12),b[1]-0.02,b[2]+R(-0.12,0.12));_m.compose(_p,_q,_s);osedax.setMatrixAt(i,_m);}
/* chemosynthetic mussels around the skeleton in the sulfophilic stage */
const wfMussels=new THREE.InstancedMesh(musselGeo,urchinMat,120);wfMussels.frustumCulled=false;wfMussels.count=0;scene.add(wfMussels);
/* deep-sea crabs drawn to the carcass */
const crabGeo=(()=>{const acc=Acc(),col=()=>[0.86,0.36,0.22],leg=new THREE.CylinderGeometry(0.008,0.006,0.2,4);
  addGeo(acc,new THREE.SphereGeometry(1,12,8),M4(0,0.05,0,0,0,0,0.11,0.05,0.1),col);
  for(const s of[1,-1]){for(let k=0;k<4;k++){const a=-0.6+k*0.4;addGeo(acc,leg,M4(s*0.15,0.03,a*0.12,0,-a*0.6*s,s*1.1),col);}
    addGeo(acc,new THREE.SphereGeometry(1,8,6),M4(s*0.06,0.05,0.14,0,0,0,0.03,0.025,0.04),col);}
  return finishGeo(acc);})();
const NCR=24,crabs=new THREE.InstancedMesh(crabGeo,urchinMat,NCR);crabs.frustumCulled=false;crabs.count=0;scene.add(crabs);
const crabS=[];for(let i=0;i<NCR;i++){const a=rnd()*6.28,r=R(1.5,6);crabS.push({x:Math.cos(a)*r*0.6,z:Math.sin(a)*r,h:rnd()*6.28,s:R(1,1.6)});}
/* hagfish (Eptatretus deani) writhing in and around the carcass */
makeDrift('hagfish',{n:40,size:[0.4,0.65],spd:0.14,minAb:0.08,phRate:2,geo:(()=>{const acc=Acc();
    addGeo(acc,latheZ([[0.001,-0.5],[0.012,-0.42],[0.018,0],[0.018,0.4],[0.012,0.48],[0.001,0.5]],10),null,(x,y)=>mixc([0.78,0.6,0.6],[0.55,0.4,0.42],sstep(-0.01,0.015,y)));
    return finishGeo(acc);})(),
  vb:'transformed.x+=sin(aPhase*4.0-position.z*14.0)*0.05;'});
/* Pacific sleeper shark (Somniosus pacificus): slow, cold-water scavenger */
const SLP=makeSwimmer('sleeper',buildFishGeo({eye:0.006,h:0.12,w:0.12,tailH:0.12,dorsal:0.035,anal:0.025,
  col:(x,y,z,f)=>mixc([0.4,0.38,0.37],[0.27,0.26,0.26],sstep(-0.05,0.05,y))}),
  {vBegin:'float bt=clamp(0.15-position.z,0.0,1.0); transformed.x+=sin(aPhase-position.z*4.0)*0.18*bt*bt;'});
const sleeperS={a:0};
let wfOn=false,wfBase=0;
function buildWhaleFall(on){
  wfOn=on;wfGroup.visible=on;if(!on){wfMussels.count=0;crabs.count=0;SLP.mesh.count=0;return;}
  let mn=0,nS=0;for(let z=-6;z<=7;z+=1)for(let x=-2;x<=2;x+=1){mn+=floorY(x,z);nS++;}mn/=nS;
  wfBase=mn;wfGroup.position.set(0,mn+0.02,0);wfGroup.rotation.set(0,0,0);
  for(let i=0;i<120;i++){const z=R(-6.5,6.5),x=R(-2.8,2.8)*(1-Math.abs(z)/9);_q.setFromEuler(_e.set(R(-0.6,0.6),rnd()*6,R(-0.6,0.6)));_s.setScalar(R(0.06,0.11));_p.set(x,floorY(x,z)+0.03,z);_m.compose(_p,_q,_s);wfMussels.setMatrixAt(i,_m);}
  wfMussels.instanceMatrix.needsUpdate=true;applyWF();
}
function applyWF(){
  if(!wfOn)return;const st=wfStages(WF.t),f=Math.pow(st.scav,0.8);
  flesh.visible=f>0.02;flesh.scale.set(13*(0.25+0.75*f),13*(0.25+0.75*f),13);
  osedax.count=Math.round(900*st.enrich*(1-0.7*f));WFU.uOse.value=st.enrich*0.8*(1-f);WFU.uMat.value=st.sulfo;
  wfMussels.count=Math.round(120*st.sulfo);crabs.count=Math.round(NCR*Math.max(0.25,Math.min(1,st.scav+st.enrich*0.5)));
  bones.scale.set(1,1-0.45*Math.max(0,(WF.t-20)/40),1);
  $('wfV').textContent=fmtYears(WF.t);
  $('wfStage').textContent=st.scav>0.4?'食腐动物阶段：盲鳗和睡鲨在啃食鲸肉，每天能吃掉 40–60 kg。':st.enrich>0.5&&st.sulfo<0.5?'机会主义者阶段：骨头露出，红色的食骨蠕虫把“根”钻进骨头里。':'化能合成阶段：细菌分解骨头里的油脂，放出硫化氢，白色细菌席和贻贝靠它生活，可以持续几十年。';
}
function stepWhaleFall(dt,t){
  if(!wfOn)return;const st=wfStages(WF.t);
  if(st.scav>0.3){sleeperS.a+=dt*0.04;const x=Math.cos(sleeperS.a)*6.5,z=Math.sin(sleeperS.a)*8.5;_p.set(x,wfBase+1.6+0.3*Math.sin(t*0.2),z);
    _a.set(-Math.sin(sleeperS.a)*6.5,0,Math.cos(sleeperS.a)*8.5);SLP.ph[0]+=dt*2*Math.PI*0.2;poseSwimmer(SLP,_p,_a,3.6);SLP.mesh.count=1;}else SLP.mesh.count=0;
  for(let i=0;i<crabs.count;i++){const c=crabS[i];c.h+=(rnd()-0.5)*dt*1.5;c.x+=Math.cos(c.h)*0.04*dt;c.z+=Math.sin(c.h)*0.04*dt;
    if(Math.hypot(c.x/3,c.z/7.5)>1){c.h+=Math.PI*0.5*dt*4;c.x*=0.995;c.z*=0.995;}
    _q.setFromEuler(_e.set(0,-c.h+Math.PI/2,0));_s.setScalar(c.s);_p.set(c.x,floorY(c.x,c.z)+0.01,c.z);_m.compose(_p,_q,_s);crabs.setMatrixAt(i,_m);}
  crabs.instanceMatrix.needsUpdate=true;
  const D=DRIFT.hagfish;if(D.active)D.mesh.count=Math.round(D.n*Math.min(1,0.1+st.scav*1.1));
}

