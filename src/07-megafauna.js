/* =========================================================
   11. Manta rays, green sea turtles, anglerfish
   ========================================================= */
/* ---- smooth organic bodies: lofted surfaces with per-vertex colour from surface coordinates ----
   loftGeo(nA,nB,fn): a runs along the body (rows 0..nA), b runs around it (nB columns, wrapped).
   fn(a,b) returns [x,y,z, r,g,b]; normals are averaged across the wrap so there is no seam. */
function loftGeo(nA,nB,fn){
  const pos=[],col=[],idx=[];
  for(let i=0;i<=nA;i++)for(let j=0;j<nB;j++){const v=fn(i/nA,j/nB);pos.push(v[0],v[1],v[2]);col.push(v[3],v[4],v[5]);}
  for(let i=0;i<nA;i++)for(let j=0;j<nB;j++){const a=i*nB+j,b=i*nB+(j+1)%nB,c=a+nB,d=b+nB;idx.push(a,c,b,b,c,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
  /* make the faces point outwards whichever way the parameters run: flip if normals point at the centroid on average */
  let cx=0,cy=0,cz=0;const n=pos.length/3;for(let k=0;k<pos.length;k+=3){cx+=pos[k];cy+=pos[k+1];cz+=pos[k+2];}cx/=n;cy/=n;cz/=n;
  const N=g.attributes.normal.array;let out=0;for(let k=0;k<pos.length;k+=3)out+=N[k]*(pos[k]-cx)+N[k+1]*(pos[k+1]-cy)+N[k+2]*(pos[k+2]-cz);
  if(out<0){for(let k=0;k<idx.length;k+=3){const t=idx[k+1];idx[k+1]=idx[k+2];idx[k+2]=t;}g.setIndex(idx);g.computeVertexNormals();}
  return g;
}
/* merge a geometry that already carries vertex colours */
function addColored(acc,g0,m){
  const g=g0.index?g0.toNonIndexed():g0.clone();if(m)g.applyMatrix4(m);
  const p=g.attributes.position.array,n=g.attributes.normal.array,c=g.attributes.color.array;
  for(let i=0;i<p.length;i++){acc.pos.push(p[i]);acc.nor.push(n[i]);acc.col.push(c[i]);}
  for(const k in acc.ex)for(let i=0;i<p.length/3;i++)acc.ex[k].push(0);
}
const hash3=(i,j,k)=>{const h=Math.sin(i*127.1+j*311.7+k*74.7)*43758.5453;return h-Math.floor(h);};
/* cellular (Voronoi) noise: distance to nearest and second-nearest jittered points -> scales, scutes, spots */
function cell2(x,y){let d1=9,d2=9,id=0;const ix=Math.floor(x),iy=Math.floor(y);
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const cx=ix+a,cy=iy+b,px=cx+0.15+0.7*hash3(cx,cy,1),py=cy+0.15+0.7*hash3(cx,cy,2),d=Math.hypot(x-px,y-py);
    if(d<d1){d2=d1;d1=d;id=hash3(cx,cy,3);}else if(d<d2)d2=d;}
  return[d1,d2,id];}
function cell3(x,y,z){let d1=9,d2=9;const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z);
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++){const cx=ix+a,cy=iy+b,cz=iz+c;
    const d=Math.hypot(x-cx-hash3(cx,cy,cz),y-cy-hash3(cy,cz,cx),z-cz-hash3(cz,cx,cy));if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}
  return[d1,d2];}

/* reef manta ray (Mobula alfredi). Normalised: span 1 (x = ±0.5), nose at z ≈ +0.3.
   Planform: broad head, swept leading edge, pointed wingtips, concave trailing edge; aerofoil-thick body, thin wings.
   Dorsal black with the species' white shoulder patches; ventral white with five pairs of gill slits and a few dark spots. */
function mantaGeo(){
  const acc=Acc();
  const half=u=>Math.abs(u);
  const zLE=u=>0.30-0.42*Math.pow(Math.max(0,half(u)-0.12),1.1);                 /* leading edge, swept back */
  /* chord: long down the body's midline, short across the wings, so the trailing edge is concave and the tips sweep back */
  const chord=u=>0.3*Math.pow(Math.max(0,1-half(u)),1.05)+0.19*Math.exp(-Math.pow(half(u)/0.13,2));
  const thick=u=>0.075*Math.pow(Math.max(0,1-half(u)/0.42),1.6)+0.008*(1-half(u));/* body thick, wings thin */
  const camber=u=>0.03*Math.pow(Math.max(0,1-half(u)),2);
  /* b runs around the aerofoil section: 0..0.5 upper surface LE->TE, 0.5..1 lower surface TE->LE */
  const g=loftGeo(80,48,(a,b)=>{
    const u=-1+2*a,ph=b<0.5?b*2:(1-b)*2;                 /* ph: chord position 0 at LE, 1 at TE */
    const v=0.5-0.5*Math.cos(Math.PI*ph);                   /* cluster vertices at the edges */
    const x=u*0.5,z=zLE(u)-v*chord(u),af=Math.pow(Math.sin(Math.PI*v),0.75)*(1-0.35*v);
    const top=b<0.5,y=camber(u)*Math.sin(Math.PI*v)+(top?1:-0.55)*thick(u)*af;
    let c;
    if(top){
      c=[0.055,0.06,0.07];
      /* white shoulder patches: behind the head, running out along the leading edge */
      const lu=half(u),patch=sstep(0.16,0.24,lu)*sstep(0.62,0.48,lu)*sstep(0.10,0.18,v)*sstep(0.55,0.38,v+0.25*lu);
      c=mixc(c,[0.86,0.88,0.9],patch*0.95);
      c=mixc(c,[0.1,0.1,0.11],sstep(0.85,1,v));
    }else{
      c=[0.9,0.91,0.92];
      const lu=half(u);
      if(v<0.05||lu>0.88){return[x,y,z,0.1,0.1,0.11];}                                        /* dark rim where upper and lower surfaces meet */
      const gill=lu>0.07&&lu<0.15&&v>0.06&&v<0.5&&Math.abs(((z-0.02)*30)%2)<0.28?1:0;                 /* gill slits */
      const [d1]=cell2(x*22,z*22);const spot=lu<0.22&&v>0.35&&d1<0.18?1:0;                           /* belly spots */
      c=mixc(c,[0.12,0.12,0.14],Math.max(gill*0.85,spot));
      c=mixc(c,[0.16,0.16,0.18],Math.min(1,sstep(0.3,0.5,lu)*sstep(0.7,1,v)*0.8+sstep(0.75,0.98,lu)*0.5+sstep(0.9,1,v)));   /* dark trailing margins */
    }
    return[x,y,z,...c];});
  addColored(acc,g);
  /* terminal mouth across the front of the head */
  addGeo(acc,new THREE.BoxGeometry(0.15,0.035,0.012),M4(0,-0.005,0.303),()=>[0.02,0.02,0.025]);
  /* cephalic lobes: rolled, tapering, curled forward and inward */
  for(const s of[1,-1]){
    const lobe=loftGeo(14,10,(a,b)=>{const t=a,ang=b*Math.PI*2,r=0.022*(1-0.55*t)+0.002;
      const cx=s*(0.09-0.04*t*t),cz=0.295+0.06*t,cy=-0.012-0.035*t*t;            /* curl down and inward */
      return[cx+r*Math.cos(ang)*0.45,cy+r*Math.sin(ang)*1.1,cz,0.07,0.075,0.085];});
    addColored(acc,lobe);
    addGeo(acc,new THREE.SphereGeometry(0.011,8,6),M4(s*0.105,0.006,0.27),()=>[0.02,0.02,0.02]);   /* eyes on the head's sides */
  }
  /* short whip tail */
  addGeo(acc,new THREE.CylinderGeometry(0.0025,0.008,0.3,6),M4(0,0,-0.33,Math.PI/2),()=>[0.06,0.06,0.07]);
  return finishGeo(acc);
}
const mantaG=mantaGeo();
const mantas=[0,1].map(i=>{
  /* wingbeat: a wave travelling from root to tip, with the tips lagging and twisting slightly */
  const mat=waterify(lambert({side:THREE.DoubleSide}),'manta',{uniforms:{uFlap:{value:0}},vHead:'uniform float uFlap;',
    vBegin:'{ float ax=abs(position.x)*2.0; float w=pow(max(ax-0.12,0.0),1.5); transformed.y+=0.16*w*sin(uFlap-ax*1.5)+0.03*w*(position.z)*cos(uFlap-ax*1.5)*8.0; }'});
  const m=new THREE.Mesh(mantaG,mat);m.scale.setScalar(i?3.0:3.8);m.visible=false;scene.add(m);
  m.userData={R:i?11:8,w:(i?-1:1)*0.09,th:i?2:0,h:i?3.5:5,ph:rnd()*6};
  m.material.onBeforeCompile=(orig=>sh=>{orig(sh);m.userData.u=sh.uniforms.uFlap;})(m.material.onBeforeCompile);
  return m;
});
let mantaOn=false;
function stepMantas(dt,t){
  if(!mantaOn)return;const fy=-S.D;
  mantas.forEach(m=>{const u=m.userData;u.th+=u.w*dt;
    const fl=t*2*Math.PI/4.5+u.ph;
    const y=(DIVE.on?controls.target.y+u.h-3:Math.min(fy+u.h,-2.0))+0.5*Math.sin(t*0.2+u.ph)+0.05*Math.sin(fl);   /* the body heaves a little with each beat */
    m.position.set(Math.cos(u.th)*u.R,y,Math.sin(u.th)*u.R);
    const hx=-Math.sin(u.th)*Math.sign(u.w),hz=Math.cos(u.th)*Math.sign(u.w);
    m.rotation.set(0,Math.atan2(hx,hz),0);m.rotateZ(-0.22*Math.sign(u.w));m.rotateX(-0.04*Math.cos(fl));
    if(m.userData.u)m.userData.u.value=fl;});
}

/* green sea turtle (Chelonia mydas), carapace ~1 m.
   Carapace: domed, heart-shaped; 5 vertebral + 4 pairs of costal scutes + marginals, each with radiating dark/amber streaks.
   Plastron pale yellow. Head and flippers covered in dark polygonal scales with pale edges. */
const turtleMat=waterify(lambert(),'turtle',{defines:{CAUSTICS:''}});
const TCX=[[0,0.29],[0,0.13],[0,-0.03],[0,-0.19],[0,-0.33],[0.2,0.2],[0.22,0.04],[0.21,-0.12],[0.17,-0.27],[-0.2,0.2],[-0.22,0.04],[-0.21,-0.12],[-0.17,-0.27]];
function turtleShell(){
  const z0=-0.48,L=0.93;
  const W=a=>0.41*Math.pow(Math.sin(Math.PI*Math.pow(a,0.9)),0.62)*(0.86+0.14*a);
  const Ht=a=>0.17*Math.pow(Math.sin(Math.PI*a),0.55)*(0.9+0.1*a);
  const Pl=a=>0.06*Math.pow(Math.sin(Math.PI*a),0.7);
  return loftGeo(96,144,(a,b)=>{
    const phi=b*Math.PI*2,c=Math.cos(phi),sn=Math.sin(phi),w=W(a);
    const x=w*c*(1-0.04*(sn>0?0:1)),z=z0+L*a;
    let y=sn>=0?Ht(a)*Math.pow(sn,0.7):-Pl(a)*Math.pow(-sn,0.55);
    if(sn>=0)y+=0.012*Math.pow(1-sn,6);                    /* marginal scutes flare up slightly */
    let col;
    if(sn<-0.05){                                           /* plastron with its scute seams */
      const seam=Math.abs(x)<0.006||Math.abs(Math.sin((z+0.4)*9.5))<0.06;
      col=seam?[0.62,0.56,0.36]:[0.9,0.84,0.6];
    }else{
      const rn=Math.abs(c);                                 /* 1 at the rim */
      let d1=9,d2=9,k=0;
      if(rn>0.86||a<0.06||a>0.95){                          /* marginal ring: cells by position around the rim */
        const ang=Math.atan2(x,z+0.02)*11/Math.PI;const fr=ang-Math.floor(ang);d1=Math.abs(fr-0.5);d2=0.5;k=Math.floor(ang)+40;
        d1=Math.min(d1,0.5);d2=Math.min(0.5,Math.abs(rn-0.86)*3+(fr<0.5?fr:1-fr));
      }else for(let q=0;q<TCX.length;q++){const d=Math.hypot(x-TCX[q][0],z-TCX[q][1]);if(d<d1){d2=d1;d1=d;k=q;}else if(d<d2)d2=d;}
      const cen=k<TCX.length&&rn<=0.86?TCX[k]:[x,z];
      const ra=Math.atan2(x-cen[0],z-cen[1]),rd=Math.hypot(x-cen[0],z-cen[1]);
      const streak=0.5+0.5*Math.sin(ra*5+hash3(k,1,2)*6+Math.sin(rd*25)*0.6);
      col=mixc([0.33,0.25,0.12],[0.52,0.39,0.17],sstep(0.45,0.9,streak)*sstep(0.0,0.07,rd)*0.85);
      col=mixc(col,[0.15,0.1,0.05],sstep(0.65,0.95,1-streak)*0.5);
      col=mixc(col,[0.7,0.62,0.42],sstep(0.03,0.006,d2-d1)*0.8);   /* pale seams between scutes */
    }
    return[x,y,z,...col];});
}
function scaleCol(x,y,z,k,dark,pale){const[d1,d2]=cell3(x*k,y*k,z*k);return mixc(dark,pale,sstep(0.12,0.0,d2-d1));}
function turtleHead(){
  return loftGeo(28,36,(a,b)=>{
    const phi=b*Math.PI*2,t=a;
    const r=0.075*Math.pow(Math.sin(Math.PI*Math.min(1,0.15+t*0.9)),0.6)+0.004;
    const z=0.40+0.22*t,x=r*Math.cos(phi)*1.05,y=r*Math.sin(phi)*(Math.sin(phi)>0?0.85:0.7)+0.02-0.02*t*t;
    const below=Math.sin(phi)<-0.2;
    const col=below?scaleCol(x,y,z,70,[0.78,0.72,0.5],[0.9,0.86,0.66]):scaleCol(x,y,z,48,[0.3,0.22,0.11],[0.8,0.72,0.48]);
    return[x,y,z,...col];});
}
function flipperGeo(len,root,tip,sweep,thk){
  return loftGeo(40,24,(a,b)=>{
    const s=a,phi=b*Math.PI*2,c=root*Math.pow(1-s,0.55)*(0.65+0.35*Math.sin(Math.PI*Math.min(1,s*1.5+0.3)))+tip;
    const cx=len*s,cz=-sweep*Math.pow(s,1.4),t=thk*(1-0.75*s);
    const x=cx,z=cz+0.5*c*Math.cos(phi)+0.15*c*(1-Math.cos(phi))*0,y=t*Math.sin(phi);
    const col=Math.sin(phi)<0?scaleCol(x,y,z,40,[0.78,0.72,0.5],[0.9,0.86,0.64]):scaleCol(x,y,z,34,[0.28,0.2,0.1],[0.78,0.7,0.46]);
    return[x,y,z,...col];});
}
function makeTurtle(){
  const g=new THREE.Group();
  const bodyAcc=Acc();addColored(bodyAcc,turtleShell());addColored(bodyAcc,turtleHead());
  for(const s of[1,-1])addGeo(bodyAcc,new THREE.SphereGeometry(0.011,10,8),M4(s*0.052,0.04,0.545),()=>[0.03,0.025,0.02]);   /* eyes */
  addGeo(bodyAcc,new THREE.SphereGeometry(1,16,10),M4(0,-0.02,-0.5,0,0,0,0.05,0.025,0.08),()=>[0.35,0.28,0.16]);              /* short tail */
  g.add(new THREE.Mesh(finishGeo(bodyAcc),turtleMat));
  const fAcc=Acc();addColored(fAcc,flipperGeo(0.56,0.17,0.012,0.16,0.022));const flipG=finishGeo(fAcc);
  const rAcc=Acc();addColored(rAcc,flipperGeo(0.2,0.13,0.02,0.05,0.018));const rearG=finishGeo(rAcc);
  const pivots=[];
  for(const s of [1,-1]){
    const pv=new THREE.Object3D();pv.position.set(s*0.3,-0.01,0.24);const f=new THREE.Mesh(flipG,turtleMat);f.scale.x=s;pv.add(f);g.add(pv);pivots.push(pv);
    const pr=new THREE.Object3D();pr.position.set(s*0.2,-0.02,-0.36);pr.rotation.y=s*-0.6;const r=new THREE.Mesh(rearG,turtleMat);r.scale.x=s;pr.add(r);g.add(pr);pivots.push(pr);
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
    const ph=t*2*Math.PI/3.2+o.ph,pv=g.userData.pv;
    g.position.set(x,y+0.03*Math.sin(ph),z);const hx=-Math.sin(o.th)*Math.sign(o.w),hz=Math.cos(o.th)*Math.sign(o.w);
    g.rotation.set(0.05*Math.sin(t*0.4+o.ph)-0.03*Math.cos(ph),Math.atan2(hx,hz),-0.1*Math.sign(o.w));
    /* front flippers: a flying stroke (down-sweep with the blade feathered, then up-sweep); rear flippers trail as rudders */
    for(let k=0;k<4;k++){const s=k<2?1:-1,front=k%2===0;
      if(front){pv[k].rotation.set(0.45*Math.cos(ph),s*(0.3+0.3*Math.cos(ph)),s*-0.65*Math.sin(ph));}
      else pv[k].rotation.set(0.15*Math.sin(ph*0.5),s*(-0.6+0.2*Math.sin(ph*0.5)),0);}
  });
}

/* deep-sea anglerfish (Melanocetus) with glowing esca */
/* Melanocetus: a near-spherical velvety black body, a huge upturned mouth lined with long glassy fangs, tiny eyes,
   small fins; the female's lure (illicium) arches from the head with the glowing esca at its tip */
const anglerGeo=(()=>{const acc=Acc(),blk=(x,y,z)=>mixc([0.1,0.08,0.08],[0.04,0.035,0.035],sstep(-0.3,0.4,y));
  const b=new THREE.SphereGeometry(1,24,16);const P=b.attributes.position;
  for(let i=0;i<P.count;i++){let x=P.getX(i)*0.42,y=P.getY(i)*0.5,z=P.getZ(i)*0.5;if(z<-0.1){const t=(-z-0.1)/0.4;x*=1-0.6*t;y*=1-0.45*t;}P.setXYZ(i,x,y,z);}
  b.computeVertexNormals();addGeo(acc,b,null,blk);
  addGeo(acc,new THREE.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI/2),M4(0,0.0,0.38,-1.2,0,0,0.3,0.22,0.24),()=>[0.02,0.015,0.02]);          /* open mouth */
  addGeo(acc,new THREE.SphereGeometry(1,16,8),M4(0,-0.12,0.42,0.5,0,0,0.3,0.1,0.16),blk);                                                     /* jutting lower jaw */
  const fang=new THREE.ConeGeometry(0.018,0.16,5);
  for(let k=0;k<9;k++){const a=(k/8-0.5)*2.4;addGeo(acc,fang,M4(Math.sin(a)*0.25,-0.05,0.42+Math.cos(a)*0.12,0,0,0),()=>[0.85,0.85,0.82]);         /* lower fangs pointing up */
    if(k%2)addGeo(acc,fang,M4(Math.sin(a)*0.22,0.14,0.38+Math.cos(a)*0.1,Math.PI,0,0),()=>[0.8,0.8,0.78]);}                                        /* upper fangs pointing down */
  for(const sg of[1,-1]){addGeo(acc,new THREE.SphereGeometry(0.025,8,6),M4(sg*0.2,0.24,0.33),()=>[0.25,0.25,0.3]);
    addGeo(acc,triGeo([sg*0.36,-0.05,0.0, sg*0.5,-0.1,-0.1, sg*0.4,-0.18,0.05]),null,()=>[0.08,0.07,0.07]);}
  addGeo(acc,triGeo([0,0,-0.45, 0,0.2,-0.68, 0,0,-0.6, 0,0,-0.45, 0,0,-0.6, 0,-0.2,-0.68]),null,()=>[0.07,0.06,0.06]);
  addGeo(acc,triGeo([0,0.42,-0.15, 0,0.55,-0.3, 0,0.35,-0.36]),null,()=>[0.07,0.06,0.06]);
  return finishGeo(acc);})();
const anglerMat=waterify(lambert({side:THREE.DoubleSide}),'angler');
const anglers=[0,1,2].map(i=>{const g=new THREE.Group();g.add(new THREE.Mesh(anglerGeo,anglerMat));
  const st=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.01,0.35,4),anglerMat);st.position.set(0,0.62,0.32);st.rotation.x=0.9;g.add(st);
  g.scale.setScalar(R(0.16,0.22));g.visible=false;g.userData={a:rnd()*6.28,r:R(1.5,4),h:R(0.6,2),ph:rnd()*6};scene.add(g);return g;});
let anglerOn=false;
const lureLocal=new THREE.Vector3(0,0.75,0.45);

