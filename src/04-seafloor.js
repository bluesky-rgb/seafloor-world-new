/* =========================================================
   5. Seafloor, rocks
   ========================================================= */
const floorGeo=new THREE.PlaneGeometry(400,400,160,160);floorGeo.rotateX(-Math.PI/2);
const FN1=new Float32Array(floorGeo.attributes.position.count),FN2=new Float32Array(FN1.length);
{const p=floorGeo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,floorH(x,z));
   FN1[i]=0.5+0.25*Math.sin(x*1.7+Math.sin(z*1.3))+0.25*Math.sin(z*2.3-x*0.7);
   FN2[i]=0.5+0.5*Math.sin(x*0.45+2.0*Math.sin(z*0.33))*Math.sin(z*0.5+1.7*Math.sin(x*0.29));}
 floorGeo.computeVertexNormals();
 floorGeo.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(p.count*3),3));}
const floorMat=waterify(lambert(),'floor',{defines:{CAUSTICS:'',RIPPLES:''},ext:true});
const floor=new THREE.Mesh(floorGeo,floorMat);scene.add(floor);

const SEEP={x:-2.5,z:-3};
function paintFloor(hab){
  const p=floorGeo.attributes.position,c=floorGeo.attributes.color;
  const pal={
    reef:[[0.86,0.83,0.75],[0.77,0.73,0.64],[0.6,0.55,0.46]],
    temperate:[[0.64,0.6,0.52],[0.52,0.48,0.42],[0.42,0.38,0.33]],
    warm:[[0.8,0.74,0.6],[0.7,0.64,0.52],[0.55,0.5,0.42]],
    deep:[[0.5,0.48,0.44],[0.42,0.41,0.38],[0.34,0.33,0.31]],
    hadal:[[0.62,0.58,0.5],[0.54,0.5,0.43],[0.46,0.43,0.37]],
    vent:[[0.26,0.24,0.21],[0.34,0.29,0.24],[0.55,0.33,0.16]],
    anox:[[0.2,0.19,0.18],[0.15,0.14,0.13],[0.42,0.4,0.33]],
    ant:[[0.78,0.76,0.7],[0.6,0.58,0.54],[0.24,0.23,0.22]],
    cwc:[[0.52,0.5,0.45],[0.44,0.42,0.38],[0.7,0.68,0.62]],
    abyss:[[0.56,0.47,0.36],[0.47,0.39,0.3],[0.16,0.13,0.1]]
  }[hab];
  for(let i=0;i<p.count;i++){
    let col=mixc(pal[0],pal[1],FN1[i]);
    col=mixc(col,pal[2],sstep(0.72,0.95,FN2[i])*0.8);
    if(wfOn){const st=wfStages(WF.t),x=p.getX(i),z=p.getZ(i),e=Math.hypot(x/3.2,z/8);
      col=mixc(col,[0.3,0.26,0.22],sstep(1.4,0.4,e)*st.scav*0.6);
      col=mixc(col,[0.16,0.15,0.13],sstep(1.7,0.6,e)*st.sulfo*0.55);
      col=mixc(col,[0.96,0.95,0.88],sstep(1.15,0.45,e)*st.sulfo*sstep(0.3,0.7,FN1[i]+0.25*Math.sin(x*3)*Math.cos(z*2.4)));}
    if(S.seep){
      const dx=p.getX(i)-SEEP.x,dz=p.getZ(i)-SEEP.z,r=Math.hypot(dx,dz);
      const mat=sstep(4.5,2.0,r)*sstep(0.35,0.7,FN1[i]+0.25*Math.sin(dx*3)*Math.cos(dz*2.6));
      col=mixc(col,[0.16,0.15,0.14],sstep(5,1.5,r)*0.7);
      col=mixc(col,[0.96,0.96,0.93],mat);
    }
    c.setXYZ(i,col[0],col[1],col[2]);
  }
  c.needsUpdate=true;
}

const rocks=new THREE.Group();scene.add(rocks);
const rockMat=waterify(lambert(),'rock',{defines:{CAUSTICS:''}});
for(let i=0;i<18;i++){
  const g=new THREE.DodecahedronGeometry(1,1);const p=g.attributes.position;
  for(let j=0;j<p.count;j++){const s=0.75+rnd()*0.4;p.setXYZ(j,p.getX(j)*s,p.getY(j)*s*0.7,p.getZ(j)*s);}
  g.computeVertexNormals();
  g.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(p.count*3),3));
  g.userData.n=Array.from({length:p.count},()=>rnd());
  const m=new THREE.Mesh(g,rockMat);const a=rnd()*6.28,r=4+rnd()*16,sc=0.3+rnd()*1.3;
  m.position.set(Math.cos(a)*r,0,Math.sin(a)*r);m.scale.setScalar(sc);m.rotation.y=rnd()*6;
  m.userData.base=floorH(m.position.x,m.position.z)+sc*0.2;rocks.add(m);
}
function paintRocks(hab){
  const base={reef:[0.5,0.45,0.38],temperate:[0.42,0.4,0.38],warm:[0.48,0.44,0.38],deep:[0.18,0.17,0.16],hadal:[0.3,0.28,0.25],vent:[0.14,0.13,0.12],anox:[0.16,0.15,0.14],ant:[0.16,0.15,0.15],cwc:[0.3,0.28,0.25],abyss:[0.2,0.17,0.14]}[hab];
  const top={reef:[0.52,0.48,0.32],temperate:[0.86,0.5,0.56],warm:[0.5,0.52,0.32],deep:[0.12,0.11,0.1],hadal:[0.5,0.47,0.4],vent:[0.5,0.3,0.14],anox:[0.3,0.28,0.24],ant:[0.55,0.5,0.45],cwc:[0.6,0.4,0.3],abyss:[0.3,0.26,0.2]}[hab];
  rocks.children.forEach(m=>{
    const g=m.geometry,c=g.attributes.color,nr=g.attributes.normal,n=g.userData.n;
    for(let i=0;i<c.count;i++){
      const up=sstep(0.15,0.8,nr.getY(i));let col=mixc(base,top,up*(0.6+0.4*n[i]));
      const k=0.8+0.35*n[i];c.setXYZ(i,col[0]*k,col[1]*k,col[2]*k);
    }
    c.needsUpdate=true;
  });
}

