/* =========================================================
   Live ocean: real-world data in data/live.json (refreshed twice a day by .github/workflows/live.yml running
   tools/fetch_live.py) drives part of the scenes:
     - coral bleaching at the Paracels, Sanya and Eilat from NOAA Coral Reef Watch heat stress (Degree Heating Weeks),
       and the scene's water temperature from the same satellite SST;
     - the real tide at the Nanji Islands (hourly sea level from the Meteo-France SMOC model via Open-Meteo);
     - today's Arctic and Antarctic sea-ice extent against 1981-2010 (NSIDC Sea Ice Index), as information.
   The animals are still simulated; only these conditions follow reality. "跟随现实数据" switches it all off.
   ========================================================= */
const LIVE={data:null,on:true,sim:null,site:null,err:null,tx:null,sun:false,hist:null};
const TM={on:false,id:null,idx:0,b:0,d:0,play:null,last:0};   /* time machine: a day in the reef's record since 1985 */
try{LIVE.on=localStorage.getItem('seafloor-live')!=='off';}catch(e){}
const REEF_IDS=['xisha','spawn','eilat'];
const REEF_NAME={xisha:$t('西沙群岛'),spawn:$t('海南岛（三亚）'),eilat:$t('亚喀巴湾（埃拉特）')};
/* NOAA CRW Bleaching Alert Area levels (Alert Levels 3-5 added in 2023); colours follow CRW's own map, the label always goes with them */
const LIVE_LV=[[$t('无热应力'),'#7fb6c2'],[$t('白化观察'),'#f1e05a'],[$t('白化警告'),'#f5a623'],[$t('一级警报'),'#ec6a3f'],[$t('二级警报'),'#d93a3a'],[$t('三级警报'),'#c2306b'],[$t('四级警报'),'#9b43b5'],[$t('五级警报'),'#6650d6']];
const LIVE_LV_MEAN=[$t('海温没有超过常年最热月份的平均水平，珊瑚没有热应力。'),$t('海温略高于常年最热月份的平均水平，需要留意。'),$t('海温比常年最热月份高 1 °C 以上，热应力正在累积，可能开始白化。'),
  $t('热应力较大（DHW 4–8），很可能出现明显白化。'),$t('严重热应力（DHW 8–12），会大面积白化，部分珊瑚可能死亡。'),$t('DHW 12–16：多种珊瑚有死亡风险。'),$t('DHW 16–20：多种珊瑚有大量死亡的风险。'),$t('DHW 超过 20：近乎全部珊瑚死亡的风险（八成以上）。')];
const lvOfDhw=d=>d<=0?0:d<4?2:d<8?3:d<12?4:d<16?5:d<20?6:7;
/* typical response to accumulated heat stress (CRW: DHW ≥ 4 significant bleaching likely, ≥ 8 severe and widespread, ≥ 12 multi-species mortality) */
const bleachOf=d=>Math.min(1,0.35*sstep(1,4,d)+0.45*sstep(4,8,d)+0.2*sstep(8,12,d));
const deadOf=d=>0.75*sstep(10,20,d);
const fx=(v,n)=>(+v).toFixed(n===undefined?1:n);
const QLP=LANG==='en'?' (':'（',QRP=LANG==='en'?')':'）',QCO=LANG==='en'?': ':'：',QCM=LANG==='en'?', ':'，';
const isoDay=s=>{const[y,m,d]=s.split('-').map(Number);return{y,m,d};};
const MON_EN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDay=s=>{const q=isoDay(s);return LANG==='en'?q.d+' '+MON_EN[q.m-1]:q.m+' 月 '+q.d+' 日';};
const fmtDayY=s=>{const q=isoDay(s);return LANG==='en'?q.d+' '+MON_EN[q.m-1]+' '+q.y:q.y+' 年 '+q.m+' 月 '+q.d+' 日';};
const fmtMon=m=>LANG==='en'?MON_EN[m-1]:m+' 月';
const clockAt=(ms,tz)=>{const d=new Date(ms+tz*3.6e6);return String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0');};
const ordEn=n=>n+(n%100>=11&&n%100<=13?'th':['th','st','nd','rd'][n%10]||'th');
const reefData=id=>LIVE.data&&LIVE.data.coral&&LIVE.data.coral[id]||null;

/* bleaching has memory: colonies whiten as DHW climbs and stay pale for weeks after the peak (recovery e-folding ~6 weeks
   once the stress falls); colonies killed (DHW ≥ 10, see deadOf) stay dead and algae-covered for years (e-folding ~3 years).
   One model for today (the past year's DHW), the heat-stress slider and the time machine. */
const REEF_KB=Math.exp(-1/42),REEF_KD=Math.exp(-1/1100);
function reefStep(st,dhw,days){if(dhw==null)return st;const n=days||1;st.b=Math.max(bleachOf(dhw),st.b*Math.pow(REEF_KB,n));st.d=Math.max(deadOf(dhw),st.d*Math.pow(REEF_KD,n));return st;}
function reefToday(c){const st={b:0,d:0};for(const r of c.series)reefStep(st,r[2]);return st;}   /* series runs oldest to newest ([days before the last date, SST, DHW]) */
function reefNow(){
  if(!REEF_IDS.includes(LIVE.site))return{b:0,d:0};
  if(LIVE.sim!=null)return{b:bleachOf(LIVE.sim),d:deadOf(LIVE.sim)};
  if(TM.on&&TM.id===LIVE.site)return{b:TM.b,d:TM.d};
  const c=reefData(LIVE.site);return LIVE.on&&c?reefToday(c):{b:0,d:0};
}
function applyBleach(){const st=reefNow();CORALU.uBleach.value=st.b;CORALU.uDead.value=st.d;}
function bleachWords(st){
  const b=st.b;let w=b<0.05?$t('珊瑚颜色正常：褐、绿、紫等颜色来自组织里的共生藻。'):b<0.3?$t('少数珊瑚的顶端开始变浅，枝状珊瑚最先。'):b<0.6?$t('不少珊瑚明显发白，枝状和盘状珊瑚最多，块状珊瑚还撑得住。'):b<0.9?$t('大部分珊瑚已经白化，透过透明的组织能看到白色骨骼。'):$t('几乎所有珊瑚都白化了。');
  if(st.d>0.08)w+=$t('部分珊瑚已经死亡，表面长出一层灰绿色的藻皮。');
  return w;
}
/* ---- today's sea state (wave height and period, SST) and local day/night ---- */
function seaAt(id,ms){
  const W=LIVE.data&&LIVE.data.sea&&LIVE.data.sea[id];if(!W)return null;
  const x=(ms/1000-W.t0)/W.step,i=Math.round(x),n=W.H.length;if(i<0||i>=n)return null;
  const pick=a=>{if(!a||!a.length)return null;for(let k=0;k<6;k++)for(const j of[i-k,i+k])if(j>=0&&j<a.length&&a[j]!=null)return a[j];return null;};
  return{H:pick(W.H),T:pick(W.T),sst:pick(W.sst)};
}
const SUN_SITES={xisha:'Asia/Shanghai',mangrove:'Asia/Shanghai',nanji:'Asia/Shanghai',monterey:'America/Los_Angeles',truk:'Pacific/Chuuk',eilat:'Asia/Jerusalem'};
try{LIVE.sun=localStorage.getItem('seafloor-localsun')==='on';}catch(e){LIVE.sun=false;}
/* solar elevation (degrees) from a standard low-precision ephemeris, good to about half a degree */
function sunElev(lat,lon,ms){
  const d=ms/864e5-10957.5,r=Math.PI/180,g=(357.529+0.98560028*d)*r,q=280.459+0.98564736*d;
  const L=(q+1.915*Math.sin(g)+0.020*Math.sin(2*g))*r,e=(23.439-0.00000036*d)*r;
  const ra=Math.atan2(Math.cos(e)*Math.sin(L),Math.cos(L)),dec=Math.asin(Math.sin(e)*Math.sin(L));
  const gmst=((18.697374558+24.06570982441908*d)%24+24)%24,H=(gmst*15+lon)*r-ra,la=lat*r;
  return Math.asin(Math.sin(la)*Math.sin(dec)+Math.cos(la)*Math.cos(dec)*Math.cos(H))/r;
}
function localClock(id,ms){try{return new Date(ms).toLocaleTimeString(LANG==='en'?'en-GB':'zh-CN',{timeZone:SUN_SITES[id],hour:'2-digit',minute:'2-digit',hour12:false});}catch(e){return'';}}
function siteSun(id,ms){const ll=SITE_LL[id];return ll?sunElev(ll[0],ll[1],ms):null;}
/* what today's real world sets for a place: water temperature, waves, and (if chosen) local day or night */
function liveEnv(id){
  const o={};if(!LIVE.on||!LIVE.data||!id)return o;
  const c=reefData(id),w=seaAt(id,Date.now());
  if(c)o.temp=Math.round(c.sst*10)/10;else if(w&&w.sst!=null)o.temp=Math.round(w.sst*10)/10;
  if(w&&w.H!=null)o.H=Math.max(0,Math.min(4,Math.round(w.H*10)/10));
  if(w&&w.T!=null)o.T=Math.max(4,Math.min(16,Math.round(w.T*2)/2));
  if(LIVE.sun&&SUN_SITES[id]){const e=siteSun(id,Date.now());if(e!=null){o.night=e<-4;if(!o.night)o.sun=Math.max(10,Math.min(90,Math.round(e)));}}
  else if(LIVE.sunNight&&!SUN_SITES[id]&&id!=='spawn')o.night=false;     /* a night set by local time does not follow you to other places */
  return o;
}
function applyEnv(id,rb){
  const o=liveEnv(id);if(!Object.keys(o).length)return false;
  if(o.temp!=null&&LOC[id])S.tempRef=LOC[id].temp;
  Object.assign(S,o);if('night' in o)LIVE.sunNight=!!(o.night&&SUN_SITES[id]);if(S.night&&S.torch==='off')S.torch='white';
  $('sTemp').value=S.temp;$('sH').value=S.H;$('sT').value=S.T;$('sSun').value=S.sun;
  if(rb){rebuild();readouts();}return true;
}
function liveOnLocation(id){
  LIVE.site=id;if(!REEF_IDS.includes(id))LIVE.sim=null;if(TM.on&&TM.id!==id)tmStop();
  if(id==='nanji'){const ok=LIVE.on&&!!liveTide(Date.now());TIDE.live=true;TIDE.play=!ok;$('tidePlay').textContent=ok?$t('▶ 快放潮汐'):$t('❚❚ 暂停潮汐');}
  applyBleach();renderLive();
}
function setLiveOn(on){
  LIVE.on=on;try{localStorage.setItem('seafloor-live',on?'on':'off');}catch(e){}
  if(on)TIDE.live=true;else tmStop();
  const L=LOC[S.loc];
  if(L&&S.loc===LIVE.site){if(on)applyEnv(S.loc,true);else{S.tempRef=null;Object.assign(S,{temp:L.temp,H:L.H,T:L.T,sun:L.sun});$('sTemp').value=S.temp;$('sH').value=S.H;$('sT').value=S.T;$('sSun').value=S.sun;rebuild();readouts();}}
  applyBleach();renderLive();readouts();
}
function setLocalSun(on){
  LIVE.sun=on;try{localStorage.setItem('seafloor-localsun',on?'on':'off');}catch(e){}
  if(!on&&SUN_SITES[S.loc]){S.night=false;S.sun=LOC[S.loc].sun;$('sSun').value=S.sun;S.torch=LOC[S.loc].torch;rebuild();readouts();}
  else applyEnv(S.loc,true);
  renderLive();
}

/* ---- tide: Catmull-Rom between hourly values; highs and lows found once per data load ---- */
function tideExtremes(){
  const T=LIVE.data&&LIVE.data.tide;if(!T)return[];const h=T.h,out=[];
  for(let k=1;k<h.length-1;k++){const mx=h[k]>h[k-1]&&h[k]>=h[k+1],mn=h[k]<h[k-1]&&h[k]<=h[k+1];if(!mx&&!mn)continue;
    const den=h[k-1]-2*h[k]+h[k+1],off=den?0.5*(h[k-1]-h[k+1])/den:0,hv=h[k]-0.25*(h[k-1]-h[k+1])*off;
    out.push({t:(T.t0+(k+off)*T.step)*1000,h:hv,max:mx});}
  return out;
}
function tideAt(ms){const T=LIVE.data&&LIVE.data.tide;if(!T)return null;const h=T.h,n=h.length,x=(ms/1000-T.t0)/T.step;if(x<1||x>n-2)return null;
  const i=Math.floor(x),f=x-i,a=h[i-1],b=h[i],c=h[i+1],d=h[Math.min(n-1,i+2)];
  return 0.5*(2*b+(-a+c)*f+(2*a-5*b+4*c-d)*f*f+(-a+3*b-3*c+d)*f*f*f);}
function liveTide(ms){
  const v=tideAt(ms);if(v==null)return null;
  const X=LIVE.tx||(LIVE.tx=tideExtremes());
  const prevLow=[...X].reverse().find(e=>!e.max&&e.t<=ms),nx=X.filter(e=>e.t>ms);
  const near=X.find(e=>Math.abs(e.t-ms)<35*60e3);
  const rising=(tideAt(ms+6e5)||v)>v;
  const ext=e=>(e.max?$t('高潮'):$t('低潮'))+' '+clockAt(e.t,8)+QLP+(e.h>=0?'+':'−')+fx(Math.abs(e.h),2)+' m'+QRP;
  const next=nx.length?$t('下一次')+ext(nx[0])+(nx[1]?$t('，再下一次')+ext(nx[1]):''):'';
  return{h:v,rising,nearExt:near?(near.max?1:-1):0,sinceLow:prevLow?(ms-prevLow.t)/3.6e6:6.2,clock:clockAt(ms,8),next,nextExt:nx.slice(0,2)};
}

/* ---- small line charts (one y-axis each), with a hover crosshair and readout ---- */
function lineChart(o){
  const W=300,H=o.h||92,L=34,R=6,T=8,B=16,n=o.x.length;
  let lo=o.dom[0],hi=o.dom[1];
  const X=v=>L+(v-o.xr[0])/(o.xr[1]-o.xr[0])*(W-L-R),Y=v=>T+(1-(v-lo)/(hi-lo))*(H-T-B);
  const path=(ys)=>{let s='',pen=false;for(let i=0;i<n;i++){const y=ys[i];if(y==null||isNaN(y)){pen=false;continue;}s+=(pen?'L':'M')+X(o.x[i]).toFixed(1)+' '+Y(y).toFixed(1);pen=true;}return s;};
  let g='';
  (o.yt||[lo,(lo+hi)/2,hi]).forEach(v=>{g+='<line class="lg" x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(v).toFixed(1)+'" y2="'+Y(v).toFixed(1)+'"/><text class="la" x="'+(L-4)+'" y="'+(Y(v)+3).toFixed(1)+'" text-anchor="end">'+(o.yf?o.yf(v):v)+'</text>';});
  (o.xt||[]).forEach(t=>{g+='<text class="la" x="'+X(t[0]).toFixed(1)+'" y="'+(H-3)+'" text-anchor="middle">'+t[1]+'</text>';});
  if(o.band){let s='';for(let i=0;i<n;i++)s+=(i?'L':'M')+X(o.x[i]).toFixed(1)+' '+Y(o.band[1][i]).toFixed(1);for(let i=n-1;i>=0;i--)s+='L'+X(o.x[i]).toFixed(1)+' '+Y(o.band[0][i]).toFixed(1);g+='<path class="lb" d="'+s+'Z"/>';}
  if(o.area)g+='<path class="lar" d="'+path(o.y)+'L'+X(o.x[n-1]).toFixed(1)+' '+Y(lo).toFixed(1)+'L'+X(o.x[0]).toFixed(1)+' '+Y(lo).toFixed(1)+'Z"/>';
  (o.refs||[]).forEach(r=>{if(r.y<lo||r.y>hi)return;g+='<line class="lr" style="stroke:'+r.c+'" x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(r.y).toFixed(1)+'" y2="'+Y(r.y).toFixed(1)+'"/><text class="lrl" x="'+(L+3)+'" y="'+(Y(r.y)-3).toFixed(1)+'">'+r.t+'</text>';});
  if(o.y2)g+='<path class="lm2" d="'+path(o.y2)+'"/>';
  g+='<path class="lm" d="'+path(o.y)+'"/>';
  if(o.now!=null)g+='<line class="ln" x1="'+X(o.now).toFixed(1)+'" x2="'+X(o.now).toFixed(1)+'" y1="'+T+'" y2="'+(H-B)+'"/><text class="lrl" x="'+(X(o.now)+3).toFixed(1)+'" y="'+(T+8)+'">'+$t('现在')+'</text>';
  g+='<line class="lx" x1="0" x2="0" y1="'+T+'" y2="'+(H-B)+'" visibility="hidden"/><circle class="ld" r="3.5" visibility="hidden"/>';
  const fig=document.createElement('figure');fig.className='lc';
  fig.innerHTML='<figcaption>'+o.title+'</figcaption><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+o.title+'">'+g+'</svg><p class="lcr">'+o.rd(o.di)+'</p>';
  const svg=fig.querySelector('svg'),cx=fig.querySelector('.lx'),dot=fig.querySelector('.ld'),rd=fig.querySelector('.lcr');
  svg.addEventListener('pointermove',e=>{const r=svg.getBoundingClientRect(),vx=o.xr[0]+((e.clientX-r.left)/r.width*W-L)/(W-L-R)*(o.xr[1]-o.xr[0]);
    let bi=0,bd=1e9;for(let i=0;i<n;i++){const d=Math.abs(o.x[i]-vx);if(d<bd&&o.y[i]!=null){bd=d;bi=i;}}
    const px=X(o.x[bi]).toFixed(1);cx.setAttribute('x1',px);cx.setAttribute('x2',px);cx.setAttribute('visibility','visible');
    dot.setAttribute('cx',px);dot.setAttribute('cy',Y(o.y[bi]).toFixed(1));dot.setAttribute('visibility','visible');rd.textContent=o.rd(bi);});
  svg.addEventListener('pointerleave',()=>{cx.setAttribute('visibility','hidden');dot.setAttribute('visibility','hidden');rd.textContent=o.rd(o.di);});
  return fig;
}
function niceDom(vals,pad,minSpan){let lo=Math.min(...vals),hi=Math.max(...vals);const sp=Math.max(minSpan||0,hi-lo);const m=(lo+hi)/2;lo=m-sp/2-pad;hi=m+sp/2+pad;return[lo,hi];}
/* month ticks for a series of "days before last date" */
function monthTicks(lastIso,days){const q=isoDay(lastIso),last=Date.UTC(q.y,q.m-1,q.d),out=[];
  for(let k=0;k<14;k++){const d=new Date(Date.UTC(q.y,q.m-1-k,1));const ago=Math.round((last-d.getTime())/864e5);if(ago>days)break;if((d.getUTCMonth())%3===0)out.push([-ago,fmtMon(d.getUTCMonth()+1)]);}
  return out;}
function dayLabel(lastIso,ago){const q=isoDay(lastIso),d=new Date(Date.UTC(q.y,q.m-1,q.d)-ago*864e5);return fmtDayY(d.toISOString().slice(0,10));}

/* ---- panel ---- */
function chip(lv){const c=LIVE_LV[lv];return'<span class="lchip"><i style="background:'+c[1]+'"></i>'+c[0]+'</span>';}
const lvOf=(hs,d)=>hs<=0?0:hs<1?1:lvOfDhw(d);
const pctS=v=>Math.round(v*100)+'%';
function seaLine(id){const w=seaAt(id,Date.now());if(!w||w.H==null)return'';
  return'<p class="lnote">'+$t('今日海况：有效波高 ')+fx(w.H)+' m'+(w.T!=null?$t(' · 周期 ')+fx(w.T,0)+' s':'')+(reefData(id)||w.sst==null?'':$t(' · 海温 ')+fx(w.sst)+' °C')+$t('（画面里的波浪和水流按这个计算）')+'</p>';}
function sunLine(id){
  if(!SUN_SITES[id])return'';const e=siteSun(id,Date.now());if(e==null)return'';
  const st=e<-4?$t('夜里'):e<6?$t('黎明或黄昏'):$t('白天');
  return'<div class="lsun"><span>'+$t('当地时间 ')+localClock(id,Date.now())+' · '+st+QLP+(e>=0?$t('太阳高度 ')+fx(e,0)+'°':$t('太阳在地平线下 ')+fx(-e,0)+'°')+QRP+'</span>'
    +'<span class="seg"><button type="button" id="liveSunBtn" aria-pressed="'+LIVE.sun+'">'+(LIVE.sun?$t('按当地时间显示昼夜：开'):$t('按当地时间显示昼夜：关'))+'</button></span></div>';
}
function coralCard(id){
  const c=reefData(id),el=document.createElement('div');el.className='lcard';
  const simOn=LIVE.sim!=null,st=reefNow();
  el.innerHTML='<div class="lhead">'+chip(c.level)+'<span class="ldate">'+$t('卫星数据 · ')+fmtDay(c.date)+'</span></div>'
    +'<dl class="lnum"><div><dt>'+$t('海表温度')+'</dt><dd>'+fx(c.sst)+' °C</dd></div><div><dt>'+$t('白化阈值')+'</dt><dd>'+fx(c.threshold)+' °C</dd></div><div><dt>'+$t('热应力 DHW')+'</dt><dd>'+fx(c.dhw)+$t(' °C·周')+'</dd></div></dl>'
    +'<p class="lmean">'+LIVE_LV_MEAN[c.level]+(c.level<2&&c.dhw>=4?$t('不过过去 12 周累积的热应力（DHW ')+fx(c.dhw)+$t('）还很高：白化通常在热浪过后才最明显，之前的热浪造成的白化可能还没有恢复。'):'')+'</p>'+seaLine(id);
  const s=c.series,x=s.map(r=>-r[0]),thr=c.threshold;
  el.appendChild(lineChart({title:$t('过去一年的海表温度（°C）'),x,y:s.map(r=>r[1]),xr:[-365,0],dom:niceDom(s.map(r=>r[1]).concat([thr]),0.3,2),yf:v=>fx(v),xt:monthTicks(c.date,365),
    refs:[{y:thr,t:$t('白化阈值 ')+fx(thr),c:LIVE_LV[2][1]}],di:s.length-1,rd:i=>dayLabel(c.date,s[i][0])+$t('：海温 ')+fx(s[i][1])+' °C'}));
  const dmax=Math.max(8.5,...s.map(r=>r[2]))*1.08;
  el.appendChild(lineChart({title:$t('累积热应力 DHW（°C·周）'),x,y:s.map(r=>r[2]),area:true,xr:[-365,0],dom:[0,dmax],yt:[0,4,8,12,16,20].filter(v=>v<=dmax),yf:v=>v,xt:monthTicks(c.date,365),
    refs:[{y:4,t:LIVE_LV[3][0],c:LIVE_LV[3][1]},{y:8,t:LIVE_LV[4][0],c:LIVE_LV[4][1]},{y:12,t:LIVE_LV[5][0],c:LIVE_LV[5][1]}],di:s.length-1,rd:i=>dayLabel(c.date,s[i][0])+QCO+'DHW '+fx(s[i][2])}));
  const rec=(c.record||[]).map(r=>isoDay(r.date).y+QLP+fx(r.dhw)+QRP).join($t('、'));
  const sceneHead=TM.on&&TM.id===id?$t('画面里（时间机器里的那一天，见下方）：'):simOn?$t('画面里（模拟 DHW ')+fx(LIVE.sim)+QRP+QCO:$t('画面里（按过去几周的 DHW）：');
  el.insertAdjacentHTML('beforeend','<p class="lnote">'+$t('过去一年最高：DHW ')+fx(c.peak365.dhw)+QLP+fmtDayY(c.peak365.date)+QCM+LIVE_LV[lvOfDhw(c.peak365.dhw)][0]+QRP+$t('。')+(rec?$t('有记录以来热应力最强的年份：')+rec+$t('。'):'')+'</p>'
    +'<p class="lscene"><b>'+sceneHead+'</b>'+bleachWords(st)+'</p>'
    +'<div class="ctl"><label for="simDhw">'+$t('模拟热应力 DHW')+' <b id="simV">'+(simOn?fx(LIVE.sim):$t('今天 ')+fx(c.dhw))+'</b></label><input id="simDhw" type="range" min="0" max="20" step="0.5" value="'+fx(simOn?LIVE.sim:c.dhw)+'"></div>'
    +'<div class="seg lrow"><button type="button" id="simBack"'+(simOn?'':' disabled')+'>'+$t('回到今天的实测')+'</button><button type="button" class="lguideBtn">'+$t('怎么观察')+'</button></div>'
    +'<ol class="lhow"><li>'+$t('看珊瑚的颜色，再对照上面的警报等级。')+'</li><li>'+$t('把“模拟热应力”从 0 拖到 16，看白化怎样从枝状珊瑚的顶端开始扩散，再拖回“今天”。')+'</li><li>'+$t('看温度曲线：海温高于白化阈值的那些天，DHW 曲线才会上升；它累计的是过去 12 周。')+'</li><li>'+$t('打开下面的“时间机器”，回到有记录以来最热的那几年，播放一整个夏天。')+'</li></ol>'
    +'<details class="tm"'+(TM.on&&TM.id===id?' open':'')+'><summary>'+$t('时间机器：回看 1985 年以来的任何一天')+'</summary><div class="tmBody"></div></details>');
  el.querySelector('#simDhw').addEventListener('input',e=>{if(TM.on)tmStop();LIVE.sim=+e.target.value;applyBleach();const v=$('simV');if(v)v.textContent=fx(LIVE.sim);
    const sc=el.querySelector('.lscene');if(sc)sc.innerHTML='<b>'+$t('画面里（模拟 DHW ')+fx(LIVE.sim)+QRP+QCO+'</b>'+bleachWords(reefNow());el.querySelector('#simBack').disabled=false;});
  el.querySelector('#simBack').addEventListener('click',()=>{LIVE.sim=null;applyBleach();renderLive();});
  const det=el.querySelector('details.tm');
  det.addEventListener('toggle',()=>{if(det.open){if(!(TM.on&&TM.id===id))tmStart(id,det.querySelector('.tmBody'));else tmBody(det.querySelector('.tmBody'));}else if(TM.on)tmStop(true);});
  if(TM.on&&TM.id===id)tmBody(det.querySelector('.tmBody'));
  return el;
}

/* ---- time machine: any day of the reef's NOAA record (data/reef_history.json, loaded on first use) ---- */
function histLoad(cb){
  if(LIVE.hist)return cb();
  if(window.SEAFLOOR_REEF_HIST){LIVE.hist=window.SEAFLOOR_REEF_HIST;return cb();}
  fetch('data/reef_history.json?h='+Math.floor(Date.now()/3.6e6)).then(r=>r.ok?r.json():Promise.reject(new Error('HTTP '+r.status)))
    .then(d=>{LIVE.hist=d;cb();}).catch(e=>{LIVE.histErr=String(e);const b=document.querySelector('.tm .tmBody');if(b)b.innerHTML='<p class="note">'+$t('历史数据暂时没有加载成功。')+'</p>';});
}
const tmR=()=>LIVE.hist&&LIVE.hist.reefs&&LIVE.hist.reefs[TM.id];
const isoOf=(start,k)=>{const q=isoDay(start);return new Date(Date.UTC(q.y,q.m-1,q.d)+k*864e5).toISOString().slice(0,10);};
const idxOf=(start,iso)=>{const a=isoDay(start),b=isoDay(iso);return Math.round((Date.UTC(b.y,b.m-1,b.d)-Date.UTC(a.y,a.m-1,a.d))/864e5);};
function tmStart(id,body){
  LIVE.sim=null;tmPause();TM.on=true;TM.id=id;if(body)body.innerHTML='<p class="note">'+$t('正在加载 1985 年以来的每日数据……')+'</p>';
  histLoad(()=>{const R=tmR();if(!R){if(body)body.innerHTML='<p class="note">'+$t('这片礁还没有历史数据。')+'</p>';return;}
    const ev=R.events&&R.events[0];tmSeek(ev?idxOf(R.start,ev.date):R.dhw10.length-1);const b=document.querySelector('.tm .tmBody');if(b)tmBody(b);});
}
function tmStop(keepClosed){
  tmPause();if(!TM.on)return;TM.on=false;
  if(LOC[S.loc]&&S.loc===LIVE.site){const o=liveEnv(S.loc);S.temp=o.temp!=null?o.temp:LOC[S.loc].temp;$('sTemp').value=S.temp;}
  applyBleach();if(!keepClosed)renderLive();else{const sc=document.querySelector('#liveHere .lscene');if(sc)sc.innerHTML='<b>'+$t('画面里（按过去几周的 DHW）：')+'</b>'+bleachWords(reefNow());}
}
function tmSeek(k){const R=tmR();k=Math.max(0,Math.min(R.dhw10.length-1,Math.round(k)));TM.idx=k;TM.b=0;TM.d=0;
  for(let i=Math.max(0,k-1100);i<=k;i++){const v=R.dhw10[i];if(v!=null)reefStep(TM,v/10);}tmApply(true);}
function tmAdvance(n){const R=tmR();for(let k=0;k<n;k++){if(TM.idx>=R.dhw10.length-1){tmPause();break;}TM.idx++;const v=R.dhw10[TM.idx];if(v!=null)reefStep(TM,v/10);}tmApply(false);}
function tmPause(){if(TM.play){clearInterval(TM.play);TM.play=null;}const b=$('tmPlay');if(b)b.textContent=$t('▶ 播放（每秒 5 天）');}
function tmPlay(){if(TM.play){tmPause();return;}const R=tmR();if(!R)return;if(TM.idx>=R.dhw10.length-1)tmSeek(TM.idx-200);
  let acc=0;TM.play=setInterval(()=>{acc+=0.5;const n=Math.floor(acc);if(n){acc-=n;tmAdvance(n);}},100);const b=$('tmPlay');if(b)b.textContent=$t('❚❚ 暂停');}
function tmVals(){const R=tmR(),k=TM.idx,g=a=>a[k]==null?null:a[k]/10;return{iso:isoOf(R.start,k),sst:g(R.sst10),hs:g(R.hs10),dhw:g(R.dhw10)};}
/* how many years per period reached Alert Level 1 (DHW ≥ 4): the trend the record shows */
function tmDecades(R){
  const y0=+R.start.slice(0,4),mx={};for(let i=0;i<R.dhw10.length;i++){const v=R.dhw10[i];if(v==null)continue;const y=+isoOf(R.start,i).slice(0,4);if(!(y in mx)||v>mx[y])mx[y]=v;}
  const last=Math.max(...Object.keys(mx).map(Number)),P=[[y0,1999],[2000,2009],[2010,last]];
  return $t('达到一级警报（DHW ≥ 4）的年份：')+P.map(([a,b])=>{let n=0,t=0;for(let y=a;y<=b;y++)if(y in mx){t++;if(mx[y]>=40)n++;}return a+'–'+b+QCO+n+' / '+t;}).join($t('；'))+$t('。');
}
function tmBody(body){
  const R=tmR();if(!R){return;}
  const ev=(R.events||[]).map(e=>'<button type="button" data-ev="'+e.date+'">'+isoDay(e.date).y+' · '+fmtMon(isoDay(e.date).m)+QLP+'DHW '+fx(e.dhw)+QRP+'</button>').join('');
  body.innerHTML='<div class="lhead"><span id="tmChip"></span><b id="tmDate" class="ldate"></b></div>'
    +'<dl class="lnum"><div><dt>'+$t('海表温度')+'</dt><dd id="tmSst"></dd></div><div><dt>'+$t('热应力 DHW')+'</dt><dd id="tmDhw"></dd></div><div><dt>'+$t('白化 / 死亡')+'</dt><dd id="tmBD"></dd></div></dl>'
    +'<div id="tmChart"></div>'
    +'<input id="tmSlider" type="range" min="0" max="'+(R.dhw10.length-1)+'" step="1" value="'+TM.idx+'" aria-label="'+$t('日期')+'">'
    +'<div class="seg lrow"><button type="button" id="tmPlay">'+(TM.play?$t('❚❚ 暂停'):$t('▶ 播放（每秒 5 天）'))+'</button><button type="button" id="tmClose">'+$t('回到今天')+'</button></div>'
    +'<p class="lnote">'+$t('热应力最强的几次（点一下，从热浪来临前开始播放）：')+'</p><div class="seg tmEv">'+ev+'</div>'
    +'<p class="lnote tmDec">'+tmDecades(R)+'</p>'
    +'<p class="lscene" id="tmScene"></p>'
    +'<p class="lnote">'+$t('数据：NOAA Coral Reef Watch，')+fmtDayY(R.start)+$t(' 起的每日卫星记录。画面里的白化程度按热应力推算：白化会在热浪过后持续几周，热应力回落后慢慢恢复；死去的珊瑚要好几年才会被新珊瑚取代。')+'</p>';
  body.querySelector('#tmSlider').addEventListener('input',e=>{tmPause();tmSeek(+e.target.value);});
  body.querySelector('#tmPlay').addEventListener('click',tmPlay);
  body.querySelector('#tmClose').addEventListener('click',()=>{const d=body.closest('details');if(d)d.open=false;tmStop();});
  body.querySelectorAll('[data-ev]').forEach(b=>b.addEventListener('click',()=>{tmPause();tmSeek(idxOf(R.start,b.dataset.ev)-110);tmPlay();}));
  tmApply(true);
}
let tmChartT=0;
function tmApply(force){
  applyBleach();const R=tmR();if(!R||!TM.on)return;const v=tmVals();
  if(v.sst!=null&&S.loc===TM.id)S.temp=Math.round(v.sst*10)/10;
  const set=(id,h)=>{const e=$(id);if(e)e.innerHTML=h;};
  set('tmDate',fmtDayY(v.iso));set('tmChip',chip(lvOf(v.hs||0,v.dhw||0)));
  set('tmSst',v.sst==null?'—':fx(v.sst)+' °C');set('tmDhw',v.dhw==null?'—':fx(v.dhw));set('tmBD',pctS(TM.b)+' / '+pctS(TM.d));
  set('tmScene','<b>'+$t('画面里：')+'</b>'+bleachWords(TM));
  const sl=$('tmSlider');if(sl&&document.activeElement!==sl)sl.value=TM.idx;
  const now=performance.now();if(!force&&now-tmChartT<300)return;tmChartT=now;
  const box=$('tmChart');if(!box)return;
  const x=[],y=[];for(let k=-240;k<=60;k+=2){const i=TM.idx+k;x.push(k);y.push(i>=0&&i<R.dhw10.length&&R.dhw10[i]!=null?R.dhw10[i]/10:null);}
  const ok=y.filter(q=>q!=null),dmax=Math.max(8.5,...ok)*1.08,ticks=[];
  for(let k=-240;k<=60;k++){const iso=isoOf(R.start,TM.idx+k),q=isoDay(iso);if(q.d===1&&q.m%2===1)ticks.push([k,fmtMon(q.m)]);}
  box.innerHTML='';box.appendChild(lineChart({title:$t('这一天前后的热应力 DHW'),x,y,area:true,xr:[-240,60],dom:[0,dmax],yt:[0,4,8,12,16,20].filter(q=>q<=dmax),yf:q=>q,xt:ticks,now:0,
    refs:[{y:4,t:LIVE_LV[3][0],c:LIVE_LV[3][1]},{y:8,t:LIVE_LV[4][0],c:LIVE_LV[4][1]},{y:12,t:LIVE_LV[5][0],c:LIVE_LV[5][1]}],di:120,
    rd:i=>fmtDayY(isoOf(R.start,TM.idx+x[i]))+QCO+'DHW '+(y[i]==null?'—':fx(y[i]))}));
}

/* ---- Monterey (and anywhere with waves but no reef): today's sea state ---- */
function seaCard(id){
  const el=document.createElement('div');el.className='lcard';const now=Date.now(),w=seaAt(id,now);
  if(!w||w.H==null){el.innerHTML='<p class="lmean">'+$t('海况数据已经过期，先用资料里的典型海况。')+'</p>';return el;}
  el.innerHTML='<div class="lhead"><span class="lchip"><i style="background:var(--accent)"></i>'+$t('今日海况')+'</span><span class="ldate">'+$t('当地时间 ')+localClock(id,now)+'</span></div>'
    +'<dl class="lnum"><div><dt>'+$t('有效波高')+'</dt><dd>'+fx(w.H)+' m</dd></div><div><dt>'+$t('波周期')+'</dt><dd>'+(w.T==null?'—':fx(w.T,0)+' s')+'</dd></div><div><dt>'+$t('海表温度')+'</dt><dd>'+(w.sst==null?'—':fx(w.sst)+' °C')+'</dd></div></dl>';
  const W=LIVE.data.sea[id],xs=[],ys=[];for(let k=-6;k<=36;k++){const i=Math.round((now/1000-W.t0)/W.step)+k;xs.push(k);ys.push(i>=0&&i<W.H.length?W.H[i]:null);}
  const ok=ys.filter(v=>v!=null);
  el.appendChild(lineChart({title:$t('接下来一天半的有效波高（m）'),x:xs,y:ys,xr:[-6,36],dom:[0,Math.max(1,...ok)*1.15],yf:v=>fx(v),xt:[[0,$t('现在')],[12,'+12 h'],[24,'+24 h'],[36,'+36 h']],now:0,di:6,
    rd:i=>(xs[i]>=0?'+':'')+xs[i]+' h'+QCO+(ys[i]==null?'—':fx(ys[i])+' m')}));
  el.insertAdjacentHTML('beforeend','<p class="lscene"><b>'+$t('画面里：')+'</b>'+$t('巨藻按今天的浪高和周期摆动。浪越高、周期越长，水质点的往返运动越大，也传得越深：12 m 深的海底也能感到涌浪，沙纹因此变粗。')+'</p>'
    +'<div class="seg lrow"><button type="button" class="lguideBtn">'+$t('怎么观察')+'</button></div>'
    +'<ol class="lhow"><li>'+$t('看巨藻的摆动幅度和节奏，再对照这里的波高和周期。')+'</li><li>'+$t('到“环境参数”里把有效波高拖到 0 再拖回来，对比平静和今天的海况。')+'</li><li>'+$t('冬季北太平洋的风暴常把涌浪推到 3 m 以上，那时再来看。')+'</li></ol>'
    +'<p class="lnote">'+$t('海况来自 Open-Meteo 的海浪预报（附近海上格点的有效波高、平均周期和海表温度），代表外海的情况；巨藻林里的波浪会被海藻和地形削弱一些。')+'</p>');
  return el;
}
function tideCard(){
  const T=LIVE.data.tide,el=document.createElement('div');el.className='lcard';const now=Date.now(),L=liveTide(now);
  if(!L){el.innerHTML='<p class="lmean">'+$t('潮汐数据已经过期（只覆盖到下载后的 4 天），先用简化潮汐。数据每天自动更新两次。')+'</p>';return el;}
  el.innerHTML='<div class="lhead"><span class="lchip"><i style="background:var(--accent)"></i>'+(L.nearExt?(L.nearExt>0?$t('高潮'):$t('低潮')):L.rising?$t('涨潮'):$t('落潮'))+'</span><span class="ldate">'+$t('当地时间 ')+L.clock+'</span></div>'
    +'<dl class="lnum"><div><dt>'+$t('现在潮位')+'</dt><dd>'+(L.h>=0?'+':'−')+fx(Math.abs(L.h),2)+' m</dd></div>'+L.nextExt.map(e=>'<div><dt>'+(e.max?$t('高潮'):$t('低潮'))+' '+clockAt(e.t,8)+'</dt><dd>'+(e.h>=0?'+':'−')+fx(Math.abs(e.h),2)+' m</dd></div>').join('')+'</dl>';
  const xs=[],ys=[];for(let k=-6;k<=30;k+=0.5){const v=tideAt(now+k*3.6e6);xs.push(k);ys.push(v);}
  const ticks=[];for(let t=Math.ceil((now-6*3.6e6+8*3.6e6)/3.6e6)*3.6e6-8*3.6e6;t<=now+30*3.6e6;t+=3.6e6){if(new Date(t+8*3.6e6).getUTCHours()%6===0)ticks.push([(t-now)/3.6e6,clockAt(t,8)]);}
  const ok=ys.filter(v=>v!=null);
  el.appendChild(lineChart({title:$t('接下来一天半的潮位（m，当地时间）'),x:xs,y:ys,xr:[-6,30],dom:niceDom(ok,0.2,2),yf:v=>fx(v),xt:ticks,now:0,di:12,
    rd:i=>clockAt(now+xs[i]*3.6e6,8)+$t('：潮位 ')+(ys[i]==null?'—':(ys[i]>=0?'+':'−')+fx(Math.abs(ys[i]),2)+' m')}));
  el.insertAdjacentHTML('beforeend','<div class="seg lrow"><button type="button" class="lguideBtn">'+$t('怎么观察')+'</button></div>'
    +'<ol class="lhow"><li>'+$t('打开“潮汐”一栏的“跟随现实潮位”，画面里的海面就是南麂列岛此刻的潮位。')+'</li><li>'+$t('记下现在哪几条生物带在水下，过一两个小时再来看，对照上面的曲线。')+'</li><li>'+$t('想一口气看完一次涨落，点“快放潮汐”。')+'</li></ol>'
    +'<p class="lnote">'+$t('潮位来自海洋模型（约 8 km 格点）对附近海面的逐小时预报，减去了这几天的平均海面；近岸的精度有限，不能用于航海。')+'</p>');
  return el;
}
function iceCard(hemi){
  const I=LIVE.data.ice&&LIVE.data.ice[hemi];const el=document.createElement('div');el.className='lcard';if(!I)return el;
  const diff=I.extent-I.climMedian,pc=diff/I.climMedian*100,N=hemi==='north';
  el.innerHTML='<div class="lhead"><span class="lchip"><i style="background:'+(diff<0?LIVE_LV[2][1]:'var(--accent)')+'"></i>'+(diff<0?$t('低于常年'):$t('高于常年'))+'</span><span class="ldate">'+$t('卫星数据 · ')+fmtDay(I.date)+'</span></div>'
    +'<dl class="lnum"><div><dt>'+(N?$t('北极海冰面积'):$t('南极海冰面积'))+'</dt><dd>'+fx(I.extent,2)+$t(' 百万 km²')+'</dd></div><div><dt>'+$t('1981–2010 同日中位数')+'</dt><dd>'+fx(I.climMedian,2)+'</dd></div><div><dt>'+$t('差别')+'</dt><dd>'+(diff>=0?'+':'−')+fx(Math.abs(diff),2)+QLP+(pc>=0?'+':'−')+fx(Math.abs(pc),0)+'%'+QRP+'</dd></div></dl>'
    +'<p class="lmean">'+(LANG==='en'?'Of the '+I.years+' years since '+I.firstYear+', this is the '+ordEn(I.rankLow)+' lowest extent for this date. '
      :'在 '+I.firstYear+' 年以来的 '+I.years+' 年里，同一天的海冰面积排第 '+I.rankLow+' 低。')+$t('过去一年的最小值出现在 ')+fmtDayY(I.yearMin.date)+QLP+fx(I.yearMin.extent,2)+$t(' 百万 km²')+QRP+$t('。')+'</p>';
  const s=I.series,x=s.map(r=>-r[0]);
  el.appendChild(lineChart({title:$t('过去一年的海冰面积（百万 km²）'),x,y:s.map(r=>r[1]),y2:s.map(r=>r[2]),band:[s.map(r=>r[3]),s.map(r=>r[4])],xr:[-365,0],dom:niceDom(s.map(r=>r[1]).concat(s.map(r=>r[4])),0.4,2),yf:v=>fx(v,0),xt:monthTicks(I.date,365),di:s.length-1,
    rd:i=>dayLabel(I.date,s[i][0])+QCO+fx(s[i][1],2)+$t('（常年中位数 ')+fx(s[i][2],2)+QRP}));
  const m=isoDay(I.date).m;
  const season=N?(m>=5&&m<=6?$t('现在正是庞德因莱特一带的浮冰边缘季节，和这个场景表现的一样。'):m>=7&&m<=9?$t('现在庞德因莱特一带的固定冰已经融化或破碎；这个场景表现的是 5–6 月的浮冰边缘。'):m>=10&&m<=11?$t('现在庞德因莱特一带的海面正在结冰；这个场景表现的是第二年 5–6 月的浮冰边缘。'):$t('现在庞德因莱特一带是冬季的固定冰，浮冰边缘离岸很远；这个场景表现的是 5–6 月冰缘退近海岸的时候。'))
    :$t('南极海冰 9 月前后最大、2 月前后最小，正好和北极相反。麦克默多湾的潜水季在南半球的春天（大约 10–12 月），那时冰最厚、水最清。');
  el.insertAdjacentHTML('beforeend','<p class="lnote">'+$t('图中蓝线是实测，虚线是 1981–2010 年同一天的中位数，浅色带是其中 80% 年份所在的范围。')+'</p><p class="lscene"><b>'+$t('和场景的关系：')+'</b>'+season+$t('场景里的冰本身不随这个数字变化。')+'</p>'
    +'<div class="seg lrow"><button type="button" class="lguideBtn">'+$t('怎么观察')+'</button></div>');
  return el;
}
const LIVE_ROWS=[['xisha','coral'],['spawn','coral'],['eilat','coral'],['monterey','sea'],['nanji','tide'],['arctic','north'],['ice','south']];
function rowText(id,k){
  const D=LIVE.data;
  if(k==='coral'){const c=reefData(id);return c?chip(c.level)+' '+fx(c.sst)+' °C · DHW '+fx(c.dhw):'—';}
  if(k==='sea'){const w=seaAt(id,Date.now());return w&&w.H!=null?$t('浪高 ')+fx(w.H)+' m'+(w.T!=null?' · '+fx(w.T,0)+' s':'')+(w.sst!=null?' · '+fx(w.sst)+' °C':''):'—';}
  if(k==='tide'){const L=liveTide(Date.now());return L?(L.h>=0?'+':'−')+fx(Math.abs(L.h),2)+' m · '+(L.rising?$t('涨潮'):$t('落潮')):'—';}
  const I=D.ice&&D.ice[k];if(!I)return'—';const pc=(I.extent-I.climMedian)/I.climMedian*100;return fx(I.extent,2)+$t(' 百万 km²')+' · '+(pc>=0?'+':'−')+fx(Math.abs(pc),0)+$t('% 比常年');
}
const LIVE_ROW_NAME={xisha:$t('西沙 · 珊瑚热应力'),spawn:$t('三亚 · 珊瑚热应力'),eilat:$t('埃拉特 · 珊瑚热应力'),monterey:$t('蒙特雷 · 今日海况'),nanji:$t('南麂列岛 · 潮位'),arctic:$t('北极 · 海冰面积'),ice:$t('南极 · 海冰面积')};
function renderLive(){
  const sec=$('liveSec');if(!sec)return;
  $('liveOn').setAttribute('aria-pressed',LIVE.on);$('liveOn').textContent=LIVE.on?$t('跟随现实数据：开'):$t('跟随现实数据：关');
  const D=LIVE.data;
  if(!D){$('liveUpd').textContent='';$('liveHere').innerHTML='<p class="note">'+(LIVE.err?$t('现实数据暂时没有加载成功，场景使用资料里的典型数值。'):$t('正在加载现实数据……'))+'</p>';$('liveList').innerHTML='';return;}
  const up=new Date(D.updated),age=(Date.now()-up.getTime())/864e5;
  $('liveUpd').textContent=$t('更新于 ')+up.toLocaleString(LANG==='en'?'en-GB':'zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+(age>3?$t('（已超过 3 天）'):'');
  const here=$('liveHere');here.innerHTML='';const id=LIVE.site;
  if(!LIVE.on)here.innerHTML='<p class="note">'+$t('已关闭：场景使用资料里的典型数值（健康的珊瑚、简化的潮汐）。打开后，下面这些地点会跟着现实变化。')+'</p>';
  else if(REEF_IDS.includes(id)&&reefData(id))here.appendChild(coralCard(id));
  else if(id==='nanji'&&D.tide)here.appendChild(tideCard());
  else if(id==='arctic')here.appendChild(iceCard('north'));
  else if(id==='ice')here.appendChild(iceCard('south'));
  else if(seaAt(id,Date.now()))here.appendChild(seaCard(id));
  else here.innerHTML='<p class="note">'+$t('下面 7 个地点的环境跟着现实世界变化，点“前往”去看今天的样子。')+'</p>';
  if(LIVE.on&&SUN_SITES[id]){here.insertAdjacentHTML('afterbegin',sunLine(id));const b=$('liveSunBtn');if(b)b.addEventListener('click',()=>setLocalSun(!LIVE.sun));}
  if(id==='nanji'&&LIVE.on){const c=here.querySelector('.lcard');if(c)c.insertAdjacentHTML('beforeend',seaLine(id));}
  $('liveList').innerHTML=LIVE_ROWS.map(([lid,k])=>'<li'+(lid===id?' aria-current="true"':'')+'><span class="ln1">'+LIVE_ROW_NAME[lid]+'</span><span class="ln2">'+rowText(lid,k)+'</span>'+(lid===id?'':'<button type="button" data-go="'+lid+'">'+$t('前往')+'</button>')+'</li>').join('');
  here.querySelectorAll('.lguideBtn').forEach(b=>b.addEventListener('click',()=>openLiveGuide(b)));
}
let liveGuideFrom=null;
function openLiveGuide(from){liveGuideFrom=from||document.activeElement;$('liveGuide').hidden=false;$('liveGuideX').focus();}
function closeLiveGuide(){$('liveGuide').hidden=true;if(liveGuideFrom&&liveGuideFrom.focus)liveGuideFrom.focus();}
$('liveOn').addEventListener('click',()=>setLiveOn(!LIVE.on));
$('liveHowBtn').addEventListener('click',e=>openLiveGuide(e.currentTarget));
$('liveGuideX').addEventListener('click',closeLiveGuide);
$('liveGuide').addEventListener('click',e=>{if(e.target===$('liveGuide'))closeLiveGuide();});
$('liveList').addEventListener('click',e=>{const g=e.target.dataset&&e.target.dataset.go;if(g)applyLocation(g);});
/* refresh the list (tide) once a minute */
setInterval(()=>{
  if(!LIVE.data)return;
  if(LIVE.on&&LIVE.sun&&SUN_SITES[S.loc]&&S.loc===LIVE.site&&!DIVE.on){const o=liveEnv(S.loc);if(o.night!==undefined&&o.night!==S.night)applyEnv(S.loc,true);}
  if(!$('panel').classList.contains('closed')&&!TM.play)renderLive();
},60e3);

function liveReady(){
  LIVE.tx=null;
  if(LIVE.on&&LOC[S.loc]&&S.loc===LIVE.site)applyEnv(S.loc,true);
  applyBleach();renderLive();
}
(function loadLive(){
  if(window.SEAFLOOR_REEF_HIST)LIVE.hist=window.SEAFLOOR_REEF_HIST;
  if(window.SEAFLOOR_LIVE){LIVE.data=window.SEAFLOOR_LIVE;liveReady();return;}
  fetch('data/live.json?h='+Math.floor(Date.now()/3.6e6)).then(r=>r.ok?r.json():Promise.reject(new Error('HTTP '+r.status)))
    .then(d=>{LIVE.data=d;liveReady();}).catch(e=>{LIVE.err=String(e);renderLive();});
})();
