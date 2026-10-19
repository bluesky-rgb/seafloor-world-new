/* =========================================================
   Live ocean: real-world data in data/live.json (refreshed twice a day by .github/workflows/live.yml running
   tools/fetch_live.py) drives part of the scenes:
     - coral bleaching at the Paracels, Sanya and Eilat from NOAA Coral Reef Watch heat stress (Degree Heating Weeks),
       and the scene's water temperature from the same satellite SST;
     - the real tide at the Nanji Islands (hourly sea level from the Meteo-France SMOC model via Open-Meteo);
     - today's Arctic and Antarctic sea-ice extent against 1981-2010 (NSIDC Sea Ice Index), as information.
   The animals are still simulated; only these conditions follow reality. "跟随现实数据" switches it all off.
   ========================================================= */
const LIVE={data:null,on:true,sim:null,site:null,err:null,tx:null};
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

function liveTemp(id,def){const c=reefData(id);return LIVE.on&&c?Math.round(c.sst*10)/10:def;}
function applyBleach(){
  const c=REEF_IDS.includes(LIVE.site)?reefData(LIVE.site):null;
  const d=LIVE.sim!=null?LIVE.sim:(LIVE.on&&c?c.dhw:0),dead=LIVE.sim!=null?LIVE.sim:(LIVE.on&&c?c.peak365.dhw:0);
  CORALU.uBleach.value=REEF_IDS.includes(LIVE.site)?bleachOf(d):0;CORALU.uDead.value=REEF_IDS.includes(LIVE.site)?deadOf(dead):0;
}
function bleachWords(d,dead){
  const b=bleachOf(d);let w=b<0.05?$t('珊瑚颜色正常：褐、绿、紫等颜色来自组织里的共生藻。'):b<0.3?$t('少数珊瑚的顶端开始变浅，枝状珊瑚最先。'):b<0.6?$t('不少珊瑚明显发白，枝状和盘状珊瑚最多，块状珊瑚还撑得住。'):b<0.9?$t('大部分珊瑚已经白化，透过透明的组织能看到白色骨骼。'):$t('几乎所有珊瑚都白化了。');
  if(deadOf(dead)>0.08)w+=$t('部分珊瑚已经死亡，表面长出一层灰绿色的藻皮。');
  return w;
}
function liveOnLocation(id){
  LIVE.site=id;if(!REEF_IDS.includes(id))LIVE.sim=null;
  if(id==='nanji'){const ok=LIVE.on&&!!liveTide(Date.now());TIDE.live=true;TIDE.play=!ok;$('tidePlay').textContent=ok?$t('▶ 快放潮汐'):$t('❚❚ 暂停潮汐');}
  applyBleach();renderLive();
}
function setLiveOn(on){
  LIVE.on=on;try{localStorage.setItem('seafloor-live',on?'on':'off');}catch(e){}
  if(on)TIDE.live=true;
  if(REEF_IDS.includes(LIVE.site)&&S.loc===LIVE.site){S.temp=liveTemp(S.loc,LOC[S.loc].temp);$('sTemp').value=S.temp;rebuild();}
  applyBleach();renderLive();readouts();
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
function coralCard(id){
  const c=reefData(id),el=document.createElement('div');el.className='lcard';
  const d=LIVE.sim!=null?LIVE.sim:c.dhw,simOn=LIVE.sim!=null;
  el.innerHTML='<div class="lhead">'+chip(c.level)+'<span class="ldate">'+$t('卫星数据 · ')+fmtDay(c.date)+'</span></div>'
    +'<dl class="lnum"><div><dt>'+$t('海表温度')+'</dt><dd>'+fx(c.sst)+' °C</dd></div><div><dt>'+$t('白化阈值')+'</dt><dd>'+fx(c.threshold)+' °C</dd></div><div><dt>'+$t('热应力 DHW')+'</dt><dd>'+fx(c.dhw)+$t(' °C·周')+'</dd></div></dl>'
    +'<p class="lmean">'+LIVE_LV_MEAN[c.level]+(c.level<2&&c.dhw>=4?$t('不过过去 12 周累积的热应力（DHW ')+fx(c.dhw)+$t('）还很高：白化通常在热浪过后才最明显，之前的热浪造成的白化可能还没有恢复。'):'')+'</p>';
  const s=c.series,x=s.map(r=>-r[0]),thr=c.threshold;
  el.appendChild(lineChart({title:$t('过去一年的海表温度（°C）'),x,y:s.map(r=>r[1]),xr:[-365,0],dom:niceDom(s.map(r=>r[1]).concat([thr]),0.3,2),yf:v=>fx(v),xt:monthTicks(c.date,365),
    refs:[{y:thr,t:$t('白化阈值 ')+fx(thr),c:LIVE_LV[2][1]}],di:s.length-1,rd:i=>dayLabel(c.date,s[i][0])+$t('：海温 ')+fx(s[i][1])+' °C'}));
  const dmax=Math.max(8.5,...s.map(r=>r[2]))*1.08;
  el.appendChild(lineChart({title:$t('累积热应力 DHW（°C·周）'),x,y:s.map(r=>r[2]),area:true,xr:[-365,0],dom:[0,dmax],yt:[0,4,8,12,16,20].filter(v=>v<=dmax),yf:v=>v,xt:monthTicks(c.date,365),
    refs:[{y:4,t:LIVE_LV[3][0],c:LIVE_LV[3][1]},{y:8,t:LIVE_LV[4][0],c:LIVE_LV[4][1]},{y:12,t:LIVE_LV[5][0],c:LIVE_LV[5][1]}],di:s.length-1,rd:i=>dayLabel(c.date,s[i][0])+QCO+'DHW '+fx(s[i][2])}));
  const rec=(c.record||[]).map(r=>isoDay(r.date).y+QLP+fx(r.dhw)+QRP).join($t('、'));
  el.insertAdjacentHTML('beforeend','<p class="lnote">'+$t('过去一年最高：DHW ')+fx(c.peak365.dhw)+QLP+fmtDayY(c.peak365.date)+QCM+LIVE_LV[lvOfDhw(c.peak365.dhw)][0]+QRP+$t('。')+(rec?$t('有记录以来热应力最强的年份：')+rec+$t('。'):'')+'</p>'
    +'<p class="lscene"><b>'+(simOn?$t('画面里（模拟 DHW ')+fx(d)+QRP+CO:$t('画面里（按今天的 DHW）：'))+'</b>'+bleachWords(d,simOn?d:c.peak365.dhw)+'</p>'
    +'<div class="ctl"><label for="simDhw">'+$t('模拟热应力 DHW')+' <b id="simV">'+(simOn?fx(d):$t('今天 ')+fx(c.dhw))+'</b></label><input id="simDhw" type="range" min="0" max="20" step="0.5" value="'+fx(d)+'"></div>'
    +'<div class="seg lrow"><button type="button" id="simBack"'+(simOn?'':' disabled')+'>'+$t('回到今天的实测')+'</button><button type="button" class="lguideBtn">'+$t('怎么观察')+'</button></div>'
    +'<ol class="lhow"><li>'+$t('看珊瑚的颜色，再对照上面的警报等级。')+'</li><li>'+$t('把“模拟热应力”从 0 拖到 16，看白化怎样从枝状珊瑚的顶端开始扩散，再拖回“今天”。')+'</li><li>'+$t('看温度曲线：海温高于白化阈值的那些天，DHW 曲线才会上升；它累计的是过去 12 周。')+'</li></ol>');
  el.querySelector('#simDhw').addEventListener('input',e=>{LIVE.sim=+e.target.value;applyBleach();const v=$('simV');if(v)v.textContent=fx(LIVE.sim);
    const sc=el.querySelector('.lscene');if(sc)sc.innerHTML='<b>'+$t('画面里（模拟 DHW ')+fx(LIVE.sim)+QRP+QCO+'</b>'+bleachWords(LIVE.sim,LIVE.sim);el.querySelector('#simBack').disabled=false;});
  el.querySelector('#simBack').addEventListener('click',()=>{LIVE.sim=null;applyBleach();renderLive();});
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
const LIVE_ROWS=[['xisha','coral'],['spawn','coral'],['eilat','coral'],['nanji','tide'],['arctic','north'],['ice','south']];
function rowText(id,k){
  const D=LIVE.data;
  if(k==='coral'){const c=reefData(id);return c?chip(c.level)+' '+fx(c.sst)+' °C · DHW '+fx(c.dhw):'—';}
  if(k==='tide'){const L=liveTide(Date.now());return L?(L.h>=0?'+':'−')+fx(Math.abs(L.h),2)+' m · '+(L.rising?$t('涨潮'):$t('落潮')):'—';}
  const I=D.ice&&D.ice[k];if(!I)return'—';const pc=(I.extent-I.climMedian)/I.climMedian*100;return fx(I.extent,2)+$t(' 百万 km²')+' · '+(pc>=0?'+':'−')+fx(Math.abs(pc),0)+$t('% 比常年');
}
const LIVE_ROW_NAME={xisha:$t('西沙 · 珊瑚热应力'),spawn:$t('三亚 · 珊瑚热应力'),eilat:$t('埃拉特 · 珊瑚热应力'),nanji:$t('南麂列岛 · 潮位'),arctic:$t('北极 · 海冰面积'),ice:$t('南极 · 海冰面积')};
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
  else here.innerHTML='<p class="note">'+$t('下面 6 个地点的环境跟着现实世界变化，点“前往”去看今天的样子。')+'</p>';
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
setInterval(()=>{if(LIVE.data&&!$('panel').classList.contains('closed'))renderLive();},60e3);

function liveReady(){
  LIVE.tx=null;
  if(LIVE.on&&REEF_IDS.includes(S.loc)&&reefData(S.loc)){S.temp=liveTemp(S.loc,S.temp);$('sTemp').value=S.temp;rebuild();readouts();}
  applyBleach();renderLive();
}
(function loadLive(){
  if(window.SEAFLOOR_LIVE){LIVE.data=window.SEAFLOOR_LIVE;liveReady();return;}
  fetch('data/live.json?h='+Math.floor(Date.now()/3.6e6)).then(r=>r.ok?r.json():Promise.reject(new Error('HTTP '+r.status)))
    .then(d=>{LIVE.data=d;liveReady();}).catch(e=>{LIVE.err=String(e);renderLive();});
})();
