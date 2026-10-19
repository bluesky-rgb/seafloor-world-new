/* =========================================================
   14y. Postcard: grab the current frame and lay out a card with the place, depth, temperature and pressure.
   Saving goes through the platform's download confirmation when available.
   ========================================================= */
const CARD={blob:null,url:null,dl:undefined};
(async()=>{try{CARD.dl=window.claude&&window.claude.use?await window.claude.use('downloads'):null;}catch(e){CARD.dl=null;}})();
function makeCard(){
  if(composer)composer.render();else renderer.render(scene,camera);
  const src=renderer.domElement,W=1600,H=1000,band=230,ph=H-band,g0=document.createElement('canvas');g0.width=W;g0.height=H;const g=g0.getContext('2d');
  g.fillStyle='#03121a';g.fillRect(0,0,W,H);
  const sw=src.width,sh=src.height,ar=W/ph;let cw=sw,chh=sw/ar;if(chh>sh){chh=sh;cw=sh*ar;}
  g.drawImage(src,(sw-cw)/2,(sh-chh)/2,cw,chh,0,0,W,ph);
  const gr=g.createLinearGradient(0,ph-80,0,ph);gr.addColorStop(0,'rgba(3,18,26,0)');gr.addColorStop(1,'rgba(3,18,26,1)');g.fillStyle=gr;g.fillRect(0,ph-80,W,80);
  const z=camZ(),T=DIVE.on?(DIVE.bh?bhTemp(z):tempAt(z)):S.temp,P=pressure(z)/PATM,css=getComputedStyle(document.body);
  const fd=css.getPropertyValue('--f-display'),fb=css.getPropertyValue('--f-body'),fm=css.getPropertyValue('--f-mono');
  const site=S.loc?(SITE[S.loc]?SITE[S.loc][0]:LOC[S.loc].name):$t('自定义参数');
  g.fillStyle='#d9ecef';g.font='700 46px '+fd;g.fillText(site,60,ph+70);
  g.fillStyle='#62d4e3';g.font='600 30px '+fm;
  const d=new Date(),ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  g.fillText('−'+fmtD(z)+' m  ·  '+T.toFixed(1)+' °C  ·  '+P.toFixed(P<10?2:0)+' atm  ·  '+ds,60,ph+122);
  let line=S.loc&&SITE[S.loc]?SITE[S.loc][1]:'';const dot=line.indexOf($t('。'));if(dot>0)line=line.slice(0,dot+1);if(line.length>52)line=line.slice(0,51)+'…';
  g.fillStyle='#86a7ae';g.font='26px '+fb;g.fillText(line,60,ph+172);
  g.textAlign='right';g.fillStyle='#62d4e3';g.font='600 22px '+fd;g.fillText($t('海底物理世界'),W-60,ph+70);
  g.fillStyle='#86a7ae';g.font='18px '+fb;g.fillText($t('按真实地点与实测数据模拟'),W-60,ph+100);
  g.strokeStyle='rgba(120,190,205,.35)';g.lineWidth=2;g.strokeRect(20,20,W-40,H-40);
  return g0;
}
function openCard(){
  let cv;try{cv=makeCard();}catch(e){showCaption($t('拍不了明信片'),$t('这个浏览器不允许读取三维画面。'),5);return;}
  const url=cv.toDataURL('image/png');$('cardImg').src=url;
  const bin=atob(url.split(',')[1]),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);CARD.blob=new Blob([u8],{type:'image/png'});
  $('card').hidden=false;$('cardSave').hidden=!CARD.dl&&!!window.claude;
  $('cardTip').textContent=!window.claude?$t('点“保存图片”会把这张明信片下载到你的设备；手机上也可以长按图片保存。'):CARD.dl?$t('点“保存图片”会弹出确认框，确认后图片会保存到你的设备。'):$t('这里不能直接保存文件：电脑上右键图片“另存为”，手机上长按图片保存。');
}
$('cardBtn').addEventListener('click',openCard);$('cardX').addEventListener('click',()=>{$('card').hidden=true;});
$('card').addEventListener('click',e=>{if(e.target.id==='card')$('card').hidden=true;});
$('cardSave').addEventListener('click',async()=>{if(!CARD.blob)return;const nm=$t('海底明信片-')+(S.loc||'custom')+'-'+Math.round(camZ())+'m.png';
  if(!CARD.dl){const u=URL.createObjectURL(CARD.blob),a=document.createElement('a');a.href=u;a.download=nm;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);$('cardTip').textContent=$t('已交给浏览器下载。');return;}
  try{await CARD.dl.save({filename:nm,data:CARD.blob});$('cardTip').textContent=$t('已交给浏览器保存。');}
  catch(e){const c=e&&e.code;$('cardTip').textContent=c==='declined'?$t('已取消保存。'):c==='rate_limited'?$t('已有一个保存确认框，请先处理它。'):$t('这里暂时不能保存：电脑上右键图片“另存为”，手机上长按图片保存。');if(c==='unavailable'||c==='not_granted')$('cardSave').hidden=true;}});
$('helpBtn').addEventListener('click',()=>{$('help').hidden=false;});$('helpX').addEventListener('click',()=>{$('help').hidden=true;});
$('welGo').addEventListener('click',()=>{$('welcome').hidden=true;});$('welHelp').addEventListener('click',()=>{$('welcome').hidden=true;$('help').hidden=false;});
for(const id of['help','sofar','welcome'])$(id).addEventListener('click',e=>{if(e.target.id===id)$(id).hidden=true;});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){for(const id of['help','sofar','welcome','press','mapOv','card','liveGuide'])$(id).hidden=true;if(VR.on&&!VR.xr)exitVR();else if(TOUR.on)exitTour();}});
try{if(!localStorage.getItem('seafloor-welcome')){$('welcome').hidden=false;localStorage.setItem('seafloor-welcome','1');}}catch(e){$('welcome').hidden=false;}

