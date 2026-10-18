/* =========================================================
   14d. Field guide: species stay hidden until met
   ========================================================= */
const CAT=[
  ['coral','造礁珊瑚','Scleractinia','0–150 m'],['kelp','巨藻','Macrocystis pyrifera','0–35 m'],['anem','公主海葵','Heteractis magnifica','0–40 m'],['clown','眼斑双锯鱼','Amphiprion ocellaris','0–40 m'],
  ['clam','长砗磲','Tridacna maxima','0–20 m'],['fanS','柳珊瑚','Gorgonacea','3–200 m'],['fanD','竹珊瑚','Isididae','200 m 以深'],['turtle','绿海龟','Chelonia mydas','0–60 m'],
  ['manta','阿氏前口蝠鲼','Mobula alfredi','0–120 m'],['whaleshark','鲸鲨','Rhincodon typus','0–150 m'],['hammer','路氏双髻鲨','Sphyrna lewini','10–300 m'],
  ['chromis','蓝绿光鳃鱼','Chromis viridis','0–30 m'],['anthias','丝鳍拟花鲈','Pseudanthias squamipinnis','0–60 m'],['butterfly','月斑蝴蝶鱼','Chaetodon lunula','0–60 m'],
  ['snapper','四线笛鲷','Lutjanus kasmira','0–80 m'],['parrot','蓝点鹦嘴鱼','Scarus ghobban','0–30 m'],['sardine','太平洋沙丁鱼','Sardinops sagax','0–200 m'],['rockfish','蓝平鲉','Sebastes mystinus','0–150 m'],
  ['urchinT','紫球海胆','Strongylocentrotus purpuratus','0–200 m'],['urchinD','冠海胆','Diadema setosum','0–70 m'],['starT','蓝指海星','Linckia laevigata','0–200 m'],['starC','蝙蝠海星','Patiria miniata','0–200 m'],
  ['moon','海月水母','Aurelia aurita','0–150 m'],['nettle','太平洋金黄水母','Chrysaora fuscescens','0–100 m'],['comb','栉水母','Ctenophora','各种深度'],
  ['sperm','抹香鲸','Physeter macrocephalus','0–2,000 m'],['lantern','灯笼鱼','Myctophidae','白天 200–1,200 m · 夜里上浮到表层'],['hatchet','银斧鱼','Argyropelecus','200–1,000 m'],
  ['siph','巨型管水母','Apolemia','300–1,000 m'],['squid','大王乌贼','Architeuthis dux','300–1,000 m'],['vampire','幽灵蛸','Vampyroteuthis infernalis','600–1,300 m'],
  ['atolla','冠水母','Atolla wyvillei','400–4,000 m'],['gulper','宽咽鱼','Eurypharynx pelecanoides','500–3,000 m'],['cucumber','游泳海参','Enypniastes eximia','500–5,000 m'],
  ['angler','黑鮟鱇','Melanocetus johnsonii','700–4,000 m'],['dumbo','烟灰蛸','Grimpoteuthis','1,000–7,000 m'],['sponge','偕老同穴','Euplectella','400–7,000 m'],
  ['seep','冷泉贻贝与管栖蠕虫','Bathymodiolus · Lamellibrachia','冷泉'],['snail','马里亚纳狮子鱼','Pseudoliparis swirei','6,000–8,200 m'],
  ['hagfish','太平洋盲鳗','Eptatretus deani','鲸落 · 深海'],['sleeper','太平洋睡鲨','Somniosus pacificus','0–2,000 m'],
  ['osedax','食骨蠕虫','Osedax','鲸落'],['crab','深海石蟹','Lithodidae','鲸落 · 深海'],
  ['rimicaris','盲虾','Rimicaris kairei','印度洋热液区'],['kiwa','雪人蟹','Kiwa sp.','热液区'],['scalyfoot','鳞角腹足蜗牛（铁甲蜗牛）','Chrysomallon squamiferum','印度洋热液区'],
  ['giga','盾巨螺','Gigantopelta aegis','西南印度洋热液区'],['ventmussel','印度洋深海偏顶蛤','Bathymodiolus marisindicus','印度洋热液区'],
  ['barnacle','柄藤壶','Neolepas','热液区外圈'],['ventanem','深海海葵','Actinostolidae','热液区外圈'],
  ['acropora','鹿角珊瑚（产卵中）','Acropora','0–30 m · 每年集体产卵'],['dendro','软珊瑚','Dendronephthya 等','0–50 m · 沉船与礁石'],['baitfish','小型饵鱼群','Atherinidae 等','热带浅海'],['jack','鲹','Caranx','热带浅海'],['lionfish','魔鬼蓑鲉','Pterois volitans','0–50 m · 印度—太平洋'],['lophelia','深水石珊瑚（佩尔图萨珊瑚）','Desmophyllum pertusum','80–3,000 m · 4–12 °C'],['paragorgia','泡泡糖珊瑚','Paragorgia arborea','冷水 · 200–1,300 m'],['redfish','挪威平鲉','Sebastes norvegicus','北大西洋 · 100–1,000 m'],['geodia','球海绵','Geodia','北大西洋深海'],['acesta','大锉蛤','Acesta excavata','冷水珊瑚礁'],['seal','威德尔海豹','Leptonychotes weddellii','南极海冰下'],['icefish','冰鱼（白血鱼）','Channichthyidae','南大洋 · −1.8–2 °C'],['borch','秃南极鱼','Pagothenia borchgrevinki','南极海冰底下'],['icealgae','冰藻','海冰底部的硅藻群落','南北极海冰底部'],['odontaster','南极红海星','Odontaster validus','南大洋'],['sterechinus','南极海胆','Sterechinus neumayeri','南大洋'],['pycno','巨型海蜘蛛','Pycnogonida','南大洋海底'],['rossella','南极玻璃海绵','Rossellidae','南大洋'],['childressi','墨西哥湾甲烷贻贝','Bathymodiolus childressi','墨西哥湾冷泉 · 盐池岸边'],['krill','磷虾','Euphausiidae','0–500 m · 每天上下迁移'],['salp','樽海鞘','Salpa aspera','0–800 m · 每天上下迁移'],['amphi','巨型钩虾','Hirondellea gigas','海沟底部'],['holo','超深渊海参','Elpidiidae','海沟底部'],['xeno','巨型单细胞生物','Xenophyophorea','海沟底部']
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
    case'starT':return H.star&&S.temp>=18&&nearF&&seeDist(false)>4;
    case'starC':return H.star&&S.temp<18&&!ICE.on&&nearF&&seeDist(false)>4;
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
  $('catN').textContent='已遇见 '+FOUND.size+' / '+CAT.length;$('catBar').style.width=(FOUND.size/CAT.length*100)+'%';
  const sc=k=>SHARE.live&&SHARE.cnt[k]?'<b class="shc" title="'+SHARE.cnt[k]+' 位探险者遇见过">'+SHARE.cnt[k]+'人</b>':'';
  $('cat').innerHTML=CAT.map(c=>FOUND.has(c[0])?'<span class="sp" title="'+c[2]+'">'+c[1]+sc(c[0])+'</span>':'<span class="sp unk">？？？<i>'+c[3]+'</i>'+sc(c[0])+'</span>').join('');
  if(typeof shareRender==='function')shareRender();
}
function stepToast(dt){
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('on');return;}
  if(toastQ.length){const c=toastQ.shift();$('toast').innerHTML=c.mission?'任务完成：'+c.mission.t:'新遇见：'+c[1]+'<i>'+c[2]+'</i>';$('toast').classList.add('on');toastT=3.2;}
}

