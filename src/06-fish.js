/* =========================================================
   10. Fish (one InstancedMesh per species, Boids schooling)
   ========================================================= */
function buildFishGeo(p){
  const acc=Acc();
  const b=new THREE.SphereGeometry(1,22,14);b.rotateX(Math.PI/2);const P=b.attributes.position;
  for(let i=0;i<P.count;i++){let x=P.getX(i)*p.w,y=P.getY(i)*p.h,z=P.getZ(i)*0.5;
    if(z<-0.1){const t=Math.min(1,(-z-0.1)/0.36);x*=1-0.82*t;y*=1-0.62*t;}
    if(z>0.25){const t=(z-0.25)/0.25;y*=1-0.35*t*t;x*=1-0.2*t*t;}
    P.setXYZ(i,x,y,z);}
  b.computeVertexNormals();
  const ex=p.glow?{aGlow:(x,y,z)=>p.glow(x,y,z)}:null,ex0=p.glow?{aGlow:()=>0}:null;
  addGeo(acc,b,null,(x,y,z)=>p.col(x,y,z,0),ex);
  const tri=(pts)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
    g.setAttribute('normal',new THREE.Float32BufferAttribute(pts.map((_,k)=>k%3===0?1:0),3));addGeo(acc,g,null,(x,y,z)=>p.col(x,y,z,1),ex0);};
  const th=p.tailH,h=p.h;
  tri([0,0,-0.4, 0,th,-0.63, 0,0,-0.54, 0,0,-0.4, 0,0,-0.54, 0,-th,-0.63]);
  tri([0,h*0.9,0.16, 0,h*0.9+p.dorsal,-0.02, 0,h*0.72,-0.3]);
  tri([0,-h*0.85,-0.02, 0,-h*0.85-p.anal,-0.17, 0,-h*0.62,-0.31]);
  tri([p.w*0.9,-h*0.15,0.2, p.w*0.9+0.07,-h*0.4,0.06, p.w*0.85,-h*0.35,0.14]);
  tri([-p.w*0.9,-h*0.15,0.2, -p.w*0.9-0.07,-h*0.4,0.06, -p.w*0.85,-h*0.35,0.14]);
  const eye=new THREE.SphereGeometry(p.eye||Math.min(0.035,h*0.22),8,6);
  addGeo(acc,eye,M4(p.w*0.72,h*0.22,0.34),()=>[0.03,0.03,0.04],ex0);addGeo(acc,eye,M4(-p.w*0.72,h*0.22,0.34),()=>[0.03,0.03,0.04],ex0);
  if(p.extra)p.extra(acc,ex0);
  return finishGeo(acc);
}
const cs=(belly,back,yh)=>(x,y,z,f)=>mixc(belly,back,sstep(-0.25,0.55,y/yh));
const FISH={
  sardine:{name:'太平洋沙丁鱼',n:220,len:[0.17,0.22],spd:[0.7,1.3],h:0.11,w:0.065,tailH:0.11,dorsal:0.05,anal:0.02,
    col:(x,y,z,f)=>f?[0.5,0.58,0.64]:mixc([0.9,0.92,0.95],[0.1,0.28,0.42],sstep(-0.01,0.07,y)),sheen:1.2,
    nb:1.0,sep:0.22,ali:1.4,coh:0.6,sepW:0.05,mill:1.1,rheo:0},
  chromis:{name:'蓝绿光鳃鱼',n:70,len:[0.06,0.09],spd:[0.2,0.55],h:0.2,w:0.07,tailH:0.14,dorsal:0.07,anal:0.06,
    col:(x,y,z,f)=>f?[0.45,0.85,0.9]:mixc([0.55,0.95,0.85],[0.2,0.65,0.9],sstep(-0.1,0.18,y)),sheen:0.5,
    nb:0.7,sep:0.12,ali:0.7,coh:0.7,sepW:0.02,mill:0,rheo:1},
  anthias:{name:'丝鳍拟花鲈',n:140,len:[0.07,0.11],spd:[0.2,0.6],h:0.17,w:0.06,tailH:0.15,dorsal:0.06,anal:0.05,
    col:cs([1,0.92,0.85],[0.95,0.8,0.75],0.17),tint:[[1,0.5,0.25],[1,0.55,0.3],[0.85,0.3,0.75]],sheen:0.2,
    nb:0.9,sep:0.15,ali:0.5,coh:0.45,sepW:0.025,mill:0,rheo:1},
  butterfly:{name:'月斑蝴蝶鱼',n:14,len:[0.13,0.18],spd:[0.15,0.35],h:0.38,w:0.06,tailH:0.14,dorsal:0.12,anal:0.1,
    col:(x,y,z,f)=>{if(f)return[1,0.72,0.15];if(z>0.24&&z<0.33&&y>-0.15)return[0.04,0.04,0.05];if(z>0.17&&z<=0.24)return[0.97,0.97,0.94];
      if(z<-0.22&&z>-0.34&&y>0.0)return[0.05,0.05,0.06];return mixc([1,0.85,0.25],[0.95,0.7,0.15],sstep(-0.2,0.3,y));},
    nb:1.6,sep:0.25,ali:0.3,coh:0.15,sepW:0.02,mill:0,rheo:0},
  clown:{name:'眼斑双锯鱼（小丑鱼）',n:10,len:[0.07,0.1],spd:[0.08,0.3],h:0.3,w:0.12,tailH:0.13,dorsal:0.07,anal:0.06,
    col:(x,y,z,f)=>{const bands=[0.24,0.0,-0.3],wd=[0.04,0.05,0.03];
      for(let k=0;k<3;k++){const d=Math.abs(z-bands[k]);if(d<wd[k])return[0.98,0.98,0.96];if(d<wd[k]+0.015)return[0.04,0.04,0.04];}
      return f?[1,0.45,0.08]:[1,0.42,0.06];},
    nb:0.5,sep:0.08,ali:0.1,coh:0.1,sepW:0.01,mill:0,rheo:0,wander:1.2},
  snapper:{name:'四线笛鲷',n:45,len:[0.2,0.28],spd:[0.25,0.55],h:0.24,w:0.09,tailH:0.13,dorsal:0.07,anal:0.05,
    col:(x,y,z,f)=>{if(f)return[1,0.85,0.2];const yn=y/0.24;for(const b of[0.42,0.18,-0.06,-0.3]){if(Math.abs(yn-b+z*0.15)<0.045)return[0.25,0.6,1.0];}
      return yn<-0.45?[0.98,0.95,0.85]:[1,0.82,0.12];},sheen:0.3,
    nb:1.2,sep:0.3,ali:0.6,coh:0.5,sepW:0.04,mill:0,rheo:1},
  parrot:{name:'蓝点鹦嘴鱼',n:7,len:[0.4,0.6],spd:[0.2,0.45],h:0.3,w:0.13,tailH:0.15,dorsal:0.05,anal:0.04,
    col:(x,y,z,f)=>{if(f)return[0.95,0.45,0.6];if(z>0.38)return[0.2,0.75,0.85];const sc=Math.sin(z*40)*Math.sin(y*45)>0.45;
      return sc?[0.95,0.5,0.6]:mixc([0.35,0.85,0.75],[0.15,0.55,0.75],sstep(-0.2,0.3,y/0.3));},
    nb:2.5,sep:0.6,ali:0.2,coh:0.05,sepW:0.05,mill:0,rheo:0,wander:0.4},
  rockfish:{name:'蓝平鲉',n:26,len:[0.25,0.38],spd:[0.2,0.5],h:0.26,w:0.11,tailH:0.13,dorsal:0.09,anal:0.06,
    col:(x,y,z,f)=>{const mt=0.5+0.5*Math.sin(z*30+y*14)*Math.sin(z*11-y*20);return f?[0.25,0.3,0.4]:mixc(mixc([0.55,0.6,0.68],[0.2,0.25,0.36],sstep(-0.2,0.3,y/0.26)),[0.15,0.18,0.26],mt*0.4);},
    nb:1.5,sep:0.45,ali:0.4,coh:0.15,sepW:0.05,mill:0,rheo:1},
  hammer:{name:'路氏双髻鲨',eye:0.004,n:16,len:[2.4,3.2],spd:[0.6,1.1],h:0.1,w:0.1,tailH:0.2,dorsal:0.17,anal:0.04,
    col:(x,y,z,f)=>f?[0.4,0.43,0.46]:mixc([0.92,0.92,0.9],[0.42,0.45,0.48],sstep(-0.04,0.03,y)),
    extra:(acc,ex0)=>{addGeo(acc,new THREE.SphereGeometry(1,18,8),M4(0,0.006,0.46,0,0,0,0.17,0.016,0.045),(x,y)=>y<0?[0.85,0.85,0.84]:[0.42,0.45,0.48],ex0);
      for(const sg of[1,-1]){addGeo(acc,new THREE.SphereGeometry(0.011,6,4),M4(sg*0.168,0.006,0.462),()=>[0.02,0.02,0.02],ex0);
        addGeo(acc,triGeo([sg*0.08,-0.05,0.18, sg*0.24,-0.09,0.02, sg*0.08,-0.05,0.06]),null,()=>[0.42,0.45,0.48],ex0);}},
    nb:7,sep:2.2,ali:0.6,coh:0.2,sepW:0.6,mill:0.35,rheo:0},
  hatchet:{name:'银斧鱼',n:60,len:[0.04,0.07],spd:[0.1,0.3],h:0.42,w:0.035,tailH:0.1,dorsal:0.05,anal:0.05,
    col:(x,y,z,f)=>f?[0.6,0.65,0.7]:mixc([0.92,0.94,0.97],[0.25,0.28,0.35],sstep(0.1,0.3,y/0.42)),sheen:1.0,
    glow:(x,y,z)=>(y<-0.42*0.62&&(((z+0.5)*16)%1)<0.45&&z<0.3&&z>-0.3)?1:0,
    nb:0.8,sep:0.15,ali:0.5,coh:0.3,sepW:0.02,mill:0,rheo:0},
  snail:{name:'马里亚纳狮子鱼',n:14,len:[0.2,0.28],spd:[0.04,0.16],h:0.22,w:0.13,tailH:0.05,dorsal:0.03,anal:0.03,
    col:(x,y,z,f)=>f?[0.95,0.85,0.85]:mixc([0.98,0.78,0.8],[0.93,0.86,0.86],sstep(-0.1,0.2,y/0.22)),
    nb:1.5,sep:0.4,ali:0.1,coh:0.05,sepW:0.03,mill:0,rheo:0,wander:0.15},
  baitfish:{name:'小型饵鱼',n:200,len:[0.06,0.09],spd:[0.5,1.0],h:0.16,w:0.05,tailH:0.1,dorsal:0.03,anal:0.02,
    col:(x,y,z,f)=>f?[0.75,0.8,0.85]:mixc([0.95,0.96,0.98],[0.45,0.6,0.7],sstep(0.0,0.1,y)),sheen:1.4,
    nb:0.6,sep:0.1,ali:1.5,coh:0.7,sepW:0.02,mill:0.9,rheo:0},
  jack:{name:'鲹',n:9,len:[0.6,0.9],spd:[0.6,1.2],h:0.3,w:0.1,tailH:0.2,dorsal:0.08,anal:0.06,
    col:(x,y,z,f)=>f?[0.4,0.5,0.6]:mixc([0.9,0.92,0.94],[0.35,0.45,0.55],sstep(-0.02,0.12,y/0.3)),sheen:1.0,
    nb:3,sep:1.0,ali:0.7,coh:0.3,sepW:0.2,mill:0.4,rheo:0},
  lionfish:{name:'魔鬼蓑鲉',n:4,len:[0.25,0.32],spd:[0.02,0.08],h:0.3,w:0.1,tailH:0.13,dorsal:0.25,anal:0.12,
    col:(x,y,z,f)=>{const st=Math.sin(z*48+y*9)>0.1;return f?(st?[0.85,0.25,0.18]:[0.97,0.92,0.88]):(st?[0.75,0.22,0.15]:[0.97,0.9,0.85]);},
    extra:(acc,ex0)=>{for(const sg of[1,-1])for(let k=0;k<6;k++)addGeo(acc,new THREE.CylinderGeometry(0.004,0.002,0.32,3),M4(sg*(0.08+k*0.01),-0.02,0.18-k*0.05,0.6,0,sg*(1.0+k*0.08)),()=>k%2?[0.95,0.9,0.85]:[0.8,0.25,0.18],ex0);},
    nb:1.5,sep:0.5,ali:0.05,coh:0.02,sepW:0.03,mill:0,rheo:0,wander:0.08},
  redfish:{name:'挪威平鲉',eye:0.05,n:22,len:[0.35,0.5],spd:[0.05,0.2],h:0.27,w:0.12,tailH:0.13,dorsal:0.11,anal:0.06,
    col:(x,y,z,f)=>f?[0.95,0.3,0.15]:mixc([0.98,0.55,0.35],[0.9,0.22,0.12],sstep(-0.2,0.3,y/0.27)),sheen:0.2,
    nb:2,sep:0.7,ali:0.08,coh:0.04,sepW:0.05,mill:0,rheo:1,wander:0.12},
  lantern:{name:'灯笼鱼',n:70,len:[0.06,0.1],spd:[0.15,0.4],h:0.18,w:0.08,tailH:0.12,dorsal:0.05,anal:0.04,
    col:(x,y,z,f)=>f?[0.15,0.15,0.18]:mixc([0.45,0.47,0.5],[0.08,0.08,0.1],sstep(-0.2,0.3,y/0.18)),
    glow:(x,y,z)=>{if(y<-0.18*0.45&&Math.abs(x)>0.02&&(((z+0.5)*13)%1)<0.38&&z<0.3&&z>-0.38)return 1;if(z>0.38&&y<0&&Math.abs(x)>0.04)return 0.8;return 0;},
    nb:1.2,sep:0.2,ali:0.4,coh:0.25,sepW:0.02,mill:0,rheo:0}
};
const fishMats={};
for(const key in FISH){
  const sp=FISH[key];const geo=buildFishGeo(sp);
  const ph=new Float32Array(sp.n);geo.setAttribute('aPhase',new THREE.InstancedBufferAttribute(ph,1));
  const mat=waterify(lambert({side:THREE.DoubleSide}),'fish_'+key,{
    vHead:'attribute float aPhase;'+(sp.glow?'attribute float aGlow; varying float vGlow;':''),
    vBegin:'float bt=clamp(0.15-position.z,0.0,1.0); transformed.x+=sin(aPhase-position.z*4.0)*0.22*bt*bt;'+(sp.glow?'vGlow=aGlow;':''),
    fHead:sp.glow?'varying float vGlow;':'',
    lit:sp.sheen?`gl_FragColor.rgb+=${sp.sheen.toFixed(2)}*pow(max(dot(reflect(vdir,nrmW),uSunDir),0.0),5.0)*uDay*diffuseColor.rgb;`:'',
    emit:sp.glow?'emit+=vec3(0.15,0.55,1.0)*vGlow*(1.6+0.8*sin(uTime*2.3+vWPos.x*7.0+vWPos.z*5.0));':''
  });
  const mesh=new THREE.InstancedMesh(geo,mat,sp.n);mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const c=new THREE.Color();
  for(let i=0;i<sp.n;i++){const t=sp.tint?sp.tint[i%sp.tint.length]:[1,1,1],k=R(0.88,1.08);mesh.setColorAt(i,c.setRGB(t[0]*k,t[1]*k,t[2]*k));}
  mesh.count=0;scene.add(mesh);
  sp.mesh=mesh;sp.ph=ph;sp.p=new Float32Array(sp.n*3);sp.v=new Float32Array(sp.n*3);sp.L=new Float32Array(sp.n);sp.active=false;sp.box=null;sp.homes=null;
  for(let i=0;i<sp.n;i++){sp.L[i]=R(sp.len[0],sp.len[1]);ph[i]=rnd()*6.28;}
}
function setSchool(sp,on,box,homes){
  const was=sp.active;sp.active=on;sp.mesh.count=on?sp.n:0;sp.box=box;sp.homes=homes||null;
  if(on&&(!was||sp.forceRespawn)){
    for(let i=0;i<sp.n;i++){const o=i*3;
      if(homes){const h=homes[i%homes.length];sp.p[o]=h.x+R(-0.2,0.2);sp.p[o+1]=h.y+R(0,0.2);sp.p[o+2]=h.z+R(-0.2,0.2);}
      else{sp.p[o]=box.cx+R(-1,1)*box.rx;sp.p[o+1]=box.cy+R(-1,1)*box.ry;sp.p[o+2]=box.cz+R(-1,1)*box.rz;}
      const a=rnd()*6.28;sp.v[o]=Math.cos(a)*sp.spd[0];sp.v[o+1]=0;sp.v[o+2]=Math.sin(a)*sp.spd[0];}
  }
  sp.forceRespawn=false;
}
function stepSchool(sp,dt,t){
  if(!sp.active)return;
  if(DIVE.on&&!sp.homes&&sp.box)relocateBox(sp.box,sp.p,sp.n,sp.zr);
  const n=sp.n,p=sp.p,v=sp.v,B=sp.box,nb2=sp.nb*sp.nb,sep2=sp.sep*sp.sep,fy=-S.D;
  const vmin=sp.spd[0],vmax=sp.spd[1];
  for(let i=0;i<n;i++){
    const ix=i*3;let ax=0,ay=0,az=0,cx=0,cy=0,cz=0,sx=0,sy=0,sz=0,cnt=0;
    if(sp.ali>0||sp.coh>0)for(let j=0;j<n;j++){if(j===i)continue;const jx=j*3;
      const dx=p[jx]-p[ix],dy=p[jx+1]-p[ix+1],dz=p[jx+2]-p[ix+2],d2=dx*dx+dy*dy+dz*dz;
      if(d2<nb2){cnt++;ax+=v[jx];ay+=v[jx+1];az+=v[jx+2];cx+=dx;cy+=dy;cz+=dz;if(d2<sep2){const k=1/(d2+0.004);sx-=dx*k;sy-=dy*k;sz-=dz*k;}}}
    let gx=0,gy=0,gz=0;
    if(cnt){gx+=(ax/cnt-v[ix])*sp.ali+cx/cnt*sp.coh;gy+=(ay/cnt-v[ix+1])*sp.ali+cy/cnt*sp.coh;gz+=(az/cnt-v[ix+2])*sp.ali+cz/cnt*sp.coh;}
    gx+=sx*sp.sepW;gy+=sy*sp.sepW;gz+=sz*sp.sepW;
    if(sp.homes){const h=sp.homes[i%sp.homes.length];const dx=h.x-p[ix],dy=h.y-p[ix+1],dz=h.z-p[ix+2],d=Math.hypot(dx,dy,dz);
      const k=d>0.25?3.5*(d-0.25)/Math.max(d,1e-3)+0.6:0.6;gx+=dx*k;gy+=dy*k;gz+=dz*k;}
    else{const ex=(p[ix]-B.cx)/B.rx,ey=(p[ix+1]-B.cy)/B.ry,ez=(p[ix+2]-B.cz)/B.rz;
      if(Math.abs(ex)>1)gx-=Math.sign(ex)*(Math.abs(ex)-1)*2.5;if(Math.abs(ey)>1)gy-=Math.sign(ey)*(Math.abs(ey)-1)*2.5;if(Math.abs(ez)>1)gz-=Math.sign(ez)*(Math.abs(ez)-1)*2.5;
      if(sp.mill){const dx=p[ix]-B.cx,dz=p[ix+2]-B.cz,d=Math.hypot(dx,dz)||1;gx+=(-dz/d)*sp.mill-dx*0.25;gz+=(dx/d)*sp.mill-dz*0.25;}}
    if(sp.wander){gx+=Math.sin(t*1.7+i*3.1)*sp.wander;gz+=Math.cos(t*1.3+i*5.7)*sp.wander;gy+=Math.sin(t*2.1+i)*0.3*sp.wander;}
    if(p[ix+1]<floorY(p[ix],p[ix+2])+0.35)gy+=3;if(p[ix+1]>-0.6)gy-=3;
    if(sp.rheo&&S.cur>0.05){const k=Math.min(1,S.cur/0.3)*0.5;gx+=(-CUR.x*vmin-v[ix])*k;gz+=(-CUR.z*vmin-v[ix+2])*k;}
    v[ix]+=gx*dt;v[ix+1]+=gy*dt;v[ix+2]+=gz*dt;v[ix+1]*=0.96;
    let s=Math.hypot(v[ix],v[ix+1],v[ix+2])||1e-4;const cl=Math.min(vmax,Math.max(vmin,s));v[ix]*=cl/s;v[ix+1]*=cl/s;v[ix+2]*=cl/s;s=cl;
    orbital(p[ix],p[ix+1],t,_u);
    p[ix]+=(v[ix]+_u.x*0.7)*dt;p[ix+1]+=(v[ix+1]+_u.y*0.7)*dt;p[ix+2]+=(v[ix+2]+_u.z*0.7)*dt;
    sp.ph[i]+=2*Math.PI*Math.min(12,s/(0.7*sp.L[i]))*dt;
    _d.set(v[ix],Math.max(-0.6,Math.min(0.6,v[ix+1]/s))*s,v[ix+2]).normalize();
    _m.lookAt(_d,ORIGIN,UP);_q.setFromRotationMatrix(_m);_p.set(p[ix],p[ix+1],p[ix+2]);_s.setScalar(sp.L[i]);
    _m.compose(_p,_q,_s);sp.mesh.setMatrixAt(i,_m);
  }
  sp.mesh.instanceMatrix.needsUpdate=true;sp.mesh.geometry.attributes.aPhase.needsUpdate=true;
}

