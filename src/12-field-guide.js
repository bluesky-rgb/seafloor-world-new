/* =========================================================
   14d. Field guide: species stay hidden until met
   ========================================================= */
const CAT=[
  ['coral',$t('造礁珊瑚'),'Scleractinia','0–150 m'],['kelp',$t('巨藻'),'Macrocystis pyrifera','0–35 m'],['anem',$t('公主海葵'),'Heteractis magnifica','0–40 m'],['clown',$t('眼斑双锯鱼'),'Amphiprion ocellaris','0–40 m'],
  ['clam',$t('长砗磲'),'Tridacna maxima','0–20 m'],['fanS',$t('柳珊瑚'),'Gorgonacea','3–200 m'],['fanD',$t('竹珊瑚'),'Isididae',$t('200 m 以深')],['turtle',$t('绿海龟'),'Chelonia mydas','0–60 m'],
  ['manta',$t('阿氏前口蝠鲼'),'Mobula alfredi','0–120 m'],['whaleshark',$t('鲸鲨'),'Rhincodon typus','0–150 m'],['hammer',$t('路氏双髻鲨'),'Sphyrna lewini','10–300 m'],
  ['chromis',$t('蓝绿光鳃鱼'),'Chromis viridis','0–30 m'],['anthias',$t('丝鳍拟花鲈'),'Pseudanthias squamipinnis','0–60 m'],['butterfly',$t('月斑蝴蝶鱼'),'Chaetodon lunula','0–60 m'],
  ['snapper',$t('四线笛鲷'),'Lutjanus kasmira','0–80 m'],['parrot',$t('蓝点鹦嘴鱼'),'Scarus ghobban','0–30 m'],['sardine',$t('太平洋沙丁鱼'),'Sardinops sagax','0–200 m'],['rockfish',$t('蓝平鲉'),'Sebastes mystinus','0–150 m'],
  ['urchinT',$t('紫球海胆'),'Strongylocentrotus purpuratus','0–200 m'],['urchinD',$t('冠海胆'),'Diadema setosum','0–70 m'],['starT',$t('蓝指海星'),'Linckia laevigata','0–200 m'],['starC',$t('蝙蝠海星'),'Patiria miniata','0–200 m'],
  ['moon',$t('海月水母'),'Aurelia aurita','0–150 m'],['nettle',$t('太平洋金黄水母'),'Chrysaora fuscescens','0–100 m'],['comb',$t('栉水母'),'Ctenophora',$t('各种深度')],
  ['sperm',$t('抹香鲸'),'Physeter macrocephalus','0–2,000 m'],['lantern',$t('灯笼鱼'),'Myctophidae',$t('白天 200–1,200 m · 夜里上浮到表层')],['hatchet',$t('银斧鱼'),'Argyropelecus','200–1,000 m'],
  ['siph',$t('巨型管水母'),'Apolemia','300–1,000 m'],['squid',$t('大王乌贼'),'Architeuthis dux','300–1,000 m'],['vampire',$t('幽灵蛸'),'Vampyroteuthis infernalis','600–1,300 m'],
  ['atolla',$t('冠水母'),'Atolla wyvillei','400–4,000 m'],['gulper',$t('宽咽鱼'),'Eurypharynx pelecanoides','500–3,000 m'],['cucumber',$t('游泳海参'),'Enypniastes eximia','500–5,000 m'],
  ['angler',$t('黑鮟鱇'),'Melanocetus johnsonii','700–4,000 m'],['dumbo',$t('烟灰蛸'),'Grimpoteuthis','1,000–7,000 m'],['sponge',$t('偕老同穴'),'Euplectella','400–7,000 m'],
  ['seep',$t('冷泉贻贝与管栖蠕虫'),'Bathymodiolus · Lamellibrachia',$t('冷泉')],['snail',$t('马里亚纳狮子鱼'),'Pseudoliparis swirei','6,000–8,200 m'],
  ['hagfish',$t('太平洋盲鳗'),'Eptatretus deani',$t('鲸落 · 深海')],['sleeper',$t('太平洋睡鲨'),'Somniosus pacificus','0–2,000 m'],
  ['osedax',$t('食骨蠕虫'),'Osedax',$t('鲸落')],['crab',$t('深海石蟹'),'Lithodidae',$t('鲸落 · 深海')],
  ['rimicaris',$t('盲虾'),'Rimicaris kairei',$t('印度洋热液区')],['kiwa',$t('雪人蟹'),'Kiwa sp.',$t('热液区')],['scalyfoot',$t('鳞角腹足蜗牛（铁甲蜗牛）'),'Chrysomallon squamiferum',$t('印度洋热液区')],
  ['giga',$t('盾巨螺'),'Gigantopelta aegis',$t('西南印度洋热液区')],['ventmussel',$t('印度洋深海偏顶蛤'),'Bathymodiolus marisindicus',$t('印度洋热液区')],
  ['barnacle',$t('柄藤壶'),'Neolepas',$t('热液区外圈')],['ventanem',$t('深海海葵'),'Actinostolidae',$t('热液区外圈')],
  ['acropora',$t('鹿角珊瑚（产卵中）'),'Acropora',$t('0–30 m · 每年集体产卵')],['dendro',$t('软珊瑚'),$t('Dendronephthya 等'),$t('0–50 m · 沉船与礁石')],['baitfish',$t('小型饵鱼群'),$t('Atherinidae 等'),$t('热带浅海')],['jack',$t('鲹'),'Caranx',$t('热带浅海')],['lionfish',$t('魔鬼蓑鲉'),'Pterois volitans',$t('0–50 m · 印度—太平洋')],['lophelia',$t('深水石珊瑚（佩尔图萨珊瑚）'),'Desmophyllum pertusum','80–3,000 m · 4–12 °C'],['paragorgia',$t('泡泡糖珊瑚'),'Paragorgia arborea',$t('冷水 · 200–1,300 m')],['redfish',$t('挪威平鲉'),'Sebastes norvegicus',$t('北大西洋 · 100–1,000 m')],['geodia',$t('球海绵'),'Geodia',$t('北大西洋深海')],['acesta',$t('大锉蛤'),'Acesta excavata',$t('冷水珊瑚礁')],['seal',$t('威德尔海豹'),'Leptonychotes weddellii',$t('南极海冰下')],['icefish',$t('冰鱼（白血鱼）'),'Channichthyidae',$t('南大洋 · −1.8–2 °C')],['borch',$t('秃南极鱼'),'Pagothenia borchgrevinki',$t('南极海冰底下')],['icealgae',$t('冰藻'),$t('海冰底部的硅藻群落'),$t('南北极海冰底部')],['odontaster',$t('南极红海星'),'Odontaster validus',$t('南大洋')],['sterechinus',$t('南极海胆'),'Sterechinus neumayeri',$t('南大洋')],['pycno',$t('巨型海蜘蛛'),'Pycnogonida',$t('南大洋海底')],['rossella',$t('南极玻璃海绵'),'Rossellidae',$t('南大洋')],['childressi',$t('墨西哥湾甲烷贻贝'),'Bathymodiolus childressi',$t('墨西哥湾冷泉 · 盐池岸边')],['krill',$t('磷虾'),'Euphausiidae',$t('0–500 m · 每天上下迁移')],['salp',$t('樽海鞘'),'Salpa aspera',$t('0–800 m · 每天上下迁移')],['amphi',$t('巨型钩虾'),'Hirondellea gigas',$t('海沟底部')],['holo',$t('超深渊海参'),'Elpidiidae',$t('海沟底部')],['xeno',$t('巨型单细胞生物'),'Xenophyophorea',$t('海沟底部')]
];
const CATMAP={};CAT.forEach(c=>CATMAP[c[0]]=c);
const SHARE={live:false,cnt:{},n:0,db:null,uid:null,canWrite:null,sent:'',busy:false,state:''};
let FOUND=new Set();
try{const v=localStorage.getItem('seafloor-found');if(v)FOUND=new Set(JSON.parse(v));}catch(e){}
function seeDist(glow){const z=camZ();let d=(!S.night&&light(z,1)>2e-3)?Math.min(32,4/OPT.c[1]):0;if(S.torch!=='off')d=Math.max(d,14);if(glow)d=Math.max(d,24);return d;}
function minDist(arr,n){const c=camera.position,st=Math.max(1,Math.floor(n/48));let m=1e9;for(let i=0;i<n;i+=st){const o=i*3,d=Math.hypot(arr[o]-c.x,arr[o+1]-c.y,arr[o+2]-c.z);if(d<m)m=d;}return m;}
function isSeen(k){
  const c=camera.position,nearF=(S.D-camZ())<28;
  if(FISH[k])return FISH[k].active&&minDist(FISH[k].p,FISH[k].n)<seeDist(!!FISH[k].glow);
  if(JELLY[k])return JELLY[k].active&&minDist(JELLY[k].p,JELLY[k].n)<seeDist(k==='atolla');
  if(DRIFT[k])return DRIFT[k].active&&minDist(DRIFT[k].p,DRIFT[k].n)<seeDist(DRIFT[k].glows);
  switch(k){
    case'whaleshark':return encWS.on&&encWS.pos.distanceTo(c)<seeDist(false)+4;
    case'sperm':return encSW.on&&encSW.pos.distanceTo(c)<seeDist(false)+6;
    case'squid':return encSQ.on&&encSQ.pos.distanceTo(c)<seeDist(false)+1;
    case'siph':return encSI.on&&encSI.pos.distanceTo(c)<seeDist(true)+10;
    case'manta':return mantaOn&&mantas.some(m=>m.position.distanceTo(c)<seeDist(false));
    case'turtle':return turtleOn&&turtles.some(g=>g.position.distanceTo(c)<seeDist(false));
    case'angler':return anglerOn&&anglers.some(g=>g.position.distanceTo(c)<seeDist(true));
    case'acropora':return SPN.on&&SPN.t>21.02;
    case'fanS':return H.fan&&S.D<=200&&nearF&&seeDist(false)>4;
    case'fanD':return H.fan&&S.D>200&&!ROST.on&&nearF;
    case'paragorgia':return H.fan&&ROST.on&&nearF;
    case'lophelia':return ROST.on&&nearF;
    case'geodia':return ROST.on&&nearF;
    case'acesta':return ROST.on&&nearF&&seeDist(false)>6;
    case'starT':return H.star&&habTemp()>=18&&nearF&&seeDist(false)>4;
    case'starC':return H.star&&habTemp()<18&&!ICE.on&&nearF&&seeDist(false)>4;
    case'urchinT':return !!H.urchinT&&!ICE.on&&nearF&&seeDist(false)>4;
    case'sponge':return !!H.sponge&&!ICE.on&&nearF;
    case'odontaster':return ICE.on&&H.star&&nearF;
    case'sterechinus':return ICE.on&&H.urchinT&&nearF;
    case'rossella':return ICE.on&&nearF;
    case'pycno':return ICE.on&&nearF;
    case'icealgae':return ICE.on||ARC.on;
    case'narwhal':return podSeen('narwhal');
    case'beluga':return podSeen('beluga');
    case'melosira':return ARC.on&&camera.position.x<arcEdge(camera.position.z)+6&&camera.position.y>-ARC.h-12;
    case'seal':return encSeal.on&&encSeal.pos.distanceTo(c)<seeDist(false)+4;
    default:return !!H[k]&&nearF&&seeDist(false)>(S.D-camZ())+2;
  }
}
const toastQ=[];let toastT=0;
function checkDiscover(){
  let changed=false;
  for(const c of CAT){if(FOUND.has(c[0]))continue;if(isSeen(c[0])){FOUND.add(c[0]);changed=true;toastQ.push(c);}}
  if(changed){try{localStorage.setItem('seafloor-found',JSON.stringify([...FOUND]));}catch(e){}renderCatalog();}
}
function renderCatalog(){
  $('catN').textContent=$t('已遇见 ')+FOUND.size+' / '+CAT.length;$('catBar').style.width=(FOUND.size/CAT.length*100)+'%';
  const sc=k=>SHARE.live&&SHARE.cnt[k]?'<b class="shc" title="'+SHARE.cnt[k]+$t(' 位探险者遇见过">')+SHARE.cnt[k]+$t('人</b>'):'';
  $('cat').innerHTML=CAT.map(c=>FOUND.has(c[0])?'<span class="sp" title="'+c[2]+'">'+c[1]+sc(c[0])+'</span>':$t('<span class="sp unk">？？？<i>')+c[3]+'</i>'+sc(c[0])+'</span>').join('');
  if(typeof shareRender==='function')shareRender();
}
function stepToast(dt){
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('on');return;}
  if(toastQ.length){const c=toastQ.shift();$('toast').innerHTML=c.mission?$t('任务完成：')+c.mission.t:$t('新遇见：')+c[1]+'<i>'+c[2]+'</i>';$('toast').classList.add('on');toastT=3.2;}
}

