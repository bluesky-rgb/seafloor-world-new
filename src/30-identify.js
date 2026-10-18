/* =========================================================
   14j. Tap to identify
   ========================================================= */
const FACTS={
  coral:'珊瑚虫体内住着虫黄藻，靠光合作用为珊瑚提供大部分能量，所以造礁珊瑚只能活在有光的浅海。',
  kelp:'每天最快能长约 60 cm，是地球上长得最快的生物之一；叶片基部的气囊让它漂向水面。',
  anem:'触手上的刺细胞能蜇伤小鱼，但小丑鱼体表的黏液让它们不会被蜇。',
  clown:'一群小丑鱼里最大的那条是雌鱼；雌鱼不在了，最大的雄鱼会变成雌鱼。',
  clam:'外套膜里养着共生藻，像珊瑚一样靠阳光获得营养；那片蓝色来自会反光的虹彩细胞。',
  fanS:'扇面垂直于海流生长，好拦截更多随水流来的浮游食物。',
  fanD:'骨骼一节白一节深，像竹子；可以活几百年，被触碰时会发出蓝色光波。',
  turtle:'名字里的“绿”来自体内脂肪的颜色，因为成年后主要吃海草和藻类。',
  manta:'翼展可达 5 m，脑与体型之比在鱼类中名列前茅。',
  whaleshark:'世界上最大的鱼，可长到 18 m 以上，却只吃浮游生物和小鱼。',
  hammer:'锤状的头部布满电感受器，像金属探测器一样扫描海底找猎物；白天常成百上千地聚群。',
  chromis:'遇到危险时会一起钻进枝状珊瑚的缝隙里。',
  anthias:'群体里大多是雌鱼；雄鱼不在了，雌鱼会变性成雄鱼。',
  butterfly:'眼睛藏在黑色条纹里，尾部的黑斑像假眼睛，用来迷惑捕食者。',
  snapper:'白天成群停在珊瑚礁旁，夜里散开去觅食。',
  parrot:'啃食珊瑚上的藻类时连骨骼一起咬碎，排出的就是细白沙；热带海滩的白沙很多来自鹦嘴鱼。',
  sardine:'遇到捕食者时会挤成旋转的“鱼饵球”，让捕食者难以锁定某一条。',
  rockfish:'可以活 40 多年，常在巨藻林中层成群悬停。',
  urchinT:'数量失控时会把巨藻林啃成光秃秃的“海胆荒漠”，海獭是它们的主要天敌。',
  urchinD:'细长的刺带有微毒，白天躲着，夜里出来啃食藻类。',
  starT:'断掉的一条腕能长成一只完整的新海星。',
  starC:'几乎什么都吃，会把胃翻出体外消化食物。',
  moon:'伞中央四个马蹄形的是生殖腺；生命中有一段固着在岩石上的水螅体阶段。',
  nettle:'触手可长到 4 m 以上，布满刺细胞，用来捕捉浮游动物。',
  comb:'靠八列纤毛栉板划水，是用纤毛游泳的最大动物；彩虹色是纤毛衍射光线，不是发光。',
  sperm:'有地球上最大的大脑（约 8 kg），能潜到 2,000 m 以下捕食大型乌贼，靠咔嗒声回声定位。',
  lantern:'可能是数量最多的脊椎动物之一；夜里上浮到表层觅食，白天回到几百米深处。',
  hatchet:'腹部的发光器发出和上方透下来一样亮的光，把自己的影子“抹掉”，这叫反照明。',
  siph:'看起来像一只动物，其实是许多分工不同的个体连成的群体，有的长达数十米。',
  squid:'眼睛直径约 27 cm，是动物界最大的眼睛之一；2012 年才第一次在自然环境中被拍到活体。',
  vampire:'名字吓人，其实吃的是“海洋雪”；受威胁时会把披风般的腕翻过来罩住身体。',
  atolla:'被攻击时让光沿伞缘一圈圈旋转闪烁，像防盗警报，可能招来更大的捕食者对付攻击者。你刚才点它，就相当于“碰”了它一下。',
  gulper:'嘴能张得比身体还大，尾端有发光器，可能用来引诱猎物。',
  cucumber:'能离开海底游泳的海参，身体半透明，能看见里面的消化道。',
  angler:'头上“钓竿”末端住着发光细菌；在一些鮟鱇物种里，雄鱼会咬住雌鱼并和它长在一起。',
  dumbo:'像大象耳朵的鳍是主要推进器；曾在近 7,000 m 深处被拍到，是已知最深的章鱼之一。',
  sponge:'玻璃般的骨骼由二氧化硅构成；常有一对小虾幼年钻进去，长大后出不来，在里面过完一生。',
  seep:'不靠阳光，靠体内共生细菌把甲烷或硫化物转化成能量。',
  snail:'身体柔软半透明，骨骼没有完全钙化，能承受 800 多个大气压。',
  amphi:'体内有能分解纤维素的酶，可能靠从陆地漂来、沉入海沟的植物残骸生活。',
  holo:'海沟底部数量最多的大型动物之一，不停吞食沉积物，吸收里面的有机物。',
  xeno:'单个细胞可以长到 10 cm 以上，是已知最大的单细胞生物之一。',
  hagfish:'受惊时几秒钟内就能分泌出大量黏液，连鲨鱼的鳃都能堵住；会钻进腐肉里从内部吃起。',
  sleeper:'游得很慢的冷水鲨鱼，能长到 4 m 以上，常在鲸落上撕咬鲸肉。',
  osedax:'没有嘴也没有肠子，靠“根”分泌酸钻进鲸骨，再借共生细菌消化骨头里的营养；2002 年在蒙特雷峡谷 2,893 m 的灰鲸骨头上首次被发现。',
  crab:'被腐肉的气味吸引而来的甲壳动物之一，会在骨头之间翻找残渣。',
  rimicaris:'没有普通的眼睛，背上却有一块感光器官，科学家认为它可能用来感知热液口发出的极微弱的光；靠体内和鳃腔里的共生细菌获取养分。',
  kiwa:'俗称“雪人蟹”，螯足上长满刚毛，上面养着细菌；龙旂的这一种是在这里首次发现的新种。',
  scalyfoot:'脚上覆盖着数百片含硫化铁的鳞片，壳的外层也含硫化铁，是已知唯一把铁硫化物用进骨骼的动物；靠体内的共生细菌生活。2019 年被列为濒危，是第一种因深海采矿威胁而被列为濒危的物种。',
  giga:'和铁甲蜗牛是近亲的大型热液螺，同样靠体内的共生细菌生活，在龙旂成片分布，2015 年才被命名。',
  ventmussel:'鳃里住着共生细菌，把热液里的化学能转化成养分，在喷口外围成片生长。',
  barnacle:'长在热液影响的最外圈，伸出羽状的蔓足从水里滤食。',
  dendro:'没有坚硬骨骼的珊瑚，靠水压撑起身体，喜欢长在水流经过的高处，所以沉船的桅杆、吊杆和栏杆上挂满了它们，颜色从粉红、淡紫到橙红都有。',
  baitfish:'成千上万的小鱼在甲板上方结成密集的鱼群，一起转向来迷惑捕食者。',
  jack:'在沉船边缘巡游的掠食者，时不时冲进饵鱼群里捕食。',
  lionfish:'鳍条上长着毒刺，动作缓慢，常在沉船船尾的阴影里伏击小鱼。它们原产印度—太平洋，在大西洋已成为严重的入侵物种。',
  lophelia:'深水里最重要的造礁珊瑚。它没有共生藻，靠伸出触手捕食浮游生物，所以能活在没有阳光的冷水里；有白色和橙色两种颜色型。每年只长 1–2.5 mm 左右，礁体底部是层层堆积的死珊瑚骨架，只有顶端是活的。底拖网曾毁掉挪威大陆架约三到五成的珊瑚区。',
  paragorgia:'一种长成小树的大型柳珊瑚，枝端圆鼓鼓的，像嚼过的泡泡糖，因此得名。颜色从白色到鲜红都有，能长到几米高。',
  redfish:'北大西洋深水里的大眼红鱼，常静静悬停在冷水珊瑚礁上方。它们长得很慢、寿命很长，有的能活几十年以上。',
  geodia:'大块的球形海绵，内部有硅质骨针，是北大西洋深海“海绵场”的主角，为许多小动物提供栖身之所。',
  acesta:'贝壳可长到十几厘米的大型锉蛤，常附着在冷水珊瑚的骨架上，张开的壳缘伸出一圈橙色的触手。',
  seal:'世界上最南端的哺乳动物之一，整个冬天都待在海冰下。它们用牙齿啃磨冰面来维持呼吸孔，成年个体约 400 kg，在冰下捕食南极鱼。',
  icefish:'已知唯一成年后血液里没有血红蛋白的脊椎动物，血液几乎无色。氧气直接溶解在血浆里运输，靠的是冰冷海水溶氧多、心脏和血量都比别的鱼大好几倍。',
  borch:'躲在海冰底下的片状冰层里生活，血液里有抗冻糖蛋白，能在 −1.9 °C 的海水里不被冻住。',
  icealgae:'生活在海冰底部的微藻，春季冰下光照回升时大量繁殖，把冰底染成褐色，是南北两极食物网的起点之一。',
  odontaster:'南极海底最常见的海星之一，颜色鲜红，什么都吃，包括海豹的粪便。',
  sterechinus:'南极浅海最常见的海胆，常成堆聚集；冬天会被海底的“锚冰”冻住带离海底。',
  pycno:'海蜘蛛不是蜘蛛，而是一类海洋节肢动物。南极的海蜘蛛长得特别大，腿展可达几十厘米，这种“极地巨型化”可能与冷水含氧多有关。',
  rossella:'南极浅海的玻璃海绵，骨骼由二氧化硅骨针构成。它们长得极慢，有的个体可能已有上千岁。',
  acropora:'造礁珊瑚里种类最多的一属。大多数鹿角珊瑚雌雄同体，每年只在少数几个夜里把卵和精子一起包成卵精束放出，在水里与其他珊瑚的配子相遇受精。',
  childressi:'鳃里住着以甲烷为食的共生细菌，细菌再把养分供给贻贝。它们沿盐池的“湖岸”长成一圈：往里是没有氧气的卤水，往外甲烷又不够，只有岸边两样都有。',
  krill:'身上有一排排会发蓝光的发光器。白天躲在几百米深的暗处，黄昏上浮到表层吃浮游植物，天亮前再沉回去。',
  salp:'一个个透明的“小桶”连成长链，靠喷水前进，边游边滤食。它们每天要上下迁移几百米，粪粒沉得很快，把碳带进深海。',
  ventanem:'住在热液区最外缘，那里水温已接近周围海水，食物却比普通深海海底丰富得多。'
};
const PICK=[];
function regPick(o,key){o.userData.ck=key;PICK.push(o);}
const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2();
function chainVisible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}
function resolveKey(k){if(k==='smt_rock'&&SMT.seeps.some(s=>Math.hypot(s[0]-lastPick.x,s[1]-lastPick.z)<0.7))return'smt_seep';if(k==='aby_floor')return inTrack(lastPick.x,lastPick.z)?'minetrack':'abysed';if((ICE.on&&(k==='star'||k==='urchinT'||k==='sponge'))||(ROST.on&&k==='fan'))return catKey(k);if(k==='fan')return S.D>200?'fanD':'fanS';if(k==='star')return S.temp>=18?'starT':'starC';return k;}
let infoT=0;
function showInfo(k,dist){
  if(CHIM_INFO[k]){const c=CHIM_INFO[k];if(k==='brine_surf')brineRing(lastPick.x,lastPick.z,0.035);$('infoN').textContent=c[0];$('infoL').textContent=c[3]||'龙旂热液区';$('infoD').textContent=c[1]+(dist?' · 距离你约 '+dist.toFixed(1)+' m':'');$('infoF').textContent=c[2];$('info').hidden=false;infoT=14;return;}
  if(k==='whalebone'){const st=wfStages(WF.t);$('infoN').textContent='灰鲸遗骸';$('infoL').textContent='沉到海底 '+fmtYears(WF.t);
    $('infoD').textContent='约 13 m 长 · 骨头里储存着上千公斤油脂';$('infoF').textContent='一头鲸沉到深海后，能养活一个群落几十年。科学家已在鲸落上记录到 400 多种生物，其中至少 30 种在别处从未见过。';}
  else{const c=CATMAP[k];if(!c)return;$('infoN').textContent=c[1];$('infoL').textContent=c[2];$('infoD').textContent='分布深度 '+c[3]+(dist?' · 距离你约 '+dist.toFixed(1)+' m':'');$('infoF').textContent=FACTS[k]||'';
    if(SHARE.live){const n=SHARE.cnt[k]||0;$('infoD').textContent+=' · '+(n?'已有 '+n+' 位探险者遇见过':'你可能是第一个遇见它的探险者');}
    if(!FOUND.has(k)){FOUND.add(k);try{localStorage.setItem('seafloor-found',JSON.stringify([...FOUND]));}catch(e){}renderCatalog();}}
  $('info').hidden=false;infoT=12;
}
const lastPick=new THREE.Vector3();
function pickAt(cx,cy){
  if(VR.on)return;
  const r=canvas.getBoundingClientRect();ndc.set((cx-r.left)/r.width*2-1,-((cy-r.top)/r.height)*2+1);
  raycaster.setFromCamera(ndc,camera);raycaster.far=45;
  const objs=PICK.filter(o=>chainVisible(o)&&(o.count===undefined||o.count>0));
  const hits=raycaster.intersectObjects(objs,true);
  const ckOf=h=>{let o=h.object;while(o&&!o.userData.ck)o=o.parent;return o?o.userData.ck:null;};
  {const i=hits.findIndex(h=>ckOf(h)==='brine_surf'),j=hits.findIndex(h=>ckOf(h)==='brine_dead');if(i>=0&&j>i){const hd=hits[j];hits.splice(j,1);hits.splice(i,0,hd);}}
  for(const h of hits){const ck=ckOf(h);if(!ck)continue;if(ck==='__occ')break;lastPick.copy(h.point);
    if(ck==='atolla'&&h.instanceId!=null){const J=JELLY.atolla,i=h.instanceId*3;J.mesh.material.uniforms.uAlarm.value.set(J.p[i],J.p[i+1],J.p[i+2],U.uTime.value);}
    if(ck==='fan'&&U.uDeepFan.value>0)FANHIT.uFanHit.value.set(h.point.x,h.point.y,h.point.z,U.uTime.value);showInfo(resolveKey(ck),h.distance);return;}
  const tryPts=(pts,n,key,sz)=>{for(let i=0;i<n;i++){if(sz&&!sz[i])continue;_p.set(pts[i*3],pts[i*3+1],pts[i*3+2]).project(camera);
    const px=(_p.x+1)/2*r.width,py=(1-_p.y)/2*r.height;if(_p.z<1&&Math.hypot(px-(cx-r.left),py-(cy-r.top))<16){showInfo(key,_p.set(pts[i*3],pts[i*3+1],pts[i*3+2]).distanceTo(camera.position));return true;}}return false;};
  if(encSI.on&&tryPts(siph.pos,NSI,'siph',siph.size))return;
  if(anglerOn&&tryPts(lure.pos,3,'angler',lure.size))return;
  if(SPN.on&&tryPts(spawnPts.pos,NSPN,'spawn_bundle',spawnPts.size))return;
}
let downXY=null;
canvas.addEventListener('pointerdown',e=>{downXY=[e.clientX,e.clientY,performance.now()];});
canvas.addEventListener('pointerup',e=>{if(!downXY)return;const[x,y,t0]=downXY;downXY=null;if(Math.hypot(e.clientX-x,e.clientY-y)<6&&performance.now()-t0<500)pickAt(e.clientX,e.clientY);});
function registerPickables(){
  for(const k in FISH)regPick(FISH[k].mesh,k);for(const k in JELLY)regPick(JELLY[k].mesh,k);for(const k in DRIFT)regPick(DRIFT[k].mesh,k);
  regPick(WSH.mesh,'whaleshark');regPick(SPW.mesh,'sperm');regPick(SQD.mesh,'squid');regPick(SLP.mesh,'sleeper');
  mantas.forEach(m=>regPick(m,'manta'));turtles.forEach(g=>regPick(g,'turtle'));anglers.forEach(g=>regPick(g,'angler'));
  for(const k in CORAL)regPick(CORAL[k].mesh,'coral');regPick(wSoft,'coral');regPick(kelp,'kelp');regPick(stipes,'kelp');
  regPick(tents,'anem');anemBases.forEach(b=>regPick(b,'anem'));clamObjs.forEach(g=>regPick(g,'clam'));FANS.forEach(m=>regPick(m,'fan'));regPick(wFan,'fanS');
  regPick(sponges,'sponge');regPick(wSponge,'sponge');regPick(urchinT,'urchinT');regPick(urchinD,'urchinD');regPick(stars,'star');regPick(wreckHull,'wreck');wreckParts.forEach(m=>regPick(m,'wreck'));regPick(zeros,'zero');regPick(wSoftT,'dendro');regPick(wHardT,'coral');regPick(lophs,'lophelia');regPick(geodias,'geodia');regPick(acestas,'acesta');regPick(rubble,'lophelia');regPick(pycnos,'pycno');regPick(iceUnder,'ice_under');regPick(platelets,'ice_under');regPick(SEAL.mesh,'seal');
  regPick(mussels,'seep');regPick(tubes,'seep');regPick(wfMussels,'seep');regPick(holos,'holo');regPick(xenos,'xeno');
  regPick(osedax,'osedax');regPick(crabs,'crab');regPick(bones,'whalebone');regPick(flesh,'whalebone');
  chimMeshes.forEach(m=>regPick(m,m.userData.c.key));regPick(brMus,'childressi');regPick(brDead,'brine_dead');regPick(brFish,'brine_dead');regPick(brSurf,'brine_surf');regPick(brTerr,'__occ');for(const k in VFA)regPick(VFA[k],k);
  regPick(floor,'__occ');regPick(wall,'__occ');regPick(rocks,'__occ');
}

