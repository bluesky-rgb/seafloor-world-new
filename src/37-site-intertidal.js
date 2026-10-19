/* =========================================================
   14u. Rocky intertidal shore, Nanji Islands, Pingyang, Wenzhou, Zhejiang (27°27′N 121°02′E).
   - Nanji Archipelago National Marine Nature Reserve: one of China's first five marine reserves (1990),
     China's earliest UNESCO biosphere reserve (1998), Ramsar site (2022); 19,893 ha; 422 species of algae and
     725 of shellfish and other molluscs recorded: the "kingdom of shellfish and algae" (Ramsar RIS 2517).
   - Dominant animals on its rocky shores: the barnacle Tetraclita, the tMussels Mytilus coruscus and Septifer
     (S. virgatus in summer), the periwinkle Littorina brevicula; coralline algae and Sargassum thunbergii are
     common (Shanghai Ocean Univ. 2017 survey: 125 species). S. thunbergii dominates the brown algae of the high
     tidal zone, browns in general the mid zone, and Sargassum the upper subtidal (Frontiers in Mar. Sci. 2025).
   - Tide: semidiurnal, two highs and two lows a day; the model uses a 12.42 h cycle with a 4 m range
     (a simplification of the order of magnitude on this coast).
   The whole shore sits in a group that moves down as the tide rises (the sea surface stays at y = 0);
   anything above the surface is clipped, as a diver sees only the underwater part.
   ========================================================= */
const TIDE={on:false,h:0,amp:2,hr:5.2,play:true,rate:0.25,size:44,seg:220};   /* hr: hours since low water; rate: tide hours per second */
renderer.localClippingEnabled=true;
const CLIP_SURF=[new THREE.Plane(new THREE.Vector3(0,-1,0),0.015)];
const tideG=new THREE.Group();tideG.visible=false;scene.add(tideG);
/* elevation of the shore relative to mean sea level: subtidal bench at -S.D on the right, rock rising to +3 m on the left */
function tideRock(x,z){
  const s=x+1.4*Math.sin(z*0.27)+0.5*Math.sin(z*0.9+1);
  let e=-S.D+(S.D+3.2)*sstep(5,-9,s);
  const[d1,d2,id]=cell2(x*0.42+5,z*0.42+2);e+=0.55*Math.sqrt(sstep(0,0.5,d2-d1))*(0.6+0.8*id)*sstep(6,-2,s);  /* boulders and blocks */
  e+=0.18*Math.sin(x*1.7+z*0.8)*Math.sin(z*1.3)+0.05*Math.sin(x*6.1+z*4.7);
  return e*sstep(22,15,Math.hypot(x,z))+(-S.D)*(1-sstep(22,15,Math.hypot(x,z)));
}
const tideFloor=(x,z)=>tideRock(x,z)-TIDE.h;
const tideGeo=new THREE.PlaneGeometry(TIDE.size,TIDE.size,TIDE.seg,TIDE.seg);tideGeo.rotateX(-Math.PI/2);
tideGeo.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(tideGeo.attributes.position.count*3),3));
const tideMat=waterify(lambert({clippingPlanes:CLIP_SURF}),'tideRock',{defines:{CAUSTICS:''}});
const tideMesh=new THREE.Mesh(tideGeo,tideMat);tideG.add(tideMesh);
function paintTide(){
  const p=tideGeo.attributes.position,c=tideGeo.attributes.color;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),e=tideRock(x,z);p.setY(i,e);
    const n=0.5+0.3*Math.sin(x*4.3+z*3.1)*Math.sin(z*5.7)+0.2*Math.sin(x*13+z*11);
    let col=mixc([0.23,0.22,0.21],[0.14,0.14,0.13],n);                                         /* granite-grey rock */
    col=mixc(col,[0.12,0.12,0.11],sstep(1.5,1.8,e)*sstep(2.6,2.2,e)*0.8);                     /* black band (cyanobacteria) at the top of the splash zone */
    {const[b1]=cell2(x*30,z*30);col=mixc(col,b1<0.32?[0.42,0.45,0.42]:[0.25,0.27,0.25],sstep(0.1,0.4,e)*sstep(1.7,1.4,e)*0.85);}   /* barnacle zone: crowded pale cones */
    col=mixc(col,[0.1,0.08,0.09],sstep(0.5,0.3,e)*sstep(-0.8,-0.5,e)*0.85);                    /* dark mussel beds */
    col=mixc(col,[0.6,0.33,0.38],sstep(-0.4,-0.8,e)*sstep(-3.2,-2.4,e)*0.8);                  /* pink crusts of coralline algae */
    col=mixc(col,[0.55,0.5,0.42],sstep(-3.6,-4.2,e));                                          /* coarse sand at the foot */
    c.setXYZ(i,col[0],col[1],col[2]);}
  p.needsUpdate=true;c.needsUpdate=true;tideGeo.computeVertexNormals();
}
const _tn=new THREE.Vector3();
function tideNormal(x,z){const e=0.05;_tn.set(tideRock(x-e,z)-tideRock(x+e,z),2*e,tideRock(x,z-e)-tideRock(x,z+e)).normalize();return _tn;}
/* ---- Tetraclita (鳞笠藤壶): a steep grey-green cone of plates, ~3 cm; when the water covers it the cirri sweep in and out ---- */
const tetraGeo=(()=>{const acc=Acc();
  const g=new THREE.CylinderGeometry(0.34,1,0.72,10,1,true);g.translate(0,0.36,0);
  addGeo(acc,g,null,(x,y,z)=>{const a=Math.atan2(z,x),r=Math.abs(Math.sin(a*6));return mixc([0.4,0.45,0.41],[0.18,0.22,0.2],r*0.8+0.2*sstep(0.5,0.7,y));});
  addGeo(acc,new THREE.CircleGeometry(0.34,8).rotateX(-Math.PI/2).translate(0,0.715,0),null,()=>[0.18,0.17,0.16]);
  for(let k=0;k<6;k++){const a=(k-2.5)*0.28;   /* cirri: six curled feeding legs, collapsed into the shell when dry */
    addGeo(acc,new THREE.CylinderGeometry(0.02,0.035,0.6,3,3,true),M4(Math.sin(a)*0.25,0.98,0.05,0.35,0,a*1.6),()=>[0.85,0.72,0.5]);}
  return finishGeo(acc);})();
const tideU={uTideH:{value:0}};
const tetraMat=waterify(lambert({clippingPlanes:CLIP_SURF}),'tetra',{uniforms:tideU,vHead:'uniform float uTideH;',
  vBegin:'if(position.y>0.73){ float wy=instanceMatrix[3].y-uTideH; float sub=smoothstep(-0.02,-0.12,wy); float ph=instanceMatrix[3].x*7.1+instanceMatrix[3].z*5.3; float s=sub*max(0.0,sin(uTime*2.2+ph)); transformed.y=0.72+(transformed.y-0.72)*s; transformed.xz*=0.2+0.8*s; transformed.z+=0.25*s*s*(transformed.y-0.72); }'});
const tetras=new THREE.InstancedMesh(tetraGeo,tetraMat,2200);tetras.frustumCulled=false;tetras.count=0;tideG.add(tetras);
/* ---- Capitulum mitella (龟足): stalked barnacles in clumps in crevices; a fan of pointed plates on a scaly stalk ---- */
const pollGeo=(()=>{const acc=Acc();addGeo(acc,new THREE.CylinderGeometry(0.16,0.2,0.5,8),M4(0,0.25,0),(x,y,z)=>Math.sin(y*60)>0?[0.45,0.38,0.3]:[0.35,0.29,0.22]);
  for(let k=0;k<7;k++){const a=(k-3)*0.32;addGeo(acc,new THREE.ConeGeometry(0.1,0.55,4),M4(Math.sin(a)*0.12,0.72,Math.cos(a)*0.02*(k%2?1:-1),0,0,-a*0.8),()=>k%2?[0.55,0.58,0.5]:[0.68,0.66,0.55]);}
  return finishGeo(acc);})();
const polls=new THREE.InstancedMesh(pollGeo,waterify(lambert({clippingPlanes:CLIP_SURF}),'pollicipes'),700);polls.frustumCulled=false;polls.count=0;tideG.add(polls);
/* ---- tMussels: Mytilus coruscus (厚壳贻贝, thick dark shells to ~12 cm) packed with smaller Septifer ---- */
const tMusselGeo=(()=>{const acc=Acc();
  for(const sg of[1,-1])addColored(acc,loftGeo(8,6,(a,b)=>{const ph=b*Math.PI,w=Math.sin(Math.PI*Math.pow(a,0.7))*0.32+0.01,z=a-0.5;
    const x=sg*w*Math.sin(ph)*0.55,y=w*Math.cos(ph)*0.9;return[x,y,z,...mixc([0.16,0.12,0.16],[0.3,0.22,0.24],0.5+0.5*Math.sin(a*40))];}));
  return finishGeo(acc);})();
const tMussels=new THREE.InstancedMesh(tMusselGeo,waterify(lambert({clippingPlanes:CLIP_SURF,side:THREE.DoubleSide}),'mussel'),1800);tMussels.frustumCulled=false;tMussels.count=0;tideG.add(tMussels);
/* ---- Littorina brevicula (短滨螺): ~1 cm periwinkles high on the shore ---- */
const winkGeo=(()=>{const acc=Acc();for(let k=0;k<4;k++)addGeo(acc,new THREE.SphereGeometry(1,8,6),M4(0,0.3+k*0.22,-k*0.06,0,0,0,0.5-k*0.11,0.42-k*0.09,0.5-k*0.11),(x,y,z)=>Math.sin(y*30+Math.atan2(z,x)*2)>0.3?[0.32,0.3,0.26]:[0.5,0.46,0.38]);return finishGeo(acc);})();
const winks=new THREE.InstancedMesh(winkGeo,waterify(lambert({clippingPlanes:CLIP_SURF}),'littorina'),500);winks.frustumCulled=false;winks.count=0;tideG.add(winks);
/* ---- Sargassum: short bushy S. thunbergii (鼠尾藻) higher up, taller leafy S. hemiphyllum (半叶马尾藻) below; sway with the surge ---- */
const sargGeo=(()=>{const acc=Acc();
  for(let s=0;s<5;s++){const a0=s*1.26,lean=0.25+0.1*s%3;
    for(let k=0;k<12;k++){const t=k/12,x=Math.cos(a0)*lean*t*0.35,z=Math.sin(a0)*lean*t*0.35,y=t;
      addGeo(acc,new THREE.CylinderGeometry(0.008,0.01,1/12,3,1,true),M4(x,y+1/24,z),()=>[0.42,0.33,0.14]);
      for(let j=0;j<3;j++){const b=a0+k*2.1+j*2.1,cx=x+Math.cos(b)*0.07,cz=z+Math.sin(b)*0.07;                    /* small flat leaves */
        addGeo(acc,triGeo([x,y,z, cx+Math.sin(b)*0.02,y+0.04,cz-Math.cos(b)*0.02, cx+Math.cos(b)*0.05,y+0.08,cz+Math.sin(b)*0.05,  x,y,z, cx+Math.cos(b)*0.05,y+0.08,cz+Math.sin(b)*0.05, cx-Math.sin(b)*0.02,y+0.04,cz+Math.cos(b)*0.02]),null,()=>j?[0.5,0.38,0.12]:[0.44,0.34,0.1]);
        if((k+j)%4===0)addGeo(acc,new THREE.OctahedronGeometry(0.012,0),M4(x-Math.cos(b)*0.03,y+0.02,z-Math.sin(b)*0.03),()=>[0.55,0.45,0.18]);}}}  /* air bladders */
  return finishGeo(acc);})();
const sargMat=waterify(lambert({clippingPlanes:CLIP_SURF,side:THREE.DoubleSide}),'sargassum',{vBegin:'{ float L=length(instanceMatrix[1].xyz); float k=position.y*position.y; float ph=instanceMatrix[3].x*1.9+instanceMatrix[3].z*1.3; transformed.x+=(uFlow.x*0.35+0.06*sin(uTime*0.9+ph))*k/max(L,0.2)*0.9; transformed.z+=(uFlow.y*0.35+0.05*cos(uTime*0.8+ph))*k/max(L,0.2)*0.9; }'});
const sargs=new THREE.InstancedMesh(sargGeo,sargMat,520);sargs.frustumCulled=false;sargs.count=0;tideG.add(sargs);
/* ---- green anemones in the low zone, purple urchins (紫海胆) in the crevices below ---- */
const tAnemGeo=(()=>{const acc=Acc();addGeo(acc,new THREE.CylinderGeometry(0.4,0.5,0.4,10),M4(0,0.2,0),()=>[0.3,0.45,0.25]);
  for(let k=0;k<24;k++){const a=k/24*6.283,r=0.28+0.1*(k%2);addGeo(acc,new THREE.CylinderGeometry(0.02,0.045,0.4,4),M4(Math.cos(a)*r,0.5,Math.sin(a)*r,Math.sin(a)*0.9,0,-Math.cos(a)*0.9),()=>[0.45,0.68,0.42]);}
  return finishGeo(acc);})();
const tAnems=new THREE.InstancedMesh(tAnemGeo,waterify(lambert({clippingPlanes:CLIP_SURF}),'tAnem'),120);tAnems.frustumCulled=false;tAnems.count=0;tideG.add(tAnems);
const tUrchins=new THREE.InstancedMesh(urchinT.geometry,urchinT.material,60);tUrchins.frustumCulled=false;tUrchins.count=0;tideG.add(tUrchins);
regPick(tideMesh,'tide_rock');regPick(tetras,'tetraclita');regPick(polls,'capitulum');regPick(tMussels,'mytilus');regPick(winks,'littorina');regPick(sargs,'sargassum');regPick(tAnems,'tanem');regPick(tUrchins,'heliocidaris');
/* scatter instances over the shore where the elevation falls in a band; ab = how strongly to prefer the band centre */
function tideScatter(mesh,n,e0,e1,sc,opt){
  opt=opt||{};n=Math.round(n*PERF.k);let k=0;const cap=mesh.instanceMatrix.count;
  const zr=opt.zr||9;for(let i=0;i<n*60&&k<Math.min(n,cap);i++){const x=R(-13,8),z=R(-zr,zr);const e=tideRock(x,z);if(e<e0||e>e1)continue;
    if(opt.crev){const[d1,d2]=cell2(x*0.42+5,z*0.42+2);if(d2-d1>0.12)continue;}
    if(opt.p&&rnd()>opt.p(x,z,e))continue;
    const nrm=tideNormal(x,z);_q.setFromUnitVectors(UP,opt.up?_tn.set(0,1,0).lerp(nrm,0.4).normalize():nrm);
    _q.multiply(new THREE.Quaternion().setFromEuler(_e.set(opt.tilt?R(-opt.tilt,opt.tilt):0,rnd()*6.28,opt.tilt?R(-opt.tilt,opt.tilt):0)));
    const s=R(sc[0],sc[1]);if(opt.sy)_s.set(s,s*R(opt.sy[0],opt.sy[1]),s);else _s.setScalar(s);
    _p.set(x,e-(opt.sink||0)*s,z);_m.compose(_p,_q,_s);mesh.setMatrixAt(k++,_m);}
  mesh.count=k;mesh.instanceMatrix.needsUpdate=true;
}
function buildIntertidal(on){
  TIDE.on=on;tideOn=on;tideG.visible=on;$('tideSec').hidden=!on;
  if(!on){TIDE.h=0;tideG.position.y=0;return;}
  paintTide();
  const patch=(x,z)=>0.55+0.45*Math.sin(x*0.9+z*0.5)*Math.cos(z*0.7-x*0.3);
  tideScatter(tetras,2200,0.15,1.65,[0.03,0.05],{zr:5,p:(x,z,e)=>0.4+0.6*patch(x,z)*sstep(1.7,1.2,e)});
  tideScatter(polls,700,0.0,1.1,[0.05,0.075],{zr:6,crev:true,up:true,tilt:0.35});
  tideScatter(tMussels,1800,-0.75,0.45,[0.06,0.12],{zr:6,p:(x,z)=>0.5+0.5*patch(x+3,z),tilt:1.1,sink:0.05});
  tideScatter(winks,500,0.9,2.4,[0.01,0.014],{zr:6});
  tideScatter(sargs,520,-3.4,0.45,[0.25,0.9],{up:true,p:(x,z,e)=>e>-0.6?0.35:0.9,sy:[0.8,1.3]});
  /* S. thunbergii stays short; deeper plants (S. hemiphyllum) grow taller */
  for(let i=0;i<sargs.count;i++){sargs.getMatrixAt(i,_m);_m.decompose(_p,_q,_s);const e=_p.y;const L=e>-0.6?R(0.15,0.3):R(0.4,0.95);_s.set(L*0.8,L,L*0.8);_m.compose(_p,_q,_s);sargs.setMatrixAt(i,_m);}
  sargs.instanceMatrix.needsUpdate=true;
  tideScatter(tAnems,120,-1.6,-0.1,[0.04,0.07],{crev:true});
  tideScatter(tUrchins,60,-3.0,-1.0,[0.05,0.07],{crev:true});
  stepIntertidal(0,0);
}
const tideHr=()=>TIDE.hr%12.42;
function setTideHr(hr){TIDE.hr=((hr%12.42)+12.42)%12.42;}
function stepIntertidal(dt,t){
  if(!TIDE.on)return;
  if(TIDE.play&&!DIVE.on)setTideHr(TIDE.hr+dt*TIDE.rate);
  const h=-TIDE.amp*Math.cos(2*Math.PI*TIDE.hr/12.42),dh=h-TIDE.h;TIDE.h=h;
  tideG.position.y=-h;tideU.uTideH.value=h;floor.position.y=-S.D-0.3-h;
  if(dh!==0)tideUI();
}
let tideUIt=0;
function tideUI(){
  const now=performance.now();if(now-tideUIt<150)return;tideUIt=now;
  const h=TIDE.h,hr=TIDE.hr,rising=hr<6.21;
  $('tideV').textContent=(h>=0?'+':'−')+Math.abs(h).toFixed(2)+' m · '+(Math.abs(h)>1.85?(h>0?$t('高潮'):$t('低潮')):rising?$t('涨潮'):$t('落潮'));
  if(document.activeElement!==$('sTide'))$('sTide').value=Math.round(hr/12.42*1000);
  const sub=[[$t('滨螺带'),1.9],[$t('藤壶带'),1.0],[$t('龟足'),0.6],[$t('贻贝床'),-0.1],[$t('鼠尾藻'),0.0],[$t('珊瑚藻与马尾藻'),-1.3]].filter(z=>z[1]<h).map(z=>z[0]);
  $('tideNote').textContent=$t('距上一次低潮 ')+hr.toFixed(1)+$t(' 小时。现在淹在水下：')+(sub.length?sub.join($t('、')):$t('只有潮下带的海藻和海胆'))+$t('。藤壶被淹没时会伸出蔓足捕食，露出水面就关紧壳板保水。');
}
$('sTide').addEventListener('input',e=>{setTideHr(+e.target.value/1000*12.42);TIDE.play=false;$('tidePlay').textContent=$t('▶ 播放潮汐');});
$('tidePlay').addEventListener('click',()=>{TIDE.play=!TIDE.play;$('tidePlay').textContent=TIDE.play?$t('❚❚ 暂停潮汐'):$t('▶ 播放潮汐');});
const TIDE_INFO={
  tide_rock:[$t('南麂列岛的岩礁海岸'),$t('“贝藻王国” · 浙江温州平阳'),$t('潮水每天涨落两次，岩石上同一个高度被淹没的时间是固定的，于是生物按高度排成一条条带子：最高处是黑色的蓝藻带和滨螺，往下是白花花的藤壶带，再往下是黑紫色的贻贝床，最低处是粉红的珊瑚藻和成片的马尾藻。南麂列岛已记录 422 种藻类、725 种贝类等软体动物，1998 年成为我国第一个加入联合国“人与生物圈”的海洋保护区。'),$t('南麂列岛国家级海洋自然保护区')]
};
Object.assign(CHIM_INFO,TIDE_INFO);
CAT.push(['tetraclita',$t('鳞笠藤壶'),'Tetraclita',$t('潮间带中高潮区')],['capitulum',$t('龟足'),'Capitulum mitella',$t('潮间带岩缝')],['mytilus',$t('厚壳贻贝'),'Mytilus coruscus',$t('潮间带中低潮区')],
  ['littorina',$t('短滨螺'),'Littorina brevicula',$t('潮间带高潮区')],['sargassum',$t('鼠尾藻与马尾藻'),'Sargassum',$t('潮间带至潮下带')],['tanem',$t('绿海葵'),'Actiniaria',$t('潮间带低潮区')],['heliocidaris',$t('紫海胆'),'Heliocidaris crassispina',$t('低潮线以下岩礁')]);
CAT.slice(-7).forEach(c=>CATMAP[c[0]]=c);
Object.assign(FACTS,{
  tetraclita:$t('藤壶是甲壳动物，幼体漂流一阵后头朝下粘在岩石上，一辈子不再移动。涨潮时打开壳板、伸出羽毛似的蔓足扫食浮游生物；退潮时关紧壳板，把一点海水锁在里面熬过几个小时的日晒。'),
  capitulum:$t('也是一种藤壶，有一根肉质的柄，顶端一簇尖尖的壳板像乌龟的脚，因此叫“龟足”。成群挤在浪大的岩缝里。'),
  mytilus:$t('用足丝把自己牢牢粘在岩石上，层层叠叠铺成贻贝床，经得住大浪。它们滤食浮游生物，床缝里又住着许多小动物。'),
  littorina:$t('住在潮间带最高处，退潮时能在空气里待很久，靠刮食岩石上的微藻和蓝藻为生。'),
  sargassum:$t('鼠尾藻矮小粗壮，长在潮间带较高处；更低处的马尾藻能长得很高，靠小小的气囊让藻体在水里立起来。南麂列岛的潮下带上部几乎全被马尾藻覆盖。'),
  tanem:$t('退潮时缩成一团、身上粘着碎壳和沙粒防晒，涨潮后才张开触手。'),
  heliocidaris:$t('躲在低潮线以下的岩缝里啃食海藻，是我国东南沿海常见的食用海胆。')
});
SPECIES.push(['tetraclita',$t('鳞笠藤壶')],['capitulum',$t('龟足')],['mytilus',$t('厚壳贻贝')],['littorina',$t('短滨螺')],['sargassum',$t('马尾藻')],['tanem',$t('绿海葵')],['heliocidaris',$t('紫海胆')]);
