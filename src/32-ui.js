/* =========================================================
   16. UI
   ========================================================= */
const DMIN=3,DMAX=2000;
const toSlider=d=>Math.round(1000*Math.log(d/DMIN)/Math.log(DMAX/DMIN)),fromSlider=v=>DMIN*Math.pow(DMAX/DMIN,v/1000);
const fmtD=d=>d<20?d.toFixed(1):Math.round(d).toLocaleString('en-US');
function pct(v){if(v>=0.1)return(v*100).toFixed(0)+'%';if(v>=0.001)return(v*100).toFixed(1)+'%';if(v<1e-12)return'≈0';const e=Math.floor(Math.log10(v*100));return(v*100/Math.pow(10,e)).toFixed(1)+'e'+e+'%';}
const SPECIES=[
  ['coral','造礁珊瑚'],['kelp','巨藻'],['anem','公主海葵'],['clown','小丑鱼'],['clam','长砗磲'],['fan',()=>ROST.on?'泡泡糖珊瑚':S.D>200?'竹珊瑚':'柳珊瑚'],
  ['turtle','绿海龟'],['manta','阿氏前口蝠鲼'],['chromis','蓝绿光鳃鱼'],['anthias','丝鳍拟花鲈'],['butterfly','月斑蝴蝶鱼'],
  ['snapper','四线笛鲷'],['parrot','蓝点鹦嘴鱼'],['sardine','太平洋沙丁鱼'],['rockfish','蓝平鲉'],['urchinT',()=>ICE.on?'南极海胆':'紫球海胆'],['urchinD','冠海胆'],['star',()=>ICE.on?'南极红海星':S.temp>=18?'蓝指海星':'蝙蝠海星'],
  ['moon','海月水母'],['nettle','太平洋金黄水母'],['comb','栉水母'],['lantern','灯笼鱼'],['atolla','冠水母'],['angler','黑鮟鱇'],
  ['sponge',()=>ICE.on?'南极玻璃海绵':'偕老同穴（玻璃海绵）'],['seep','深海贻贝、管栖蠕虫、细菌席'],
  ['whaleshark','鲸鲨'],['hammer','路氏双髻鲨'],['sperm','抹香鲸'],['hatchet','银斧鱼'],['siph','巨型管水母'],['squid','大王乌贼'],['vampire','幽灵蛸'],
  ['gulper','宽咽鱼'],['cucumber','游泳海参'],['dumbo','烟灰蛸'],['snail','马里亚纳狮子鱼'],['amphi','巨型钩虾'],['holo','超深渊海参'],['xeno','巨型单细胞生物'],
  ['hagfish','太平洋盲鳗'],['sleeper','太平洋睡鲨'],['osedax','食骨蠕虫'],['crab','深海石蟹'],
  ['rimicaris','盲虾'],['kiwa','雪人蟹'],['scalyfoot','铁甲蜗牛'],['giga','盾巨螺'],['ventmussel','深海偏顶蛤'],['barnacle','柄藤壶'],['ventanem','深海海葵'],['krill','磷虾'],['salp','樽海鞘'],['childressi','墨西哥湾甲烷贻贝'],['acropora','鹿角珊瑚（产卵中）'],['dendro','软珊瑚'],['baitfish','小型饵鱼群'],['jack','鲹'],['lionfish','魔鬼蓑鲉'],['lophelia','深水石珊瑚'],['redfish','挪威平鲉'],['geodia','球海绵'],['acesta','大锉蛤'],['seal','威德尔海豹'],['icefish','冰鱼'],['borch','秃南极鱼'],['icealgae','冰藻'],['pycno','巨型海蜘蛛']
];
const catKey=k=>ROST.on&&k==='fan'?'paragorgia':ICE.on&&k==='star'?'odontaster':ICE.on&&k==='urchinT'?'sterechinus':ICE.on&&k==='sponge'?'rossella':k==='fan'?(S.D>200?'fanD':'fanS'):k==='star'?(S.temp>=18?'starT':'starC'):k;
function readouts(){
  $('vDepth').textContent=fmtD(S.D)+' m';
  $('rK').textContent=OPT.K.map(k=>k.toFixed(3)).join(' / ')+' m⁻¹';
  $('rEu').textContent=(4.605/OPT.K[1]).toFixed(0)+' m';
  $('rVis').textContent=(3.9/OPT.c[1]).toFixed(0)+' m';
  $('rSun').textContent=(OPT.zenW*180/Math.PI).toFixed(1)+'°（空气中 '+(90-S.sun)+'°）';
  $('rL').textContent=W.L.toFixed(0)+' m'+(W.k*S.D<Math.PI?'（受海底影响）':'');
  const um=floorOrbitalMax();$('rU').textContent=um<1e-3?'≈0（波浪影响不到海底）':um.toFixed(2)+' m/s';
  $('rCur').textContent=(S.cur*curProfile(1)).toFixed(2)+' m/s';
  $('rRip').textContent=S.ripKind==='wave'?'波成沙纹 '+(U.uRipL.value*100).toFixed(0)+' cm':S.ripKind==='current'?'流成沙纹 '+(U.uRipL.value*100).toFixed(0)+' cm':'无';
  $('rMu').textContent=(viscosity(S.temp)*1000).toFixed(2)+' mPa·s';
  const Pf=pressure(S.D);$('rBub').textContent=(riseSpeed(1e-3)*100).toFixed(0)+' cm/s';
  $('rBub2').textContent='2 mm → '+(2*Math.cbrt(Pf/PATM)).toFixed(1)+' mm';
  $('vTemp').textContent=S.temp+' °C';$('vCur').textContent=S.cur.toFixed(2)+' m/s';$('vDir').textContent=S.dir+'°';
  $('vH').textContent=S.H.toFixed(1)+' m';$('vT').textContent=S.T+' s';$('vSun').textContent=S.sun+'°';
  updSite();
  $('hLoc').textContent=(S.loc?LOC[S.loc].name:'自定义参数')+(SPN.on?' · 当地时间 '+hhmm(SPN.t):'')+(DIVE.dvm?' · 当地时间 '+hhmm(DVM.t):S.night?' · 夜':'');
  [...$('locSeg').children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.l===S.loc));
  [...$('waterSeg').children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.w===S.water));
  [...$('timeSeg').children].forEach(b=>b.setAttribute('aria-pressed',(b.dataset.t==='night')===S.night));
  [...$('torchSeg').children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===S.torch));
  {const here=SPECIES.filter(s=>H[s[0]]);const known=here.filter(s=>FOUND.has(catKey(s[0])));const unk=here.length-known.length;
   $('species').innerHTML=known.map(s=>'<span class="sp">'+(typeof s[1]==='function'?s[1]():s[1])+'</span>').join('')+(unk?'<span class="sp unk">还有 '+unk+' 种未遇见</span>':'');}
  const lf=light(S.D,1);let h='';
  if(DIVE.on&&DIVE.bh){const z=DIVE.z;
    h+=z<70?'<p><span class="tag">含氧层</span>洞口一带是珊瑚礁，科考人员在龙洞上部记录到二十多种鱼。洞里的水和外面的海水几乎不交换，越往下越“老”。</p>'
      :z<100?'<p><span class="tag">化学跃层</span>氧气在这 30 m 里迅速耗尽，细菌开始改用硝酸盐、再用硫酸盐来“呼吸”。洞里约六成的氮在这一层被细菌转化成氮气流失。</p>'
      :'<p><span class="tag">无氧层</span>这里没有氧气，硫酸盐还原菌把硫酸盐变成硫化氢，硫化氢一直累积到约 150 m 后保持稳定。没有鱼、没有藻类，只有微生物；科研人员从龙洞里分离出的厌氧细菌中，约两成可能是新物种。</p>';
    if(z>95&&z<165)h+='<p><span class="tag">浑浊层</span>氧化和还原的交界处是硫氧化细菌的乐园，它们在 100–140 m 占了微生物的约九成；再加上悬浮的有机颗粒，这一层的海水明显发浑，手电光被散射成一片雾。</p>';
    h+='<p><span class="tag">传说</span>当地渔民称它为“南海之眼”。</p>';
    $('eco').innerHTML=h;return;}
  if(DIVE.on){const z=DIVE.z;
    h+=z<200?'<p><span class="tag">透光层</span>阳光充足，大型动物在开阔的蓝水里巡游。往下看，海水一直蓝到看不见底。</p>'
      :z<1000?'<p><span class="tag">暮光层</span>只剩微弱的蓝光。很多动物腹部长着发光器，把自己的影子“擦掉”，躲开下方的捕食者。</p>'
      :z<4000?'<p><span class="tag">午夜层</span>没有一丝阳光。这一层大约四分之三的动物都会发光。</p>'
      :z<6000?'<p><span class="tag">深渊层</span>水温约 1.5 °C，食物主要靠上方飘落的海洋雪。生物稀少而缓慢。</p>'
      :'<p><span class="tag">超深渊</span>海沟里的世界。'+(z<8200?'狮子鱼在这里活动，它们是最深处的鱼。':'这里已经低于鱼类能生存的极限。')+'</p>';
    if(DIVE.dvm)h+='<p><span class="tag">迁移</span>二战时海军声呐在几百米深处发现一层会反射声波的“假海底”，白天在深处、夜里升到表层，后来才知道是成群的灯笼鱼、磷虾等动物。一些旧海图上至今还标着当年被误认成浅滩的地方。</p>';
    if(S.D-z<60)h+=DIVE.replay?'<p><span class="tag">海沟底部</span>卡梅隆描述这里是“完全没有起伏”的柔软平原，只看到小小的端足类。</p>':'<p><span class="tag">海沟底部</span>细软的沉积物上住着巨型钩虾、海参和巨型单细胞生物。1960 年的的里雅斯特号和 2012 年卡梅隆都到过这里。</p>';
    $('eco').innerHTML=h;return;}
  if(H.coral)h+='<p><span class="tag">珊瑚</span>'+coralForm+'。海底有 '+pct(lf)+' 的绿光供共生藻光合作用。</p>';
  else if(S.D<=150)h+='<p><span class="tag">珊瑚</span>无造礁珊瑚：'+(S.temp<18?'水温 '+S.temp+' °C，低于约 18 °C':'光照只剩 '+pct(lf))+'。</p>';
  if(!H.kelp&&S.D<=35)h+='<p><span class="tag">巨藻</span>无：'+(S.temp>20?'水温高于约 20 °C，巨藻是冷水种':'光照不足')+'。</p>';
  if(H.fan)h+='<p><span class="tag">海扇</span>'+(S.D>200?'竹珊瑚被触碰时会沿枝条传出蓝色光波。':'扇面垂直于海流方向生长，最大化截留流过的浮游食物。')+'</p>';
  if(H.comb)h+='<p><span class="tag">栉水母</span>彩虹是纤毛衍射'+(S.D>200&&S.torch==='off'?'，这里没有光，打开手电才能看到。':'入射光形成的，不是自己发光。')+'</p>';
  if(S.night&&S.D<=150)h+='<p><span class="tag">夜光</span>夜光藻被扰动时会闪蓝光，鱼群、海龟游过会留下光迹。'+(S.torch==='blue'?'蓝光手电激发出珊瑚和海葵触手的绿色、橙红色荧光。':'试试蓝光手电看珊瑚荧光。')+'</p>';
  if(S.D>200&&!ARC.on)h+='<p><span class="tag">深海</span>这里没有阳光。看到的光点都是生物发光：灯笼鱼的发光器、冠水母的报警光环、'+(H.angler?'鮟鱇的诱饵、':'')+'被扰动的浮游生物。</p>';
  if(ventOn)h+='<p><span class="tag">热液</span>这里的生命不靠阳光：细菌把热液里硫化氢等物质的化学能转化成养分（化能合成），整个群落都建立在它们之上。龙旂已记录 21 类大型动物，其中 7 种是新种。</p>';
  if(TRUK.on)h+='<p><span class="tag">沉船鱼礁</span>1944 年 2 月的“冰雹行动”在这片泻湖里击沉了 45 艘以上的舰船。八十多年后，钢铁船体成了珊瑚、海绵和海鞘附着的基底：软珊瑚挂满高处的桅杆和吊杆，因为那里水流最好；甲板上结着成群的小鱼，船尾住着蓑鲉。</p>';
  if(MANG.on)h+='<p><span class="tag">蓝碳</span>海草床只占海底面积约 0.2%，却储存了海洋约 10% 的碳；它和红树林、盐沼一起被称为“蓝碳”生态系统。它们也是很多鱼虾的育幼场。</p><p><span class="tag">儒艮</span>中国南方沿海曾有以海草为食的儒艮。2022 年发表的一项调查访问了 788 位渔民，自 2000 年以来没有任何可核实的目击记录，儒艮在中国已功能性灭绝，是中国水域第一种功能性灭绝的大型脊椎动物。</p>';
  if(ABY.on)h+='<p><span class="tag">深海平原</span>深海平原占地球表面一半以上，是地球上面积最大的生境。这里的食物几乎全靠上方几千米飘落的“海洋雪”，动物都长得慢、活得久。克拉里昂-克利珀顿区已记录到 5,578 种动物，约九成还没有被科学描述，而它也是全球最大的深海采矿勘探区。</p>';
  if(ROST.on)h+='<p><span class="tag">冷水珊瑚</span>这里没有阳光，珊瑚也没有共生藻，全靠洋流送来的浮游生物为生，所以冷水珊瑚礁总长在水流强的陆坡和海脊上。勒斯特礁全长三四十公里，是已知最大的冷水珊瑚礁，2002 年才被发现，同年周围约 300 km² 海域禁止底拖网。</p>';
  if(TIDE.on)h+='<p><span class="tag">潮间带分带</span>同一块岩石上，越高的地方露出水面越久，要忍受日晒、干燥和温度剧变；越低的地方被淹得越久，但捕食者和竞争者更多。于是生物按高度排成一条条带子：滨螺、藤壶、龟足、贻贝、海藻依次往下。这种分带在世界各地的岩岸都能看到。</p><p><span class="tag">潮汐</span>潮汐主要由月球引力引起，这里每天两涨两落，每次比前一天晚约 50 分钟。</p>';
  if(SMT.on)h+='<p><span class="tag">海山</span>海山是从海底拔起、山顶仍在水下的山，大多是死火山，全球估计有几万座以上。它们把深层海流抬升、加速，带来更多食物，所以常长满珊瑚和海绵，聚集鱼群。</p><p><span class="tag">温泉孵化</span>深海水温只有 1.6 °C，章鱼卵发育很慢；岩缝里的温泉最高 10.8 °C，章鱼妈妈平均约 1.8 年就能孵出小章鱼，大约相当于在 5 °C 的水里孵化。孵化越快，卵被吃掉、母亲饿死前失败的风险就越小。</p>';
  if(ARC.on)h+='<p><span class="tag">冰缘</span>冰缘是北极春天最热闹的地方：冰底的冰藻先于浮游植物开始繁殖，端足类和桡足类啃食冰藻，北极鳕吃它们，一角鲸、白鲸、海豹和海鸟再吃北极鳕。北极鳕幼鱼体内 50–90% 的碳来自冰藻。</p><p><span class="tag">海冰在减少</span>北极夏末的海冰面积 2012 年创下最低纪录；2025 年 9 月的最低值约 460 万平方公里，与 2008 年并列有卫星记录以来第 10 低。冰期变短，正改变一角鲸、白鲸和依赖海冰的整个食物网。</p>';
  if(ICE.on)h+='<p><span class="tag">冰下</span>头顶约 2 m 厚的海冰挡住了大部分阳光，只有冰洞里照下一道光柱。冬天之后的海水几乎没有浮游生物，清澈得能看到很远；水温 −1.9 °C，是海水的冰点。你呼出的气泡会贴在冰底聚成一片片“水银”。</p><p><span class="tag">抗冻</span>这里的鱼血液里有抗冻糖蛋白，冰鱼甚至连血红蛋白都没有，血几乎是透明的。</p>';
  if(SPN.on)h+='<p><span class="tag">产卵</span>珊瑚不能移动，只好把繁殖押在“同时”上：整片礁在同一夜、同一小时释放配子，让卵和精子在水里相遇的机会最大，也让捕食者一时吃不完。1981 年科学家在大堡礁第一次记录到这种集体产卵，当时有 32 种珊瑚同时排放。</p>';
  if(brineOn)h+='<p><span class="tag">盐池</span>海底下方埋着古老的盐层，盐溶进渗出的流体，形成比海水重得多的卤水，在海底积成一个湖。湖里几乎没有氧气，误入的动物会死去；岸边却挤满了靠甲烷生活的贻贝。这个盐池 1989 年由美国海军的核动力研究潜艇 NR-1 首次探访，因此得名。</p>';
  if(wfOn)h+='<p><span class="tag">鲸落</span>据估计任何时候全球海底都躺着约 69 万具鲸骨，平均每隔约 12 km 就有一具；它们像深海里的绿洲，让生物得以在其间“跳岛”扩散。</p>';
  if(H.seep)h+='<p><span class="tag">冷泉</span>海底渗出甲烷，细菌把它当能量来源，形成白色细菌席，养活贻贝床和管栖蠕虫。这里的气泡是甲烷，不是潜水员呼出的。</p>';
  if(H.sardine)h+='<p><span class="tag">鱼群</span>沙丁鱼绕圈游成“鱼饵球”，翻身时银色鳞片会闪光。</p>';
  $('eco').innerHTML=h;
}
function hud(){
  const z=Math.max(-camera.position.y,0);
  $('hDepth').textContent='−'+fmtD(z);
  $('hZone').textContent=z<200?'透光层 · 上层带':z<1000?'暮光层 · 中层带':z<4000?'午夜层 · 深层带':z<6000?'深渊层':'超深渊层 · 海沟';
  $('hTemp').textContent='水温 '+(DIVE.on?(DIVE.bh?bhTemp(z):tempAt(z)):S.temp).toFixed(1)+' °C'+(DIVE.bh?(bhO2(z)>0.5?' · 有氧':bhO2(z)>0?' · 氧气稀薄':' · 无氧 · 含硫化氢'):'');
  const P=pressure(z);$('hPress').textContent=(P/PATM).toFixed(2)+' atm · '+Math.round(P/1000)+' kPa';
  const sE=DIVE.dvm?surfE(DVM.t):(S.night?0:1);[['bR','tR'],['bG','tG'],['bB','tB']].forEach(([b,tx],i)=>{const v=light(z,i)*sE;$(b).style.width=Math.max(0,Math.min(100,(Math.log10(Math.max(v,1e-9))+6)/6*100))+'%';$(tx).textContent=S.night&&!DIVE.dvm?'夜间':pct(v);});
}
function frameCamera(){
  const F=-S.D,deep=S.D>200,dist=deep?7:9.5;
  if(S.loc==='monterey'){controls.target.set(0,F+1.2,0);camera.position.set(4,F+2.4,7);return;}
  if(S.loc==='truk'){const D=TRUK.Hh,b0=floorY0(0,0)-1.5;const tw=(x,y,z)=>{const c=Math.cos(TRUK.yaw),s=Math.sin(TRUK.yaw);return new THREE.Vector3(x*c+z*s,b0+y,-x*s+z*c);};controls.target.copy(tw(36,D+2.5,0));camera.position.copy(tw(22,D+8,16));return;}
  if(S.loc==='mangrove'){const y=mangFloor(-5.2,0);controls.target.set(-5.6,y+0.5,0);camera.position.set(-2.6,-0.45,1.7);return;}
  if(S.loc==='nanji'){controls.target.set(-3.6,-0.9,0);camera.position.set(1.0,-0.7,2.6);return;}
  if(S.loc==='seamount'){const s=SMT.seeps[0],y=smtFloor(s[0],s[1]);controls.target.set(s[0],y+0.1,s[1]);camera.position.set(s[0]+1.3,y+0.9,s[1]+1.5);return;}
  if(S.loc==='abyss'){const y=abySurf(1.5,0);controls.target.set(1.5,y+0.35,0);camera.position.set(-2.6,y+1.9,4.4);return;}
  if(S.loc==='rost'){const c=ROST.centers[0],y=floorY(c[0],c[1]);controls.target.set(c[0],y+0.8,c[1]);camera.position.set(c[0]+2.3,y+1.5,c[1]+3.3);return;}
  if(S.loc==='arctic'){const e=arcEdge(3);controls.target.set(e+5,-2.0,-1);camera.position.set(e-2.5,-2.6,6);return;}
  if(S.loc==='ice'){controls.target.set(ICE.hx,-5.5,ICE.hz);camera.position.set(ICE.hx+7,-9,ICE.hz+9.5);return;}
  if(S.loc==='spawn'){const b=BOMMIE[0],y=floorY(b[0],b[1]),tg=new THREE.Vector3(b[0],y+1.6,b[1]);let best=null,bs=-1;
    for(let k=0;k<12;k++){const an=k/12*6.283,cp=new THREE.Vector3(b[0]+Math.cos(an)*4.3,y+1.4,b[1]+Math.sin(an)*4.3);let m=1e9;
      rocks.children.forEach(r=>{if(!r.visible)return;const p=r.position.clone();p.y=F+r.userData.base;for(let u=0;u<=1;u+=0.1){const q=cp.clone().lerp(tg,u);m=Math.min(m,q.distanceTo(p)-r.scale.x*1.1);}});
      if(m>bs){bs=m;best=cp;}}
    controls.target.copy(tg);camera.position.copy(best);return;}
  if(S.loc==='brine'){const y=floorY0(0,BR.zc)+BR.L;controls.target.set(0,y,BR.zc-2.5);camera.position.set(5.0,y+0.9,BR.zc+6.0);return;}
  if(S.loc==='vent'){const y=floorY(0,-1);controls.target.set(0,y+3.6,-1);camera.position.set(3.6,y+4.4,4.2);return;}
  if(S.loc==='whalefall'){controls.target.set(0,floorY(0,0)+0.3,0.5);camera.position.set(5.2,floorY(0,0)+3.4,5.6);return;}
  controls.target.set(0,F+(deep?1.3:1.5),0);camera.position.set(dist*0.5,F+(deep?2.2:2.9),dist*0.87);
}
function applyLocation(id){
  exitPilot();
  if(id!=='spawn'&&SPN.on){SPN.on=false;S.night=SPN.prevNight;$('spSec').hidden=true;}
  if(id==='spawn'&&!SPN.on){SPN.prevNight=S.night;S.night=true;}
  if(id!=='brine'&&brineOn)buildBrine(false);
  if(id==='dvm'){if(DIVE.on)exitDive();enterDVM();return;}
  if(id==='bluehole'){if(DIVE.on)exitDive();enterBH();return;}
  if(DIVE.on&&(DIVE.dvm||DIVE.bh))exitDive();
  if(id==='dive'||id==='replay'){enterDive(id==='replay');return;}
  if(DIVE.on)exitDive();
  const L=LOC[id];S.loc=id;
  Object.assign(S,{water:L.water,temp:L.temp,H:L.H,T:L.T,cur:L.cur,dir:L.dir,sun:L.sun,seep:!!L.seep,torch:S.night&&L.torch==='off'?'white':L.torch});
  $('sDepth').value=toSlider(L.D);$('sTemp').value=S.temp;$('sH').value=S.H;$('sT').value=S.T;$('sSun').value=S.sun;$('sCur').value=S.cur;$('sDir').value=S.dir;
  for(const k in FISH)FISH[k].active=false;for(const k in JELLY)JELLY[k].active=false;for(const k in DRIFT)DRIFT[k].active=false;
  [encWS,encSW,encSQ,encSI].forEach(e=>{e.on=false;e.cool=R(3,8);});
  S.D=L.D;frameCamera();applyDepth(L.D);
  if(id==='spawn'){SPN.on=true;SPN.play=true;SPN.rate=10;spawnColonies();spawnReset(20.95);$('spSec').hidden=false;spawnNote();zoneUpdate();readouts();}
}
const SITE={
  dive:['关岛礁壁 → 马里亚纳海沟','从关岛的礁壁出发，一路下潜到地球海洋最深处 10,935 m。沿途经过透光层、暮光层、午夜层、深渊层和海沟，各层的生物、水温、压强和光线都按实测资料变化。','左侧剖面里，珠穆朗玛峰按比例放进了海沟；可以在下方调倍速，或直接拖动深度条。'],
  replay:['重走 2012 · 深海挑战者号','按詹姆斯·卡梅隆 2012 年 3 月 26 日的真实时间线：05:15 出发，下潜 2 小时 36 分，在海底停留三个多小时，再上浮回到水面。','留意右下角的当地时间和字幕，它们对应当天的真实记录。'],
  dvm:['北太平洋开阔大洋 · 昼夜垂直迁移','在一天 24 小时里看暮光层的动物黄昏上浮、黎明下沉。这是地球上规模最大的动物迁移，二战时的声呐曾把它误认成海底。','点击下面的回声测深图跳到 19:00、50 m，看发光的迁移层从脚下升起。'],
  bluehole:['三沙永乐龙洞 · 蓝洞','西沙永乐环礁上的一口海底竖井，深约 301 m。沿洞壁从珊瑚礁一直下到洞底，穿过含氧层、化学跃层和充满硫化氢的无氧层。','100–150 m 的浑浊细菌层里能见度骤降；左侧剖面画的是洞的真实形状。'],
  xisha:['南海西沙群岛珊瑚礁 · 10 m','热带珊瑚礁：水清、光足，枝状和块状珊瑚长满礁石，海葵里住着小丑鱼，鹦嘴鱼和蝴蝶鱼在礁间觅食。','切到“夜潜”，关掉手电，用手指或鼠标在水里快速划一划，看夜光藻闪光；打开蓝光手电则能看到珊瑚荧光。'],
  truk:['密克罗尼西亚特鲁克泻湖 · 富士川丸','一艘 133 m 长的二战日本飞机运输舰，1944 年在“冰雹行动”中被击沉，至今直立着坐在约 34 m 深的沙底上，后桅几乎伸出水面。','十几米深处红光已被海水吸收，软珊瑚看上去发暗；打开白光手电，它们才显出粉红、橙红的本色。从舱口往 2 号货舱里看，还能找到拆解的战斗机。'],
  rost:['挪威罗弗敦外海 · 勒斯特冷水珊瑚礁 · 320 m','已知最大的冷水珊瑚礁，全长三四十公里。白色和橙色的深水石珊瑚长成一丛丛灌木，下面是层层堆积的死珊瑚骨架和碎屑；红色的泡泡糖珊瑚顺着海流张开，大眼的挪威平鲉悬停在礁上。','点击珊瑚看它每年只长几毫米；关掉手电，这片礁就完全沉入黑暗。'],
  arctic:['加拿大北极 · 庞德因莱特浮冰边缘','北纬约 73°，巴芬岛北端的埃克利普斯海峡。冬天海面冻成约 1.8 m 厚、连着陆地不动的固定冰；春天它的外缘一点点碎裂后退，冰缘外是开阔水面。5 月底到 6 月，一角鲸和白鲸沿着冰缘向峡湾里迁移，冰底正是冰藻繁殖最旺的时候。','头顶是被冰藻染成褐色的冰底，挂着一缕缕北极直链藻；冰缘外明亮的开阔水里，一角鲸和白鲸的小群会沿着冰缘游过，不时上浮换气。点击冰底和冰缘看说明。'],
  ice:['南极麦克默多湾 · 海冰之下','头顶是约 2 m 厚的海冰，阳光只透下百分之几，冰底被冰藻染成褐色，冰洞里照下一道光柱。水温 −1.9 °C，海底有红海星、南极海胆、玻璃海绵和巨型海蜘蛛，威德尔海豹不时从冰下游过。','抬头看冰底的片状冰和贴在冰下的气泡；在海底找一找趴着不动、几乎透明的冰鱼。'],
  mangrove:['海南陵水新村潟湖 · 海草床与红树林 · 1.6 m','一个几乎被沙坝围住的潟湖。岸边是红树林，支柱根扎进软泥；往外是海菖蒲和泰来草组成的海草床。2007 年，新村港和相邻的黎安港一起设立了我国第一个以海草床为保护对象的特别保护区。','左边是红树林的支柱根，小鱼在根间躲避捕食者；右边的海草随波摆动，水面上漂着海菖蒲的白色雄花。找找缠在海草上的海马和倒躺在泥上的倒立水母。'],
  nanji:['浙江南麂列岛 · 岩礁潮间带','温州平阳外海的南麂列岛，1990 年成为我国首批 5 个海洋自然保护区之一，1998 年加入联合国“人与生物圈”网络，以“贝藻王国”著称：已记录 422 种藻类、725 种贝类等软体动物。潮间带的岩石每天被海水淹没、露出各两次。','让潮汐播放起来，看海面怎样一点点淹过藤壶带和贻贝床；藤壶一被淹没就伸出蔓足捕食。也可以拖动“潮位”停在任一时刻。'],
  seamount:['加州戴维森海山 · 章鱼花园 · 3,200 m','蒙特雷西南约 129 km 的一座死火山，长 42 km、从海底拔起约 2,280 m。山脚一座小丘上，岩缝里渗出地热加温的海水，几千只珍珠章鱼聚在这里产卵、孵卵——2018 年才被发现，是已知最大的深海章鱼聚集地。','看温泉上方水的“抖动”，那是温水折射光线；章鱼妈妈的外套膜在一张一缩地给卵泵水。点击岩石和温泉看说明。'],
  abyss:['太平洋克拉里昂-克利珀顿区 · 深海平原 · 4,100 m','夏威夷与墨西哥之间一片约 600 万平方公里的深海平原，水深 4,000–6,000 m，水温约 1.5 °C。海底铺满土豆大小的锰结核，每一百万年只长 1–10 cm。这里已记录到 5,578 种动物，约九成从未被科学描述。','在手电光里找沿着自己的取食痕迹爬行的长尾蝶参、成群的海猪、用鳍条“站”在海底的三脚架鱼。右边那条没有结核的宽带是 1979 年采矿试验留下的车辙，点击它看 44 年后的样子。'],
  spawn:['海南三亚鹿回头 · 珊瑚产卵之夜','春季满月前后的某几个夜里，鹿角珊瑚在 21 点后的约一小时内集体释放红色的卵精束。它们缓缓上浮，像一场倒着下的雪。','把时间拖到 21:00 之前，可以看到珊瑚表面布满“含着”的卵精束；21:30 之后抬头看水面聚起的浮层。'],
  monterey:['加州蒙特雷湾巨藻林 · 12 m','冷水上升流养出的海底森林。巨藻随涌浪整片摆动，水温约 12 °C，对造礁珊瑚来说太冷了。','在“环境参数”里调大有效波高或波周期，看巨藻和海底沙纹怎样变化。'],
  eilat:['红海埃拉特中光层礁 · 55 m','红海的海水极清，55 m 深处仍有几个百分点的阳光。光越弱，珊瑚越长成扁平的盘状，好接住更多光。','看面板里的“此处剩余阳光”：红光几乎为零，所以这里的一切都是蓝绿色。'],
  slope:['南海北部陆坡 · 600 m','暮光层的底部，阳光几乎耗尽，只有手电照亮的一小片海底。灯笼鱼、银斧鱼在这一带活动，竹珊瑚被触碰时会沿枝条传出蓝光。','关掉手电，剩下的光点全部来自生物发光。'],
  deep:['南海海马冷泉 · 1,390 m','海底渗出甲烷，细菌把它当作能量来源，养活了贻贝床、管栖蠕虫和白色的细菌席。这里冒出的气泡是甲烷。','点击贻贝、管栖蠕虫和细菌席，看它们怎样靠化学能生活。'],
  brine:['墨西哥湾 NR1 海底盐池 · 650 m','比海水重得多的卤水在海底积成一个湖，有清晰的湖面和湖岸。湖里没有氧气，岸边却挤满了靠甲烷生活的贻贝。','点击湖面会荡开慢慢的波纹；贴近湖面斜看，湖面才会像镜子一样倒映出对岸。'],
  whalefall:['蒙特雷峡谷鲸落 · 1,800 m','一头灰鲸沉到海底后，几十年里会依次养活食腐动物、食骨蠕虫和靠硫化物生活的细菌群落。','拖动面板里“经过的时间”滑块，从几周快进到几十年。'],
  vent:['西南印度洋龙旂热液区 · 2,800 m','300 多摄氏度的热液从黑烟囱喷出。周围的盲虾、铁甲蜗牛、雪人蟹完全不靠阳光，而是靠细菌把热液里的化学能转化成养分。','点击烟囱和动物，看它们分别住在离热源多远的地方。']
};
function updSite(){const d=S.loc?SITE[S.loc]:null;$('siteT').textContent=d?d[0]:'自定义参数';$('siteD').textContent=d?d[1]:'在“环境参数”里改深度、水温、水质、海流和波浪，场景会按同样的物理和生态规则重新生成。';$('siteTip').innerHTML='<b>看点</b>'+(d?d[2]:'把深度拖到 200 m 以下，看珊瑚和阳光怎样消失。');}
const custom=()=>{S.loc=null;};
$('sDepth').value=toSlider(S.D);
$('sDepth').addEventListener('input',e=>{custom();applyDepth(fromSlider(+e.target.value));});
$('locSeg').addEventListener('click',e=>{const l=e.target.dataset.l;if(l)applyLocation(l);});
$('timeSeg').addEventListener('click',e=>{const t=e.target.dataset.t;if(!t)return;if(SPN.on&&t==='day'){showCaption('珊瑚只在夜里产卵','这一场景固定在夜里；想看白天的珊瑚礁，请选“西沙 · 珊瑚礁”。',5);return;}if(DIVE.dvm){DVM.t=t==='night'?22:12;dvmLight();zoneUpdate();drawEcho();dvmNote();readouts();return;}S.night=t==='night';if(S.night&&S.torch==='off')S.torch='white';rebuild();});
$('torchSeg').addEventListener('click',e=>{const k=e.target.dataset.k;if(!k)return;S.torch=k;if(DIVE.on)DIVE.manualTorch=true;rebuild();});
$('diveCta').addEventListener('click',()=>applyLocation('dive'));
const WF_MIN=Math.log10(1/52),WF_MAX=Math.log10(60);
$('sWF').value=Math.round((Math.log10(WF.t)-WF_MIN)/(WF_MAX-WF_MIN)*1000);
$('sWF').addEventListener('input',e=>{WF.t=Math.pow(10,WF_MIN+(+e.target.value/1000)*(WF_MAX-WF_MIN));applyWF();paintFloor(S.D>=6000?'hadal':'deep');zoneUpdate();readouts();});
$('infoX').addEventListener('click',()=>{$('info').hidden=true;});
$('dPlay').addEventListener('click',()=>{if(DIVE.replay?DIVE.rphase==='done':DIVE.z>=S.D-2.3)return;DIVE.play=!DIVE.play;updDiveUI();});
$('dSpeed').addEventListener('click',e=>{const v=e.target.dataset.s;if(!v)return;DIVE.speed=v;updDiveUI();diveInfo();});
$('dProg').addEventListener('input',e=>{setDiveZ(+e.target.value);zoneUpdate();});
$('dSound').addEventListener('click',()=>setSound(!AUD.on));
$('sSp').addEventListener('input',e=>{spawnReset(20+(+e.target.value)/60);spawnNote();readouts();});
$('spRate').addEventListener('click',e=>{const r=e.target.dataset.r;if(!r)return;if(r==='pause')SPN.play=!SPN.play;else{SPN.rate=+r;SPN.play=true;}spawnNote();});
function dvmRefresh(){dvmLight();zoneUpdate();drawEcho();dvmNote();readouts();}
$('sDvmT').addEventListener('input',e=>{DVM.t=(+e.target.value)/60;dvmRefresh();});
$('sDvmZ').addEventListener('input',e=>{setDiveZ(+e.target.value);DVM.z=DIVE.z;dvmRefresh();});
$('dvmRate').addEventListener('click',e=>{const r=e.target.dataset.r;if(!r)return;if(r==='pause')DVM.play=!DVM.play;else{DVM.rate=+r;DVM.play=true;}dvmNote();});
{const cv=$('echo');let drag=false;const go=e=>{const b=cv.getBoundingClientRect(),k=b.width/ECHO.W,x=(e.clientX-b.left)/k-ECHO.left,y=(e.clientY-b.top)/k-ECHO.top;
  if(ECHO.pw&&x>=0&&x<=ECHO.pw)DVM.t=Math.min(23.99,x/ECHO.pw*24);
  if(ECHO.ph&&y>=0&&y<=ECHO.ph){setDiveZ(Math.max(5,Math.min(900,y/ECHO.ph*ECHO.zmax)));DVM.z=DIVE.z;}
  dvmRefresh();};
  cv.addEventListener('pointerdown',e=>{drag=true;cv.setPointerCapture(e.pointerId);go(e);});
  cv.addEventListener('pointermove',e=>{if(drag)go(e);});
  cv.addEventListener('pointerup',()=>{drag=false;});cv.addEventListener('pointercancel',()=>{drag=false;});}

$('cSound').addEventListener('change',e=>setSound(e.target.checked));
$('waterSeg').addEventListener('click',e=>{const w=e.target.dataset.w;if(!w)return;S.water=w;custom();rebuild();});
[['sTemp','temp'],['sCur','cur'],['sDir','dir'],['sH','H'],['sT','T'],['sSun','sun']].forEach(([id,k])=>$(id).addEventListener('input',e=>{S[k]=+e.target.value;custom();rebuild();}));
$('cAdapt').addEventListener('change',e=>{S.adapt=e.target.checked;});
$('cTour').addEventListener('change',e=>{S.tour=e.target.checked;});
function setPanel(open){$('panelBody').hidden=!open;$('panel').classList.toggle('closed',!open);$('toggle').textContent=open?'收起':'展开';}
$('toggle').addEventListener('click',()=>setPanel($('panelBody').hidden));
let lastTouch=-1e9;controls.addEventListener('start',()=>{lastTouch=performance.now();});

function resize(){
  const w=window.innerWidth,h=window.innerHeight;
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<760?70:58;camera.updateProjectionMatrix();
  if(composer){composer.setSize(w,h);}
  const pr=renderer.getPixelRatio();
  U.uScale.value=h*pr/(2*Math.tan(camera.fov*Math.PI/360));
  vrResize();
}
window.addEventListener('resize',resize);

