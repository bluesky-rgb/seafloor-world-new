/* =========================================================
   14q. Røst Reef, off Lofoten, Norway: the largest known cold-water coral reef (~35–43 km long, discovered 2002).
   Built by Desmophyllum pertusum (formerly Lophelia pertusa): no symbiotic algae, feeds on plankton; white and
   orange colour morphs; linear growth only ~1–2.5 mm a year (in situ, Norwegian sites at 180–304 m, ~7.5 °C).
   Living tips sit on mounds of dead coral framework and rubble; bubblegum coral, Geodia sponges, file clams, redfish.
   ========================================================= */
const ROST={on:false,centers:[[-1,-1],[3.5,2.5],[-4.5,3],[4,-4.5],[-3,-6],[7,1],[-7.5,-1.5]]};
const lophGeo=(()=>{const acc=Acc();const cyl=new THREE.CylinderGeometry(0.011,0.014,1,5,1,true);cyl.translate(0,0.5,0);
  const cup=new THREE.CylinderGeometry(0.02,0.012,0.035,7,1,true);cup.translate(0,0.0175,0);
  const dead=[0.5,0.46,0.4],live=[1,1,1];
  function grow(base,dir,len,depth){
    const q=new THREE.Quaternion().setFromUnitVectors(UP,dir),col=depth<3?()=>dead:()=>live;
    addGeo(acc,cyl,new THREE.Matrix4().compose(base,q,new THREE.Vector3(1,len,1)),col);
    const end=base.clone().addScaledVector(dir,len);
    if(depth>=2)addGeo(acc,cup,new THREE.Matrix4().compose(end,q,new THREE.Vector3(1,1,1)),col);
    if(depth>=7)return;
    const n=rnd()<0.55?1:2;
    for(let i=0;i<n;i++){const sgn=(depth%2?1:-1)*(i?-1:1);const d=dir.clone().add(new THREE.Vector3(sgn*R(0.25,0.6),0.28,R(-0.5,0.5))).normalize();grow(end,d,len*R(0.88,1.04),depth+1);}
  }
  for(let i=0;i<4;i++){const a=i/4*6.28+rnd();grow(new THREE.Vector3(Math.cos(a)*0.05,0,Math.sin(a)*0.05),new THREE.Vector3(Math.cos(a)*0.45,1,Math.sin(a)*0.45).normalize(),0.075,0);}
  return finishGeo(acc);})();
const lophMat=waterify(lambert(),'loph');
const lophs=new THREE.InstancedMesh(lophGeo,lophMat,90);lophs.frustumCulled=false;lophs.count=0;scene.add(lophs);
/* dead-coral rubble */
const rubbleGeo=(()=>{const acc=Acc();for(let k=0;k<5;k++)addGeo(acc,new THREE.CylinderGeometry(0.01,0.013,R(0.04,0.1),5),M4(R(-0.06,0.06),0.008,R(-0.06,0.06),Math.PI/2+R(-0.3,0.3),rnd()*3,R(-0.4,0.4)),()=>[0.42,0.4,0.37]);return finishGeo(acc);})();
const rubble=new THREE.InstancedMesh(rubbleGeo,urchinMat,900);rubble.frustumCulled=false;rubble.count=0;scene.add(rubble);
/* Geodia: massive round demosponges */
const geodiaGeo=(()=>{const g=new THREE.SphereGeometry(1,20,14),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+0.08*Math.sin(x*6+z*5)*Math.sin(y*7);p.setXYZ(i,x*k,Math.max(y,-0.3)*k*0.8,z*k);}
  g.computeVertexNormals();const acc=Acc();addGeo(acc,g,null,(x,y,z)=>mixc([0.78,0.76,0.7],[0.62,0.6,0.56],sstep(-0.2,0.6,Math.sin(x*12)*Math.sin(z*11))));
  for(let k=0;k<4;k++){const a=k*1.7;addGeo(acc,new THREE.CircleGeometry(0.07,10),M4(Math.cos(a)*0.35,0.62,Math.sin(a)*0.35,-1.2,0,0),()=>[0.25,0.24,0.22]);}
  return finishGeo(acc);})();
const geodias=new THREE.InstancedMesh(geodiaGeo,urchinMat,14);geodias.frustumCulled=false;geodias.count=0;scene.add(geodias);
/* Acesta excavata: giant file clam, ~10–18 cm, orange mantle fringe, attached to the coral framework */
const acestaGeo=(()=>{const acc=Acc();
  addGeo(acc,new THREE.SphereGeometry(1,14,8),M4(0,0,0,0,0,0,0.4,0.12,0.5),(x,y)=>y>0?[0.9,0.86,0.76]:[0.85,0.8,0.7]);
  for(let k=0;k<22;k++){const a=k/22*Math.PI*2;addGeo(acc,new THREE.CylinderGeometry(0.012,0.02,0.16,4),M4(Math.cos(a)*0.38,0,Math.sin(a)*0.48,Math.sin(a)*1.4,0,-Math.cos(a)*1.4),()=>[1,0.5,0.15]);}
  return finishGeo(acc);})();
const acestas=new THREE.InstancedMesh(acestaGeo,urchinMat,24);acestas.frustumCulled=false;acestas.count=0;scene.add(acestas);
function buildRost(on){
  ROST.on=on;if(!on){lophs.count=rubble.count=geodias.count=acestas.count=0;return;}
  const cc=new THREE.Color();let k=0;ROST.col=[];
  for(let i=0;i<90;i++){let x,z;if(i<72){const c=ROST.centers[i%ROST.centers.length];x=c[0]+R(-1,1)*R(0.3,2.4);z=c[1]+R(-1,1)*R(0.3,2.4);}else{const a=rnd()*6.28,r=R(5,16);x=Math.cos(a)*r;z=Math.sin(a)*r;}
    const s=R(0.9,2.3);_q.setFromEuler(_e.set(R(-0.12,0.12),rnd()*6.28,R(-0.12,0.12)));_s.setScalar(s);_p.set(x,floorY(x,z)-0.03,z);_m.compose(_p,_q,_s);lophs.setMatrixAt(k,_m);
    const orange=rnd()<0.3;lophs.setColorAt(k,orange?cc.setRGB(0.95,0.48,0.25):cc.setRGB(0.82,0.8,0.76));ROST.col.push({x,z,s});k++;}
  lophs.count=k;lophs.instanceMatrix.needsUpdate=true;lophs.instanceColor.needsUpdate=true;
  k=0;for(let i=0;i<900;i++){const c=ROST.centers[i%ROST.centers.length],x=c[0]+R(-1,1)*R(0,4.5),z=c[1]+R(-1,1)*R(0,4.5);
    _q.setFromEuler(_e.set(0,rnd()*6.28,R(-0.3,0.3)));_s.setScalar(R(0.6,1.3));_p.set(x,floorY(x,z)+0.005,z);_m.compose(_p,_q,_s);rubble.setMatrixAt(k++,_m);}
  rubble.count=k;rubble.instanceMatrix.needsUpdate=true;
  k=0;for(let i=0;i<14;i++){const a=rnd()*6.28,r=R(2,12),x=Math.cos(a)*r,z=Math.sin(a)*r;_q.setFromEuler(_e.set(0,rnd()*6.28,0));_s.setScalar(R(0.25,0.55));_p.set(x,floorY(x,z)+0.05,z);_m.compose(_p,_q,_s);geodias.setMatrixAt(k++,_m);}
  geodias.count=k;geodias.instanceMatrix.needsUpdate=true;
  k=0;for(let i=0;i<24;i++){const c=ROST.col[i*3%ROST.col.length],a=rnd()*6.28,x=c.x+Math.cos(a)*0.25*c.s,z=c.z+Math.sin(a)*0.25*c.s;
    _q.setFromEuler(_e.set(R(-0.8,0.8),rnd()*6.28,R(-0.8,0.8)));_s.setScalar(R(0.22,0.34));_p.set(x,floorY(x,z)+R(0.1,0.35)*c.s,z);_m.compose(_p,_q,_s);acestas.setMatrixAt(k++,_m);}
  acestas.count=k;acestas.instanceMatrix.needsUpdate=true;
}

