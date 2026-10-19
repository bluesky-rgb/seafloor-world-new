/* =========================================================
   14x. World ocean floor overview from real measured data: ETOPO 20-arc-minute global relief (NOAA, public domain,
   as distributed with the basemap examples), quantized to 8 bits (~60 m steps). Each cell is ~37 km across, so narrow
   trenches are averaged shallower than they really are (Mariana: ~9,000 m here vs 10,935 m measured).
   ========================================================= */
const MAP={W:1080,H:540,h:null,img:null,sel:[],prof:null};
const SITE_LL={nanji:[27.45,121.05],seamount:[35.72,-122.72],arctic:[72.9,-77.6],mangrove:[18.42,109.97],abyss:[12,-125],xisha:[16.5,111.6],spawn:[18.2,109.5],bluehole:[16.52,111.77],slope:[20.2,115.5],deep:[16.7,110.5],monterey:[36.6,-121.9],whalefall:[36.6,-122.4],
  eilat:[29.5,34.95],brine:[27.7,-91.3],vent:[-37.8,49.65],dvm:[22.75,-158],ice:[-77.8,166.6],rost:[67.5,9.4],truk:[7.4,151.8],dive:[13.4,144.7],replay:[11.37,142.59]};
function mapDecode(){if(MAP.h)return;const b=atob(window.ETOPO_B64),n=b.length,h=new Float32Array(n);for(let i=0;i<n;i++)h[i]=b.charCodeAt(i)/255*15400-9100;MAP.h=h;}
function mapH(lat,lon){const fr=Math.max(0,Math.min(MAP.H-1.001,(89.8333-lat)*3)),fc=(lon+179.8333)*3,r=Math.floor(fr),c=Math.floor(fc),tr=fr-r,tc=fc-c,W=MAP.W,cc=k=>((k%W)+W)%W,h=MAP.h;
  const a=h[r*W+cc(c)],b=h[r*W+cc(c+1)],d=h[(r+1)*W+cc(c)],e=h[(r+1)*W+cc(c+1)];return (a*(1-tc)+b*tc)*(1-tr)+(d*(1-tc)+e*tc)*tr;}
function mapColor(h){
  const sea=[[-9000,[6,18,42]],[-6000,[14,40,82]],[-4000,[24,66,118]],[-2000,[42,104,160]],[-200,[92,160,205]],[0,[160,212,230]]];
  const land=[[0,[118,140,96]],[500,[150,150,104]],[2000,[180,166,128]],[4000,[226,220,208]]];
  const t=h<0?sea:land;if(h<=t[0][0])return t[0][1];
  for(let i=1;i<t.length;i++)if(h<=t[i][0]){const[a,ca]=t[i-1],[b,cb]=t[i],f=(h-a)/(b-a);return ca.map((c,j)=>c+(cb[j]-c)*f);}return t[t.length-1][1];}
function mapRender(){
  mapDecode();if(MAP.img)return;const cv=document.createElement('canvas');cv.width=MAP.W;cv.height=MAP.H;const g=cv.getContext('2d'),id=g.createImageData(MAP.W,MAP.H),H=MAP.h,W=MAP.W;
  for(let r=0;r<MAP.H;r++)for(let c=0;c<W;c++){const i=r*W+c,h=H[i],hx=H[r*W+(c+1)%W]-H[r*W+(c+W-1)%W],hy=H[Math.min(MAP.H-1,r+1)*W+c]-H[Math.max(0,r-1)*W+c];
    const sh=Math.max(0.45,Math.min(1.35,1-(hx*0.7-hy*0.7)/(h<0?2600:3500)));const col=mapColor(h),o=i*4;
    id.data[o]=Math.min(255,col[0]*sh);id.data[o+1]=Math.min(255,col[1]*sh);id.data[o+2]=Math.min(255,col[2]*sh);id.data[o+3]=255;}
  g.putImageData(id,0,0);MAP.img=cv;
}
function mapXY(lat,lon,w,h){return[(lon+180)/360*w,(90-lat)/180*h];}
function mapDraw(){
  const cv=$('mapCv'),pr=Math.min(2,window.devicePixelRatio||1),w=cv.clientWidth,h=w/2;cv.style.height=h+'px';cv.width=w*pr;cv.height=h*pr;
  const g=cv.getContext('2d');g.setTransform(pr,0,0,pr,0,0);g.imageSmoothingEnabled=true;g.drawImage(MAP.img,0,0,w,h);
  g.font='10px '+getComputedStyle(document.body).getPropertyValue('--f-body');
  for(const k in SITE_LL){const[x,y]=mapXY(...SITE_LL[k],w,h);const cur=S.loc===k;g.fillStyle=cur?'#ffd678':'#ff7a63';g.strokeStyle='#04121a';g.lineWidth=1.5;g.beginPath();g.arc(x,y,cur?5:3.5,0,6.283);g.fill();g.stroke();}
  if(MAP.sel.length){g.strokeStyle='#ffd678';g.lineWidth=1.6;g.beginPath();MAP.sel.forEach((p,i)=>{const[x,y]=mapXY(p[0],p[1],w,h);i?g.lineTo(x,y):g.moveTo(x,y);});g.stroke();
    MAP.sel.forEach(p=>{const[x,y]=mapXY(p[0],p[1],w,h);g.fillStyle='#ffd678';g.beginPath();g.arc(x,y,3,0,6.283);g.fill();});}
}
function profDraw(){
  const cv=$('profCv'),pr=Math.min(2,window.devicePixelRatio||1),w=cv.clientWidth,h=cv.clientHeight;cv.width=w*pr;cv.height=h*pr;const g=cv.getContext('2d');g.setTransform(pr,0,0,pr,0,0);
  g.fillStyle='#04121a';g.fillRect(0,0,w,h);if(MAP.sel.length<2){g.fillStyle='#86a7ae';g.font='12px '+getComputedStyle(document.body).getPropertyValue('--f-body');g.textAlign='center';g.fillText($t('在地图上点两个点，就能画出这两点之间的海底剖面'),w/2,h/2);return;}
  const[a,b]=MAP.sel,N=300,pts=[];let mn=1e9,mx=-1e9;
  const R=6371,toR=Math.PI/180,dist=R*Math.acos(Math.min(1,Math.sin(a[0]*toR)*Math.sin(b[0]*toR)+Math.cos(a[0]*toR)*Math.cos(b[0]*toR)*Math.cos((b[1]-a[1])*toR)));
  let dl=b[1]-a[1];if(dl>180)dl-=360;if(dl<-180)dl+=360;
  for(let i=0;i<=N;i++){const t=i/N,la=a[0]+(b[0]-a[0])*t,lo=a[1]+dl*t,z=mapH(la,lo);pts.push(z);mn=Math.min(mn,z);mx=Math.max(mx,z);}
  const top=Math.max(mx,0)+200,bot=Math.min(mn,-200)-200,L=46,Rr=10,T=12,B=22,pw=w-L-Rr,ph=h-T-B,y=z=>T+(top-z)/(top-bot)*ph;
  g.fillStyle='#0c2f48';g.fillRect(L,y(0),pw,ph-(y(0)-T));
  g.beginPath();g.moveTo(L,T+ph);pts.forEach((z,i)=>g.lineTo(L+i/N*pw,y(z)));g.lineTo(L+pw,T+ph);g.closePath();g.fillStyle='#b9a27a';g.fill();
  g.strokeStyle='rgba(217,236,239,.5)';g.beginPath();g.moveTo(L,y(0));g.lineTo(L+pw,y(0));g.stroke();
  g.fillStyle='#86a7ae';g.font='10px '+getComputedStyle(document.body).getPropertyValue('--f-mono');g.textAlign='right';
  for(let z=Math.ceil(bot/2000)*2000;z<=top;z+=2000)g.fillText(z+' m',L-4,y(z)+3);
  g.textAlign='center';g.fillText('0 km',L+10,h-6);g.fillText(Math.round(dist)+' km',L+pw-20,h-6);
  const ve=Math.round((dist*1000/pw)/((top-bot)/ph));
  $('profNote').textContent=$t('剖面长约 ')+Math.round(dist).toLocaleString('en-US')+$t(' km，最深处水深约 ')+Math.round(-mn).toLocaleString('en-US')+$t(' m，')+(mx<0?$t('最浅处水深约 ')+Math.round(-mx).toLocaleString('en-US')+' m':$t('最高处海拔约 ')+Math.round(mx).toLocaleString('en-US')+' m')+$t('。图里的竖直方向被放大了约 ')+ve+$t(' 倍；按真实比例画，几千米的起伏放在几百上千公里宽的剖面上，几乎就是一条平线。');
}
/* The 0.8 MB relief data is only fetched the first time the map is opened (the single-file build inlines it). */
function loadEtopo(){
  if(window.ETOPO_B64)return Promise.resolve();
  if(!MAP.loading)MAP.loading=new Promise((res,rej)=>{const s=document.createElement('script');s.src='data/etopo20.js';s.onload=()=>window.ETOPO_B64?res():rej();s.onerror=rej;document.head.appendChild(s);})
    .catch(e=>{MAP.loading=null;throw e;});
  return MAP.loading;
}
async function mapOpen(){
  $('mapOv').hidden=false;
  if(!window.ETOPO_B64){$('mapRead').textContent=$t('正在加载全球地形数据（约 0.8 MB）…');
    try{await loadEtopo();}catch(e){$('mapRead').textContent=$t('地形数据加载失败，请检查网络后关闭再打开。');return;}
    $('mapRead').textContent=$t('把鼠标移到地图上，可以看到那里的经纬度和水深。');}
  mapRender();if(!MAP.sel.length)MAP.sel=[[15,141],[8,143.5]];requestAnimationFrame(()=>{mapDraw();profDraw();});}
$('mapOpen').addEventListener('click',mapOpen);$('mapX').addEventListener('click',()=>{$('mapOv').hidden=true;});
$('mapOv').addEventListener('click',e=>{if(e.target.id==='mapOv')$('mapOv').hidden=true;});
$('mapCv').addEventListener('click',e=>{const cv=$('mapCv'),b=cv.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top,w=b.width,h=b.height;
  for(const k in SITE_LL){const[sx,sy]=mapXY(...SITE_LL[k],w,h);if(Math.hypot(sx-x,sy-y)<8){$('mapOv').hidden=true;applyLocation(k);return;}}
  const lat=90-y/h*180,lon=x/w*360-180;if(MAP.sel.length>=2)MAP.sel=[];MAP.sel.push([lat,lon]);mapDraw();profDraw();});
$('mapCv').addEventListener('mousemove',e=>{const cv=$('mapCv'),b=cv.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top,w=b.width,h=b.height,lat=90-y/h*180,lon=x/w*360-180;
  let near='';for(const k in SITE_LL){const[sx,sy]=mapXY(...SITE_LL[k],w,h);if(Math.hypot(sx-x,sy-y)<8){near=LOC[k].name+$t('（点击前往）');break;}}
  const z=mapH(lat,lon);$('mapRead').textContent=(near?near+' · ':'')+Math.abs(lat).toFixed(1)+'°'+(lat>=0?'N':'S')+' '+Math.abs(lon).toFixed(1)+'°'+(lon>=0?'E':'W')+' · '+(z<0?$t('水深约 ')+Math.round(-z).toLocaleString('en-US')+' m':$t('海拔约 ')+Math.round(z).toLocaleString('en-US')+' m');});
$('mapPreset').addEventListener('click',e=>{const p=e.target.dataset.p;if(!p)return;MAP.sel={mariana:[[15,141],[8,143.5]],atl:[[30,-80],[20,-15]],sio:[[-30,45],[-45,55]],scs:[[22,110],[12,120]]}[p];mapDraw();profDraw();});
window.addEventListener('resize',()=>{if(!$('mapOv').hidden){mapDraw();profDraw();}});

