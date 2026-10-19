/* =========================================================
   14f. Walls: Guam's reef drop-off near the surface, the trench's inner wall in the hadal zone.
   The cliff mesh follows the viewer; its distance from the descent line changes with depth
   (leaving the reef wall for open ocean, meeting the trench wall below 6,000 m, then the flat trench floor).
   ========================================================= */
function hash2(i,j){let h=Math.imul(i,374761393)+Math.imul(j,668265263);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967295;}
function vnoise(x,y){const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  const a=hash2(i,j),b=hash2(i+1,j),c=hash2(i,j+1),d=hash2(i+1,j+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y){return vnoise(x,y)*0.55+vnoise(x*2.1+5.3,y*2.1+1.7)*0.28+vnoise(x*4.3+9.1,y*4.3+3.3)*0.17;}
function wallDist(z){
  if(DIVE.replay||DIVE.dvm)return 1e4;
  if(DIVE.bh)return 3.0;
  if(z<220)return 2.5;if(z<700)return 2.5+(z-220)*0.6;if(z<5800)return 1e4;
  if(z<6400)return 300-(z-5800)*0.495;if(z<10200)return 3;if(z<10700)return 3+(z-10200)*0.59;return 1e4;
}
function wallBump(wy,lz){const z=-wy;const f=fbm(wy*0.05,lz*0.05),g=fbm(wy*0.21+7,lz*0.21);
  const ledge=Math.pow(Math.max(0,Math.sin(wy*0.33+f*4)),6)*2.4;return 5.2*f+1.8*g+ledge-5.5+(z>5000?1.2*fbm(wy*0.02,lz*0.02):0);}
const wallGeo=new THREE.PlaneGeometry(170,150,85,75);wallGeo.rotateY(Math.PI/2);
wallGeo.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(wallGeo.attributes.position.count*3),3));
const WALLU={uWallY:{value:0}};
const wallMat=waterify(lambert({side:THREE.DoubleSide}),'wall',{defines:{CAUSTICS:''},uniforms:WALLU,
  fHead:`uniform float uWallY;
    float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
      return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}`,
  fColor:`{ vec3 q=vec3(vLocal.x,vLocal.y+uWallY,vLocal.z);
    float r=n3(q*0.9)*0.45+n3(q*2.7)*0.33+n3(q*8.0)*0.22;
    float crev=smoothstep(0.32,0.18,n3(q*vec3(0.6,1.8,0.6)));
    diffuseColor.rgb*=(0.4+1.15*r)*(1.0-0.55*crev); }`});
const wall=new THREE.Mesh(wallGeo,wallMat);wall.visible=false;wall.frustumCulled=false;scene.add(wall);
const WALL={cy:1e9,n:new THREE.Vector3(1,0,0)};
function wallColor(z,f,g,ny){
  const sh=0.35+0.65*sstep(-0.7,0.7,ny)*(0.7+0.3*f);
  let c;
  if(DIVE.bh&&z>=25){
    if(z<70)c=mixc([0.5,0.47,0.4],[0.95,0.6,0.25],sstep(0.66,0.74,g)*0.8);
    else if(z<100)c=mixc([0.36,0.34,0.31],[0.85,0.85,0.8],sstep(0.6,0.72,g)*0.6*sstep(75,95,z));
    else if(z<165)c=mixc([0.2,0.19,0.17],[0.9,0.88,0.72],sstep(0.55,0.7,g)*0.75);
    else c=mixc([0.13,0.12,0.11],[0.24,0.2,0.16],f);
  }
  else if(z<45){const pal=[[0.8,0.42,0.52],[0.5,0.32,0.66],[0.7,0.58,0.3],[0.32,0.55,0.4],[0.86,0.5,0.3]];
    const k=Math.floor(g*5)%5,cover=sstep(0.42,0.58,f);c=mixc([0.3,0.24,0.22],pal[k],cover*0.85);}
  else if(z<160){const sp=sstep(0.6,0.7,g);c=mixc([0.22,0.19,0.18],[[0.95,0.6,0.2],[0.6,0.3,0.7],[0.9,0.8,0.3]][Math.floor(f*3)%3],sp*0.85);}
  else if(z<1000)c=mixc([0.16,0.15,0.15],[0.7,0.68,0.6],sstep(0.7,0.78,g)*0.6);
  else c=mixc([0.17,0.16,0.15],[0.55,0.52,0.45],sstep(0.25,0.7,ny)*0.9);
  const k=sh*(z<1000?2.1:2.4)*(DIVE.bh&&z>=25?1.35:1);return[Math.min(1,c[0]*k),Math.min(1,c[1]*k),Math.min(1,c[2]*k)];
}
/* life on the reef wall: soft corals in the shallows, sea fans and sea whips below ~20 m, tube sponges deeper */
const wSoft=new THREE.InstancedMesh(CORAL.soft.geo,coralMat,40);
const wFan=new THREE.InstancedMesh(fanGeo(1.0),waterify(lambert({side:THREE.DoubleSide}),'wallfan'),30);
const tubeSpGeo=(()=>{const acc=Acc();for(let k=0;k<3;k++){const c=new THREE.CylinderGeometry(0.06,0.045,1,10,1,true);c.translate(0,0.5,0);
  addGeo(acc,c,M4(Math.cos(k*2.1)*0.07,0,Math.sin(k*2.1)*0.07,Math.cos(k*2.1)*0.15,0,Math.sin(k*2.1)*0.15,1,0.6+k*0.2,1),(x,y)=>mixc([1,1,1],[0.8,0.8,0.8],y));}return finishGeo(acc);})();
const wSponge=new THREE.InstancedMesh(tubeSpGeo,urchinMat,30);
[wSoft,wFan,wSponge].forEach(m=>{m.frustumCulled=false;m.count=0;wall.add(m);});
function colorAll(mesh,pal){const c=new THREE.Color();for(let i=0;i<mesh.instanceMatrix.count;i++){const p=pal[i%pal.length],k=R(0.85,1.1);mesh.setColorAt(i,c.setRGB(p[0]*k,p[1]*k,p[2]*k));}mesh.instanceColor.needsUpdate=true;}
colorAll(wSoft,[[0.95,0.4,0.62],[0.75,0.35,0.85],[1,0.55,0.35],[0.95,0.3,0.3]]);
colorAll(wFan,[[0.85,0.18,0.15],[0.95,0.55,0.15],[0.95,0.8,0.25],[0.6,0.25,0.7]]);
colorAll(wSponge,[[0.95,0.75,0.2],[0.95,0.5,0.15],[0.55,0.3,0.75],[0.3,0.5,0.9]]);
const _wq=new THREE.Quaternion(),_wv=new THREE.Vector3();
function placeWallLife(){
  const cy=WALL.cy;
  const put=(mesh,n,band,sc,orient)=>{let k=0;
    for(let tries=0;tries<n*6&&k<n;tries++){const ly=R(-40,40),lz=R(-35,35),wy=cy+ly,z=-wy;if(z<band[0]||z>band[1])continue;
      const x=wallBump(wy,lz)+0.25;orient(_wq);_s.setScalar(R(sc[0],sc[1]));_p.set(x,ly,lz);_m.compose(_p,_wq,_s);mesh.setMatrixAt(k++,_m);}
    mesh.count=k;mesh.instanceMatrix.needsUpdate=true;};
  const bh=!!DIVE.bh;
  put(wSoft,40,bh?[4,30]:[4,60],[0.6,1.3],q=>q.setFromUnitVectors(UP,_wv.set(1,R(0.3,0.9),R(-0.3,0.3)).normalize()));
  put(wFan,30,bh?[15,60]:[18,200],[0.8,1.8],q=>q.setFromEuler(_e.set(R(-0.15,0.15),0,-R(0.7,1.2))));
  put(wSponge,30,bh?[10,70]:[12,260],[0.4,0.9],q=>q.setFromUnitVectors(UP,_wv.set(1,R(0.5,1.2),R(-0.3,0.3)).normalize()));
}
function recenterWall(){
  const cy=Math.round(camera.position.y/10)*10;WALL.cy=cy;wall.position.y=cy;WALLU.uWallY.value=((cy%1000)+1000)%1000;
  const p=wallGeo.attributes.position,c=wallGeo.attributes.color;
  for(let i=0;i<p.count;i++){const ly=p.getY(i),lz=p.getZ(i);p.setX(i,wallBump(cy+ly,lz));}
  wallGeo.computeVertexNormals();const n=wallGeo.attributes.normal;
  for(let i=0;i<p.count;i++){const wy=cy+p.getY(i),lz=p.getZ(i),col=wallColor(-wy,fbm(wy*0.09+3,lz*0.09),fbm(wy*0.3,lz*0.3+11),n.getY(i));c.setXYZ(i,col[0],col[1],col[2]);}
  p.needsUpdate=true;c.needsUpdate=true;placeWallLife();
}
function stepWall(){
  const z=camZ(),d=DIVE.on?wallDist(z):1e4,show=d<160;wall.visible=show;if(!show)return;
  const n=WALL.n,tg=controls.target;wall.position.x=tg.x-n.x*d;wall.position.z=tg.z-n.z*d;wall.rotation.y=-Math.atan2(n.z,n.x);
  if(Math.abs(camera.position.y-WALL.cy)>20)recenterWall();
  const sd=(camera.position.x-wall.position.x)*n.x+(camera.position.z-wall.position.z)*n.z;
  if(sd<3){camera.position.x+=n.x*(3-sd);camera.position.z+=n.z*(3-sd);}
}

/* =========================================================
   14g. Depth profile: the whole water column to scale, with Everest set inside the trench
   ========================================================= */
const PROF={top:14,h:372};
function buildProfile(){
  const D=S.D,y=z=>PROF.top+z/D*PROF.h,svg=$('prof');
  const ev=8849,base=y(D),peak=y(D-ev);
  const marks=[[332,$t('潜水纪录')],[1000,$t('阳光消失')],[3750,$t('平均深度 · 泰坦尼克')],[6000,$t('海沟')],[8200,$t('鱼类极限')]];
  let h='<defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a8fb0"/><stop offset="0.12" stop-color="#0d3c52"/><stop offset="0.35" stop-color="#06161f"/><stop offset="1" stop-color="#020608"/></linearGradient></defs>';
  h+='<rect x="18" y="'+PROF.top+'" width="12" height="'+PROF.h+'" rx="2" fill="url(#pg)" stroke="rgba(120,190,205,.3)"/>';
  h+='<polygon points="10,'+base+' 19,'+(peak+40)+' 22,'+(peak+18)+' 24,'+peak+' 27,'+(peak+22)+' 31,'+(peak+46)+' 38,'+base+'" fill="rgba(210,200,185,.28)" stroke="rgba(230,220,200,.65)" stroke-width="0.7"/>';
  h+='<text x="34" y="'+(peak+3)+$t('" class="pl">珠峰 8,849 m</text>');
  for(let k=0;k<=D;k+=2000)h+='<line x1="14" x2="18" y1="'+y(k)+'" y2="'+y(k)+'" stroke="rgba(120,190,205,.5)"/><text x="12" y="'+(y(k)+3)+'" class="pt" text-anchor="end">'+(k/1000)+'</text>';
  marks.forEach(([z,t])=>{if(z<D)h+='<line x1="30" x2="33" y1="'+y(z)+'" y2="'+y(z)+'" stroke="rgba(217,236,239,.55)"/><text x="35" y="'+(y(z)+3)+'" class="pl">'+t+'</text>';});
  h+='<text x="12" y="'+(PROF.top-4)+'" class="pt" text-anchor="end">km</text>';
  h+='<g id="profMe"><line x1="10" x2="34" y1="0" y2="0" stroke="#62d4e3" stroke-width="1.4"/><circle cx="24" cy="0" r="3.2" fill="#62d4e3"/></g>';
  svg.innerHTML=h;
}
function updProfile(){if(!DIVE.on)return;const g=$('profMe');if(g)g.setAttribute('transform','translate(0,'+(PROF.top+DIVE.z/S.D*PROF.h)+')');}

/* =========================================================
   14h. Replay: James Cameron, Deepsea Challenger, 26 March 2012
   Sources: NBC News / CS Monitor / National Geographic / Spokesman-Review reports of the dive.
   ========================================================= */
const RP={depth:10898,bottom:11100,ascentV:10898/4200,start:5*3600+15*60};
function clockStr(sec){const t=Math.round(RP.start+sec),h=Math.floor(t/3600)%24,m=Math.floor(t%3600/60);return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');}
const RP_EVENTS=[
  {ph:'descent',t:5,title:$t('2012 年 3 月 26 日 05:15'),sub:$t('关岛西南约 330 km。詹姆斯·卡梅隆独自驾驶 12 吨重的“深海挑战者号”离开水面。潜水器竖着下潜，驾驶舱是一个只容一人蜷坐的钢球。')},
  {ph:'descent',t:900,title:$t('舱内像桑拿'),sub:$t('下潜初期舱内温度一度超过 38 °C；越往下，舱外海水越冷，最后只有 2 °C 左右。')},
  {ph:'bottom',t:3,title:$t('07:51 抵达海底'),sub:$t('下潜用了 2 小时 36 分。公布的深度在 10,843 至 10,908 m 之间。巨大的压强让整艘潜水器缩短了约 7.6 cm。')},
  {ph:'bottom',t:900,title:$t('“荒凉、孤寂，像月球一样的平原”'),sub:$t('卡梅隆说他就坐在那里看着窗外。海底是柔软得近乎胶状的平地，几乎没有任何起伏。')},
  {ph:'bottom',t:3600,title:$t('没有鱼'),sub:$t('除了不到 2.5 cm 长、像小虾一样的端足类，他没有看到任何更大的动物。')},
  {ph:'bottom',t:9000,title:$t('液压油泄漏'),sub:$t('正要采集第一份样本时，液压油泄漏糊住了舷窗，机械臂无法使用，几个推进器也失灵了。')},
  {ph:'bottom',t:11000,title:$t('提前上浮'),sub:$t('在海底停留了三个多小时（原计划 6 小时）。1960 年，沃尔什和皮卡德在这里只停留了 20 分钟。')},
  {ph:'done',t:0,title:$t('约 12:00 回到水面'),sub:$t('上浮只用了 70 分钟。卡梅隆是第一个独自到达挑战者深渊的人，也是 1960 年之后第一个到达这里的人。')}
];
function rpEvents(){for(const e of RP_EVENTS){const key=e.ph+e.t;if(DIVE.rev.has(key))continue;
  const now=e.ph==='descent'?(DIVE.rphase==='descent'&&DIVE.clock>=e.t):e.ph==='bottom'?((DIVE.rphase==='bottom'&&DIVE.bt>=e.t)||DIVE.rphase==='ascent'||DIVE.rphase==='done'):DIVE.rphase==='done';
  if(now){DIVE.rev.add(key);showCaption(e.title,e.sub,10);}}}
function replayStep(rdt){
  const k=DIVE.speed==='auto'?60:+DIVE.speed,dtc=k*rdt;DIVE.clock+=dtc;
  if(DIVE.rphase==='descent'){const z=DIVE.z,v=z<S.D-300?1.18:0.3+0.88*Math.max(0,S.D-2.2-z)/298;setDiveZ(z+v*dtc);
    if(DIVE.z>=S.D-2.3){DIVE.rphase='bottom';DIVE.bt=0;}}
  else if(DIVE.rphase==='bottom'){DIVE.bt+=dtc;if(DIVE.bt>=RP.bottom)DIVE.rphase='ascent';}
  else if(DIVE.rphase==='ascent'){setDiveZ(DIVE.z-RP.ascentV*dtc);if(DIVE.z<=2.1){DIVE.rphase='done';DIVE.play=false;updDiveUI();}}
  rpEvents();
}

