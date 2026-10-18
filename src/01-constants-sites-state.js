/* =========================================================
   1. Physical constants, sites, state
   ========================================================= */
const RHO=1025, G=9.81, PATM=101325, N_WATER=1.34;
const WATER={
  clear:    {a:[0.345,0.060,0.018], b:[0.03,0.035,0.045]},
  ocean:    {a:[0.360,0.075,0.050], b:[0.15,0.18,0.20]},
  temperate:{a:[0.370,0.085,0.120], b:[0.17,0.19,0.22]},
  coastal:  {a:[0.420,0.150,0.350], b:[0.60,0.65,0.70]},
  arctic:   {a:[0.355,0.072,0.045], b:[0.07,0.08,0.09]},  /* clear early-season polar water with a little phytoplankton */
  lagoon:   {a:[0.450,0.120,0.300], b:[0.35,0.40,0.45]}   /* turbid, plankton- and CDOM-rich: blue absorbed strongly, so the water looks green */
};
const LOC={
  xisha:   {name:'南海西沙群岛珊瑚礁',D:10,water:'clear',temp:28,H:0.8,T:6,cur:0.15,dir:120,sun:75,torch:'off'},
  monterey:{name:'加州蒙特雷湾巨藻林',D:12,water:'temperate',temp:12,H:1.6,T:12,cur:0.08,dir:30,sun:55,torch:'off'},
  eilat:   {name:'红海埃拉特中光层礁',D:55,water:'clear',temp:23,H:0.5,T:5,cur:0.12,dir:200,sun:65,torch:'off'},
  slope:   {name:'南海北部陆坡',D:600,water:'clear',temp:7,H:1.5,T:8,cur:0.10,dir:60,sun:60,torch:'white'},
  deep:    {name:'南海海马冷泉',D:1390,water:'clear',temp:3,H:1.5,T:8,cur:0.05,dir:90,sun:60,torch:'white',seep:true},
  mangrove:{name:'海南陵水新村潟湖 · 海草床与红树林',D:1.6,water:'lagoon',temp:28,H:0.3,T:5,cur:0.05,dir:30,sun:70,torch:'off'},
  abyss:   {name:'太平洋克拉里昂-克利珀顿区 · 深海平原',D:4100,water:'clear',temp:1.5,H:1.5,T:10,cur:0.04,dir:60,sun:60,torch:'white'},
  vent:    {name:'西南印度洋龙旂热液区',D:2800,water:'clear',temp:1.8,H:1.5,T:10,cur:0.05,dir:60,sun:60,torch:'white'},
  whalefall:{name:'蒙特雷峡谷鲸落',D:1800,water:'clear',temp:2.2,H:1.5,T:10,cur:0.04,dir:40,sun:60,torch:'white'},
  bluehole:{name:'三沙永乐龙洞',D:300.9,water:'clear',temp:30,H:0.6,T:6,cur:0.01,dir:60,sun:70,torch:'off'},
  truk:    {name:'密克罗尼西亚特鲁克泻湖 · 富士川丸沉船',D:34,water:'clear',temp:28,H:0.5,T:6,cur:0.02,dir:90,sun:70,torch:'off'},
  rost:    {name:'挪威罗弗敦外海 · 勒斯特冷水珊瑚礁',D:320,water:'clear',temp:7,H:2,T:10,cur:0.15,dir:30,sun:40,torch:'white'},
  arctic:  {name:'加拿大北极庞德因莱特 · 浮冰边缘',D:300,water:'arctic',temp:-1.6,H:0.2,T:5,cur:0.04,dir:90,sun:35,torch:'off'},
  seamount:{name:'加州戴维森海山 · 章鱼花园',D:3200,water:'clear',temp:1.6,H:1.5,T:10,cur:0.04,dir:60,sun:60,torch:'white'},
  ice:     {name:'南极麦克默多湾 · 海冰之下',D:24,water:'clear',temp:-1.9,H:0,T:8,cur:0.02,dir:60,sun:25,torch:'off'},
  spawn:   {name:'海南三亚鹿回头珊瑚礁 · 产卵之夜',D:6,water:'ocean',temp:27,H:0.5,T:6,cur:0.05,dir:120,sun:70,torch:'white'},
  brine:   {name:'墨西哥湾 NR1 海底盐池',D:650,water:'clear',temp:6.5,H:1.5,T:8,cur:0.02,dir:60,sun:60,torch:'white'},
  dvm:     {name:'北太平洋副热带开阔大洋',D:4800,water:'clear',temp:26,H:1.2,T:8,cur:0.05,dir:90,sun:60,torch:'off'},
  replay:  {name:'重走 2012 · 深海挑战者号',D:10898,water:'clear',temp:28.5,H:1.2,T:8,cur:0.02,dir:90,sun:70,torch:'off'},
  dive:    {name:'关岛礁壁 → 马里亚纳海沟',D:10935,water:'clear',temp:28.5,H:1.2,T:8,cur:0.02,dir:90,sun:70,torch:'off'}
};
const S={D:10,H:0.8,T:6,sun:75,water:'clear',adapt:true,temp:28,cur:0.15,dir:120,loc:null,seep:false,night:false,torch:'off',tour:true};
const W={k:0,w:0,L:0};
const OPT={K:[0,0,0],c:[0,0,0],mu0:1,zenW:0,sunDir:new THREE.Vector3(0,1,0)};
const CUR={x:1,z:0};
const Z0=0.003;
const pressure=z=>PATM+RHO*G*Math.max(z,0);
function curProfile(zab){const h=Math.max(S.D,0.05);return Math.max(0,Math.log(Math.max(zab,Z0*1.2)/Z0)/(Math.log(h/Z0)-1));}
const MU_T=[[0,1.88],[5,1.61],[10,1.39],[15,1.22],[20,1.08],[25,0.96],[30,0.87],[35,0.80]];
function viscosity(T){for(let i=1;i<MU_T.length;i++){if(T<=MU_T[i][0]){const[t0,m0]=MU_T[i-1],[t1,m1]=MU_T[i];return(m0+(m1-m0)*(T-t0)/(t1-t0))*1e-3;}}return 0.8e-3;}
function solveWave(){W.w=2*Math.PI/S.T;let k=W.w*W.w/G;for(let i=0;i<40;i++)k=W.w*W.w/(G*Math.tanh(Math.min(k*S.D,30)));W.k=k;W.L=2*Math.PI/k;}
function orbital(x,y,t,out){
  const h=S.D,z=Math.min(Math.max(-y,0),h),k=W.k,A=S.H/2*W.w;let fu,fw;
  if(k*h>15){fu=Math.exp(-k*z);fw=fu;}else{const sh=Math.sinh(k*h);fu=Math.cosh(k*(h-z))/sh;fw=Math.sinh(k*(h-z))/sh;}
  const ph=k*x-W.w*t;
  out.x=A*fu*Math.cos(ph);out.y=A*fw*Math.sin(ph);out.z=0;
  if(S.cur>0){const f=S.cur*curProfile(y+S.D);out.x+=f*CUR.x;out.z+=f*CUR.z;}
  return out;
}
function floorOrbitalMax(){const kh=W.k*S.D;return kh>15?0:(S.H/2*W.w)/Math.sinh(kh);}
function riseSpeed(r){
  const mu=viscosity(S.temp),vs=rr=>2*RHO*G*rr*rr/(9*mu);
  if(r<1e-4)return vs(r);
  if(r<7e-4){const v1=vs(1e-4),t=Math.log(r/1e-4)/Math.log(7);return v1*Math.pow(0.22/v1,t);}
  if(r<5e-3)return 0.22;
  return 0.711*Math.sqrt(G*2*r);
}
const light=(z,i)=>Math.exp(-OPT.K[i]*Math.max(z,0));

/* helpers */
let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
const R=(a,b)=>a+(b-a)*rnd();
const sstep=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const mixc=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
function floorH(x,z){const f=Math.exp(-(x*x+z*z)/(2*70*70));return f*(0.7*Math.sin(x*0.13+1.3)*Math.cos(z*0.11)+0.35*Math.sin(x*0.37+z*0.29)+0.18*Math.sin(z*0.8-x*0.3));}
const floorY0=(x,z)=>-S.D+floorH(x,z);
let brineOn=false,mangOn=false,smtOn=false;
const floorY=(x,z)=>mangOn?mangFloor(x,z):smtOn?smtFloor(x,z):brineOn?brineFloor(x,z):floorY0(x,z);
const UP=new THREE.Vector3(0,1,0),ORIGIN=new THREE.Vector3();
const _u={x:0,y:0,z:0},_m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_s=new THREE.Vector3(),_p=new THREE.Vector3(),_d=new THREE.Vector3(),_e=new THREE.Euler();

/* geometry builder: merges parts into one non-indexed geometry with colours */
function Acc(){return{pos:[],nor:[],col:[],ex:{}};}
function addGeo(acc,g0,m,colFn,extra){
  const g=g0.index?g0.toNonIndexed():g0.clone();
  if(m)g.applyMatrix4(m);
  const p=g.attributes.position.array,n=g.attributes.normal.array;
  for(let i=0;i<p.length;i+=3){
    acc.pos.push(p[i],p[i+1],p[i+2]);acc.nor.push(n[i],n[i+1],n[i+2]);
    const c=colFn?colFn(p[i],p[i+1],p[i+2]):[1,1,1];acc.col.push(c[0],c[1],c[2]);
    if(extra)for(const k in extra)(acc.ex[k]=acc.ex[k]||[]).push(extra[k](p[i],p[i+1],p[i+2]));
  }
}
function finishGeo(acc){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(acc.pos,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(acc.nor,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(acc.col,3));
  for(const k in acc.ex)g.setAttribute(k,new THREE.Float32BufferAttribute(acc.ex[k],1));
  return g;
}
function triGeo(pts,ny){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(pts.map((_,k)=>(ny?k%3===1:k%3===0)?1:0),3));return g;}
function latheZ(profile,seg){const g=new THREE.LatheGeometry(profile.map(([r,z])=>new THREE.Vector2(Math.max(r,0.0005),z)),seg||16);g.rotateX(Math.PI/2);return g;}
const M4=(x,y,z,rx,ry,rz,sx,sy,sz)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),new THREE.Vector3(sx||1,sy==null?(sx||1):sy,sz==null?(sx||1):sz));

