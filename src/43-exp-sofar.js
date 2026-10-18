/* =========================================================
   14v. SOFAR channel. Sound speed from Mackenzie's (1981) nine-term equation, using the dive route's temperature
   profile (TPROF, western Pacific) and salinity 34.6: warm water makes sound fast near the surface, pressure makes it
   fast near the bottom, so speed has a minimum near ~1 km. Rays obey Snell's law cos(theta)/c = const and bend
   toward slower water, so rays launched near the axis are trapped and travel thousands of km.
   ========================================================= */
const SOF={zmax:5000,rmax:300e3,src:1000,spread:12,c:null,axis:0,rays:[],arr:[]};
function mackenzie(T,Sal,z){const s=Sal-35;return 1448.96+4.591*T-5.304e-2*T*T+2.374e-4*T*T*T+1.340*s+1.630e-2*z+1.675e-7*z*z-1.025e-2*T*s-7.139e-13*T*z*z*z;}
(function(){const n=SOF.zmax/10+1;SOF.c=new Float32Array(n);let mn=1e9;for(let i=0;i<n;i++){const z=i*10,c=mackenzie(tempAt(z),34.6,z);SOF.c[i]=c;if(c<mn){mn=c;SOF.axis=z;}}SOF.cmin=mn;})();
function sofC(z){const f=Math.max(0,Math.min(SOF.zmax,z))/10,i=Math.min(SOF.c.length-2,Math.floor(f)),t=f-i;return SOF.c[i]*(1-t)+SOF.c[i+1]*t;}
function traceRay(z0,ang,rmax,ds){
  const pts=[[0,z0]];let z=z0,r=0,dir=ang>=0?1:-1,xi=Math.cos(ang*Math.PI/180)/sofC(z0),t=0,hits=0,st=0;
  while(r<rmax){let c=sofC(z),cs=xi*c;if(cs>=1){dir=-dir;cs=0.99999;}const sn=Math.sqrt(1-cs*cs);
    const dz=dir*sn*ds,dr=cs*ds;z+=dz;r+=dr;t+=ds/c;
    if(z<0){z=-z;dir=1;hits++;}if(z>SOF.zmax){z=2*SOF.zmax-z;dir=-1;hits++;}
    st++;if(pts.length<4000&&st%2===0)pts.push([r,z]);}
  pts.push([r,z]);return{pts,t,hits};
}
function sofCompute(){
  SOF.rays=[];const n=25;
  for(let k=0;k<n;k++){const a=-SOF.spread+2*SOF.spread*k/(n-1);SOF.rays.push(Object.assign(traceRay(SOF.src,a,SOF.rmax,250),{a}));}
  /* arrivals at 1,000 km for the timing sound */
  SOF.arr=[];for(let k=0;k<n;k++){const a=-SOF.spread+2*SOF.spread*k/(n-1);const r=traceRay(SOF.src,a,1000e3,500);if(r.hits===0)SOF.arr.push(r.t);}
}
function sofDraw(){
  const cv=$('sofCv');if(!cv)return;const pr=Math.min(2,window.devicePixelRatio||1),W=cv.clientWidth,Hh=cv.clientHeight;cv.width=W*pr;cv.height=Hh*pr;
  const g=cv.getContext('2d');g.setTransform(pr,0,0,pr,0,0);g.clearRect(0,0,W,Hh);
  const L=46,T=14,pw=110,gap=24,rw=W-L-pw-gap-12,ph=Hh-T-28,y=z=>T+z/SOF.zmax*ph;
  const fm=getComputedStyle(document.body).getPropertyValue('--f-mono');g.font='10px '+fm;
  /* water */
  g.fillStyle='#071b26';g.fillRect(L,T,pw,ph);g.fillRect(L+pw+gap,T,rw,ph);
  /* sound speed profile */
  const cx=c=>L+(c-1475)/(1560-1475)*pw;g.strokeStyle='#62d4e3';g.lineWidth=1.5;g.beginPath();
  for(let z=0;z<=SOF.zmax;z+=20){const X=cx(sofC(z)),Y=y(z);z?g.lineTo(X,Y):g.moveTo(X,Y);}g.stroke();
  g.fillStyle='#86a7ae';g.textAlign='right';for(let z=0;z<=SOF.zmax;z+=1000){g.fillText(z+' m',L-4,y(z)+3);}
  g.textAlign='center';g.fillText('声速 m/s',L+pw/2,Hh-4);for(const c of[1480,1520,1560]){g.fillText(c,cx(c),T+ph+12);}
  /* axis */
  g.setLineDash([4,4]);g.strokeStyle='rgba(255,214,120,.8)';g.beginPath();g.moveTo(L,y(SOF.axis));g.lineTo(L+pw+gap+rw,y(SOF.axis));g.stroke();g.setLineDash([]);
  g.fillStyle='rgba(255,214,120,.95)';g.textAlign='left';g.fillText('声道轴 约 '+Math.round(SOF.axis/10)*10+' m · '+SOF.cmin.toFixed(0)+' m/s',L+pw+gap+6,y(SOF.axis)-5);
  /* rays */
  const rx=r=>L+pw+gap+r/SOF.rmax*rw;let trapped=0;
  for(const ry of SOF.rays){const ok=ry.hits===0;if(ok)trapped++;g.strokeStyle=ok?'rgba(98,212,227,.85)':'rgba(160,170,175,.35)';g.lineWidth=ok?1.1:0.8;g.beginPath();
    ry.pts.forEach((p,i)=>{const X=rx(p[0]),Y=y(p[1]);i?g.lineTo(X,Y):g.moveTo(X,Y);});g.stroke();}
  g.fillStyle='#ff7a63';g.beginPath();g.arc(rx(0),y(SOF.src),4,0,6.283);g.fill();
  g.fillStyle='#86a7ae';g.textAlign='center';for(let r=0;r<=300;r+=100)g.fillText(r+' km',Math.max(L+pw+gap+16,Math.min(rx(r*1000),L+pw+gap+rw-14)),T+ph+12);
  $('sofStat').textContent='声源深度 '+SOF.src+' m · 25 条声线中有 '+trapped+' 条被困在声道里（不碰海面也不碰海底），可以一直传下去；灰色的声线撞到海面或海底，每撞一次都会损失能量。';
}
function sofPlay(){
  if(!audioStart()||!AUD.ctx){$('sofStat').textContent='这个浏览器不支持网页音频。';return;}
  const ctx=AUD.ctx,arr=SOF.arr.slice().sort((a,b)=>a-b);if(!arr.length){$('sofStat').textContent='这个声源深度下，没有声线能不碰海面和海底地传到 1,000 km 外。把声源移到声道轴附近再试。';return;}
  const t0=arr[0],span=arr[arr.length-1]-t0,k=span>6?6/span:1,now=ctx.currentTime+0.15;
  arr.forEach((ta,i)=>{const at=now+(ta-t0)*k,o=ctx.createOscillator(),gn=ctx.createGain();o.type='sine';o.frequency.value=180+40*Math.random();
    gn.gain.setValueAtTime(0,at);gn.gain.linearRampToValueAtTime(0.18,at+0.005);gn.gain.exponentialRampToValueAtTime(0.0005,at+0.25);o.connect(gn).connect(ctx.destination);o.start(at);o.stop(at+0.3);});
  $('sofStat').textContent='1,000 km 外的接收器先听到斜着走的声线（它们穿过更快的水层，先到），最后才是沿声道轴走的声线，所以声音越来越密、在最后戛然而止，这正是 1944 年 Ewing 和 Worzel 第一次听到的“SOFAR 信号”。到达时间跨度约 '+span.toFixed(1)+' 秒'+(k<1?'（这里压缩到 6 秒播放）':'')+'。';
}
function openSofar(){$('sofar').hidden=false;sofCompute();requestAnimationFrame(sofDraw);}
$('sofOpen').addEventListener('click',openSofar);$('sofX').addEventListener('click',()=>{$('sofar').hidden=true;});
$('sofSrc').addEventListener('input',e=>{SOF.src=+e.target.value;$('sofSrcV').textContent=SOF.src+' m';sofCompute();sofDraw();});
$('sofPlay').addEventListener('click',sofPlay);window.addEventListener('resize',()=>{if(!$('sofar').hidden)sofDraw();});
MILESTONES.push([Math.round(SOF.axis/10)*10,'约 '+(Math.round(SOF.axis/10)*10).toLocaleString('en-US')+' m · 深海声道轴','这里的声速最慢（约 '+SOF.cmin.toFixed(0)+' m/s）。上面的水暖、下面的水压高，声音都会被“折”回这一层，低频声音能沿着它传几千公里，鲸的叫声也能借它远距离传播。']);
MILESTONES.sort((a,b)=>a[0]-b[0]);


