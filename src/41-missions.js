/* =========================================================
   14t. Exploration missions: goals built on the field guide and on where you have been
   ========================================================= */
const MS={visited:new Set(),maxD:0,dist:0,flags:{},done:new Set(),t:0,last:null};
try{const o=JSON.parse(localStorage.getItem('seafloor-missions')||'{}');if(o.v)o.v.forEach(x=>MS.visited.add(x));MS.maxD=o.m||0;MS.dist=o.d||0;MS.flags=o.f||{};if(o.done)o.done.forEach(x=>MS.done.add(x));}catch(e){}
function saveMS(){try{localStorage.setItem('seafloor-missions',JSON.stringify({v:[...MS.visited],m:MS.maxD,d:Math.round(MS.dist),f:MS.flags,done:[...MS.done]}));}catch(e){}}
const cnt=keys=>keys.filter(k=>FOUND.has(k)).length;
const MISSIONS=[
  {id:'reef',t:$t('珊瑚礁新手'),d:$t('在热带珊瑚礁认识 5 种生物。'),go:'xisha',n:5,p:()=>cnt(['coral','anem','clown','clam','chromis','anthias','butterfly','snapper','parrot','urchinD','starT','turtle','manta','fanS']),
    w:$t('珊瑚礁只占海底面积的不到 1%，却养活了约四分之一的海洋物种。')},
  {id:'glow',t:$t('会发光的深海'),d:$t('找到 3 种会发光的生物（深海、夜里或冰下都有）。'),go:'slope',n:3,p:()=>cnt(['lantern','hatchet','atolla','angler','vampire','gulper','siph','krill','fanD']),
    w:$t('在深海的水层里，约四分之三的动物会发光，大多发出海水最透明的蓝光。')},
  {id:'chemo',t:$t('不靠阳光的生命'),d:$t('找到 3 种靠化学能（甲烷或硫化物）生活的生物。'),go:'vent',n:3,p:()=>cnt(['seep','rimicaris','scalyfoot','kiwa','giga','ventmussel','childressi']),
    w:$t('1977 年在加拉帕戈斯热液区的发现，让人们第一次知道整个生态系统可以不依赖阳光。')},
  {id:'giants',t:$t('遇见巨兽'),d:$t('在下潜途中遇见鲸鲨、抹香鲸和大王乌贼。'),go:'dive',n:3,p:()=>cnt(['whaleshark','sperm','squid']),
    w:$t('抹香鲸能下潜到两千米以下捕食大王乌贼，两者的搏斗至今没有人亲眼见过。')},
  {id:'bottom',t:$t('到达最深处'),d:$t('下潜到挑战者深渊，10,900 m 以下。'),go:'dive',n:1,p:()=>MS.maxD>=10900?1:0,
    w:$t('至今只有二十多人到过挑战者深渊；首次是 1960 年的的里雅斯特号。')},
  {id:'whale',t:$t('鲸落的三幕'),d:$t('在鲸落找齐盲鳗、睡鲨和食骨蠕虫（拖动时间滑块）。'),go:'whalefall',n:3,p:()=>cnt(['hagfish','sleeper','osedax']),
    w:$t('一头鲸的遗体能在深海养活一个群落几十年。')},
  {id:'dvm',t:$t('夜里的迁移'),d:$t('在昼夜垂直迁移场景里，夜里在 100 m 以浅遇见灯笼鱼。'),go:'dvm',n:1,p:()=>MS.flags.dvm?1:0,
    w:$t('中层鱼类的总重量可能超过一百亿吨，它们每晚上下迁移，把表层的碳带进深海。')},
  {id:'extreme',t:$t('极端之地'),d:$t('到过热液喷口、海底盐池、蓝洞的无氧层和南极海冰之下。'),go:'brine',n:4,p:()=>['vent','brine','anoxic','ice'].filter(k=>MS.visited.has(k)).length,
    w:$t('这些地方的高温、高盐、无氧或冰冷，让科学家思考：地外海洋里会不会也有生命。')},
  {id:'ice',t:$t('冰下的生命'),d:$t('在南极海冰下遇见冰鱼和威德尔海豹。'),go:'ice',n:2,p:()=>cnt(['icefish','seal']),
    w:$t('冰鱼的血里没有血红蛋白，是唯一这样的脊椎动物。')},
  {id:'arctic',t:$t('冰缘的独角兽'),d:$t('在北极浮冰边缘遇见一角鲸和白鲸。'),go:'arctic',n:2,p:()=>cnt(['narwhal','beluga']),
    w:$t('一角鲸的长牙其实是一颗牙齿，表面有多达一千万个神经末梢。')},
  {id:'spawn',t:$t('一年一度的夜'),d:$t('看到鹿角珊瑚集体产卵。'),go:'spawn',n:1,p:()=>cnt(['acropora']),
    w:$t('珊瑚集体产卵直到 1981 年才被科学家第一次完整记录。')},
  {id:'pilot',t:$t('自由驾驶员'),d:$t('用自由驾驶累计游出 50 m。'),go:null,n:50,p:()=>Math.min(50,Math.floor(MS.dist)),
    w:$t('系缆式水下机器人（ROV）是今天深海科考的主力工具之一。')},
  {id:'all',t:$t('图鉴达人'),d:$t('图鉴收集 50 种生物。'),go:null,n:50,p:()=>Math.min(50,FOUND.size),
    w:$t('科学家估计海洋里约九成的物种还没有被描述过。')}
];
function stepMissions(rdt){
  if(S.loc)MS.visited.add(S.loc);
  if(DIVE.on){MS.maxD=Math.max(MS.maxD,camZ());if(DIVE.bh&&DIVE.z>100)MS.visited.add('anoxic');
    if(DIVE.dvm&&S.night&&DIVE.z<100&&FISH.lantern.active)MS.flags.dvm=1;}
  if(PILOT.on){if(MS.last)MS.dist+=MS.last.distanceTo(camera.position);MS.last=(MS.last||new THREE.Vector3()).copy(camera.position);}else MS.last=null;
  MS.t+=rdt;if(MS.t<1)return;MS.t=0;
  let changed=false;
  for(const m of MISSIONS){if(MS.done.has(m.id))continue;if(m.p()>=m.n){MS.done.add(m.id);changed=true;toastQ.push({mission:m});if(!TOUR.on)showCaption($t('任务完成：')+m.t,m.w,7);}}
  if(changed)saveMS();
  renderMissions();
}
let msHTML='';
function renderMissions(){
  const h=MISSIONS.map(m=>{const v=Math.min(m.n,m.p()),dn=MS.done.has(m.id);
    return '<li class="'+(dn?'done':'')+'"><div class="mt"><b>'+(dn?'✓ ':'')+m.t+'</b><span>'+v+' / '+m.n+'</span></div><p>'+m.d+(dn?'':m.go&&S.loc!==m.go?' <button type="button" data-go="'+m.go+$t('">前往</button>'):'')+'</p><div class="prog"><div style="width:'+(v/m.n*100)+'%"></div></div></li>';}).join('');
  if(h!==msHTML){msHTML=h;$('missions').innerHTML=h;}
  $('msN').textContent=$t('已完成 ')+MS.done.size+' / '+MISSIONS.length;
}
$('missions').addEventListener('click',e=>{const g=e.target.dataset&&e.target.dataset.go;if(g)applyLocation(g);});

